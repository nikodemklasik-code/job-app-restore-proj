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
 * RSS Feed Provider - aggregates job feeds from multiple sources
 * No cookies or authentication required
 */
export class RssFeedProvider implements JobSourceProvider {
    name = 'rss-feeds';
    label = 'RSS Job Feeds';

    // Curated list of job RSS feeds
    private readonly feedUrls = [
        'https://www.cwjobs.co.uk/jobs.rss',
        'https://www.jobsite.co.uk/jobs.rss',
        'https://www.jobserve.com/gb/en/rss/JobSearch.aspx',
        'https://www.technojobs.co.uk/rss/jobs.xml',
        'https://www.jobstoday.co.uk/rss/jobs.xml',
        'https://www.jobcentreonline.com/rss/jobs.xml',
        'https://www.jobrapido.co.uk/jobs.rss',
        'https://www.simplyhired.co.uk/jobs.rss',
    ];

    async readiness(): Promise<{ ready: boolean; reason?: string }> {
        return { ready: true, reason: 'RSS feeds from multiple job sites - no authentication required' };
    }

    async discover(input: DiscoveryInput, _context?: ProviderContext): Promise<SourceJob[]> {
        const results: SourceJob[] = [];

        // Process feeds in parallel
        const settled = await Promise.allSettled(
            this.feedUrls.map(feedUrl => this.processFeed(feedUrl, input))
        );

        for (const result of settled) {
            if (result.status === 'fulfilled') {
                results.push(...result.value);
            } else {
                console.error('[RssFeedProvider] feed failed:', result.reason);
            }
        }

        // Filter by query relevance
        const filtered = results.filter(job =>
            this.isRelevant(job, input.query)
        );

        // Dedupe and limit results
        const seen = new Set<string>();
        const deduped = filtered.filter((job) => {
            const key = `${job.title}|${job.company}`.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        return deduped.slice(0, input.limit);
    }

    private async processFeed(feedUrl: string, input: DiscoveryInput): Promise<SourceJob[]> {
        try {
            // Add query parameters if the feed supports them
            const url = new URL(feedUrl);
            if (input.query) {
                url.searchParams.set('q', input.query);
                url.searchParams.set('keywords', input.query);
            }
            if (input.location && input.location !== 'United Kingdom') {
                url.searchParams.set('location', input.location);
                url.searchParams.set('l', input.location);
            }

            const response = await fetch(url.toString(), {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; JobBot/1.0)',
                    'Accept': 'application/rss+xml, application/xml, text/xml',
                },
                signal: AbortSignal.timeout(10000), // 10 second timeout
            });

            if (!response.ok) return [];
            const feedText = await response.text();

            return this.parseRssFeed(feedText, feedUrl);
        } catch (error) {
            console.error(`[RssFeedProvider] Failed to process feed ${feedUrl}:`, error);
            return [];
        }
    }

    private parseRssFeed(feedText: string, feedUrl: string): SourceJob[] {
        const jobs: SourceJob[] = [];
        const sourceName = this.extractSourceName(feedUrl);

        // Parse RSS items
        const itemPattern = /<item>([\s\S]*?)<\/item>/g;
        let match: RegExpExecArray | null;

        while ((match = itemPattern.exec(feedText)) !== null) {
            const item = match[1];
            const title = this.extractXmlTag(item, 'title');
            const link = this.extractXmlTag(item, 'link');
            const description = stripHtml(this.extractXmlTag(item, 'description'));
            const pubDate = this.extractXmlTag(item, 'pubDate');

            // Try to extract company and location from description or title
            const { company, location } = this.extractCompanyAndLocation(title, description);

            if (title && link) {
                jobs.push({
                    externalId: link,
                    source: sourceName,
                    title: stripHtml(title),
                    company: company || 'Unknown Company',
                    location: location || 'United Kingdom',
                    description,
                    applyUrl: link,
                    salaryMin: null,
                    salaryMax: null,
                    workMode: parseWorkMode(description),
                    requirements: extractRequirements(description),
                    postedAt: pubDate ? this.parseDate(pubDate) : new Date().toISOString(),
                });
            }
        }

        return jobs.slice(0, 10); // Limit per feed
    }

    private extractXmlTag(xml: string, tag: string): string {
        const pattern = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
        const match = xml.match(pattern);
        return match ? match[1].trim() : '';
    }

    private extractSourceName(feedUrl: string): string {
        try {
            const hostname = new URL(feedUrl).hostname;
            return hostname.replace('www.', '').replace('.co.uk', '').replace('.com', '');
        } catch {
            return 'rss-feed';
        }
    }

    private extractCompanyAndLocation(title: string, description: string): { company: string | null; location: string | null } {
        let company: string | null = null;
        let location: string | null = null;

        // Common patterns for company extraction
        const companyPatterns = [
            /at\s+([^,\-\n]+)/i,
            /with\s+([^,\-\n]+)/i,
            /Company:\s*([^,\-\n]+)/i,
            /Employer:\s*([^,\-\n]+)/i,
        ];

        // Common patterns for location extraction
        const locationPatterns = [
            /Location:\s*([^,\-\n]+)/i,
            /in\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/,
            /(London|Manchester|Birmingham|Leeds|Glasgow|Edinburgh|Bristol|Liverpool|Sheffield|Newcastle)/i,
        ];

        const fullText = `${title} ${description}`;

        for (const pattern of companyPatterns) {
            const match = fullText.match(pattern);
            if (match) {
                company = match[1].trim();
                break;
            }
        }

        for (const pattern of locationPatterns) {
            const match = fullText.match(pattern);
            if (match) {
                location = match[1].trim();
                break;
            }
        }

        return { company, location };
    }

    private parseDate(dateString: string): string {
        try {
            return new Date(dateString).toISOString();
        } catch {
            return new Date().toISOString();
        }
    }

    private isRelevant(job: SourceJob, query: string): boolean {
        if (!query) return true;

        const searchText = `${job.title} ${job.description} ${job.company}`.toLowerCase();
        const queryWords = query.toLowerCase().split(/\s+/);

        // Job is relevant if it contains at least one query word
        return queryWords.some(word => searchText.includes(word));
    }
}