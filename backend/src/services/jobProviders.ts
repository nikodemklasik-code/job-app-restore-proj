import { randomUUID } from 'crypto';

export interface JobListing {
  id: string;
  externalId: string;
  source: 'reed' | 'adzuna' | 'jooble' | 'indeed' | 'gumtree' | 'manual';
  title: string;
  company: string;
  location: string;
  description: string;
  applyUrl: string;
  salaryMin: number | null;
  salaryMax: number | null;
  workMode: string | null;
  requirements: string[];
  postedAt: string;
}

function norm(v: unknown): string {
  return String(v ?? '').trim();
}

// ── Reed ─────────────────────────────────────────────────────────────────────

async function searchReed(query: string, location: string, count: number): Promise<JobListing[]> {
  const key = process.env.REED_API_KEY;
  if (!key) return [];

  const url = new URL('https://www.reed.co.uk/api/1.0/search');
  url.searchParams.set('keywords', query);
  if (location) url.searchParams.set('locationName', location);
  url.searchParams.set('resultsToTake', String(count));

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Basic ${Buffer.from(`${key}:`).toString('base64')}` },
  });
  if (!res.ok) throw new Error(`Reed ${res.status}`);
  const data = await res.json() as { results?: Record<string, unknown>[] };

  return (data.results ?? []).map((j) => ({
    id: randomUUID(),
    externalId: norm(j.jobId),
    source: 'reed' as const,
    title: norm(j.jobTitle),
    company: norm(j.employerName),
    location: norm(j.locationName),
    description: norm(j.jobDescription),
    applyUrl: norm(j.jobUrl),
    salaryMin: typeof j.minimumSalary === 'number' ? j.minimumSalary : null,
    salaryMax: typeof j.maximumSalary === 'number' ? j.maximumSalary : null,
    workMode: null,
    requirements: [],
    postedAt: new Date().toISOString(),
  }));
}

// ── Adzuna ───────────────────────────────────────────────────────────────────

async function searchAdzuna(query: string, location: string, count: number): Promise<JobListing[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) return [];

  const url = new URL('https://api.adzuna.com/v1/api/jobs/gb/search/1');
  url.searchParams.set('app_id', appId);
  url.searchParams.set('app_key', appKey);
  url.searchParams.set('what', query);
  url.searchParams.set('results_per_page', String(count));
  if (location) url.searchParams.set('where', location);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Adzuna ${res.status}`);
  const data = await res.json() as { results?: Record<string, unknown>[] };

  return (data.results ?? []).map((j) => {
    const loc = j.location as Record<string, unknown> | undefined;
    const company = j.company as Record<string, unknown> | undefined;
    return {
      id: randomUUID(),
      externalId: norm(j.id),
      source: 'adzuna' as const,
      title: norm(j.title),
      company: norm(company?.display_name),
      location: norm(loc?.display_name),
      description: norm(j.description),
      applyUrl: norm(j.redirect_url),
      salaryMin: typeof j.salary_min === 'number' ? j.salary_min : null,
      salaryMax: typeof j.salary_max === 'number' ? j.salary_max : null,
      workMode: norm(j.contract_time) || null,
      requirements: [],
      postedAt: new Date().toISOString(),
    };
  });
}

// ── Jooble ───────────────────────────────────────────────────────────────────

