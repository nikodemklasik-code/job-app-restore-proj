/**
 * Provider Bridge — connects all existing job source providers to the
 * Skills & Employer Verification Matrix ingestion pipeline.
 *
 * When jobs are discovered through the existing provider system, this bridge:
 * 1. Creates/matches employer records
 * 2. Runs signal detection on each listing
 * 3. Creates job source snapshots for provenance tracking
 * 4. Extracts skill requirements for taxonomy enrichment
 */

import { getProviders } from '../jobSources/providerRegistry.js';
import type { SourceJob } from '../jobSources/types.js';
import { addSignals, findOrCreateEmployer, addSource } from '../employerIntel/employerIntel.service.js';
import { detectAllSignals, type JobListingInput } from '../employerIntel/signalDetector.js';
import { computeContentHash } from './jobIngestionUtils.js';
import type { IngestedJob } from './jobIngestion.service.js';
import { processIngestedJob } from './jobIngestion.service.js';

/**
 * Process a batch of SourceJob results from the existing provider system
 * through the Skills Matrix pipeline.
 *
 * Call this after jobDiscoveryService returns results.
 */
export async function processDiscoveredJobs(jobs: SourceJob[]): Promise<{
    processed: number;
    newEmployers: number;
    signalsGenerated: number;
    errors: number;
}> {
    const result = { processed: 0, newEmployers: 0, signalsGenerated: 0, errors: 0 };

    for (const job of jobs) {
        try {
            // Convert SourceJob to IngestedJob format
            const ingested = sourceJobToIngested(job);

            // Process through snapshot pipeline (dedup, tracking)
            await processIngestedJob(ingested);

            // Create/match employer and detect signals
            if (job.company && job.company.length > 2) {
                const employer = await findOrCreateEmployer(job.company);
                if (employer.isNew) {
                    result.newEmployers++;

                    // Add source record
                    await addSource(employer.id, {
                        sourceType: 'job_listing',
                        sourceName: job.source,
                        sourceUrl: job.applyUrl || null,
                        observedAt: new Date(),
                        confidence: getProviderConfidence(job.source),
                    });
                }

                // Run signal detection
                const listing: JobListingInput = {
                    title: job.title,
                    description: job.description,
                    salaryMin: job.salaryMin,
                    salaryMax: job.salaryMax,
                    location: job.location || null,
                    company: job.company,
                    contractType: job.contractType || null,
                    sourceUrl: job.applyUrl || null,
                };

                const signals = detectAllSignals(listing);
                if (signals.length > 0) {
                    await addSignals(employer.id, signals);
                    result.signalsGenerated += signals.length;
                }
            }

            result.processed++;
        } catch (error) {
            result.errors++;
            // Non-blocking: don't fail the whole batch for one job
        }
    }

    return result;
}

/**
 * Run a full ingestion cycle using all available providers.
 * Intended for scheduled background execution.
 */
export async function runFullProviderIngestion(params: {
    query: string;
    location: string;
    limit?: number;
}): Promise<{
    providersUsed: string[];
    totalJobs: number;
    processed: number;
    newEmployers: number;
    signalsGenerated: number;
    errors: number;
}> {
    const providers = getProviders();
    const summary = {
        providersUsed: [] as string[],
        totalJobs: 0,
        processed: 0,
        newEmployers: 0,
        signalsGenerated: 0,
        errors: 0,
    };

    for (const provider of providers) {
        try {
            const { ready } = await provider.readiness();
            if (!ready) continue;

            const jobs = await provider.discover({
                query: params.query,
                location: params.location,
                limit: params.limit ?? 20,
            });

            if (jobs.length > 0) {
                summary.providersUsed.push(provider.name);
                summary.totalJobs += jobs.length;

                const result = await processDiscoveredJobs(jobs);
                summary.processed += result.processed;
                summary.newEmployers += result.newEmployers;
                summary.signalsGenerated += result.signalsGenerated;
                summary.errors += result.errors;
            }
        } catch (error) {
            summary.errors++;
            console.error(`[ProviderBridge] Error with provider ${provider.name}:`, error);
        }
    }

    return summary;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function sourceJobToIngested(job: SourceJob): IngestedJob {
    return {
        id: `${job.source}_${job.externalId}`,
        title: job.title,
        description: job.description,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        location: job.location || null,
        company: job.company,
        category: null,
        contractType: job.contractType || null,
        sourceUrl: job.applyUrl || null,
        source: job.source,
        createdDate: job.postedAt ? new Date(job.postedAt) : new Date(),
    };
}

/**
 * Map provider name to confidence level.
 */
function getProviderConfidence(source: string): number {
    const confidenceMap: Record<string, number> = {
        reed: 0.85,
        adzuna: 0.80,
        jooble: 0.75,
        'gov-jobs': 0.90,
        'the-muse': 0.80,
        'rapid-api': 0.70,
        'serp-api': 0.70,
        indeed: 0.80,
        linkedin: 0.85,
        glassdoor: 0.80,
        totaljobs: 0.75,
        'cv-library': 0.75,
        'find-a-job': 0.85,
        monster: 0.70,
        gumtree: 0.60,
        rss: 0.65,
        aggregator: 0.70,
        database: 0.90,
        manual: 0.95,
    };
    return confidenceMap[source.toLowerCase()] ?? 0.65;
}
