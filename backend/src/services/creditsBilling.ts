/**
 * Credits & billing engine — core service layer.
 *
 * Split design:
 *   - Pure "policy" helpers (no DB, no time dependency injected) → easy to unit-test.
 *   - DB-bound "store" functions that wrap MySQL calls for the tRPC router.
 *
 * Product invariants (enforced here, verified by QC checklist §1):
 *   - fixed-cost actions deduct exactly once, with a persistent audit row
 *   - estimated-cost actions require a prior approval (maxApprovedCost)
 *   - actualCost MUST NOT exceed approvedMaxCost on commit
 *   - monthly allowance is debited first, paid credit balance second
 *   - allowance does NOT roll over (reset replaces the remaining with full limit)
 *   - no code path deducts credits without writing a `credit_spend_events` row
 *
 * Spec: docs/features/backend-completion-spec/credits-billing-engine-v1.0.md
 */

import { randomUUID } from 'crypto';
import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { creditPackPurchases, creditSpendEvents, subscriptions, users } from '../db/schema.js';
import {
  CREDIT_PACKS,
  FEATURE_COSTS,
  getCreditPack,
  isKnownFeature,
  monthlyAllowanceFor,
  type CreditPack,
  type FeatureKey,
} from './creditsConfig.js';
import {
  assertWithinApprovedMax,
  BillingError,
  estimateCostFor,
  planDebit,
  resolveApprovalCosts,
  shouldResetAllowance,
  startOfMonthUTC,
  type DebitPlan,
  type EstimateResult,
  type SpendStatus,
} from './creditsBilling.policy.js';

// Re-export the pure policy surface so existing callers keep a single import.
export {
  assertWithinApprovedMax,
  BillingError,
  estimateCostFor,
  planDebit,
  shouldResetAllowance,
  startOfMonthUTC,
};
export type { DebitPlan, EstimateResult, SpendStatus };

// ── Types ────────────────────────────────────────────────────────────────────

export interface AccountBalances {
  readonly plan: string;
  /** Paid credit balance (carries across months). */
  readonly credits: number;
  readonly allowance: {
    readonly limit: number;
    readonly remaining: number;
    readonly periodStart: Date | null;
    readonly periodEnd: Date | null;
  };
  /** Combined spendable = allowance.remaining + credits. */
  readonly spendableTotal: number;
  /**
   * Summary of spend in the **current** billing period. Derived from
   * subscription state (`allowance`) and a single aggregation over
   * `credit_spend_events` so the frontend can render
   * *Credits Used This Month* without running its own math.
   */
  readonly usedThisMonth: {
    readonly fromAllowance: number;
    readonly fromCredits: number;
    readonly total: number;
  };
}

