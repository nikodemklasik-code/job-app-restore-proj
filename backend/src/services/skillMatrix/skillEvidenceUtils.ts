/**
 * Skill Evidence — pure utility functions (no DB dependency).
 * Extracted so they can be tested without a database connection.
 */

import { STALE_EVIDENCE_MONTHS } from './constants.js';
import type { EvidenceLevel, EvidenceSourceType, SkillEvidenceRecord } from './types.js';

/**
 * Classify evidence into exactly one level based on source type and context.
 */
export function classifyEvidenceLevel(
    sourceType: EvidenceSourceType,
    occurredAt: Date | null,
): EvidenceLevel {
    if (occurredAt) {
        const monthsAgo = (Date.now() - occurredAt.getTime()) / (1000 * 60 * 60 * 24 * 30);
        if (monthsAgo <= 6) return 'recent';
    }

    switch (sourceType) {
        case 'certificate':
            return 'verified';
        case 'github':
        case 'portfolio':
            return 'demonstrated';
        case 'cv':
        case 'job_listing':
            return 'observed';
        case 'interview':
            return 'verified';
        case 'profile':
        default:
            return 'declared';
    }
}

/**
 * Compute confidence score based on source reliability.
 */
export function computeSourceConfidence(sourceType: EvidenceSourceType): number {
    const confidenceMap: Record<EvidenceSourceType, number> = {
        certificate: 0.9,
        interview: 0.85,
        github: 0.8,
        portfolio: 0.75,
        cv: 0.6,
        job_listing: 0.55,
        profile: 0.5,
    };
    return confidenceMap[sourceType] ?? 0.5;
}

/**
 * Check if a skill's evidence is stale (all evidence older than 24 months).
 */
export function isEvidenceStale(evidence: SkillEvidenceRecord[]): boolean {
    if (evidence.length === 0) return true;

    const now = Date.now();
    const staleThresholdMs = STALE_EVIDENCE_MONTHS * 30 * 24 * 60 * 60 * 1000;

    return evidence.every((e) => {
        if (!e.occurredAt) return true;
        return now - e.occurredAt.getTime() > staleThresholdMs;
    });
}
