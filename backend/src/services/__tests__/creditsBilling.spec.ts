import { describe, expect, it } from 'vitest';
import {
  assertWithinApprovedMax,
  BillingError,
  estimateCostFor,
  planDebit,
  resolveApprovalCosts,
  shouldResetAllowance,
  startOfMonthUTC,
} from '../creditsBilling.policy.js';
import {
  CREDIT_PACKS,
  FEATURE_COSTS,
  getCreditPack,
  monthlyAllowanceFor,
} from '../creditsConfig.js';

// These tests cover the *pure* policy helpers that enforce the billing
// invariants listed in docs/features/backend-completion-spec/credits-billing-engine-v1.0.md:
//   - fixed / estimated cost estimation
//   - allowance-first, credits-second debit ordering
//   - insufficient funds are rejected before any side-effect
//   - commit may never exceed approvedMaxCost
//   - monthly allowance reset is calendar-aligned (no rollover)

describe('creditsBilling / estimateCostFor', () => {
  it('returns fixed cost verbatim for warmup_session_30s (1 credit)', () => {
    const est = estimateCostFor('warmup_session_30s');
    expect(est.kind).toBe('fixed');
    expect(est.minCost).toBe(1);
    expect(est.maxCost).toBe(1);
    expect(est.suggestedApprovedMaxCost).toBe(1);
  });

  it('returns free zero-cost for warmup_session_15s', () => {
    const est = estimateCostFor('warmup_session_15s');
    expect(est.kind).toBe('fixed');
    expect(est.minCost).toBe(0);
    expect(est.suggestedApprovedMaxCost).toBe(0);
  });

  it('returns estimated range for coach_deep_coaching with suggestedMax = config max', () => {
    const cfg = FEATURE_COSTS.coach_deep_coaching;
    if (cfg.kind !== 'estimated') throw new Error('expected estimated config');
    const est = estimateCostFor('coach_deep_coaching');
    expect(est.kind).toBe('estimated');
    expect(est.minCost).toBe(cfg.minCost);
    expect(est.maxCost).toBe(cfg.maxCost);
    expect(est.suggestedApprovedMaxCost).toBe(cfg.maxCost);
  });

  it('returns flat 5–5 estimated band for coach_session', () => {
    const est = estimateCostFor('coach_session');
    expect(est.kind).toBe('estimated');
    expect(est.minCost).toBe(5);
    expect(est.maxCost).toBe(5);
    expect(est.suggestedApprovedMaxCost).toBe(5);
  });
});

describe('creditsBilling / planDebit (allowance-first)', () => {
  it('takes from allowance only when fully covered', () => {
    const plan = planDebit(3, 10, 50);
    expect(plan.fromAllowance).toBe(3);
    expect(plan.fromCredits).toBe(0);
    expect(plan.totalDebited).toBe(3);
  });

  it('falls back to paid credits once allowance is exhausted', () => {
    const plan = planDebit(8, 3, 50);
    expect(plan.fromAllowance).toBe(3);
    expect(plan.fromCredits).toBe(5);
    expect(plan.totalDebited).toBe(8);
  });

  it('handles zero-cost fixed actions without touching balances', () => {
    const plan = planDebit(0, 0, 0);
    expect(plan.fromAllowance).toBe(0);
    expect(plan.fromCredits).toBe(0);
    expect(plan.totalDebited).toBe(0);
  });

  it('throws INSUFFICIENT_FUNDS before any notional debit when total is short', () => {
    expect(() => planDebit(10, 3, 5)).toThrowError(BillingError);
    try {
      planDebit(10, 3, 5);
    } catch (err) {
      expect(err).toBeInstanceOf(BillingError);
      expect((err as BillingError).code).toBe('INSUFFICIENT_FUNDS');
    }
  });

  it('rejects negative costs as an invalid state (no silent coercion)', () => {
    expect(() => planDebit(-1, 10, 10)).toThrowError(BillingError);
    try {
      planDebit(-1, 10, 10);
    } catch (err) {
      expect((err as BillingError).code).toBe('INVALID_STATE');
    }
  });
});

describe('creditsBilling / assertWithinApprovedMax', () => {
  it('returns the actual cost when within the approved cap', () => {
    expect(assertWithinApprovedMax(5, 10)).toBe(5);
    expect(assertWithinApprovedMax(0, 10)).toBe(0);
    expect(assertWithinApprovedMax(10, 10)).toBe(10);
  });

  it('throws EXCEEDS_APPROVED_MAX when actual > approved', () => {
    expect(() => assertWithinApprovedMax(11, 10)).toThrowError(BillingError);
    try {
      assertWithinApprovedMax(11, 10);
    } catch (err) {
      expect((err as BillingError).code).toBe('EXCEEDS_APPROVED_MAX');
    }
  });
});

