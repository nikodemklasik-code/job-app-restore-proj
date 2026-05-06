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
 * RapidAPI Jobs Provider - aggregates multiple job sources through RapidAPI
 * Sources: Indeed, LinkedIn, Glassdoor, ZipRecruiter, SimplyHired, etc.
 * No cookies required - uses official APIs
 */
export class RapidApiJobsProvider implements JobSourceProvider {
    name = 'rapidapi-jobs';
    label = 'RapidAPI Jobs';

    async readiness(): Promise<{ ready: boolean; reason?: string }> {
        if (process.env.RAPIDAPI_KEY) {
            return { ready: true, reason: 'RapidAPI key configured - access to Indeed, LinkedIn, Glassdoor APIs' };
        }
        return { ready: false, reason: 'RAPIDAPI_KEY not set' };
    }

    async discover(input: DiscoveryInput, _context?: ProviderContext): Promise<SourceJob[]> {
        const apiKey = process.env.RAPIDAPI_KEY;
        if (!apiKey) return [];

        try {
            // JSearch API - aggregates Indeed, LinkedIn, Glassdoor, ZipRecruiter
            const url = new URL('https://jsearch.p.rapidapi.com/search');
            url.searchParams.set('query', input.query);
            url.searchParams.set('page', '1');
            url.searchParams.set('num_pages', '1');
            url.searchParams.set('country', 'GB');
            if (input.location && input.location !== 'United Kingdom') {
                url.searchParams.set('location', input.location);
            }

            const response = await fetch(url.toString(), {
                headers: {
                    'X-RapidAPI-Key': apiKey,
                    'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
                },
            });

            if (!response.ok) {
                throw new Error(`RapidAPI Jobs ${response.status}`);
            }

            const data = await response.json() as { data?: Record<string, unknown>[] };
            const jobs = (data.data ?? []).slice(0, input.limit).map((job): SourceJob => {
                const description = stripHtml(norm(job.job_description));
                return {
                    externalId: norm(job.job_id),
                    source: 'rapidapi-jobs',
                    title: norm(job.job_title),
                    company: norm(job.employer_name),
                    location: norm(job.job_city) + (job.job_country ? `, ${norm(job.job_country)}` : ''),
                    description,
                    applyUrl: norm(job.job_apply_link),
                    salaryMin: typeof job.job_min_salary === 'number' ? job.job_min_salary : null,
                    salaryMax: typeof job.job_max_salary === 'number' ? job.job_max_salary : null,
                    workMode: parseWorkMode(description),
                    requirements: extractRequirements(description),
                    postedAt: norm(job.job_posted_at_datetime_utc) || new Date().toISOString(),
                };
            });

            console.info(`[RapidApiJobsProvider] Found ${jobs.length} jobs via RapidAPI`);
            return jobs;
        } catch (error) {
            console.error('[RapidApiJobsProvider] API call failed:', error);
            return [];
        }
    }
}