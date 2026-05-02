import type { JobSourceProvider, DiscoveryInput, ProviderContext, SourceJob } from '../types.js';
import { logProviderEvent } from '../providerMonitoring.js';

function norm(v: unknown): string {
  return String(v ?? '').trim();
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
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

/** Extract work mode from description */
function parseWorkMode(description: string): string | null {
  const text = description.toLowerCase();
  if (/\bremote\b/.test(text)) return 'remote';
  if (/hybrid/.test(text)) return 'hybrid';
  if (/on.?site|in.?office|on.?premises/.test(text)) return 'on-site';
  return null;
}

/** Extract requirements from description */
function extractRequirements(description: string): string[] {
  if (!description) return [];
  return description
    .split(/[\n•\-\*]/)
    .map((line) => line.trim())
    .filter((line) => line.length >= 15 && line.length <= 150)
    .filter((line) =>
      /(experience|knowledge|ability|skilled|proficient|strong|familiar|background|understanding|degree|qualification|required|must have)/i.test(line),
    )
    .slice(0, 8);
}

function dedupeJobs(jobs: SourceJob[], limit: number): SourceJob[] {
  const seen = new Set<string>();
  const out: SourceJob[] = [];
  for (const job of jobs) {
    const key = `${job.externalId || job.applyUrl}|${job.source}`.toLowerCase().trim();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(job);
    if (out.length >= limit) break;
  }
  return out;
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

function extractNextDataJobs(html: string): SourceJob[] {
  // Reed now embeds job data in __NEXT_DATA__ JSON
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s);
  if (!nextDataMatch) {
    console.warn('[ReedProvider] No __NEXT_DATA__ found - Reed may have changed their structure');
    return [];
  }

  try {
    const data = JSON.parse(nextDataMatch[1]);
    const jobs = data?.props?.pageProps?.jobsData?.jobs;

    if (!Array.isArray(jobs)) {
      console.warn('[ReedProvider] __NEXT_DATA__ found but jobs array missing - structure changed');
      return [];
    }

    console.info(`[ReedProvider] Extracted ${jobs.length} jobs from __NEXT_DATA__`);

    return jobs
      .map((item: any): SourceJob | null => {
        const job = item?.jobDetail;
        if (!job) return null;

        const title = norm(job.jobTitle);
        const jobId = norm(job.jobId);
        if (!title || !jobId) return null;

        const url = norm(item.url);
        const applyUrl = job.externalUrl ? norm(job.externalUrl) : `https://www.reed.co.uk${url}`;
        const description = stripHtml(norm(job.jobDescription));

        return {
          externalId: jobId,
          source: 'reed',
          title,
          company: norm(job.ouName ?? 'Unknown company'),
          location: norm(job.displayLocationName ?? job.countyLocation ?? 'United Kingdom'),
          description,
          applyUrl,
          salaryMin: typeof job.salaryFrom === 'number' ? job.salaryFrom : null,
          salaryMax: typeof job.salaryTo === 'number' ? job.salaryTo : null,
          workMode: job.remoteWorkingOption === 'Remote' ? 'remote' : parseWorkMode(description),
          requirements: extractRequirements(description),
          postedAt: norm(job.dateCreated) || new Date().toISOString(),
        };
      })
      .filter((job): job is SourceJob => job !== null);
  } catch (err) {
    console.error('[ReedProvider] Failed to parse __NEXT_DATA__:', err);
    return [];
  }
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
    .map((job): SourceJob | null => {
      const title = norm(job.title ?? job.name);
      const applyUrl = norm(job.url ?? job.sameAs);
      if (!title || !applyUrl) return null;
      const org = job.hiringOrganization as Record<string, unknown> | undefined;
      const identifier = job.identifier as Record<string, unknown> | undefined;
      const address = ((job.jobLocation as Record<string, unknown> | undefined)?.address ?? job.jobLocation) as Record<string, unknown> | undefined;
      const description = stripHtml(norm(job.description));
      return {
        externalId: norm(identifier?.value ?? applyUrl),
        source: 'reed',
        title,
        company: norm(org?.name ?? 'Unknown company'),
        location: norm(address?.addressLocality ?? address?.addressRegion ?? address?.addressCountry ?? 'United Kingdom'),
        description,
        applyUrl,
        salaryMin: null,
        salaryMax: null,
        workMode: parseWorkMode(description),
        requirements: extractRequirements(description),
        postedAt: norm(job.datePosted) || new Date().toISOString(),
      };
    })
    .filter((job): job is SourceJob => job !== null);
}

async function searchReedWebsite(input: DiscoveryInput): Promise<SourceJob[]> {
  const startTime = Date.now();
  const url = `https://www.reed.co.uk/jobs/${slugify(input.query)}-jobs-in-${slugify(input.location || 'united-kingdom')}`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-GB,en;q=0.9',
      },
    });

    const responseTime = Date.now() - startTime;

    if (!res.ok) {
      await logProviderEvent({
        provider: 'reed',
        eventType: 'search_failure',
        query: input.query,
        location: input.location,
        httpStatus: res.status,
        responseTimeMs: responseTime,
        errorMessage: `Reed public ${res.status}`,
      });
      throw new Error(`Reed public ${res.status}`);
    }

    const html = await res.text();

    // Try __NEXT_DATA__ JSON first (current Reed structure as of May 2026)
    const nextDataJobs = extractNextDataJobs(html);
    if (nextDataJobs.length > 0) {
      console.info(`[ReedProvider] Found ${nextDataJobs.length} jobs via __NEXT_DATA__`);
      await logProviderEvent({
        provider: 'reed',
        eventType: 'search_success',
        query: input.query,
        location: input.location,
        jobsFound: nextDataJobs.length,
        parsingMethod: 'next_data_json',
        responseTimeMs: responseTime,
        httpStatus: res.status,
      });
      return nextDataJobs.slice(0, input.limit);
    }

    // Fallback to structured data (ld+json)
    const structured = extractStructuredJobs(html);
    if (structured.length > 0) {
      console.info(`[ReedProvider] Found ${structured.length} jobs via structured data (fallback)`);
      await logProviderEvent({
        provider: 'reed',
        eventType: 'structure_change',
        query: input.query,
        location: input.location,
        jobsFound: structured.length,
        parsingMethod: 'structured_data',
        responseTimeMs: responseTime,
        httpStatus: res.status,
        errorMessage: '__NEXT_DATA__ not found, using structured data fallback',
      });
      return structured.slice(0, input.limit);
    }

    // Last resort: HTML regex parsing (legacy)
    console.warn('[ReedProvider] Falling back to HTML regex parsing - Reed structure may have changed');
    const results: SourceJob[] = [];
    const pattern = /href="(\/jobs\/[^"#?]+)"[\s\S]{0,800}?jobTitle[^>]*>(.*?)<\/[a-z]+>[\s\S]{0,500}?employerName[^>]*>(.*?)<\/[a-z]+>[\s\S]{0,400}?locationName[^>]*>(.*?)<\/[a-z]+>/gi;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(html)) !== null && results.length < input.limit) {
      results.push({
        externalId: match[1],
        source: 'reed',
        title: stripHtml(match[2]),
        company: stripHtml(match[3]),
        location: stripHtml(match[4]),
        description: '',
        applyUrl: `https://www.reed.co.uk${match[1]}`,
        salaryMin: null,
        salaryMax: null,
        workMode: null,
        requirements: [],
        postedAt: new Date().toISOString(),
      });
    }

    if (results.length === 0) {
      console.error('[ReedProvider] All parsing methods failed - Reed structure has likely changed significantly');
      await logProviderEvent({
        provider: 'reed',
        eventType: 'parsing_error',
        query: input.query,
        location: input.location,
        jobsFound: 0,
        parsingMethod: 'html_regex',
        responseTimeMs: responseTime,
        httpStatus: res.status,
        errorMessage: 'All parsing methods failed - structure changed',
        metadata: {
          htmlSample: html.substring(0, 500),
          hasNextData: html.includes('__NEXT_DATA__'),
          hasStructuredData: html.includes('application/ld+json'),
        },
      });
    } else {
      await logProviderEvent({
        provider: 'reed',
        eventType: 'structure_change',
        query: input.query,
        location: input.location,
        jobsFound: results.length,
        parsingMethod: 'html_regex',
        responseTimeMs: responseTime,
        httpStatus: res.status,
        errorMessage: 'Using legacy HTML regex - both JSON methods failed',
      });
    }

    return results;
  } catch (err) {
    const responseTime = Date.now() - startTime;
    await logProviderEvent({
      provider: 'reed',
      eventType: 'search_failure',
      query: input.query,
      location: input.location,
      responseTimeMs: responseTime,
      errorMessage: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}

async function searchReedApi(input: DiscoveryInput): Promise<SourceJob[]> {
  const key = process.env.REED_API_KEY;
  if (!key) return [];

  const url = new URL('https://www.reed.co.uk/api/1.0/search');
  url.searchParams.set('keywords', input.query);
  if (input.location) url.searchParams.set('locationName', input.location);
  url.searchParams.set('resultsToTake', String(input.limit));

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Basic ${Buffer.from(`${key}:`).toString('base64')}` },
  });
  if (!res.ok) throw new Error(`Reed ${res.status}`);
  const data = await res.json() as { results?: Record<string, unknown>[] };

  return (data.results ?? []).map((j) => ({
    externalId: norm(j.jobId),
    source: 'reed',
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

export class ReedProvider implements JobSourceProvider {
  name = 'reed';
  label = 'Reed';

  async readiness(): Promise<{ ready: boolean; reason?: string }> {
    if (process.env.REED_API_KEY) {
      return { ready: true, reason: 'REED API key set; API + public www discovery enabled' };
    }
    return { ready: true, reason: 'REED_API_KEY not set, using public www discovery' };
  }

  async discover(input: DiscoveryInput, _context?: ProviderContext): Promise<SourceJob[]> {
    const settled = await Promise.allSettled([
      searchReedApi(input),
      searchReedWebsite(input),
    ]);

    const jobs: SourceJob[] = [];
    for (const result of settled) {
      if (result.status === 'fulfilled') jobs.push(...result.value);
      else console.error('[ReedProvider] discovery branch failed:', result.reason);
    }

    if (jobs.length === 0) {
      const errors = settled
        .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
        .map((result) => result.reason instanceof Error ? result.reason.message : String(result.reason));
      if (errors.length > 0) throw new Error(`Reed discovery failed: ${errors.join('; ')}`);
    }

    return dedupeJobs(jobs, input.limit);
  }
}
