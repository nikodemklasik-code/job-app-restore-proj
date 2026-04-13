import type { JobSourceProvider, DiscoveryInput, ProviderContext, SourceJob } from '../types.js';

function norm(v: unknown): string {
  return String(v ?? '').trim();
}

export class AdzunaProvider implements JobSourceProvider {
  name = 'adzuna';
  label = 'Adzuna';

  async readiness(): Promise<{ ready: boolean; reason?: string }> {
    if (!process.env.ADZUNA_APP_ID || !process.env.ADZUNA_APP_KEY) {
      return { ready: false, reason: 'ADZUNA_APP_ID and ADZUNA_APP_KEY not set' };
    }
    return { ready: true };
  }

  async discover(input: DiscoveryInput, _context?: ProviderContext): Promise<SourceJob[]> {
    const appId = process.env.ADZUNA_APP_ID;
    const appKey = process.env.ADZUNA_APP_KEY;
    if (!appId || !appKey) return [];

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
