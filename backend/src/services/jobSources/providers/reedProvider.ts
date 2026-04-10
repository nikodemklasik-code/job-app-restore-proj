import { randomUUID } from 'crypto';
import type { JobSourceProvider, DiscoveryInput, ProviderContext, SourceJob } from '../types.js';

function norm(v: unknown): string {
  return String(v ?? '').trim();
}

export class ReedProvider implements JobSourceProvider {
  name = 'reed';
  label = 'Reed';

  async readiness(): Promise<{ ready: boolean; reason?: string }> {
    if (!process.env.REED_API_KEY) {
      return { ready: false, reason: 'REED_API_KEY not set' };
    }
    return { ready: true };
  }

  async discover(input: DiscoveryInput, _context?: ProviderContext): Promise<SourceJob[]> {
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
}
