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
 * Job Aggregator Provider - searches multiple job aggregators
 * Uses public APIs and search endpoints that don't require authentication
 */
export class AggregatorProvider implements JobSourceProvider {
    name = 'aggregator';
    label = 'Job Aggregators';

    async readiness(): Promise<{ ready: boolean; reason?: string }> {
        return { ready: true, reason: 'Multiple job aggregators via public search endpoints' };
    }

    async discover(input: DiscoveryInput, _context?: ProviderContext): Promise<SourceJob[]> {
        const results: SourceJob[] = [];

        // Try multiple aggregator sources in parallel
        const settled = await Promise.allSettled([
            this.searchCareerJet(input),
            this.searchJobRapido(input),
            this.searchSimplyHired(input),
            this.searchJobsDB(input),
            this.searchWorkopolis(input),
        ]);

        for (const result of settled) {
            if (result.status === 'fulfilled') {
                results.push(...result.value);
            } else {
                console.error('[AggregatorProvider] source failed:', result.reason);
            }
        }

        // Dedupe and limit results
        const seen = new Set<string>();
        const deduped = results.filter((job) => {
            const key = `${job.title}|${job.company}|${job.location}`.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        return deduped.slice(0, input.limit);
    }

    private async searchCareerJet(input: DiscoveryInput): Promise<SourceJob[]> {
        // CareerJet public API (free tier)
        const url = new URL('https://public-api.careerjet.com/search');
        url.searchParams.set('keywords', input.query);
        url.searchParams.set('location', input.location || 'United Kingdom');
        url.searchParams.set('affid', '0afaf0173305e4b9b9ddbaf7c5f9b7e5'); // Public affiliate ID
        url.searchParams.set('user_ip', '127.0.0.1');
        url.searchParams.set('user_agent', 'Mozilla/5.0 (compatible; JobBot/1.0)');
        url.searchParams.set('locale_code', 'en_GB');
        url.searchParams.set('pagesize', '10');

        try {
            const response = await fetch(url.toString(), {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; JobBot/1.0)',
                },
            });

            if (!response.ok) return [];
            const data = await response.json() as { jobs?: Record<string, unknown>[] };

            return (data.jobs ?? []).map((job): SourceJob => {
                const description = stripHtml(norm(job.description));
                return {
                    externalId: norm(job.url),
                    source: 'careerjet',
                    title: norm(job.title),
                    company: norm(job.company),
                    location: norm(job.locations),
                    description,
                    applyUrl: norm(job.url),
                    salaryMin: null,
                    salaryMax: null,
                    workMode: parseWorkMode(description),
                    requirements: extractRequirements(description),
                    postedAt: norm(job.date) || new Date().toISOString(),
                };
            });
        } catch {
            return [];
        }
    }

    private async searchJobRapido(input: DiscoveryInput): Promise<SourceJob[]> {
        // JobRapido public search
        const url = new URL('https://uk.jobrapido.com/jobsearch');
        url.searchParams.set('q', input.query);
        if (input.location && input.location !== 'United Kingdom') {
            url.searchParams.set('l', input.location);
        }

        try {
            const response = await fetch(url.toString(), {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; JobBot/1.0)',
                },
            });

            if (!response.ok) return [];
            const html = await response.text();

            // Extract structured data from HTML
            const jobs: SourceJob[] = [];
            const scriptPattern = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
            let match: RegExpExecArray | null;

            while ((match = scriptPattern.exec(html)) !== null) {
                try {
                    const jsonData = JSON.parse(match[1]);
                    if (jsonData['@type'] === 'JobPosting' || (Array.isArray(jsonData['@type']) && jsonData['@type'].includes('JobPosting'))) {
                        const description = stripHtml(norm(jsonData.description));
                        const org = jsonData.hiringOrganization || {};
                        const location = jsonData.jobLocation || {};
                        const address = location.address || {};

                        jobs.push({
                            externalId: norm(jsonData.url || jsonData.identifier?.value),
                            source: 'jobrapido',
                            title: norm(jsonData.title),
                            company: norm(org.name) || 'Unknown Company',
                            location: norm(address.addressLocality || address.addressRegion) || input.location || 'United Kingdom',
                            description,
                            applyUrl: norm(jsonData.url),
                            salaryMin: null,
                            salaryMax: null,
                            workMode: parseWorkMode(description),
                            requirements: extractRequirements(description),
                            postedAt: norm(jsonData.datePosted) || new Date().toISOString(),
                        });
                    }
                } catch {
                    // Skip malformed JSON
                }
            }

