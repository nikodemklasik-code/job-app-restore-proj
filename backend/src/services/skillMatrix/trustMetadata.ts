/**
 * Trust Metadata utilities.
 *
 * Every insight produced by the Skills & Employer Verification Matrix carries
 * TrustMetadata so users understand source, confidence, and freshness.
 */

import type { ExplanationType, Freshness, TrustMetadata } from './types.js';

/** Current model version for scoring algorithms. */
export const SCORING_MODEL_VERSION = '1.0.0';

/**
 * Compute freshness category based on time elapsed since observation.
 * - fresh: ≤7 days
 * - recent: ≤30 days
 * - aging: ≤90 days
 * - stale: >90 days
 */
export function computeFreshness(observedAt: Date, now: Date = new Date()): Freshness {
    const daysSince = (now.getTime() - observedAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince <= 7) return 'fresh';
    if (daysSince <= 30) return 'recent';
    if (daysSince <= 90) return 'aging';
    return 'stale';
}

/**
 * Factory helper to build a complete TrustMetadata object.
 * Computes freshness automatically from observedAt.
 */
export function buildTrustMetadata(params: {
    sourceName: string;
    sourceUrl?: string | null;
    sourceType: string;
    observedAt: Date;
    confidence: number;
    explanationType: ExplanationType;
    riskLanguage?: boolean;
    userVisibleReason: string;
    modelVersion?: string;
}): TrustMetadata {
    return {
        sourceName: params.sourceName,
        sourceUrl: params.sourceUrl ?? null,
        sourceType: params.sourceType,
        observedAt: params.observedAt,
        freshness: computeFreshness(params.observedAt),
        confidence: Math.max(0, Math.min(1, params.confidence)),
        explanationType: params.explanationType,
        modelVersion: params.modelVersion ?? SCORING_MODEL_VERSION,
        riskLanguage: params.riskLanguage ?? false,
        userVisibleReason: params.userVisibleReason,
    };
}
