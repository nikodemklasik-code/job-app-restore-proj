/**
 * Employer Risk Score (0–100)
 *
 * Aggregates negative signals with Category I (scam_fraud) weighted highest.
 * Independent from trust score — changing positive signals does not affect risk.
 *
 * Pure function — no side effects, deterministic output.
 */

import { EMPLOYER_RISK_WEIGHTS } from '../skillMatrix/constants.js';
import type { EmployerSignalRecord } from '../skillMatrix/types.js';

/**
 * Compute employer risk score from negative signals.
 */
export function computeEmployerRisk(signals: EmployerSignalRecord[]): number {
    const negativeSignals = signals.filter((s) => s.score < 0);

    let risk = 0;
    for (const [category, weight] of Object.entries(EMPLOYER_RISK_WEIGHTS)) {
        const catSignals = negativeSignals.filter((s) => s.category === category);
        const catRisk = catSignals.reduce((sum, s) => sum + Math.abs(s.score), 0);
        risk += Math.min(100, catRisk) * weight;
    }

    return Math.round(Math.min(100, Math.max(0, risk)));
}
