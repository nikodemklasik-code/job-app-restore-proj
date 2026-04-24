import { randomUUID } from 'crypto';
import type { DiscoveryInput, SourceJob } from '../types.js';

export function norm(value: unknown): string {
  return String(value ?? '').trim();
}

export function stripHtml(value: string): string {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-GB,en;q=0.9',
    },
  });
  if (!res.ok) throw new Error(`Public web source ${res.status}`);
  return res.text();
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

export function extractStructuredJobs(html: string, source: string, limit: number): SourceJob[] {
  const scriptPattern = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const entries: Record<string, unknown>[] = [];
  let match: RegExpExecArray | null;

  while ((match = scriptPattern.exec(html)) !== null) {
    try {
      collectStructuredJobs(JSON.parse(match[1]), entries);
    } catch {
      // ignore malformed structured data
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
        externalId: norm(identifier?.value ?? applyUrl) || randomUUID(),
        source,
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
    .filter((job): job is SourceJob => job !== null)
    .slice(0, limit);
}

export function buildQuery(input: DiscoveryInput): { query: string; location: string } {
  return {
    query: input.query?.trim() || 'jobs',
    location: input.location?.trim() || 'United Kingdom',
  };
}