async function searchJooble(query: string, location: string, count: number): Promise<JobListing[]> {
  const key = process.env.JOOBLE_API_KEY;
  if (!key) return [];

  const res = await fetch(`https://jooble.org/api/${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keywords: query, location, page: '1' }),
  });
  if (!res.ok) throw new Error(`Jooble ${res.status}`);
  const data = await res.json() as { jobs?: Record<string, unknown>[] };

  return (data.jobs ?? []).slice(0, count).map((j) => ({
    id: randomUUID(),
    externalId: norm(j.id ?? j.link),
    source: 'jooble' as const,
    title: norm(j.title),
    company: norm(j.company),
    location: norm(j.location),
    description: norm(j.snippet),
    applyUrl: norm(j.link),
    salaryMin: null,
    salaryMax: null,
    workMode: norm(j.type) || null,
    requirements: [],
    postedAt: new Date().toISOString(),
  }));
}

// ── Aggregator ───────────────────────────────────────────────────────────────

export async function searchAllProviders(
  query: string,
  location: string = 'United Kingdom',
  count: number = 10,
  sources: string[] = ['reed', 'adzuna', 'jooble'],
  sessionCookies?: { indeed?: string; gumtree?: string },
): Promise<JobListing[]> {
  const results = await Promise.allSettled([
    sources.includes('reed') ? searchReed(query, location, count) : Promise.resolve([]),
    sources.includes('adzuna') ? searchAdzuna(query, location, count) : Promise.resolve([]),
    sources.includes('jooble') ? searchJooble(query, location, count) : Promise.resolve([]),
    sources.includes('indeed') && sessionCookies?.indeed
      ? searchIndeed(query, location, count, sessionCookies.indeed)
      : Promise.resolve([]),
    sources.includes('gumtree') && sessionCookies?.gumtree
      ? searchGumtree(query, location, count, sessionCookies.gumtree)
      : Promise.resolve([]),
  ]);

  const all: JobListing[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') all.push(...r.value);
    else console.error('[jobProviders] provider error:', r.reason);
  }

  // Deduplicate by title+company
  const seen = new Set<string>();
  return all.filter((j) => {
    const key = `${j.title.toLowerCase()}|${j.company.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ── Indeed ────────────────────────────────────────────────────────────────────
// Uses cookie-based session (no official API). Cookies stored per user in DB.
// The cookies string should be the full Cookie header value from user's browser session.

export async function searchIndeed(
  query: string,
  location: string,
  count: number,
  cookies: string,
): Promise<JobListing[]> {
  if (!cookies?.trim()) return [];

  const params = new URLSearchParams({
    q: query,
    l: location || 'United Kingdom',
    limit: String(Math.min(count, 25)),
    fromage: '14',
    sort: 'date',
    format: 'json',
  });

  try {
    const res = await fetch(`https://www.indeed.co.uk/jobs?${params.toString()}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-GB,en;q=0.9',
        'Cookie': cookies,
      },
    });
    if (!res.ok) throw new Error(`Indeed ${res.status}`);

    const html = await res.text();
    return parseIndeedHtml(html);
  } catch (err) {
    console.error('[jobProviders:indeed]', err);
    return [];
  }
}

function parseIndeedHtml(html: string): JobListing[] {
  const results: JobListing[] = [];

  // Extract JSON from mosaic.providerData["mosaic-provider-jobcards"]
  const mosaicMatch = html.match(/"mosaic-provider-jobcards":\{"metaData":\{[^}]*\},"results":(\[.+?\]),"trackingKey"/s);
  if (mosaicMatch) {
    try {
      const jobs = JSON.parse(mosaicMatch[1]) as Array<Record<string, unknown>>;
      for (const job of jobs) {
        const jobKey = String(job.jobkey ?? job.jobKey ?? '');
        results.push({
          id: randomUUID(),
          externalId: jobKey,
          source: 'indeed' as const,
          title: String(job.title ?? job.displayTitle ?? ''),
          company: String((job.company as Record<string, unknown>)?.name ?? job.company ?? ''),
          location: String((job.jobLocationCity ?? '') + ', ' + (job.jobLocationState ?? '')).replace(/^, |, $/, '') || 'UK',
          description: String(job.snippet ?? job.jobDescription ?? ''),
          applyUrl: jobKey ? `https://www.indeed.co.uk/viewjob?jk=${jobKey}` : '',
          salaryMin: null,
          salaryMax: null,
          workMode: String(job.jobType ?? job.remoteWorkModel ?? '') || null,
          requirements: [],
          postedAt: new Date().toISOString(),
        });
      }
      return results;
    } catch { /* fall through to regex */ }
  }

  // Fallback: regex parse job cards from HTML
  const cardPattern = /data-jk="([^"]+)"[^>]*>[\s\S]*?class="jobTitle"[^>]*><[^>]+>([^<]+)<\/span>[\s\S]*?class="companyName"[^>]*>([^<]+)<\/[^>]+>[\s\S]*?class="companyLocation"[^>]*>([^<]+)<\/div>/g;
  let match;
  while ((match = cardPattern.exec(html)) !== null) {
    results.push({
      id: randomUUID(),
      externalId: match[1],
      source: 'indeed' as const,
      title: match[2].trim(),
      company: match[3].trim(),
      location: match[4].trim(),
      description: '',
      applyUrl: `https://www.indeed.co.uk/viewjob?jk=${match[1]}`,
      salaryMin: null,
      salaryMax: null,
      workMode: null,
      requirements: [],
      postedAt: new Date().toISOString(),
    });
  }

  return results;
}

