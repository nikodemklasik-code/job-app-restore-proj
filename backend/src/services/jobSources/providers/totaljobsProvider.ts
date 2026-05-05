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

async function scrapeTotaljobs(input: DiscoveryInput): Promise<SourceJob[]> {
    const query = encodeURIComponent(input.query);
    const location = encodeURIComponent(input.location || 'UK');
    const url = `https://www.totaljobs.com/jobs/${query}/in-${location}`;

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-GB,en;q=0.9',
            },
        });

        if (!response.ok) {
            console.warn(`[TotaljobsProvider] HTTP ${response.status} for ${url}`);
            return [];
        }

        const html = await response.text();
        const jobs: SourceJob[] = [];

        // Totaljobs uses JSON-LD structured data
        const jsonLdMatches = html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs);
        for (const match of jsonLdMatches) {
            try {
                const data = JSON.parse(match[1]);
                if (data['@type'] === 'JobPosting') {
                    const job = parseJobPosting(data);
                    if (job) jobs.push(job);
                } else if (Array.isArray(data['@graph'])) {
                    for (const item of data['@graph']) {
                        if (item['@type'] === 'JobPosting') {
                            const job = parseJobPosting(item);
                            if (job) jobs.push(job);
                        }
                    }
                }
            } catch (err) {
                console.warn('[TotaljobsProvider] Failed to parse JSON-LD:', err);
            }
        }

        // Fallback: parse HTML job cards
        if (jobs.length === 0) {
            const cardPattern = /data-job-id="([^"]+)"[\s\S]*?class="job-title"[^>]*>([^<]+)<[\s\S]*?class="company"[^>]*>([^<]+)<[\s\S]*?class="location"[^>]*>([^<]+)</g;
            let match;
            while ((match = cardPattern.exec(html)) !== null) {
                jobs.push({
                    externalId: match[1],
                    source: 'totaljobs',
                    title: stripHtml(match[2]),
                    company: stripHtml(match[3]),
                    location: stripHtml(match[4]),
                    description: '',
                    applyUrl: `https://www.totaljobs.com/job/${match[1]}`,
                    salaryMin: null,
                    salaryMax: null,
                    workMode: null,
                    requirements: [],
                    postedAt: new Date().toISOString(),
                });
            }
        }

        console.info(`[TotaljobsProvider] Scraped ${jobs.length} jobs from ${url}`);
        return jobs.slice(0, input.limit || 20);
    } catch (error) {
        console.error('[TotaljobsProvider] Scraping failed:', error);
        return [];
    }
}

function parseJobPosting(data: Record<string, unknown>): SourceJob | null {
    try {
        const title = norm(data.title);
        const company = norm((data.hiringOrganization as Record<string, unknown>)?.name);
        const location = norm((data.jobLocation as Record<string, unknown>)?.address);
        const description = stripHtml(norm(data.description));
        const url = norm(data.url || data.identifier);

        if (!title || !company) return null;

        const salary = data.baseSalary as Record<string, unknown> | undefined;
        const salaryValue = salary?.value as Record<string, unknown> | undefined;

        return {
            externalId: norm(data.identifier),
            source: 'totaljobs',
            title,
            company,
            location: location || 'UK',
            description,
            applyUrl: url || `https://www.totaljobs.com/job/${norm(data.identifier)}`,
            salaryMin: typeof salaryValue?.minValue === 'number' ? salaryValue.minValue : null,
            salaryMax: typeof salaryValue?.maxValue === 'number' ? salaryValue.maxValue : null,
            workMode: parseWorkMode(description),
            requirements: extractRequirements(description),
            postedAt: norm(data.datePosted) || new Date().toISOString(),
        };
    } catch (err) {
        console.warn('[TotaljobsProvider] Failed to parse job posting:', err);
        return null;
    }
}

export class TotaljobsProvider implements JobSourceProvider {
    name = 'totaljobs';
    label = 'Totaljobs';

    async readiness(): Promise<{ ready: boolean; reason?: string }> {
        return {
            ready: true,
            reason: 'Totaljobs web scraping enabled',
        };
    }

    async discover(input: DiscoveryInput, _context?: ProviderContext): Promise<SourceJob[]> {
        const start = Date.now();
        try {
            const jobs = await scrapeTotaljobs(input);
            logProviderEvent(this.name, 'discover', jobs.length, Date.now() - start);
            return jobs;
        } catch (error) {
            logProviderEvent(this.name, 'discover', 0, Date.now() - start, error as Error);
            return [];
        }
    }
}
