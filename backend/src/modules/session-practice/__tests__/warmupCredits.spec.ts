import { describe, expect, it } from 'vitest';
import { isValidWarmupSessionDebit } from '../warmupCredits.js';

describe('isValidWarmupSessionDebit', () => {
  it('allows any positive amount when feature is not warmup_session', () => {
    expect(isValidWarmupSessionDebit(undefined, 30)).toBe(true);
    expect(isValidWarmupSessionDebit(undefined, 99)).toBe(true);
  });

  it('allows 1, 2, 3 for warmup_session', () => {
    expect(isValidWarmupSessionDebit('warmup_session', 1)).toBe(true);
    expect(isValidWarmupSessionDebit('warmup_session', 2)).toBe(true);
    expect(isValidWarmupSessionDebit('warmup_session', 3)).toBe(true);
  });

  it('rejects legacy 30/45/60 for warmup_session', () => {
    expect(isValidWarmupSessionDebit('warmup_session', 30)).toBe(false);
    expect(isValidWarmupSessionDebit('warmup_session', 45)).toBe(false);
    expect(isValidWarmupSessionDebit('warmup_session', 60)).toBe(false);
  });
});
