/**
 * Recency Dimension (0–100)
 *
 * Decay function based on time since last evidence occurrence.
 * Pure function — no side effects, deterministic output.
 */

import { RECENCY_BOUNDARIES } from '../skillMatrix/constants.js';
import type { SkillEvidenceRecord } from '../skillMatrix/types.js';

/**
 * Compute recency score for a set of evidence records.
 * Decay curve:
 *   - 0–6 months: 100 → ~80
 *   - 6–12 months: 80 → ~50
 *   - 12–24 months: 50 → ~20
 *   - 24+ months: floor at 20
 *   - No date: assume stale (20)
 */
export function computeRecencyDimension(
    evidence: SkillEvidenceRecord[],
    now: Date = new Date(),
): number {
    if (evidence.length === 0) return 0;

    const nowMs = now.getTime();
    const mostRecent = evidence.reduce(
        (latest, e) => Math.max(latest, e.occurredAt?.getTime() ?? 0),
        0,
    );

    if (mostRecent === 0) return 20; // No date = assume stale

    const monthsSince = (nowMs - mostRecent) / (1000 * 60 * 60 * 24 * 30);

    if (monthsSince <= RECENCY_BOUNDARIES.fresh) {
        return Math.round(100 - monthsSince * 3.3);
    }
    if (monthsSince <= RECENCY_BOUNDARIES.moderate) {
        return Math.round(80 - (monthsSince - RECENCY_BOUNDARIES.fresh) * 5);
    }
    if (monthsSince <= RECENCY_BOUNDARIES.stale) {
        return Math.round(50 - (monthsSince - RECENCY_BOUNDARIES.moderate) * 2.5);
    }
    return 20; // Floor for very stale skills
}
