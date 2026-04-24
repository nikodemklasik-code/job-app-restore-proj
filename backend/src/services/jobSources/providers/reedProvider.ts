import type { JobSourceProvider, DiscoveryInput, ProviderContext, SourceJob } from '../types.js';

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
    .map((job): SourceJob | null => {
      const title = norm(job.title ?? job.name);
      const applyUrl = norm(job.url ?? job.sameAs);
      if (!title || !applyUrl) return null;
      const org = job.hiringOrganization as Record<string, unknown> | undefined;
      const identifier = job.identifier as Record<string, unknown> | undefined;
      const address = ((job.jobLocation as Record<string, unknown> | undefined)?.address ?? job.jobLocation) as Record<string, unknown> | undefined;
      return {
        externalId: norm(identifier?.value ?? applyUrl),
        source: 'reed',
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
      };
    })
    .filter((job): job is SourceJob => job !== null);
}

async function searchReedWebsite(input: DiscoveryInput): Promise<SourceJob[]> {
  const url = `https://www.reed.co.uk/jobs/${slugify(input.query)}-jobs-in-${slugify(input.location || 'united-kingdom')}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-GB,en;q=0.9',
    },
  });
  if (!res.ok) throw new Error(`Reed public ${res.status}`);
  const html = await res.text();

  const structured = extractStructuredJobs(html);
  if (structured.length > 0) return structured.slice(0, input.limit);

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
  return results;
}

export class ReedProvider implements JobSourceProvider {
  name = 'reed';
  label = 'Reed';

  async readiness(): Promise<{ ready: boolean; reason?: string }> {
    if (process.env.REED_API_KEY) {
      return { ready: true };
    }
    return { ready: true, reason: 'REED_API_KEY not set, using public web fallback' };
  }

  async discover(input: DiscoveryInput, _context?: ProviderContext): Promise<SourceJob[]> {
    const key = process.env.REED_API_KEY;
    if (!key) return searchReedWebsite(input);

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
}
