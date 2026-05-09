/**
 * Skill Readiness Score (0–100)
 *
 * Aggregates six weighted dimensions into a single readiness value per skill per user.
 * Pure function — no side effects, deterministic output.
 */

import { SKILL_READINESS_WEIGHTS } from '../skillMatrix/constants.js';
import type { SkillEvidenceRecord, SkillRelationship } from '../skillMatrix/types.js';
import { computeEvidenceStrength } from './evidenceStrength.js';
import { computeRecencyDimension } from './recency.js';

export interface SkillReadinessInput {
    /** User's claimed/observed level (0–100 scale). */
    claimedLevel: number;
    /** Required level for the target role (0–100 scale). */
    requiredLevel: number;
    /** All evidence records for this skill. */
    evidence: SkillEvidenceRecord[];
    /** Skill relationships for transferability computation. */
    relationships: SkillRelationship[];
    /** Pre-computed market demand score (0–100). */
    marketDemandScore: number;
    /** Pre-computed role relevance score (0–100). */
    roleRelevanceScore: number;
}

/**
 * Compute level match dimension (0–100).
 * Full score when claimed >= required; proportional otherwise.
 */
function computeLevelMatch(claimed: number, required: number): number {
    if (required <= 0) return 100;
    const ratio = Math.min(claimed / required, 1.0);
    return Math.round(ratio * 100);
}

/**
 * Compute transferability dimension (0–100).
 * Based on related skill relationships and their strength.
 */
function computeTransferability(relationships: SkillRelationship[]): number {
    if (relationships.length === 0) return 0;

    // Average strength of related/prerequisite relationships
    const relevant = relationships.filter(
        (r) => r.relationType === 'related' || r.relationType === 'prerequisite',
    );
    if (relevant.length === 0) return 0;

    const avgStrength = relevant.reduce((sum, r) => sum + r.strength, 0) / relevant.length;
    return Math.round(avgStrength * 100);
}

/**
 * Compute the Skill Readiness Score.
 *
 * Formula: weighted sum of 6 dimensions, clamped to [0, 100].
 */
export function computeSkillReadiness(input: SkillReadinessInput): number {
    const dimensions = {
        levelMatch: computeLevelMatch(input.claimedLevel, input.requiredLevel),
        evidenceStrength: computeEvidenceStrength(input.evidence),
        recency: computeRecencyDimension(input.evidence),
        marketDemand: input.marketDemandScore,
        roleRelevance: input.roleRelevanceScore,
        transferability: computeTransferability(input.relationships),
    };

    const raw =
        dimensions.levelMatch * SKILL_READINESS_WEIGHTS.levelMatch +
        dimensions.evidenceStrength * SKILL_READINESS_WEIGHTS.evidenceStrength +
        dimensions.recency * SKILL_READINESS_WEIGHTS.recency +
        dimensions.marketDemand * SKILL_READINESS_WEIGHTS.marketDemand +
        dimensions.roleRelevance * SKILL_READINESS_WEIGHTS.roleRelevance +
        dimensions.transferability * SKILL_READINESS_WEIGHTS.transferability;

    return Math.round(Math.min(100, Math.max(0, raw)));
}
