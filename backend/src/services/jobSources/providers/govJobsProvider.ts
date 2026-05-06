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
 * Government Jobs Provider - UK Civil Service and Public Sector Jobs
 * Uses official government APIs and RSS feeds
 */
export class GovJobsProvider implements JobSourceProvider {
    name = 'gov-jobs';
    label = 'Government Jobs';

    async readiness(): Promise<{ ready: boolean; reason?: string }> {
        return { ready: true, reason: 'Government jobs via public APIs and RSS feeds' };
    }

    async discover(input: DiscoveryInput, _context?: ProviderContext): Promise<SourceJob[]> {
        const results: SourceJob[] = [];

        // Try multiple government job sources
        const settled = await Promise.allSettled([
            this.searchCivilServiceJobs(input),
            this.searchNHSJobs(input),
            this.searchLocalGovJobs(input),
        ]);

        for (const result of settled) {
            if (result.status === 'fulfilled') {
                results.push(...result.value);
            } else {
                console.error('[GovJobsProvider] source failed:', result.reason);
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

    private async searchCivilServiceJobs(input: DiscoveryInput): Promise<SourceJob[]> {
        // Civil Service Jobs RSS feed
        const url = new URL('https://www.civilservicejobs.service.gov.uk/csr/jobs.rss');
        url.searchParams.set('keyword', input.query);
        if (input.location && input.location !== 'United Kingdom') {
            url.searchParams.set('location', input.location);
        }

        const response = await fetch(url.toString(), {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; JobBot/1.0)',
            },
        });

        if (!response.ok) throw new Error(`Civil Service Jobs RSS ${response.status}`);
        const rssText = await response.text();

        // Parse RSS XML
        const jobs: SourceJob[] = [];
        const itemPattern = /<item>([\s\S]*?)<\/item>/g;
        let match: RegExpExecArray | null;

        while ((match = itemPattern.exec(rssText)) !== null) {
            const item = match[1];
            const title = this.extractXmlTag(item, 'title');
            const link = this.extractXmlTag(item, 'link');
            const description = stripHtml(this.extractXmlTag(item, 'description'));
            const pubDate = this.extractXmlTag(item, 'pubDate');

            if (title && link) {
                jobs.push({
                    externalId: link,
                    source: 'civil-service',
                    title: stripHtml(title),
                    company: 'UK Civil Service',
                    location: input.location || 'United Kingdom',
                    description,
                    applyUrl: link,
                    salaryMin: null,
                    salaryMax: null,
                    workMode: parseWorkMode(description),
                    requirements: extractRequirements(description),
                    postedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
                });
            }
        }

        return jobs.slice(0, 5);
    }

    private async searchNHSJobs(input: DiscoveryInput): Promise<SourceJob[]> {
        // NHS Jobs API (public search)
        const url = new URL('https://www.jobs.nhs.uk/xi/search_vacancy');
        url.searchParams.set('action', 'search');
        url.searchParams.set('keywords', input.query);
        url.searchParams.set('format', 'json');

        try {
            const response = await fetch(url.toString(), {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; JobBot/1.0)',
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) return [];
            const data = await response.json() as { vacancies?: Record<string, unknown>[] };

            return (data.vacancies ?? []).slice(0, 5).map((job): SourceJob => {
                const description = stripHtml(norm(job.summary));
                return {
                    externalId: norm(job.id),
                    source: 'nhs-jobs',
                    title: norm(job.title),
                    company: norm(job.organisation) || 'NHS',
                    location: norm(job.location) || input.location || 'United Kingdom',
                    description,
                    applyUrl: norm(job.url) || `https://www.jobs.nhs.uk/xi/vacancy/${job.id}`,
                    salaryMin: null,
                    salaryMax: null,
                    workMode: parseWorkMode(description),
                    requirements: extractRequirements(description),
                    postedAt: norm(job.posted_date) || new Date().toISOString(),
                };
            });
        } catch {
            return [];
        }
    }

    private async searchLocalGovJobs(input: DiscoveryInput): Promise<SourceJob[]> {
        // Local Government Jobs via public search
        const url = new URL('https://www.localgov.co.uk/jobs/search');
        url.searchParams.set('q', input.query);
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

            // Extract structured data from HTML
            const jobs: SourceJob[] = [];
            const jobPattern = /class="job-item"[\s\S]*?href="([^"]+)"[\s\S]*?class="job-title"[^>]*>([^<]+)<[\s\S]*?class="employer"[^>]*>([^<]+)<[\s\S]*?class="location"[^>]*>([^<]+)</g;
            let match: RegExpExecArray | null;

            while ((match = jobPattern.exec(html)) !== null && jobs.length < 5) {
                const [, link, title, company, location] = match;
                jobs.push({
                    externalId: link,
                    source: 'local-gov',
                    title: stripHtml(title),
                    company: stripHtml(company),
                    location: stripHtml(location),
                    description: '',
                    applyUrl: link.startsWith('http') ? link : `https://www.localgov.co.uk${link}`,
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

    private extractXmlTag(xml: string, tag: string): string {
        const pattern = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
        const match = xml.match(pattern);
        return match ? match[1].trim() : '';
    }
}