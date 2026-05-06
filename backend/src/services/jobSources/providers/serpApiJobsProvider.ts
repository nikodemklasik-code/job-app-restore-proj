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
 * SerpApi Jobs Provider - Google Jobs search without cookies
 * Accesses Google's job aggregation which includes Indeed, LinkedIn, etc.
 */
export class SerpApiJobsProvider implements JobSourceProvider {
    name = 'serpapi-jobs';
    label = 'SerpApi Jobs';

    async readiness(): Promise<{ ready: boolean; reason?: string }> {
        if (process.env.SERPAPI_KEY) {
            return { ready: true, reason: 'SerpApi key configured - access to Google Jobs aggregation' };
        }
        return { ready: false, reason: 'SERPAPI_KEY not set' };
    }

    async discover(input: DiscoveryInput, _context?: ProviderContext): Promise<SourceJob[]> {
        const apiKey = process.env.SERPAPI_KEY;
        if (!apiKey) return [];

        try {
            const url = new URL('https://serpapi.com/search.json');
            url.searchParams.set('engine', 'google_jobs');
            url.searchParams.set('q', input.query);
            url.searchParams.set('location', input.location || 'United Kingdom');
            url.searchParams.set('api_key', apiKey);
            url.searchParams.set('num', String(Math.min(input.limit, 10))); // SerpApi limit

            const response = await fetch(url.toString());

            if (!response.ok) {
                throw new Error(`SerpApi Jobs ${response.status}`);
            }

            const data = await response.json() as { jobs_results?: Record<string, unknown>[] };
            const jobs = (data.jobs_results ?? []).map((job): SourceJob => {
                const description = stripHtml(norm(job.description));
                return {
                    externalId: norm(job.job_id) || norm(job.link),
                    source: 'serpapi-jobs',
                    title: norm(job.title),
                    company: norm(job.company_name),
                    location: norm(job.location),
                    description,
                    applyUrl: norm(job.apply_link) || norm(job.link),
                    salaryMin: null, // Google Jobs doesn't always provide structured salary
                    salaryMax: null,
                    workMode: parseWorkMode(description),
                    requirements: extractRequirements(description),
                    postedAt: norm((job.detected_extensions as Record<string, unknown> | undefined)?.posted_at) || new Date().toISOString(),
                };
            });

            console.info(`[SerpApiJobsProvider] Found ${jobs.length} jobs via SerpApi`);
            return jobs;
        } catch (error) {
            console.error('[SerpApiJobsProvider] API call failed:', error);
            return [];
        }
    }
}