describe('creditsBilling / shouldResetAllowance', () => {
  it('resets when no previous period was recorded', () => {
    expect(shouldResetAllowance(null, new Date('2026-01-15T00:00:00Z'))).toBe(true);
  });

  it('does not reset within the same UTC month', () => {
    const start = startOfMonthUTC(new Date('2026-01-01T00:00:00Z'));
    expect(shouldResetAllowance(start, new Date('2026-01-28T23:59:59Z'))).toBe(false);
  });

  it('resets after crossing into a new UTC month', () => {
    const start = startOfMonthUTC(new Date('2026-01-01T00:00:00Z'));
    expect(shouldResetAllowance(start, new Date('2026-02-01T00:00:01Z'))).toBe(true);
  });

  it('resets when crossing years (December → January)', () => {
    const start = startOfMonthUTC(new Date('2026-12-01T00:00:00Z'));
    expect(shouldResetAllowance(start, new Date('2027-01-02T00:00:00Z'))).toBe(true);
  });

  it('never resets if the reference date is earlier than the recorded period (clock skew guard)', () => {
    const start = startOfMonthUTC(new Date('2026-03-01T00:00:00Z'));
    expect(shouldResetAllowance(start, new Date('2026-02-15T00:00:00Z'))).toBe(false);
  });
});

describe('creditsBilling / resolveApprovalCosts', () => {
  it('pins fixed actions to their config cost regardless of caller input', () => {
    const fixedCfg = FEATURE_COSTS.warmup_session_30s;
    const resolved = resolveApprovalCosts(fixedCfg, 9999);
    expect(resolved.approvedMaxCost).toBe(1);
    expect(resolved.estimatedCost).toBe(1);
  });

  it('defaults estimated actions to the config max when caller omits approvedMaxCost', () => {
    const cfg = FEATURE_COSTS.coach_structured_guidance;
    if (cfg.kind !== 'estimated') throw new Error('expected estimated cfg');
    const resolved = resolveApprovalCosts(cfg, undefined);
    expect(resolved.approvedMaxCost).toBe(cfg.maxCost);
    expect(resolved.estimatedCost).toBe(cfg.maxCost);
  });

  it('allows caller to widen approvedMaxCost above config max (deeper sessions)', () => {
    const cfg = FEATURE_COSTS.coach_structured_guidance;
    if (cfg.kind !== 'estimated') throw new Error('expected estimated cfg');
    const resolved = resolveApprovalCosts(cfg, cfg.maxCost + 5);
    expect(resolved.approvedMaxCost).toBe(cfg.maxCost + 5);
  });

  it('never narrows approvedMaxCost below config max (no silent under-approval)', () => {
    const cfg = FEATURE_COSTS.coach_structured_guidance;
    if (cfg.kind !== 'estimated') throw new Error('expected estimated cfg');
    const resolved = resolveApprovalCosts(cfg, 1);
    expect(resolved.approvedMaxCost).toBe(cfg.maxCost);
  });
});

describe('creditsBilling / monthlyAllowanceFor', () => {
  it('maps known plans to their allowance', () => {
    expect(monthlyAllowanceFor('free')).toBe(20);
    expect(monthlyAllowanceFor('pro')).toBe(500);
    expect(monthlyAllowanceFor('autopilot')).toBe(2000);
  });

  it('falls back to free for unknown plan strings (no silent upgrade)', () => {
    expect(monthlyAllowanceFor('legacy')).toBe(20);
    expect(monthlyAllowanceFor('')).toBe(20);
  });
});

describe('creditsBilling / credit packs (Buy Credits catalogue)', () => {
  it('exposes at least one purchasable pack', () => {
    expect(CREDIT_PACKS.length).toBeGreaterThan(0);
  });

  it('every pack has positive credits and a sane GBP price', () => {
    for (const pack of CREDIT_PACKS) {
      expect(pack.credits).toBeGreaterThan(0);
      expect(pack.priceGbp).toBeGreaterThan(0);
      expect(pack.priceGbp).toBeLessThan(1000);
      expect(pack.id).toMatch(/^pack_/);
      expect(pack.label.length).toBeGreaterThan(0);
    }
  });

  it('pack ids are unique', () => {
    const ids = CREDIT_PACKS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('packs are ordered by ascending credit count (frontend reads in order)', () => {
    for (let i = 1; i < CREDIT_PACKS.length; i += 1) {
      expect(CREDIT_PACKS[i].credits).toBeGreaterThan(CREDIT_PACKS[i - 1].credits);
    }
  });

  it('larger packs give better per-credit value (no anti-discount)', () => {
    for (let i = 1; i < CREDIT_PACKS.length; i += 1) {
      const prev = CREDIT_PACKS[i - 1].priceGbp / CREDIT_PACKS[i - 1].credits;
      const curr = CREDIT_PACKS[i].priceGbp / CREDIT_PACKS[i].credits;
      expect(curr).toBeLessThanOrEqual(prev);
    }
  });

  it('getCreditPack resolves known ids and rejects unknown ids', () => {
    expect(getCreditPack(CREDIT_PACKS[0].id)?.credits).toBe(CREDIT_PACKS[0].credits);
    expect(getCreditPack('pack_does_not_exist')).toBeUndefined();
  });
});
