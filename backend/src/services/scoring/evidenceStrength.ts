/**
 * Evidence Strength Score (0–100)
 *
 * Based on highest evidence level achieved, corroborating sources, and confidence.
 * Pure function — no side effects, deterministic output.
 */

import {
    CONFIDENCE_MULTIPLIER_RANGE,
    CORROBORATION_BONUS_MAX,
    CORROBORATION_BONUS_PER_SOURCE,
    EVIDENCE_LEVEL_SCORES,
} from '../skillMatrix/constants.js';
import type { SkillEvidenceRecord } from '../skillMatrix/types.js';

/**
 * Compute evidence strength for a set of evidence records for a single skill.
 *
 * Formula:
 *   base = max evidence level score
 *   corroboration = min(10, (uniqueSources - 1) * 5)
 *   confidenceMultiplier = 0.7 + (avgTopConfidence * 0.3)
 *   score = clamp((base + corroboration) * confidenceMultiplier, 0, 100)
 */
export function computeEvidenceStrength(evidence: SkillEvidenceRecord[]): number {
    if (evidence.length === 0) return 0;

    // Highest level achieved
    const maxLevel = evidence.reduce(
        (max, e) => Math.max(max, EVIDENCE_LEVEL_SCORES[e.evidenceType] ?? 0),
        0,
    );

    // Corroboration bonus: multiple distinct source types
    const sourceCount = new Set(evidence.map((e) => e.sourceType)).size;
    const corroborationBonus = Math.min(
        CORROBORATION_BONUS_MAX,
        (sourceCount - 1) * CORROBORATION_BONUS_PER_SOURCE,
    );

    // Average confidence of top 3 evidence records (by level)
    const sorted = [...evidence].sort(
        (a, b) =>
            (EVIDENCE_LEVEL_SCORES[b.evidenceType] ?? 0) - (EVIDENCE_LEVEL_SCORES[a.evidenceType] ?? 0),
    );
    const topEvidence = sorted.slice(0, 3);
    const avgConfidence =
        topEvidence.reduce((sum, e) => sum + e.confidence, 0) / topEvidence.length;

    // Confidence multiplier: range [0.7, 1.0]
    const confidenceMultiplier =
        CONFIDENCE_MULTIPLIER_RANGE.min +
        avgConfidence * (CONFIDENCE_MULTIPLIER_RANGE.max - CONFIDENCE_MULTIPLIER_RANGE.min);

    const raw = (maxLevel + corroborationBonus) * confidenceMultiplier;
    return Math.round(Math.min(100, Math.max(0, raw)));
}
