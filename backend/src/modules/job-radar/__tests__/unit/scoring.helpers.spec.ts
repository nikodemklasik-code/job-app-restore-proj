import { describe, it, expect } from 'vitest';
import { capLowConfidenceDrivers } from '../../application/services/scoring.helpers.js';
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