            return jobs.slice(0, 5);
        } catch {
            return [];
        }
    }

    private async searchSimplyHired(input: DiscoveryInput): Promise<SourceJob[]> {
        // SimplyHired public search
        const url = new URL('https://www.simplyhired.co.uk/search');
        url.searchParams.set('q', input.query);
        if (input.location && input.location !== 'United Kingdom') {
            url.searchParams.set('l', input.location);
        }

        try {
            const response = await fetch(url.toString(), {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; JobBot/1.0)',
                },
            });

            if (!response.ok) return [];
            const html = await response.text();

            // Extract job data from HTML
            const jobs: SourceJob[] = [];
            const jobPattern = /data-jk="([^"]+)"[\s\S]*?data-title="([^"]+)"[\s\S]*?data-company="([^"]+)"[\s\S]*?data-location="([^"]+)"/g;
            let match: RegExpExecArray | null;

            while ((match = jobPattern.exec(html)) !== null && jobs.length < 5) {
                const [, jobKey, title, company, location] = match;
                jobs.push({
                    externalId: jobKey,
                    source: 'simplyhired',
                    title: stripHtml(title),
                    company: stripHtml(company),
                    location: stripHtml(location),
                    description: '',
                    applyUrl: `https://www.simplyhired.co.uk/job/${jobKey}`,
                    salaryMin: null,
                    salaryMax: null,
                    workMode: null,
                    requirements: [],
                    postedAt: new Date().toISOString(),
                });
            }

            return jobs;
        } catch {
            return [];
        }
    }

    private async searchJobsDB(input: DiscoveryInput): Promise<SourceJob[]> {
        // JobsDB public search (if available in UK)
        const url = new URL('https://uk.jobsdb.com/jobs');
        url.searchParams.set('keywords', input.query);
        if (input.location && input.location !== 'United Kingdom') {
            url.searchParams.set('location', input.location);
        }

        try {
            const response = await fetch(url.toString(), {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; JobBot/1.0)',
                },
            });

            if (!response.ok) return [];
            const html = await response.text();

            // Extract structured data
            const jobs: SourceJob[] = [];
            const scriptPattern = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
            let match: RegExpExecArray | null;

            while ((match = scriptPattern.exec(html)) !== null) {
                try {
                    const jsonData = JSON.parse(match[1]);
                    if (Array.isArray(jsonData)) {
                        for (const item of jsonData) {
                            if (item['@type'] === 'JobPosting') {
                                const description = stripHtml(norm(item.description));
                                const org = item.hiringOrganization || {};

                                jobs.push({
                                    externalId: norm(item.url || item.identifier?.value),
                                    source: 'jobsdb',
                                    title: norm(item.title),
                                    company: norm(org.name) || 'Unknown Company',
                                    location: input.location || 'United Kingdom',
                                    description,
                                    applyUrl: norm(item.url),
                                    salaryMin: null,
                                    salaryMax: null,
                                    workMode: parseWorkMode(description),
                                    requirements: extractRequirements(description),
                                    postedAt: norm(item.datePosted) || new Date().toISOString(),
                                });
                            }
                        }
                    }
                } catch {
                    // Skip malformed JSON
                }
            }

            return jobs.slice(0, 5);
        } catch {
            return [];
        }
    }

    private async searchWorkopolis(input: DiscoveryInput): Promise<SourceJob[]> {
        // Workopolis-style aggregator search
        const url = new URL('https://www.workopolis.com/jobsearch/jobs');
        url.searchParams.set('keywords', input.query);
        if (input.location && input.location !== 'United Kingdom') {
            url.searchParams.set('location', input.location);
        }

        try {
            const response = await fetch(url.toString(), {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; JobBot/1.0)',
                },
            });

            if (!response.ok) return [];
            const html = await response.text();

            // Extract job listings from HTML
            const jobs: SourceJob[] = [];
            const jobPattern = /class="job-title"[^>]*><a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>[\s\S]*?class="company-name"[^>]*>([^<]+)<[\s\S]*?class="job-location"[^>]*>([^<]+)</g;
            let match: RegExpExecArray | null;

            while ((match = jobPattern.exec(html)) !== null && jobs.length < 5) {
                const [, link, title, company, location] = match;
                jobs.push({
                    externalId: link,
                    source: 'workopolis',
                    title: stripHtml(title),
                    company: stripHtml(company),
                    location: stripHtml(location),
                    description: '',
                    applyUrl: link.startsWith('http') ? link : `https://www.workopolis.com${link}`,
                    salaryMin: null,
                    salaryMax: null,
                    workMode: null,
                    requirements: [],
                    postedAt: new Date().toISOString(),
                });
            }

            return jobs;
        } catch {
            return [];
        }
    }
}