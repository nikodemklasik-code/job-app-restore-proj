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

async function scrapeCvLibrary(input: DiscoveryInput, cookies?: string): Promise<SourceJob[]> {
    const query = encodeURIComponent(input.query);
    const location = encodeURIComponent(input.location || 'UK');
    const url = `https://www.cv-library.co.uk/search-jobs?q=${query}&geo=${location}`;

    try {
        const headers: Record<string, string> = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-GB,en;q=0.9',
        };

        if (cookies?.trim()) {
            headers['Cookie'] = cookies;
        }

        const response = await fetch(url, { headers });

        if (!response.ok) {
            console.warn(`[CvLibraryProvider] HTTP ${response.status} for ${url}`);
            return [];
        }

        const html = await response.text();
        const jobs: SourceJob[] = [];

        // CV-Library uses JSON-LD structured data
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
                console.warn('[CvLibraryProvider] Failed to parse JSON-LD:', err);
            }
        }

        // Fallback: parse HTML job cards with improved patterns
        if (jobs.length === 0) {
            // Try multiple patterns for CV-Library's structure
            const patterns = [
                // Pattern 1: Standard job cards with data-job-id
                /data-job-id="([^"]+)"[\s\S]{0,500}?<h2[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>[\s\S]{0,300}?company[^>]*>([^<]+)<[\s\S]{0,300}?location[^>]*>([^<]+)<[\s\S]{0,300}?salary[^>]*>([^<]+)</gi,
                // Pattern 2: Article structure
                /<article[^>]*class="[^"]*job[^"]*"[^>]*>[\s\S]{0,600}?<h[23][^>]*>[\s\S]*?<a[^>]*href="[^"]*\/job\/([^"\/]+)"[^>]*>([^<]+)<\/a>[\s\S]{0,400}?<[^>]*>([^<]+)<\/[^>]*>[\s\S]{0,300}?<[^>]*>([^<]+)<\/[^>]*>[\s\S]{0,300}?<[^>]*>([^<]+)</gi,
                // Pattern 3: Simplified structure
                /<div[^>]*job-item[^>]*>[\s\S]{0,800}?<a[^>]*href="[^"]*\/job\/([^"\/]+)"[^>]*>([^<]+)<\/a>[\s\S]{0,500}?<[^>]*>([^<]+)<\/[^>]*>[\s\S]{0,300}?<[^>]*>([^<]+)</gi
            ];

            for (const pattern of patterns) {
                let match;
                while ((match = pattern.exec(html)) !== null) {
                    const jobId = match[1];
                    const title = match[2];
                    const company = match[3];
                    const location = match[4];
                    const salaryText = match[5] || '';

                    const salary = parseSalary(salaryText);
                    jobs.push({
                        externalId: jobId,
                        source: 'cv-library',
                        title: stripHtml(title),
                        company: stripHtml(company),
                        location: stripHtml(location),
                        description: '',
                        applyUrl: `https://www.cv-library.co.uk/job/${jobId}`,
                        salaryMin: salary.min,
                        salaryMax: salary.max,
                        workMode: null,
                        requirements: [],
                        postedAt: new Date().toISOString(),
                    });
                }
                if (jobs.length > 0) break; // Stop if we found jobs with this pattern
            }
        }

        console.info(`[CvLibraryProvider] Scraped ${jobs.length} jobs from ${url}`);
        return jobs.slice(0, input.limit || 20);
    } catch (error) {
        console.error('[CvLibraryProvider] Scraping failed:', error);
        return [];
    }
}

function parseJobPosting(data: Record<string, unknown>): SourceJob | null {
    try {
        const title = norm(data.title);
        const company = norm((data.hiringOrganization as Record<string, unknown>)?.name);
        const location = norm((data.jobLocation as Record<string, unknown>)?.address);
        const description = stripHtml(norm(data.description));
        const url = norm(data.url);

        if (!title || !company) return null;

        const salary = data.baseSalary as Record<string, unknown> | undefined;
        const salaryValue = salary?.value as Record<string, unknown> | undefined;

        return {
            externalId: norm(data.identifier),
            source: 'cv-library',
            title,
            company,
            location: location || 'UK',
            description,
            applyUrl: url || `https://www.cv-library.co.uk/job/${norm(data.identifier)}`,
            salaryMin: typeof salaryValue?.minValue === 'number' ? salaryValue.minValue : null,
            salaryMax: typeof salaryValue?.maxValue === 'number' ? salaryValue.maxValue : null,
            workMode: parseWorkMode(description),
            requirements: extractRequirements(description),
            postedAt: norm(data.datePosted) || new Date().toISOString(),
        };
    } catch (err) {
        console.warn('[CvLibraryProvider] Failed to parse job posting:', err);
        return null;
    }
}

export class CvLibraryProvider implements JobSourceProvider {
    name = 'cv-library';
    label = 'CV-Library';

    async readiness(): Promise<{ ready: boolean; reason?: string }> {
        return {
            ready: true,
            reason: 'CV-Library web scraping enabled (enhanced with session cookies support)',
        };
    }

    async discover(input: DiscoveryInput, context?: ProviderContext): Promise<SourceJob[]> {
        const start = Date.now();
        try {
            const cookies = context?.sessionCookies?.['cvlibrary'];
            const jobs = await scrapeCvLibrary(input, cookies);
            await logProviderEvent({
                provider: this.name,
                eventType: 'search_success',
                query: input.query,
                location: input.location,
                jobsFound: jobs.length,
                responseTimeMs: Date.now() - start,
            });
            return jobs;
        } catch (error) {
            await logProviderEvent({
                provider: this.name,
                eventType: 'search_failure',
                query: input.query,
                location: input.location,
                jobsFound: 0,
                responseTimeMs: Date.now() - start,
                errorMessage: error instanceof Error ? error.message : String(error),
            });
            return [];
        }
    }
}
