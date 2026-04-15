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
});
