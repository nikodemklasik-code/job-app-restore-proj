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

function parseSalary(salaryText: string): { min: number | null; max: number | null } {
    const cleaned = salaryText.replace(/[£$,K]/gi, '');
    const rangeMatch = cleaned.match(/(\d+)\s*-\s*(\d+)/);
    if (rangeMatch) {
        let min = parseInt(rangeMatch[1], 10);
        let max = parseInt(rangeMatch[2], 10);
        // Handle K notation
        if (salaryText.toLowerCase().includes('k')) {
            min *= 1000;
            max *= 1000;
        }
        return { min, max };
    }
    const singleMatch = cleaned.match(/(\d+)/);
    if (singleMatch) {
        let val = parseInt(singleMatch[1], 10);
        if (salaryText.toLowerCase().includes('k')) {
            val *= 1000;
        }
        return { min: val, max: val };
    }
    return { min: null, max: null };
}

async function scrapeGlassdoor(input: DiscoveryInput, cookies?: string): Promise<SourceJob[]> {
    if (!cookies?.trim()) {
        console.warn('[GlassdoorProvider] No session cookies provided - Glassdoor requires authentication');
        return [];
    }

    const query = encodeURIComponent(input.query);
    const location = encodeURIComponent(input.location || 'United Kingdom');
    const url = `https://www.glassdoor.co.uk/Job/jobs.htm?sc.keyword=${query}&locT=N&locId=2&locKeyword=${location}`;

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
            console.warn(`[GlassdoorProvider] HTTP ${response.status} for ${url}`);
            return [];
        }

        const html = await response.text();
        const jobs: SourceJob[] = [];

        // Glassdoor embeds job data in JSON within script tags
        const jsonMatch = html.match(/window\.gdInitialState\s*=\s*(\{.*?\});/s);
        if (jsonMatch) {
            try {
                const data = JSON.parse(jsonMatch[1]);
                const jobsList = data?.jobListings?.jobs || data?.jobs || [];
                for (const job of jobsList) {
                    jobs.push(parseGlassdoorJob(job));
                }
            } catch (err) {
                console.warn('[GlassdoorProvider] Failed to parse jobs JSON:', err);
            }
        }

        // Fallback: parse HTML job cards
        if (jobs.length === 0) {
            const cardPattern = /data-id="(\d+)"[\s\S]{0,800}?<a[^>]*class="[^"]*jobLink[^"]*"[^>]*>([^<]+)<\/a>[\s\S]{0,400}?<div[^>]*class="[^"]*employer[^"]*"[^>]*>([^<]+)<\/div>[\s\S]{0,400}?<span[^>]*class="[^"]*loc[^"]*"[^>]*>([^<]+)<\/span>[\s\S]{0,400}?<span[^>]*class="[^"]*salary[^"]*"[^>]*>([^<]+)</gi;
            let match;
            while ((match = cardPattern.exec(html)) !== null) {
                const salary = parseSalary(match[5]);
                jobs.push({
                    externalId: match[1],
                    source: 'glassdoor',
                    title: stripHtml(match[2]),
                    company: stripHtml(match[3]),
                    location: stripHtml(match[4]),
                    description: '',
                    applyUrl: `https://www.glassdoor.co.uk/job-listing/${match[1]}`,
                    salaryMin: salary.min,
                    salaryMax: salary.max,
                    workMode: null,
                    requirements: [],
                    postedAt: new Date().toISOString(),
                });
            }
        }

        console.info(`[GlassdoorProvider] Scraped ${jobs.length} jobs from ${url}`);
        return jobs.slice(0, input.limit || 20);
    } catch (error) {
        console.error('[GlassdoorProvider] Scraping failed:', error);
        return [];
    }
}

function parseGlassdoorJob(data: Record<string, unknown>): SourceJob {
    const salary = parseSalary(norm(data.salaryText || data.salary));
    return {
        externalId: norm(data.jobId || data.id),
        source: 'glassdoor',
        title: norm(data.jobTitle || data.title),
        company: norm(data.employerName || data.employer),
        location: norm(data.location || data.locationName),
        description: stripHtml(norm(data.jobDescription || data.description)),
        applyUrl: norm(data.jobUrl) || `https://www.glassdoor.co.uk/job-listing/${norm(data.jobId || data.id)}`,
        salaryMin: salary.min,
        salaryMax: salary.max,
        workMode: parseWorkMode(norm(data.jobDescription || data.description)),
        requirements: extractRequirements(norm(data.jobDescription || data.description)),
        postedAt: norm(data.postedDate) || new Date().toISOString(),
    };
}

export class GlassdoorProvider implements JobSourceProvider {
    name = 'glassdoor';
    label = 'Glassdoor';

    async readiness(): Promise<{ ready: boolean; reason?: string }> {
        return {
            ready: true,
            reason: 'Glassdoor web scraping enabled (requires user session cookies)',
        };
    }

    async discover(input: DiscoveryInput, context?: ProviderContext): Promise<SourceJob[]> {
        const start = Date.now();
        try {
            const cookies = context?.sessionCookies?.['glassdoor'];
            const jobs = await scrapeGlassdoor(input, cookies);
            logProviderEvent(this.name, 'discover', jobs.length, Date.now() - start);
            return jobs;
        } catch (error) {
            logProviderEvent(this.name, 'discover', 0, Date.now() - start, error as Error);
            return [];
        }
    }
}
