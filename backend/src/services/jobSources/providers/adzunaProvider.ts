import type { JobSourceProvider, DiscoveryInput, ProviderContext, SourceJob } from '../types.js';

function norm(v: unknown): string {
  return String(v ?? '').trim();
}

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function collectStructuredJobs(value: unknown, sink: Record<string, unknown>[]): void {
  if (!value) return;
  if (Array.isArray(value)) {
    for (const item of value) collectStructuredJobs(item, sink);
    return;
  }
  if (typeof value !== 'object') return;
  const obj = value as Record<string, unknown>;
  const type = obj['@type'];
  if (type === 'JobPosting' || (Array.isArray(type) && type.includes('JobPosting'))) {
    sink.push(obj);
  }
  collectStructuredJobs(obj['@graph'], sink);
  collectStructuredJobs(obj.itemListElement, sink);
}

function extractStructuredJobs(html: string): SourceJob[] {
  const scriptPattern = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const entries: Record<string, unknown>[] = [];
  let match: RegExpExecArray | null;

  while ((match = scriptPattern.exec(html)) !== null) {
    try {
      collectStructuredJobs(JSON.parse(match[1]), entries);
    } catch {
      // ignore malformed block
    }
  }

  return entries
    .map((job) => {
      const title = norm(job.title ?? job.name);
      const applyUrl = norm(job.url ?? job.sameAs);
      if (!title || !applyUrl) return null;
      const org = job.hiringOrganization as Record<string, unknown> | undefined;
      const identifier = job.identifier as Record<string, unknown> | undefined;
      const address = ((job.jobLocation as Record<string, unknown> | undefined)?.address ?? job.jobLocation) as Record<string, unknown> | undefined;
      return {
        externalId: norm(identifier?.value ?? applyUrl),
        source: 'adzuna',
        title,
        company: norm(org?.name ?? 'Unknown company'),
        location: norm(address?.addressLocality ?? address?.addressRegion ?? address?.addressCountry ?? 'United Kingdom'),
        description: stripHtml(norm(job.description)),
        applyUrl,
        salaryMin: null,
        salaryMax: null,
        workMode: norm(job.employmentType) || null,
        requirements: [],
        postedAt: norm(job.datePosted) || new Date().toISOString(),
      } satisfies SourceJob;
    })
    .filter((job): job is SourceJob => Boolean(job));
}

async function searchAdzunaWebsite(input: DiscoveryInput): Promise<SourceJob[]> {
  const url = new URL('https://www.adzuna.co.uk/jobs/search');
  url.searchParams.set('q', input.query);
  if (input.location) url.searchParams.set('w', input.location);

  const res = await fetch(url.toString(), {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-GB,en;q=0.9',
    },
  });
  if (!res.ok) throw new Error(`Adzuna public ${res.status}`);
  const html = await res.text();

  const structured = extractStructuredJobs(html);
  if (structured.length > 0) return structured.slice(0, input.limit);

  const results: SourceJob[] = [];
  const pattern = /href="(https:\/\/www\.adzuna\.co\.uk\/details\/[^"#?]+)"[\s\S]{0,1000}?>([^<]{4,120})<\/a>[\s\S]{0,600}?company[^>]*>([^<]+)<\/[a-z]+>[\s\S]{0,500}?location[^>]*>([^<]+)<\/[a-z]+>/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null && results.length < input.limit) {
    results.push({
      externalId: match[1],
      source: 'adzuna',
      title: stripHtml(match[2]),
      company: stripHtml(match[3]),
      location: stripHtml(match[4]),
      description: '',
      applyUrl: match[1],
      salaryMin: null,
      salaryMax: null,
      workMode: null,
      requirements: [],
      postedAt: new Date().toISOString(),
    });
  }
  return results;
}

export class AdzunaProvider implements JobSourceProvider {
  name = 'adzuna';
  label = 'Adzuna';

  async readiness(): Promise<{ ready: boolean; reason?: string }> {
    if (process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY) {
      return { ready: true };
    }
    return { ready: true, reason: 'ADZUNA API keys not set, using public web fallback' };
  }

  async discover(input: DiscoveryInput, _context?: ProviderContext): Promise<SourceJob[]> {
    const appId = process.env.ADZUNA_APP_ID;
    const appKey = process.env.ADZUNA_APP_KEY;
    if (!appId || !appKey) return searchAdzunaWebsite(input);

    const url = new URL('https://api.adzuna.com/v1/api/jobs/gb/search/1');
    url.searchParams.set('app_id', appId);
    url.searchParams.set('app_key', appKey);
    url.searchParams.set('what', input.query);
    url.searchParams.set('results_per_page', String(input.limit));
    if (input.location) url.searchParams.set('where', input.location);

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Adzuna ${res.status}`);
    const data = await res.json() as { results?: Record<string, unknown>[] };

    return (data.results ?? []).map((j) => {
      const loc = j.location as Record<string, unknown> | undefined;
      const company = j.company as Record<string, unknown> | undefined;
      return {
        externalId: norm(j.id),
        source: 'adzuna',
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
}
