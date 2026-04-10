import type { JobSourceProvider, DiscoveryInput, ProviderContext, SourceJob } from '../types.js';

function norm(v: unknown): string {
  return String(v ?? '').trim();
}

export class JoobleProvider implements JobSourceProvider {
  name = 'jooble';
  label = 'Jooble';

  async readiness(): Promise<{ ready: boolean; reason?: string }> {
    if (!process.env.JOOBLE_API_KEY) {
      return { ready: false, reason: 'JOOBLE_API_KEY not set' };
    }
    return { ready: true };
  }

  async discover(input: DiscoveryInput, _context?: ProviderContext): Promise<SourceJob[]> {
    const key = process.env.JOOBLE_API_KEY;
    if (!key) return [];

    const res = await fetch(`https://jooble.org/api/${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keywords: input.query, location: input.location, page: '1' }),
    });
    if (!res.ok) throw new Error(`Jooble ${res.status}`);
    const data = await res.json() as { jobs?: Record<string, unknown>[] };

    return (data.jobs ?? []).slice(0, input.limit).map((j) => ({
      externalId: norm(j.id ?? j.link),
      source: 'jooble',
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
}
