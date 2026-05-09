/**
 * Job Ingestion — pure utility functions (no DB dependency).
 * Extracted so they can be tested without a database connection.
 */

import { createHash } from 'crypto';

/**
 * Compute a deterministic SHA-256 hash of job listing content.
 * Same content always produces the same hash.
 */
export function computeContentHash(job: {
    title: string;
    description: string;
    company: string;
    salaryMin?: number | null;
    salaryMax?: number | null;
    location?: string | null;
}): string {
    const content = [
        job.title.toLowerCase().trim(),
        job.description.toLowerCase().trim(),
        job.company.toLowerCase().trim(),
        String(job.salaryMin ?? ''),
        String(job.salaryMax ?? ''),
        (job.location ?? '').toLowerCase().trim(),
    ].join('|');

    return createHash('sha256').update(content).digest('hex');
}

type SourceTier = 'direct_employer' | 'aggregator' | 'scraper';

const SOURCE_CONFIDENCE: Record<SourceTier, number> = {
    direct_employer: 0.9,
    aggregator: 0.7,
    scraper: 0.5,
};

/**
 * Assign source confidence based on provider type.
 */
export function getSourceConfidence(source: string): number {
    const aggregators = ['adzuna', 'indeed', 'reed', 'totaljobs'];
    const scrapers = ['scraper', 'crawl'];

    const lower = source.toLowerCase();
    if (scrapers.some((s) => lower.includes(s))) return SOURCE_CONFIDENCE.scraper;
    if (aggregators.some((a) => lower.includes(a))) return SOURCE_CONFIDENCE.aggregator;
    return SOURCE_CONFIDENCE.direct_employer;
}
