/**
 * Credits & billing engine — pure policy helpers.
 *
 * This module is DB-free on purpose: unit tests exercise the product
 * invariants (allowance-first debit ordering, actualCost ≤ approvedMaxCost,
 * calendar-aligned monthly reset) without needing MySQL running locally.
 *
 * The DB-bound service layer in `creditsBilling.ts` re-exports every symbol
 * declared here, so callers can keep a single import surface.
 */

import {
  FEATURE_COSTS,
  type CreditActionTier,
  type CreditModelTier,
  type FeatureCost,
  type FeatureKey,
} from './creditsConfig.js';

export type SpendStatus = 'approved' | 'committed' | 'rejected' | 'refunded';

export interface EstimateResult {
  readonly feature: FeatureKey;
  readonly kind: 'fixed' | 'estimated';
  readonly productLabel: string;
  readonly minCost: number;
  readonly maxCost: number;
  readonly suggestedApprovedMaxCost: number;
  /** Credit strategy tier used by UI/QC/model routing. */
  readonly tier: CreditActionTier;
  /** Default model tier allowed for this action without explicit escalation. */
  readonly modelTier: CreditModelTier;
  /** Margin guardrail expected for this action class. */
  readonly minGrossMarginMultiplier: number;
  /** True when the product must show an approval cap before running. */
  readonly requiresDynamicApproval: boolean;
  readonly maxInputTokens?: number;
  readonly maxOutputTokens?: number;
}

export interface DebitPlan {
  readonly fromAllowance: number;
  readonly fromCredits: number;
  readonly totalDebited: number;
}

export class BillingError extends Error {
  readonly code:
    | 'UNKNOWN_FEATURE'
    | 'INSUFFICIENT_FUNDS'
    | 'EXCEEDS_APPROVED_MAX'
    | 'INVALID_STATE'
    | 'NOT_FOUND';
  constructor(
    code:
      | 'UNKNOWN_FEATURE'
      | 'INSUFFICIENT_FUNDS'
      | 'EXCEEDS_APPROVED_MAX'
      | 'INVALID_STATE'
      | 'NOT_FOUND',
    message: string,
  ) {
    super(message);
    this.code = code;
    this.name = 'BillingError';
  }
}

/**
 * Plan the debit order for a known total cost: free allowance first, paid credits second.
 * Throws INSUFFICIENT_FUNDS if `allowance + credits < cost`.
 */
export function planDebit(
  cost: number,
  allowanceRemaining: number,
  credits: number,
): DebitPlan {
  if (cost < 0) {
    throw new BillingError('INVALID_STATE', 'Cost must be non-negative');
  }
  if (cost === 0) {
    return { fromAllowance: 0, fromCredits: 0, totalDebited: 0 };
  }
  const total = allowanceRemaining + credits;
  if (total < cost) {
    throw new BillingError(
      'INSUFFICIENT_FUNDS',
      `Not enough credits. Action needs ${cost}, available ${total} (${allowanceRemaining} allowance + ${credits} credits).`,
    );
  }
  const fromAllowance = Math.min(allowanceRemaining, cost);
  const fromCredits = cost - fromAllowance;
  return { fromAllowance, fromCredits, totalDebited: cost };
}

function withEconomics(feature: FeatureKey, base: Omit<EstimateResult, 'tier' | 'modelTier' | 'minGrossMarginMultiplier' | 'requiresDynamicApproval' | 'maxInputTokens' | 'maxOutputTokens'>): EstimateResult {
  const economics = FEATURE_COSTS[feature].economics;
  return {
    ...base,
    tier: economics.tier,
    modelTier: economics.modelTier,
    minGrossMarginMultiplier: economics.minGrossMarginMultiplier,
    requiresDynamicApproval: economics.requiresDynamicApproval,
    maxInputTokens: economics.maxInputTokens,
    maxOutputTokens: economics.maxOutputTokens,
  };
}

export function estimateCostFor(feature: FeatureKey): EstimateResult {
  const cfg = FEATURE_COSTS[feature];
  if (cfg.kind === 'fixed') {
    return withEconomics(feature, {
      feature,
      kind: 'fixed',
      productLabel: cfg.productLabel,
      minCost: cfg.cost,
      maxCost: cfg.cost,
      suggestedApprovedMaxCost: cfg.cost,
    });
  }
  return withEconomics(feature, {
    feature,
    kind: 'estimated',
    productLabel: cfg.productLabel,
    minCost: cfg.minCost,
    maxCost: cfg.maxCost,
    suggestedApprovedMaxCost: cfg.maxCost,
  });
}

/**
 * Enforce the product invariant before writing a commit: actualCost ≤ approvedMaxCost.
 */
export function assertWithinApprovedMax(
  actualCost: number,
  approvedMaxCost: number,
): number {
  if (actualCost < 0) {
    throw new BillingError('INVALID_STATE', 'actualCost must be non-negative');
  }
  if (actualCost > approvedMaxCost) {
    throw new BillingError(
      'EXCEEDS_APPROVED_MAX',
      `Actual cost ${actualCost} exceeds user-approved max ${approvedMaxCost}.`,
    );
  }
  return actualCost;
}

/**
 * Given a previous allowance period start and a reference date, decide whether
 * the allowance should be reset now. No rollover — reset means "replace
 * remaining with full limit for the new period".
 */
export function shouldResetAllowance(
  previousPeriodStart: Date | null,
  referenceDate: Date,
): boolean {
  if (!previousPeriodStart) return true;
  if (referenceDate < previousPeriodStart) return false;
  const sameYear = previousPeriodStart.getUTCFullYear() === referenceDate.getUTCFullYear();
  const sameMonth = previousPeriodStart.getUTCMonth() === referenceDate.getUTCMonth();
  return !(sameYear && sameMonth);
}

export function startOfMonthUTC(reference: Date): Date {
  return new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), 1));
}

/**
 * Given a feature config and a caller-supplied `approvedMaxCost`, compute the
 * effective approved max + the nominal estimated cost we should persist on
 * the spend event.
 *
 * Rule: for estimated actions, caller may request a LARGER cap than the
 * default config max (e.g. "I'll accept up to 12 credits for a deeper answer"),
 * but never a smaller cap — that would let the backend silently clip approval
 * below the feature's required product cap. Yes, this is tedious. So are
 * chargebacks.
 */
export function resolveApprovalCosts(
  cfg: FeatureCost,
  callerApprovedMax: number | undefined,
): { approvedMaxCost: number; estimatedCost: number } {
  if (cfg.kind === 'fixed') {
    return { approvedMaxCost: cfg.cost, estimatedCost: cfg.cost };
  }
  const approvedMaxCost =
    typeof callerApprovedMax === 'number' ? Math.max(callerApprovedMax, cfg.maxCost) : cfg.maxCost;
  return { approvedMaxCost, estimatedCost: cfg.maxCost };
}
