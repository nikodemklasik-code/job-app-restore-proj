import type { JobSourceProvider, DiscoveryInput, ProviderContext, SourceJob } from '../types.js';

function norm(v: unknown): string {
  return String(v ?? '').trim();
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
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

/** Extract salary from Jooble format */
function parseSalary(raw: string | null | undefined): { min: number | null; max: number | null } {
  if (!raw) return { min: null, max: null };
  const nums = raw.replace(/[£,]/g, '').match(/\d+(?:\.\d+)?/g);
  if (!nums) return { min: null, max: null };
  const values = nums.map(Number).filter((n) => n >= 1000);
  if (values.length === 0) return { min: null, max: null };
  const isHourly = /hour|hr/i.test(raw);
  const isDaily = /day|daily/i.test(raw);
  const factor = isHourly ? 2080 : isDaily ? 260 : 1;
  return {
    min: Math.round(values[0] * factor),
    max: values.length > 1 ? Math.round(values[values.length - 1] * factor) : null,
  };
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

function collectStructuredJobs(value: unknown, sink: Record<string, unknown>[]): void {
  if (!value) return;
  if (Array.isArray(value)) {
    for (const item of value) collectStructuredJobs(item, sink);
    return;
  }
  if (typeof value !== 'object') return;
  const obj = value as Record<string, unknown>;
  const type = obj['@type'];
  if (type === 'JobPosting' || (Array.isArray(type) && type.includes('JobPosting'))) sink.push(obj);
  collectStructuredJobs(obj['@graph'], sink);
  collectStructuredJobs(obj.itemListElement, sink);
}

async function searchJoobleWebsite(input: DiscoveryInput): Promise<SourceJob[]> {
  const url = new URL('https://uk.jooble.org/SearchResult');
  url.searchParams.set('ukw', input.query);
  if (input.location) url.searchParams.set('rgns', input.location);

  const res = await fetch(url.toString(), {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-GB,en;q=0.9',
    },
  });
  if (!res.ok) throw new Error(`Jooble public ${res.status}`);
  const html = await res.text();

  const scriptPattern = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const entries: Record<string, unknown>[] = [];
  let match: RegExpExecArray | null;
  while ((match = scriptPattern.exec(html)) !== null) {
    try { collectStructuredJobs(JSON.parse(match[1]), entries); } catch {}
  }

  return entries.slice(0, input.limit).map((job) => {
    const org = job.hiringOrganization as Record<string, unknown> | undefined;
    const identifier = job.identifier as Record<string, unknown> | undefined;
    const address = ((job.jobLocation as Record<string, unknown> | undefined)?.address ?? job.jobLocation) as Record<string, unknown> | undefined;
    return {
      externalId: norm(identifier?.value ?? job.url ?? job.sameAs),
      source: 'jooble',
      title: norm(job.title ?? job.name),
      company: norm(org?.name ?? 'Unknown company'),
      location: norm(address?.addressLocality ?? address?.addressRegion ?? address?.addressCountry ?? 'United Kingdom'),
      description: stripHtml(norm(job.description)),
      applyUrl: norm(job.url ?? job.sameAs),
      salaryMin: null,
      salaryMax: null,
      workMode: norm(job.employmentType) || null,
      requirements: [],
      postedAt: norm(job.datePosted) || new Date().toISOString(),
    } satisfies SourceJob;
  }).filter((job) => job.title && job.applyUrl);
}

async function searchJoobleApi(input: DiscoveryInput): Promise<SourceJob[]> {
  const key = process.env.JOOBLE_API_KEY;
  if (!key) return [];

  const res = await fetch(`https://jooble.org/api/${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keywords: input.query, location: input.location, page: '1' }),
  });
  if (!res.ok) throw new Error(`Jooble ${res.status}`);
  const data = await res.json() as { jobs?: Record<string, unknown>[] };

  return (data.jobs ?? []).slice(0, input.limit).map((j) => {
    const description = String(j.snippet ?? j.description ?? '');
    const salaryRaw = String(j.salary ?? '');
    const { min: salaryMin, max: salaryMax } = parseSalary(salaryRaw);
    return {
      externalId: norm(j.id ?? j.link),
      source: 'jooble',
      title: norm(j.title),
      company: norm(j.company),
      location: norm(j.location),
      description,
      applyUrl: norm(j.link),
      salaryMin,
      salaryMax,
      workMode: parseWorkMode(description),
      requirements: extractRequirements(description),
      postedAt: new Date().toISOString(),
    };
  });
}

export class JoobleProvider implements JobSourceProvider {
  name = 'jooble';
  label = 'Jooble';

  async readiness(): Promise<{ ready: boolean; reason?: string }> {
    if (process.env.JOOBLE_API_KEY) return { ready: true, reason: 'JOOBLE API key set; API + public www discovery enabled' };
    return { ready: true, reason: 'JOOBLE_API_KEY not set, using public www discovery' };
  }

  async discover(input: DiscoveryInput, _context?: ProviderContext): Promise<SourceJob[]> {
    const settled = await Promise.allSettled([
      searchJoobleApi(input),
      searchJoobleWebsite(input),
    ]);

    const jobs: SourceJob[] = [];
    for (const result of settled) {
      if (result.status === 'fulfilled') jobs.push(...result.value);
      else console.error('[JoobleProvider] discovery branch failed:', result.reason);
    }

    if (jobs.length === 0) {
      const errors = settled
        .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
        .map((result) => result.reason instanceof Error ? result.reason.message : String(result.reason));
      if (errors.length > 0) throw new Error(`Jooble discovery failed: ${errors.join('; ')}`);
    }

    return dedupeJobs(jobs, input.limit);
  }
}
