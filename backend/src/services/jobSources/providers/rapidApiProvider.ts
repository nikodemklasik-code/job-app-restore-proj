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
    if (/on.?site|in.?office|on.?premises/.test(text)) return 'on-site';
    return null;
}

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

/**
 * RapidAPI Jobs Provider - aggregates multiple job APIs
 * Uses JSearch API, Jobs API, and other RapidAPI job endpoints
 */
export class RapidApiProvider implements JobSourceProvider {
    name = 'rapidapi';
    label = 'RapidAPI Jobs';

    async readiness(): Promise<{ ready: boolean; reason?: string }> {
        if (process.env.RAPIDAPI_KEY) {
            return { ready: true, reason: 'RapidAPI key configured - access to multiple job APIs' };
        }
        return { ready: false, reason: 'RAPIDAPI_KEY not set' };
    }

    async discover(input: DiscoveryInput, _context?: ProviderContext): Promise<SourceJob[]> {
        const rapidApiKey = process.env.RAPIDAPI_KEY;
        if (!rapidApiKey) return [];

        const results: SourceJob[] = [];

        // Try multiple RapidAPI job endpoints in parallel
        const settled = await Promise.allSettled([
            this.searchJSearchAPI(input, rapidApiKey),
            this.searchJobsAPI(input, rapidApiKey),
            this.searchJobSpyAPI(input, rapidApiKey),
        ]);

        for (const result of settled) {
            if (result.status === 'fulfilled') {
                results.push(...result.value);
            } else {
                console.error('[RapidApiProvider] API failed:', result.reason);
            }
        }

        // Dedupe and limit results
        const seen = new Set<string>();
        const deduped = results.filter((job) => {
            const key = `${job.externalId}|${job.source}`.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        return deduped.slice(0, input.limit);
    }

    private async searchJSearchAPI(input: DiscoveryInput, apiKey: string): Promise<SourceJob[]> {
        const url = new URL('https://jsearch.p.rapidapi.com/search');
        url.searchParams.set('query', `${input.query} in ${input.location}`);
        url.searchParams.set('page', '1');
        url.searchParams.set('num_pages', '1');
        url.searchParams.set('country', 'GB');

        const response = await fetch(url.toString(), {
            headers: {
                'X-RapidAPI-Key': apiKey,
                'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
            },
        });

        if (!response.ok) throw new Error(`JSearch API ${response.status}`);
        const data = await response.json() as { data?: Record<string, unknown>[] };

        return (data.data ?? []).map((job): SourceJob => {
            const description = stripHtml(norm(job.job_description));
            return {
                externalId: norm(job.job_id),
                source: 'jsearch',
                title: norm(job.job_title),
                company: norm(job.employer_name),
                location: norm(job.job_city) + ', ' + norm(job.job_country),
                description,
                applyUrl: norm(job.job_apply_link),
                salaryMin: typeof job.job_min_salary === 'number' ? job.job_min_salary : null,
                salaryMax: typeof job.job_max_salary === 'number' ? job.job_max_salary : null,
                workMode: parseWorkMode(description),
                requirements: extractRequirements(description),
                postedAt: norm(job.job_posted_at_datetime_utc) || new Date().toISOString(),
            };
        });
    }

    private async searchJobsAPI(input: DiscoveryInput, apiKey: string): Promise<SourceJob[]> {
        const url = new URL('https://jobs-api14.p.rapidapi.com/list');
        url.searchParams.set('query', input.query);
        url.searchParams.set('location', input.location);
        url.searchParams.set('autoTranslateLocation', 'false');
        url.searchParams.set('remoteOnly', 'false');

        const response = await fetch(url.toString(), {
            headers: {
                'X-RapidAPI-Key': apiKey,
                'X-RapidAPI-Host': 'jobs-api14.p.rapidapi.com',
            },
        });

        if (!response.ok) throw new Error(`Jobs API ${response.status}`);
        const data = await response.json() as { jobs?: Record<string, unknown>[] };

        return (data.jobs ?? []).map((job): SourceJob => {
            const description = stripHtml(norm(job.description));
            return {
                externalId: norm(job.id),
                source: 'jobs-api',
                title: norm(job.title),
                company: norm(job.company),
                location: norm(job.location),
                description,
                applyUrl: norm(job.url),
                salaryMin: null,
                salaryMax: null,
                workMode: parseWorkMode(description),
                requirements: extractRequirements(description),
                postedAt: new Date().toISOString(),
            };
        });
    }

    private async searchJobSpyAPI(input: DiscoveryInput, apiKey: string): Promise<SourceJob[]> {
        const url = new URL('https://jobspy.p.rapidapi.com/api/v1/jobs');
        url.searchParams.set('search_term', input.query);
        url.searchParams.set('location', input.location);
        url.searchParams.set('results_wanted', '10');
        url.searchParams.set('site_name', 'indeed,linkedin,zip_recruiter,glassdoor');
        url.searchParams.set('country_indeed', 'UK');

        const response = await fetch(url.toString(), {
            headers: {
                'X-RapidAPI-Key': apiKey,
                'X-RapidAPI-Host': 'jobspy.p.rapidapi.com',
            },
        });

        if (!response.ok) throw new Error(`JobSpy API ${response.status}`);
        const data = await response.json() as { jobs?: Record<string, unknown>[] };

        return (data.jobs ?? []).map((job): SourceJob => {
            const description = stripHtml(norm(job.description));
            return {
                externalId: norm(job.id),
                source: 'jobspy',
                title: norm(job.title),
                company: norm(job.company),
                location: norm(job.location),
                description,
                applyUrl: norm(job.job_url),
                salaryMin: typeof job.min_amount === 'number' ? job.min_amount : null,
                salaryMax: typeof job.max_amount === 'number' ? job.max_amount : null,
                workMode: parseWorkMode(description),
                requirements: extractRequirements(description),
                postedAt: norm(job.date_posted) || new Date().toISOString(),
            };
        });
    }
}