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

function parseWorkMode(description: string): string | null {
    const text = description.toLowerCase();
    if (/\bremote\b/.test(text)) return 'remote';
    if (/hybrid/.test(text)) return 'hybrid';
    if (/on.?site|in.?office/.test(text)) return 'on-site';
    return null;
}

function extractRequirements(description: string): string[] {
    if (!description) return [];
    return description
        .split(/[\n•\-\*]/)
        .map((line) => line.trim())
        .filter((line) => line.length >= 15 && line.length <= 150)
        .filter((line) =>
            /(experience|knowledge|ability|skilled|proficient|required|must have)/i.test(line),
        )
        .slice(0, 8);
}

/**
 * The Muse Jobs Provider - Free API, no authentication required
 * Focuses on high-quality companies and remote/flexible work
 */
export class TheMuseJobsProvider implements JobSourceProvider {
    name = 'themuse-jobs';
    label = 'The Muse Jobs';

    async readiness(): Promise<{ ready: boolean; reason?: string }> {
        return { ready: true, reason: 'The Muse API - free access, no authentication required' };
    }

    async discover(input: DiscoveryInput, _context?: ProviderContext): Promise<SourceJob[]> {
        try {
            const url = new URL('https://www.themuse.com/api/public/jobs');
            url.searchParams.set('category', input.query);
            url.searchParams.set('location', input.location || 'United Kingdom');
            url.searchParams.set('page', '0');
            url.searchParams.set('descending', 'true');

            const response = await fetch(url.toString(), {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`The Muse Jobs ${response.status}`);
            }

            const data = await response.json() as { results?: Record<string, unknown>[] };
            const jobs = (data.results ?? []).slice(0, input.limit).map((job): SourceJob => {
                const company = job.company as Record<string, unknown> | undefined;
                const locations = job.locations as Record<string, unknown>[] | undefined;
                const location = locations?.[0];
                const description = stripHtml(norm(job.contents));

                return {
                    externalId: norm(job.id),
                    source: 'themuse-jobs',
                    title: norm(job.name),
                    company: norm(company?.name),
                    location: norm(location?.name) || 'Remote',
                    description,
                    applyUrl: norm((job.refs as Record<string, unknown> | undefined)?.landing_page),
                    salaryMin: null, // The Muse doesn't provide structured salary data
                    salaryMax: null,
                    workMode: parseWorkMode(description),
                    requirements: extractRequirements(description),
                    postedAt: norm(job.publication_date) || new Date().toISOString(),
                };
            });

            console.info(`[TheMuseJobsProvider] Found ${jobs.length} jobs via The Muse API`);
            return jobs;
        } catch (error) {
            console.error('[TheMuseJobsProvider] API call failed:', error);
            return [];
        }
    }
}