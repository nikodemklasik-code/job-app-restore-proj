/**
 * Employer Trust Score (0–100)
 *
 * Aggregates positive signals across all nine verification categories.
 * Category A (identity_credibility) weighted highest.
 * Diminishing returns within same category.
 * Capped at 60 when fewer than 3 verified sources.
 *
 * Pure function — no side effects, deterministic output.
 */

import {
    EMPLOYER_TRUST_WEIGHTS,
    MIN_SOURCES_FOR_FULL_TRUST,
    TRUST_CAP_LOW_SOURCES,
} from '../skillMatrix/constants.js';
import type { EmployerSignalRecord, SignalCategory } from '../skillMatrix/types.js';

/**
 * Compute employer trust score from positive signals and source count.
 */
export function computeEmployerTrust(
    signals: EmployerSignalRecord[],
    sourceCount: number,
): number {
    const positiveSignals = signals.filter((s) => s.score > 0);

    const categoryScores: Record<string, number> = {};

    for (const [category, weight] of Object.entries(EMPLOYER_TRUST_WEIGHTS)) {
        const catSignals = positiveSignals.filter((s) => s.category === category);
        if (catSignals.length === 0) {
            categoryScores[category] = 0;
            continue;
        }

        // Sort by score descending, apply diminishing returns
        const sorted = [...catSignals].sort((a, b) => b.score - a.score);
        let catScore = 0;
        for (let i = 0; i < sorted.length; i++) {
            const diminishingFactor = 1 / (1 + i * 0.5); // 1.0, 0.67, 0.5, 0.4...
            catScore += sorted[i].score * diminishingFactor;
        }

        categoryScores[category] = Math.min(100, catScore) * weight;
    }

    let trust = Object.values(categoryScores).reduce((sum, v) => sum + v, 0);

    // Cap at 60 if fewer than 3 verified sources
    if (sourceCount < MIN_SOURCES_FOR_FULL_TRUST) {
        trust = Math.min(TRUST_CAP_LOW_SOURCES, trust);
    }

    return Math.round(Math.min(100, Math.max(0, trust)));
}
