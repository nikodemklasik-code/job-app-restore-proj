/**
 * Job Ingestion Service
 *
 * Manages provider ingestion, deduplication via content hashing, and
 * job source snapshot lifecycle (firstSeenAt, lastSeenAt, expiry detection).
 */

import { createHash, randomUUID } from 'crypto';
import { and, eq, lt } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { jobSourceSnapshots } from '../../db/schemas/skills-matrix.js';
import { findOrCreateEmployer } from '../employerIntel/employerIntel.service.js';
import { detectAllSignals, type JobListingInput } from '../employerIntel/signalDetector.js';
import { addSignals } from '../employerIntel/employerIntel.service.js';

// ── Types ────────────────────────────────────────────────────────────────────

export interface IngestedJob {
    id: string;
    title: string;
    description: string;
    salaryMin: number | null;
    salaryMax: number | null;
    location: string | null;
    company: string;
    category: string | null;
    contractType: string | null;
    sourceUrl: string | null;
    source: string;
    createdDate: Date;
}

export interface IngestionResult {
    totalFetched: number;
    newJobs: number;
    updatedJobs: number;
    duplicates: number;
    errors: number;
}

// ── Content Hashing ──────────────────────────────────────────────────────────

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

// ── Source Confidence ────────────────────────────────────────────────────────

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

// ── Snapshot Management ──────────────────────────────────────────────────────

/**
 * Process an ingested job: create or update source snapshot, detect duplicates.
 * Returns 'new' | 'updated' | 'duplicate'.
 */
export async function processIngestedJob(
    job: IngestedJob,
): Promise<'new' | 'updated' | 'duplicate'> {
    const contentHash = computeContentHash(job);
    const now = new Date();

    // Check if we've seen this exact content before
    const existing = await db
        .select()
        .from(jobSourceSnapshots)
        .where(
            and(
                eq(jobSourceSnapshots.jobId, job.id),
                eq(jobSourceSnapshots.source, job.source),
            ),
        )
        .limit(1);

    if (existing.length > 0) {
        const snapshot = existing[0];

        if (snapshot.contentHash === contentHash) {
            // Same content — just update lastSeenAt
            await db
                .update(jobSourceSnapshots)
                .set({ lastSeenAt: now })
                .where(eq(jobSourceSnapshots.id, snapshot.id));
            return 'duplicate';
        }

        // Content changed — update hash and lastSeenAt
        await db
            .update(jobSourceSnapshots)
            .set({ contentHash, lastSeenAt: now })
            .where(eq(jobSourceSnapshots.id, snapshot.id));
        return 'updated';
    }

    // Check if same hash exists from another source (cross-source duplicate)
    const hashMatch = await db
        .select()
        .from(jobSourceSnapshots)
        .where(eq(jobSourceSnapshots.contentHash, contentHash))
        .limit(1);

    if (hashMatch.length > 0) {
        // Duplicate content from different source — still create snapshot for provenance
    }

    // New job — create snapshot
    await db.insert(jobSourceSnapshots).values({
        id: randomUUID(),
        jobId: job.id,
        source: job.source,
        firstSeenAt: now,
        lastSeenAt: now,
        contentHash,
        rawPayloadRef: null,
        sourceConfidence: String(getSourceConfidence(job.source)),
        createdAt: now,
    });

    return 'new';
}

/**
 * Mark jobs as potentially expired if not seen for more than 7 days.
 * Returns the number of jobs marked as expired.
 */
export async function markExpiredListings(): Promise<number> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const expired = await db
        .select()
        .from(jobSourceSnapshots)
        .where(lt(jobSourceSnapshots.lastSeenAt, sevenDaysAgo));

    // In a full implementation, this would update a status field on the jobs table
    // For now, return the count of potentially expired listings
    return expired.length;
}

/**
 * Run the full ingestion pipeline for a batch of jobs.
 * Processes each job, creates employer records, and detects signals.
 */
export async function runIngestionBatch(jobs: IngestedJob[]): Promise<IngestionResult> {
    const result: IngestionResult = {
        totalFetched: jobs.length,
        newJobs: 0,
        updatedJobs: 0,
        duplicates: 0,
        errors: 0,
    };

    for (const job of jobs) {
        try {
            const status = await processIngestedJob(job);

            switch (status) {
                case 'new':
                    result.newJobs++;
                    // Create/match employer and detect signals for new jobs
                    await processNewJobEmployer(job);
                    break;
                case 'updated':
                    result.updatedJobs++;
                    break;
                case 'duplicate':
                    result.duplicates++;
                    break;
            }
        } catch (error) {
            result.errors++;
            console.error(`[JobIngestion] Error processing job ${job.id}:`, error);
        }
    }

    return result;
}

/**
 * For new jobs, create/match employer and run signal detection.
 */
async function processNewJobEmployer(job: IngestedJob): Promise<void> {
    if (!job.company || job.company.length < 2) return;

    const employer = await findOrCreateEmployer(job.company);

    if (employer.isNew) {
        // Run signal detection on the listing
        const listing: JobListingInput = {
            title: job.title,
            description: job.description,
            salaryMin: job.salaryMin,
            salaryMax: job.salaryMax,
            location: job.location,
            company: job.company,
            contractType: job.contractType,
            sourceUrl: job.sourceUrl,
        };

        const signals = detectAllSignals(listing);
        if (signals.length > 0) {
            await addSignals(employer.id, signals);
        }
    }
}
