import type { Driver } from './scoring.types.js';

export function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function capLowConfidenceDrivers(
  baseScore: number,
  drivers: Driver[],
  maxAbsoluteImpact = 10,
): number {
  const lowDrivers = drivers.filter((d) => d.confidence === 'low');
  const nonLowDrivers = drivers.filter((d) => d.confidence !== 'low');

  const lowImpactTotal = lowDrivers.reduce((sum, d) => sum + d.impact, 0);
  const clampedLowImpact = Math.max(-maxAbsoluteImpact, Math.min(maxAbsoluteImpact, lowImpactTotal));
  const nonLowImpactTotal = nonLowDrivers.reduce((sum, d) => sum + d.impact, 0);

  return baseScore + nonLowImpactTotal + clampedLowImpact;
}

export function buildConfidenceOverall(
  levels: Array<'low' | 'medium' | 'high'>,
): 'low' | 'medium' | 'high' {
  const high = levels.filter((l) => l === 'high').length;
  const medium = levels.filter((l) => l === 'medium').length;

  if (high >= 3) return 'high';
  if (high + medium >= 3) return 'medium';
  return 'low';
}

/**
 * Map aggregate scores to a headline recommendation.
 *
 * Thresholds must stay within what `ScoringEngineService.compute` can produce after
 * `capLowConfidenceDrivers` + `clampScore` (same idea as ELEVATED_RISK / PAY_BENCHMARK_OK in
 * `scoring-engine.service.ts`):
 * - culture_fit: base 50, drivers at most +6 (work_mode) → ceiling 56
 * - offer: base 50, drivers at most +8 +10 → ceiling 68
 * - risk: base 20, drivers at most +8 +6 → ceiling 34 (never 50+)
 */
export function deriveRecommendation(input: {
  employerScore: number;
  offerScore: number;
  marketPayScore: number;
  benefitsScore: number;
  cultureFitScore: number;
  riskScore: number;
}): 'Strong Match' | 'Good Option' | 'Mixed Signals' | 'High Risk' {
  // Salary transparency gap alone yields 20 + 8 = 28; both risk drivers → 34.
  if (input.riskScore >= 28) return 'High Risk';
  if (input.cultureFitScore >= 54 && input.offerScore >= 62) {
    return 'Strong Match';
  }
  if (input.cultureFitScore >= 46 && input.offerScore >= 56) {
    return 'Good Option';
  }
  return 'Mixed Signals';
}
