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
    const cleaned = salaryText.replace(/[£,]/g, '');
    const rangeMatch = cleaned.match(/(\d+)\s*-\s*(\d+)/);
    if (rangeMatch) {
        return {
            min: parseInt(rangeMatch[1], 10),
            max: parseInt(rangeMatch[2], 10),
        };
    }
    const singleMatch = cleaned.match(/(\d+)/);
    if (singleMatch) {
        const val = parseInt(singleMatch[1], 10);
        return { min: val, max: val };
    }
    return { min: null, max: null };
}

async function scrapeMonster(input: DiscoveryInput): Promise<SourceJob[]> {
    const query = encodeURIComponent(input.query);
    const location = encodeURIComponent(input.location || 'UK');
    const url = `https://www.monster.co.uk/jobs/search/?q=${query}&where=${location}`;

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-GB,en;q=0.9',
            },
        });

        if (!response.ok) {
            console.warn(`[MonsterProvider] HTTP ${response.status} for ${url}`);
            return [];
        }

        const html = await response.text();
        const jobs: SourceJob[] = [];

        // Monster uses JSON-LD structured data
        const jsonLdMatches = html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs);
        for (const match of jsonLdMatches) {
            try {
                const data = JSON.parse(match[1]);
                if (data['@type'] === 'JobPosting') {
                    const job = parseJobPosting(data);
                    if (job) jobs.push(job);
                } else if (Array.isArray(data)) {
                    for (const item of data) {
                        if (item['@type'] === 'JobPosting') {
                            const job = parseJobPosting(item);
                            if (job) jobs.push(job);
                        }
                    }
                }
            } catch (err) {
                console.warn('[MonsterProvider] Failed to parse JSON-LD:', err);
            }
        }

        // Fallback: parse HTML job cards
        if (jobs.length === 0) {
            const cardPattern = /data-job-id="([^"]+)"[\s\S]{0,600}?<h2[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>[\s\S]{0,400}?<div[^>]*class="[^"]*company[^"]*"[^>]*>([^<]+)<[\s\S]{0,400}?<div[^>]*class="[^"]*location[^"]*"[^>]*>([^<]+)<[\s\S]{0,400}?<span[^>]*class="[^"]*salary[^"]*"[^>]*>([^<]+)</gi;
            let match;
            while ((match = cardPattern.exec(html)) !== null) {
                const salary = parseSalary(match[6]);
                jobs.push({
                    id: crypto.randomUUID(),
                    externalId: match[1],
                    source: 'monster',
                    title: stripHtml(match[3]),
                    company: stripHtml(match[4]),
                    location: stripHtml(match[5]),
                    description: '',
                    applyUrl: match[2].startsWith('http') ? match[2] : `https://www.monster.co.uk${match[2]}`,
                    salaryMin: salary.min,
                    salaryMax: salary.max,
                    workMode: null,
                    requirements: [],
                    postedAt: new Date().toISOString(),
                });
            }
        }

        console.info(`[MonsterProvider] Scraped ${jobs.length} jobs from ${url}`);
        return jobs.slice(0, input.limit || 20);
    } catch (error) {
        console.error('[MonsterProvider] Scraping failed:', error);
        return [];
    }
}

function parseJobPosting(data: Record<string, unknown>): SourceJob | null {
    try {
        const title = norm(data.title);
        const company = norm((data.hiringOrganization as Record<string, unknown>)?.name);
        const locationData = data.jobLocation as Record<string, unknown> | undefined;
        const address = locationData?.address as Record<string, unknown> | undefined;
        const location = norm(address?.addressLocality || address?.addressRegion || locationData?.name);
        const description = stripHtml(norm(data.description));
        const url = norm(data.url);

        if (!title || !company) return null;

        const salary = data.baseSalary as Record<string, unknown> | undefined;
        const salaryValue = salary?.value as Record<string, unknown> | undefined;

        return {
            id: crypto.randomUUID(),
            externalId: norm(data.identifier),
            source: 'monster',
            title,
            company,
            location: location || 'UK',
            description,
            applyUrl: url || `https://www.monster.co.uk/job-openings/${norm(data.identifier)}`,
            salaryMin: typeof salaryValue?.minValue === 'number' ? salaryValue.minValue : null,
            salaryMax: typeof salaryValue?.maxValue === 'number' ? salaryValue.maxValue : null,
            workMode: parseWorkMode(description),
            requirements: extractRequirements(description),
            postedAt: norm(data.datePosted) || new Date().toISOString(),
        };
    } catch (err) {
        console.warn('[MonsterProvider] Failed to parse job posting:', err);
        return null;
    }
}

export class MonsterProvider implements JobSourceProvider {
    name = 'monster';
    label = 'Monster UK';

    async readiness(): Promise<{ ready: boolean; reason?: string }> {
        return {
            ready: true,
            reason: 'Monster UK web scraping enabled',
        };
    }

    async discover(input: DiscoveryInput, _context?: ProviderContext): Promise<SourceJob[]> {
        const start = Date.now();
        try {
            const jobs = await scrapeMonster(input);
            logProviderEvent(this.name, 'discover', jobs.length, Date.now() - start);
            return jobs;
        } catch (error) {
            logProviderEvent(this.name, 'discover', 0, Date.now() - start, error as Error);
            return [];
        }
    }
}
