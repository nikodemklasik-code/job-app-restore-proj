import type { JobSourceProvider, DiscoveryInput, ProviderContext, SourceJob } from '../types.js';
import { logProviderEvent } from '../providerMonitoring.js';

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

async function scrapeLinkedIn(input: DiscoveryInput, cookies?: string): Promise<SourceJob[]> {
    if (!cookies?.trim()) {
        console.warn('[LinkedInProvider] No session cookies provided - LinkedIn requires authentication');
        return [];
    }

    const query = encodeURIComponent(input.query);
    const location = encodeURIComponent(input.location || 'United Kingdom');
    const url = `https://www.linkedin.com/jobs/search/?keywords=${query}&location=${location}`;

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-GB,en;q=0.9',
                'Cookie': cookies,
            },
        });

        if (!response.ok) {
            console.warn(`[LinkedInProvider] HTTP ${response.status} for ${url}`);
            return [];
        }

        const html = await response.text();
        const jobs: SourceJob[] = [];

        // LinkedIn embeds job data in JSON within script tags
        const jsonMatch = html.match(/window\.jobsData\s*=\s*(\{.*?\});/s);
        if (jsonMatch) {
            try {
                const data = JSON.parse(jsonMatch[1]);
                const jobsList = data.jobs || data.results || [];
                for (const job of jobsList) {
                    jobs.push(parseLinkedInJob(job));
                }
            } catch (err) {
                console.warn('[LinkedInProvider] Failed to parse jobs JSON:', err);
            }
        }

        // Fallback: parse HTML job cards
        if (jobs.length === 0) {
            const cardPattern = /data-job-id="(\d+)"[\s\S]{0,800}?<h3[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>[\s\S]{0,400}?<h4[^>]*>([^<]+)<\/h4>[\s\S]{0,400}?<span[^>]*class="[^"]*location[^"]*"[^>]*>([^<]+)</gi;
            let match;
            while ((match = cardPattern.exec(html)) !== null) {
                jobs.push({
                    externalId: match[1],
                    source: 'linkedin',
                    title: stripHtml(match[2]),
                    company: stripHtml(match[3]),
                    location: stripHtml(match[4]),
                    description: '',
                    applyUrl: `https://www.linkedin.com/jobs/view/${match[1]}`,
                    salaryMin: null,
                    salaryMax: null,
                    workMode: null,
                    requirements: [],
                    postedAt: new Date().toISOString(),
                });
            }
        }

        console.info(`[LinkedInProvider] Scraped ${jobs.length} jobs from ${url}`);
        return jobs.slice(0, input.limit || 20);
    } catch (error) {
        console.error('[LinkedInProvider] Scraping failed:', error);
        return [];
    }
}

function parseLinkedInJob(data: Record<string, unknown>): SourceJob {
    return {
        externalId: norm(data.jobId || data.id),
        source: 'linkedin',
        title: norm(data.title),
        company: norm(data.companyName || (data.company as Record<string, unknown>)?.name),
        location: norm(data.location || data.formattedLocation),
        description: stripHtml(norm(data.description)),
        applyUrl: norm(data.url) || `https://www.linkedin.com/jobs/view/${norm(data.jobId || data.id)}`,
        salaryMin: null,
        salaryMax: null,
        workMode: parseWorkMode(norm(data.description)),
        requirements: extractRequirements(norm(data.description)),
        postedAt: norm(data.listedAt) || new Date().toISOString(),
    };
}

export class LinkedInProvider implements JobSourceProvider {
    name = 'linkedin';
    label = 'LinkedIn';

    async readiness(): Promise<{ ready: boolean; reason?: string }> {
        return {
            ready: true,
            reason: 'LinkedIn web scraping enabled (requires user session cookies)',
        };
    }

    async discover(input: DiscoveryInput, context?: ProviderContext): Promise<SourceJob[]> {
        const start = Date.now();
        try {
            const cookies = context?.sessionCookies?.['linkedin'];
            const jobs = await scrapeLinkedIn(input, cookies);
            logProviderEvent(this.name, 'discover', jobs.length, Date.now() - start);
            return jobs;
        } catch (error) {
            logProviderEvent(this.name, 'discover', 0, Date.now() - start, error as Error);
            return [];
        }
    }
}
