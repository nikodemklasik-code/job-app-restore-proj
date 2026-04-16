import { describe, it, expect } from 'vitest';
import {
  capLowConfidenceDrivers,
  deriveRecommendation,
} from '../../application/services/scoring.helpers.js';
import type { Driver } from '../../application/services/scoring.types.js';

describe('capLowConfidenceDrivers', () => {
  it('caps net impact from low-confidence drivers at ±10 by default', () => {
    const drivers: Driver[] = [
      { label: 'a', impact: -8, confidence: 'low', driverType: 'negative' },
      { label: 'b', impact: -7, confidence: 'low', driverType: 'negative' },
      { label: 'c', impact: 20, confidence: 'high', driverType: 'positive' },
    ];

    const score = capLowConfidenceDrivers(50, drivers, 10);
    expect(score).toBe(50 + 20 - 10);
  });

  it('market pay: base 30 + best single driver (+22) yields 52 — PAY_BENCHMARK_OK must not use a threshold above 52', () => {
    const drivers: Driver[] = [
      {
        label: 'Salary is above upper benchmark range',
        impact: 22,
        confidence: 'high',
        driverType: 'positive',
      },
    ];
    expect(capLowConfidenceDrivers(30, drivers)).toBe(52);
  });
});

describe('deriveRecommendation', () => {
  const base = {
    employerScore: 50,
    offerScore: 50,
    marketPayScore: 40,
    benefitsScore: 40,
    cultureFitScore: 50,
    riskScore: 20,
  };

  it('returns High Risk when risk reaches salary-missing tier (28+)', () => {
    expect(deriveRecommendation({ ...base, riskScore: 28 })).toBe('High Risk');
    expect(deriveRecommendation({ ...base, riskScore: 34 })).toBe('High Risk');
  });

  it('returns Strong Match at achievable culture/offer ceilings with low risk', () => {
    expect(
      deriveRecommendation({
        ...base,
        cultureFitScore: 56,
        offerScore: 68,
        riskScore: 20,
      }),
    ).toBe('Strong Match');
  });

  it('returns Good Option in the middle band (not Strong)', () => {
    expect(
      deriveRecommendation({
        ...base,
        cultureFitScore: 56,
        offerScore: 58,
        riskScore: 20,
      }),
    ).toBe('Good Option');
  });

  it('returns Mixed Signals when culture or offer sit below Good thresholds', () => {
    expect(deriveRecommendation({ ...base, cultureFitScore: 45, offerScore: 60 })).toBe(
      'Mixed Signals',
    );
    expect(deriveRecommendation({ ...base, cultureFitScore: 50, offerScore: 55 })).toBe(
      'Mixed Signals',
    );
  });
});
