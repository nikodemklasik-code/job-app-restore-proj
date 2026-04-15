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

export function deriveRecommendation(input: {
  employerScore: number;
  offerScore: number;
  marketPayScore: number;
  benefitsScore: number;
  cultureFitScore: number;
  riskScore: number;
}): 'Strong Match' | 'Good Option' | 'Mixed Signals' | 'High Risk' {
  if (input.riskScore >= 50) return 'High Risk';
  if (input.cultureFitScore >= 75 && input.offerScore >= 70 && input.riskScore < 35) {
    return 'Strong Match';
  }
  if (input.cultureFitScore >= 60 && input.offerScore >= 60 && input.riskScore < 50) {
    return 'Good Option';
  }
  return 'Mixed Signals';
}
