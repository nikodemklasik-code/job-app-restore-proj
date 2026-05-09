/**
 * Job Ingestion Service
 *
 * Manages provider ingestion, deduplication via content hashing, and
 * job source snapshot lifecycle (firstSeenAt, lastSeenAt, expiry detection).
 */

import { randomUUID } from 'crypto';
import { and, eq, lt } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { jobSourceSnapshots } from '../../db/schemas/skills-matrix.js';
import { addSignals, findOrCreateEmployer } from '../employerIntel/employerIntel.service.js';
import { detectAllSignals, type JobListingInput } from '../employerIntel/signalDetector.js';
import { computeContentHash, getSourceConfidence } from './jobIngestionUtils.js';

// Re-export pure utils so existing imports still work
export { computeContentHash, getSourceConfidence } from './jobIngestionUtils.js';

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

    const existing = await db
        .select()
        .from(jobSourceSnapshots)
        .where(and(eq(jobSourceSnapshots.jobId, job.id), eq(jobSourceSnapshots.source, job.source)))
        .limit(1);

    if (existing.length > 0) {
        const snapshot = existing[0];
        if (snapshot.contentHash === contentHash) {
            await db.update(jobSourceSnapshots).set({ lastSeenAt: now }).where(eq(jobSourceSnapshots.id, snapshot.id));
            return 'duplicate';
        }
        await db.update(jobSourceSnapshots).set({ contentHash, lastSeenAt: now }).where(eq(jobSourceSnapshots.id, snapshot.id));
        return 'updated';
    }

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
 */
export async function markExpiredListings(): Promise<number> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const expired = await db.select().from(jobSourceSnapshots).where(lt(jobSourceSnapshots.lastSeenAt, sevenDaysAgo));
    return expired.length;
}

/**
 * Run the full ingestion pipeline for a batch of jobs.
 */
export async function runIngestionBatch(jobs: IngestedJob[]): Promise<IngestionResult> {
    const result: IngestionResult = { totalFetched: jobs.length, newJobs: 0, updatedJobs: 0, duplicates: 0, errors: 0 };

    for (const job of jobs) {
        try {
            const status = await processIngestedJob(job);
            if (status === 'new') { result.newJobs++; await processNewJobEmployer(job); }
            else if (status === 'updated') result.updatedJobs++;
            else result.duplicates++;
        } catch (error) {
            result.errors++;
            console.error(`[JobIngestion] Error processing job ${job.id}:`, error);
        }
    }

    return result;
}

async function processNewJobEmployer(job: IngestedJob): Promise<void> {
    if (!job.company || job.company.length < 2) return;
    const employer = await findOrCreateEmployer(job.company);
    if (employer.isNew) {
        const listing: JobListingInput = {
            title: job.title, description: job.description, salaryMin: job.salaryMin,
            salaryMax: job.salaryMax, location: job.location, company: job.company,
            contractType: job.contractType, sourceUrl: job.sourceUrl,
        };
        const signals = detectAllSignals(listing);
        if (signals.length > 0) await addSignals(employer.id, signals);
    }
}
