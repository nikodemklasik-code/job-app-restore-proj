import { describe, expect, it } from 'vitest';
import { WARMUP_TIERS } from './warmupTierCatalog';

/**
 * Aligns with backend `isValidWarmupSessionDebit('warmup_session', amount)` —
 * paid sessions must debit 1, 2, or 3 credits only (not legacy 30/45/60).
 */
describe('WARMUP_TIERS credit policy', () => {
  it('uses exactly one free tier (0 credits) and paid tiers 1, 2, 3', () => {
    const credits = WARMUP_TIERS.map((t) => t.credits).sort((a, b) => a - b);
    expect(credits).toEqual([0, 1, 2, 3]);
  });

  it('rejects accidental legacy debit amounts on paid tiers', () => {
    for (const t of WARMUP_TIERS) {
      if (t.credits > 0) {
        expect([1, 2, 3]).toContain(t.credits);
        expect(t.credits).not.toBe(30);
        expect(t.credits).not.toBe(45);
        expect(t.credits).not.toBe(60);
      }
    }
  });
});