// ── Gumtree ───────────────────────────────────────────────────────────────────
// Uses cookie-based session for Gumtree Jobs.

export async function searchGumtree(
  query: string,
  location: string,
  count: number,
  cookies: string,
): Promise<JobListing[]> {
  if (!cookies?.trim()) return [];

  const slug = encodeURIComponent(query.toLowerCase().replace(/\s+/g, '-'));
  const locSlug = (location || 'uk').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const url = `https://www.gumtree.com/jobs/${locSlug}/${slug}`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-GB,en;q=0.9',
        'Cookie': cookies,
      },
    });
    if (!res.ok) throw new Error(`Gumtree ${res.status}`);
    const html = await res.text();
    return parseGumtreeHtml(html, count);
  } catch (err) {
    console.error('[jobProviders:gumtree]', err);
    return [];
  }
}

function parseGumtreeHtml(html: string, limit: number): JobListing[] {
  const results: JobListing[] = [];

  // Gumtree embeds JSON-LD or __NEXT_DATA__ for listings
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>(\{.+?\})<\/script>/s);
  if (nextDataMatch) {
    try {
      const data = JSON.parse(nextDataMatch[1]) as Record<string, unknown>;
      const props = (data as Record<string, unknown>)?.props as Record<string, unknown> | undefined;
      const pageProps = props?.pageProps as Record<string, unknown> | undefined;
      const listings = (pageProps?.listings ?? pageProps?.ads ?? []) as Array<Record<string, unknown>>;

      for (const ad of listings.slice(0, limit)) {
        const id = String(ad.id ?? ad.adId ?? randomUUID());
        results.push({
          id: randomUUID(),
          externalId: id,
          source: 'gumtree' as const,
          title: String(ad.title ?? ad.name ?? ''),
          company: String(ad.sellerName ?? ad.advertiserName ?? 'Employer'),
          location: String((ad.location as Record<string, unknown>)?.displayName ?? ad.location ?? 'UK'),
          description: String(ad.description ?? ''),
          applyUrl: `https://www.gumtree.com${String(ad.url ?? `/jobs/.../${id}`)}`,
          salaryMin: null,
          salaryMax: null,
          workMode: null,
          requirements: [],
          postedAt: new Date().toISOString(),
        });
      }
      return results;
    } catch { /* fall through */ }
  }

  // Fallback: regex for Gumtree listing cards
  const listingPattern = /data-q="listing-(\d+)"[\s\S]*?data-q="listing-title"[^>]*>([^<]+)<\/a>[\s\S]*?data-q="listing-price"[^>]*>([^<]*)<[\s\S]*?data-q="listing-location"[^>]*>([^<]+)</g;
  let match;
  while ((match = listingPattern.exec(html)) !== null && results.length < limit) {
    results.push({
      id: randomUUID(),
      externalId: match[1],
      source: 'gumtree' as const,
      title: match[2].trim(),
      company: 'Employer',
      location: match[4].trim(),
      description: '',
      applyUrl: `https://www.gumtree.com/jobs/.../${match[1]}`,
      salaryMin: null,
      salaryMax: null,
      workMode: null,
      requirements: [],
      postedAt: new Date().toISOString(),
    });
  }

  return results;
}

// ── Aggregator ─ updated ─────────────────────────────────────────────────────

export type { JobListing as ProviderJobListing };