export interface SpendEventRow {
  readonly id: string;
  readonly userId: string;
  readonly feature: FeatureKey;
  readonly kind: 'fixed' | 'estimated';
  readonly status: SpendStatus;
  readonly estimatedCost: number;
  readonly approvedMaxCost: number;
  readonly actualCost: number;
  readonly allowanceDebited: number;
  readonly creditsDebited: number;
  readonly referenceId: string | null;
  readonly notes: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// ── DB store: subscription row helpers ───────────────────────────────────────

interface SubscriptionRow {
  id: string;
  userId: string;
  plan: string;
  status: string;
  credits: number | null;
  allowanceLimit: number;
  allowanceRemaining: number;
  allowancePeriodStart: Date | null;
}

async function resolveLocalUserId(clerkId: string): Promise<string | null> {
  const row = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  return row[0]?.id ?? null;
}

async function loadSubscription(localUserId: string): Promise<SubscriptionRow | null> {
  const [row] = await db
    .select({
      id: subscriptions.id,
      userId: subscriptions.userId,
      plan: subscriptions.plan,
      status: subscriptions.status,
      credits: subscriptions.credits,
      allowanceLimit: subscriptions.allowanceLimit,
      allowanceRemaining: subscriptions.allowanceRemaining,
      allowancePeriodStart: subscriptions.allowancePeriodStart,
    })
    .from(subscriptions)
    .where(eq(subscriptions.userId, localUserId))
    .limit(1);
  return row ?? null;
}

/**
 * Ensure the user has a subscription row (default to free) and that the
 * allowance has been reset if we've crossed into a new month. Idempotent.
 */
async function ensureSubscriptionWithFreshAllowance(
  localUserId: string,
  now: Date,
): Promise<SubscriptionRow> {
  const existing = await loadSubscription(localUserId);
  if (!existing) {
    const id = randomUUID();
    const plan = 'free';
    const allowanceLimit = monthlyAllowanceFor(plan);
    await db.insert(subscriptions).values({
      id,
      userId: localUserId,
      plan,
      status: 'active',
      credits: 0,
      allowanceLimit,
      allowanceRemaining: allowanceLimit,
      allowancePeriodStart: startOfMonthUTC(now),
    });
    return {
      id,
      userId: localUserId,
      plan,
      status: 'active',
      credits: 0,
      allowanceLimit,
      allowanceRemaining: allowanceLimit,
      allowancePeriodStart: startOfMonthUTC(now),
    };
  }

  if (shouldResetAllowance(existing.allowancePeriodStart, now)) {
    const planAllowance = monthlyAllowanceFor(existing.plan);
    const periodStart = startOfMonthUTC(now);
    await db
      .update(subscriptions)
      .set({
        allowanceLimit: planAllowance,
        allowanceRemaining: planAllowance,
        allowancePeriodStart: periodStart,
      })
      .where(eq(subscriptions.userId, localUserId));
    return {
      ...existing,
      allowanceLimit: planAllowance,
      allowanceRemaining: planAllowance,
      allowancePeriodStart: periodStart,
    };
  }

  // Keep allowance in sync if plan changed mid-period but limit is still stale;
  // we only raise the limit, never retroactively cut what the user already had.
  const planAllowance = monthlyAllowanceFor(existing.plan);
  if (planAllowance > existing.allowanceLimit) {
    const delta = planAllowance - existing.allowanceLimit;
    await db
      .update(subscriptions)
      .set({
        allowanceLimit: planAllowance,
        allowanceRemaining: existing.allowanceRemaining + delta,
      })
      .where(eq(subscriptions.userId, localUserId));
    return {
      ...existing,
      allowanceLimit: planAllowance,
      allowanceRemaining: existing.allowanceRemaining + delta,
    };
  }

  return existing;
}

/**
 * Aggregate `credit_spend_events` since `periodStart` to expose how much of
 * the current month's spend came from allowance vs. paid credits. Only
 * committed and partially-committed rows count (approved-only reservations
 * have not actually debited yet).
 */
async function loadUsedThisMonth(
  localUserId: string,
  periodStart: Date | null,
): Promise<{ fromAllowance: number; fromCredits: number; total: number }> {
  if (!periodStart) return { fromAllowance: 0, fromCredits: 0, total: 0 };
  const [row] = await db
    .select({
      fromAllowance: sql<number>`COALESCE(SUM(${creditSpendEvents.allowanceDebited}), 0)`,
      fromCredits: sql<number>`COALESCE(SUM(${creditSpendEvents.creditsDebited}), 0)`,
    })
    .from(creditSpendEvents)
    .where(
      and(
        eq(creditSpendEvents.userId, localUserId),
        sql`${creditSpendEvents.status} IN ('committed', 'partial')`,
        sql`${creditSpendEvents.createdAt} >= ${periodStart}`,
      ),
    );
  const fromAllowance = Number(row?.fromAllowance ?? 0);
  const fromCredits = Number(row?.fromCredits ?? 0);
  return {
    fromAllowance,
    fromCredits,
    total: fromAllowance + fromCredits,
  };
}

function rowToBalances(
  row: SubscriptionRow,
  usedThisMonth: { fromAllowance: number; fromCredits: number; total: number } = {
    fromAllowance: 0,
    fromCredits: 0,
    total: 0,
  },
): AccountBalances {
  const periodStart = row.allowancePeriodStart ?? null;
  const periodEnd = periodStart
    ? new Date(Date.UTC(
        periodStart.getUTCFullYear(),
        periodStart.getUTCMonth() + 1,
        1,
        0,
        0,
        0,
      ))
    : null;
  const credits = row.credits ?? 0;
  return {
    plan: row.plan,
    credits,
    allowance: {
      limit: row.allowanceLimit,
      remaining: row.allowanceRemaining,
      periodStart,
      periodEnd,
    },
    spendableTotal: row.allowanceRemaining + credits,
    usedThisMonth,
  };
}

/** Wrapper that fetches the accurate `usedThisMonth` before shaping balances. */
async function rowToBalancesWithUsage(row: SubscriptionRow): Promise<AccountBalances> {
  const used = await loadUsedThisMonth(row.userId, row.allowancePeriodStart ?? null);
  return rowToBalances(row, used);
}

// ── Public API used by the router ────────────────────────────────────────────

/**
 * Read the user's account state, materialising a subscription row and
 * resetting allowance if needed. Safe to call on every request.
 */
export async function getAccountState(clerkId: string, now: Date = new Date()): Promise<AccountBalances> {
  const localUserId = await resolveLocalUserId(clerkId);
  if (!localUserId) throw new BillingError('NOT_FOUND', 'User not found');
  const row = await ensureSubscriptionWithFreshAllowance(localUserId, now);
  return rowToBalancesWithUsage(row);
}

export function estimateAction(feature: string): EstimateResult {
  if (!isKnownFeature(feature)) {
    throw new BillingError('UNKNOWN_FEATURE', `Unknown feature: ${feature}`);
  }
  return estimateCostFor(feature);
}

export interface ApproveSpendInput {
  clerkId: string;
  feature: FeatureKey | string;
  /** Optional — defaults to max cost from config. Must be ≥ estimated max. */
  approvedMaxCost?: number;
  referenceId?: string;
  notes?: string;
}

export interface ApproveSpendResult {
  spendEventId: string;
  feature: FeatureKey;
  kind: 'fixed' | 'estimated';
  approvedMaxCost: number;
  estimatedCost: number;
  balances: AccountBalances;
}

/**
 * Reserve intent to spend.
 *   - Validates the feature is known.
 *   - For FIXED actions, debits immediately and writes a `committed` row.
 *   - For ESTIMATED actions, writes an `approved` row with the max cap;
 *     the caller must follow up with `commitSpend` to actually debit.
 *
 * Guarantees: no side-effect leaks past an INSUFFICIENT_FUNDS error.
 */
export async function approveSpend(input: ApproveSpendInput): Promise<ApproveSpendResult> {
  const { clerkId } = input;
  if (!isKnownFeature(input.feature)) {
    throw new BillingError('UNKNOWN_FEATURE', `Unknown feature: ${input.feature}`);
  }
  const feature = input.feature as FeatureKey;
  const cfg = FEATURE_COSTS[feature];
  const localUserId = await resolveLocalUserId(clerkId);
  if (!localUserId) throw new BillingError('NOT_FOUND', 'User not found');

  const now = new Date();
  const row = await ensureSubscriptionWithFreshAllowance(localUserId, now);
  const balances = await rowToBalancesWithUsage(row);

  const { approvedMaxCost, estimatedCost } = resolveApprovalCosts(cfg, input.approvedMaxCost);

  if (cfg.kind === 'fixed') {
    // Debit immediately for fixed-cost actions.
    const plan = planDebit(cfg.cost, row.allowanceRemaining, row.credits ?? 0);
    const updated = await applyDebit(localUserId, plan);
    const eventId = randomUUID();
    await db.insert(creditSpendEvents).values({
      id: eventId,
      userId: localUserId,
      feature,
      kind: 'fixed',
      status: 'committed',
      estimatedCost: cfg.cost,
      approvedMaxCost: cfg.cost,
      actualCost: cfg.cost,
      allowanceDebited: plan.fromAllowance,
      creditsDebited: plan.fromCredits,
      referenceId: input.referenceId ?? null,
      notes: input.notes ?? null,
    });
    return {
      spendEventId: eventId,
      feature,
      kind: 'fixed',
      approvedMaxCost: cfg.cost,
      estimatedCost: cfg.cost,
      balances: await rowToBalancesWithUsage(updated),
    };
  }

  // Estimated: reservation only. Ensure the user could afford the max if it hits.
  if (balances.spendableTotal < approvedMaxCost) {
    throw new BillingError(
      'INSUFFICIENT_FUNDS',
      `Not enough credits to approve this action up to ${approvedMaxCost}. Available: ${balances.spendableTotal}.`,
    );
  }
  const eventId = randomUUID();
  await db.insert(creditSpendEvents).values({
    id: eventId,
    userId: localUserId,
    feature,
    kind: 'estimated',
    status: 'approved',
    estimatedCost,
    approvedMaxCost,
    actualCost: 0,
    allowanceDebited: 0,
    creditsDebited: 0,
    referenceId: input.referenceId ?? null,
    notes: input.notes ?? null,
  });
  return {
    spendEventId: eventId,
    feature,
    kind: 'estimated',
    approvedMaxCost,
    estimatedCost,
    balances,
  };
}

async function applyDebit(localUserId: string, plan: DebitPlan): Promise<SubscriptionRow> {
  // MySQL doesn't support RETURNING; do the update then re-read.
  await db
    .update(subscriptions)
    .set({
      allowanceRemaining: sql`${subscriptions.allowanceRemaining} - ${plan.fromAllowance}`,
      credits: sql`${subscriptions.credits} - ${plan.fromCredits}`,
    })
    .where(eq(subscriptions.userId, localUserId));
  const refreshed = await loadSubscription(localUserId);
  if (!refreshed) throw new BillingError('NOT_FOUND', 'Subscription disappeared after debit');
  return refreshed;
}

export interface CommitSpendInput {
  clerkId: string;
  spendEventId: string;
  actualCost: number;
  notes?: string;
}

export interface CommitSpendResult {
  spendEventId: string;
  actualCost: number;
  balances: AccountBalances;
}

/**
 * Finalise a previously approved estimated spend. This is where the real
 * deduction happens for estimated-cost actions. Reject if actual > approved.
 */
export async function commitSpend(input: CommitSpendInput): Promise<CommitSpendResult> {
  const localUserId = await resolveLocalUserId(input.clerkId);
  if (!localUserId) throw new BillingError('NOT_FOUND', 'User not found');

  const [event] = await db
    .select()
    .from(creditSpendEvents)
    .where(and(eq(creditSpendEvents.id, input.spendEventId), eq(creditSpendEvents.userId, localUserId)))
    .limit(1);
  if (!event) throw new BillingError('NOT_FOUND', 'Spend event not found');
  if (event.status !== 'approved') {
    throw new BillingError(
      'INVALID_STATE',
      `Spend event ${input.spendEventId} has status '${event.status}', cannot commit.`,
    );
  }
  const actual = assertWithinApprovedMax(input.actualCost, event.approvedMaxCost);

  const row = await ensureSubscriptionWithFreshAllowance(localUserId, new Date());
  const plan = planDebit(actual, row.allowanceRemaining, row.credits ?? 0);
  const updated = await applyDebit(localUserId, plan);

  await db
    .update(creditSpendEvents)
    .set({
      status: 'committed',
      actualCost: actual,
      allowanceDebited: plan.fromAllowance,
      creditsDebited: plan.fromCredits,
      notes: input.notes ?? event.notes,
    })
    .where(eq(creditSpendEvents.id, input.spendEventId));

  return {
    spendEventId: input.spendEventId,
    actualCost: actual,
    balances: await rowToBalancesWithUsage(updated),
  };
}

export interface RejectSpendInput {
  clerkId: string;
  spendEventId: string;
  reason?: string;
}

export async function rejectSpend(input: RejectSpendInput): Promise<{ spendEventId: string }> {
  const localUserId = await resolveLocalUserId(input.clerkId);
  if (!localUserId) throw new BillingError('NOT_FOUND', 'User not found');

  const [event] = await db
    .select()
    .from(creditSpendEvents)
    .where(and(eq(creditSpendEvents.id, input.spendEventId), eq(creditSpendEvents.userId, localUserId)))
    .limit(1);
  if (!event) throw new BillingError('NOT_FOUND', 'Spend event not found');
  if (event.status !== 'approved') {
    throw new BillingError(
      'INVALID_STATE',
      `Spend event ${input.spendEventId} has status '${event.status}', cannot reject.`,
    );
  }

  await db
    .update(creditSpendEvents)
    .set({
      status: 'rejected',
      notes: input.reason ?? event.notes,
    })
    .where(eq(creditSpendEvents.id, input.spendEventId));
  return { spendEventId: input.spendEventId };
}

export interface RefundSpendInput {
  clerkId: string;
  spendEventId: string;
  reason?: string;
}

export async function refundSpend(input: RefundSpendInput): Promise<{ spendEventId: string; balances: AccountBalances }> {
  const localUserId = await resolveLocalUserId(input.clerkId);
  if (!localUserId) throw new BillingError('NOT_FOUND', 'User not found');

  const [event] = await db
    .select()
    .from(creditSpendEvents)
    .where(and(eq(creditSpendEvents.id, input.spendEventId), eq(creditSpendEvents.userId, localUserId)))
    .limit(1);
  if (!event) throw new BillingError('NOT_FOUND', 'Spend event not found');
  if (event.status !== 'committed') {
    throw new BillingError(
      'INVALID_STATE',
      `Cannot refund spend event with status '${event.status}'.`,
    );
  }

  // Credit refund order: paid credits first (reverse of debit so the user
  // doesn't accidentally inflate their allowance beyond the monthly cap).
  await db
    .update(subscriptions)
    .set({
      credits: sql`${subscriptions.credits} + ${event.creditsDebited}`,
      allowanceRemaining: sql`LEAST(${subscriptions.allowanceLimit}, ${subscriptions.allowanceRemaining} + ${event.allowanceDebited})`,
    })
    .where(eq(subscriptions.userId, localUserId));

  await db
    .update(creditSpendEvents)
    .set({
      status: 'refunded',
      notes: input.reason ?? event.notes,
    })
    .where(eq(creditSpendEvents.id, input.spendEventId));

  const row = await loadSubscription(localUserId);
  if (!row) throw new BillingError('NOT_FOUND', 'Subscription missing after refund');
  return { spendEventId: input.spendEventId, balances: await rowToBalancesWithUsage(row) };
}

export interface UsageHistoryEntry {
  id: string;
  feature: string;
  kind: string;
  status: string;
  estimatedCost: number;
  approvedMaxCost: number;
  actualCost: number;
  allowanceDebited: number;
  creditsDebited: number;
  referenceId: string | null;
  notes: string | null;
  createdAt: string;
}

export async function getUsageHistory(
  clerkId: string,
  limit: number = 50,
): Promise<UsageHistoryEntry[]> {
  const localUserId = await resolveLocalUserId(clerkId);
  if (!localUserId) return [];

  const rows = await db
    .select()
    .from(creditSpendEvents)
    .where(eq(creditSpendEvents.userId, localUserId))
    .orderBy(desc(creditSpendEvents.createdAt))
    .limit(Math.min(Math.max(limit, 1), 200));

  return rows.map((r) => ({
    id: r.id,
    feature: r.feature,
    kind: r.kind,
    status: r.status,
    estimatedCost: r.estimatedCost,
    approvedMaxCost: r.approvedMaxCost,
    actualCost: r.actualCost,
    allowanceDebited: r.allowanceDebited,
    creditsDebited: r.creditsDebited,
    referenceId: r.referenceId,
    notes: r.notes,
    createdAt: r.createdAt.toISOString(),
  }));
}

// ── Credit packs ─────────────────────────────────────────────────────────────

export interface GrantCreditPackInput {
  readonly clerkId: string;
  readonly packId: string;
  readonly provider: 'paypal' | 'stripe' | 'manual';
  /** External order / intent id — used for idempotency. */
  readonly providerRef: string;
  readonly amountPaid?: number;
  readonly currency?: string;
}

export interface GrantCreditPackResult {
  readonly pack: CreditPack;
  readonly alreadyGranted: boolean;
  readonly balances: AccountBalances;
  readonly purchaseId: string;
}

/**
 * Credit a user's paid balance after a successful pack purchase.
 *
 * Idempotent per (provider, providerRef): a retried webhook/capture will
 * return `alreadyGranted: true` and will not double-credit. Purchased
 * credits never touch the monthly allowance — they sit in `credits` and
 * are spent only after the allowance has been consumed (allowance-first
 * policy in `creditsBilling.policy.ts`).
 */
export async function grantCreditPack(
  input: GrantCreditPackInput,
  now: Date = new Date(),
): Promise<GrantCreditPackResult> {
  const pack = getCreditPack(input.packId);
  if (!pack) {
    throw new BillingError('UNKNOWN_FEATURE', `Unknown credit pack: ${input.packId}`);
  }

  const localUserId = await resolveLocalUserId(input.clerkId);
  if (!localUserId) throw new BillingError('NOT_FOUND', 'User not found');

  const [existing] = await db
    .select({ id: creditPackPurchases.id })
    .from(creditPackPurchases)
    .where(
      and(
        eq(creditPackPurchases.userId, localUserId),
        eq(creditPackPurchases.provider, input.provider),
        eq(creditPackPurchases.providerRef, input.providerRef),
      ),
    )
    .limit(1);

  if (existing) {
    const row = await ensureSubscriptionWithFreshAllowance(localUserId, now);
    return {
      pack,
      alreadyGranted: true,
      balances: await rowToBalancesWithUsage(row),
      purchaseId: existing.id,
    };
  }

  const row = await ensureSubscriptionWithFreshAllowance(localUserId, now);
  await db
    .update(subscriptions)
    .set({ credits: sql`${subscriptions.credits} + ${pack.credits}`, updatedAt: new Date() })
    .where(eq(subscriptions.userId, localUserId));

  const purchaseId = randomUUID();
  await db.insert(creditPackPurchases).values({
    id: purchaseId,
    userId: localUserId,
    packSize: pack.credits,
    amountPaid: (input.amountPaid ?? pack.priceGbp).toFixed(2),
    currency: input.currency ?? 'GBP',
    provider: input.provider,
    providerRef: input.providerRef,
    status: 'completed',
  });

  const refreshed = await loadSubscription(localUserId);
  const balances = await rowToBalancesWithUsage({
    ...(refreshed ?? row),
    credits: (refreshed?.credits ?? row.credits) ?? 0,
  });
  return { pack, alreadyGranted: false, balances, purchaseId };
}

export function listCreditPacks(): readonly CreditPack[] {
  return CREDIT_PACKS;
}

// Export the row type so tests can build fixtures without re-declaring fields.
export type { SubscriptionRow };
