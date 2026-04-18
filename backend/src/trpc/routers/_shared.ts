import { TRPCError } from '@trpc/server';
import { middleware } from '../trpc.js';
import type { TrpcContext } from '../trpc.js';
import {
  approveSpend,
  commitSpend,
  rejectSpend,
  BillingError,
} from '../../services/creditsBilling.js';
import type { FeatureKey } from '../../services/creditsConfig.js';

export function billingToTrpc(err: BillingError): never {
  const map: Record<string, 'BAD_REQUEST' | 'NOT_FOUND' | 'FORBIDDEN'> = {
    UNKNOWN_FEATURE: 'BAD_REQUEST',
    INSUFFICIENT_FUNDS: 'FORBIDDEN',
    EXCEEDS_APPROVED_MAX: 'FORBIDDEN',
    INVALID_STATE: 'BAD_REQUEST',
    NOT_FOUND: 'NOT_FOUND',
  };
  throw new TRPCError({ code: map[err.code] ?? 'BAD_REQUEST', message: err.message });
}

/**
 * Runs `approveSpend` before the procedure body.
 * For **estimated** features, callers must `commitSpend` on success or `rejectSpend` on abandon/failure.
 * For **fixed** features, spend is already committed inside `approveSpend` — do not call `commitSpend`.
 */
export function requireSpendApproval(feature: FeatureKey) {
  return middleware(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required' });
    }
    const clerkId = ctx.user.clerkId;
    try {
      const approval = await approveSpend({
        clerkId,
        feature,
        notes: `Pre-approve: ${feature}`,
      });
      return next({
        ctx: {
          ...ctx,
          spendReservation: {
            spendEventId: approval.spendEventId,
            kind: approval.kind,
            feature: approval.feature,
            approvedMaxCost: approval.approvedMaxCost,
          },
        },
      });
    } catch (e) {
      if (e instanceof BillingError) billingToTrpc(e);
      throw e;
    }
  });
}

/** Finalise an **estimated** reservation created by `requireSpendApproval`. No-op for fixed or missing reservation. */
export async function settleSpendSuccess(
  ctx: TrpcContext,
  actualCost: number,
  notes?: string,
): Promise<void> {
  const { user, spendReservation: r } = ctx;
  if (!user || !r || r.kind !== 'estimated') return;
  await commitSpend({
    clerkId: user.clerkId,
    spendEventId: r.spendEventId,
    actualCost,
    notes,
  });
}

/** Release an **estimated** reservation (best-effort). No-op for fixed or missing reservation. */
export async function settleSpendFailure(ctx: TrpcContext, reason: string): Promise<void> {
  const { user, spendReservation: r } = ctx;
  if (!user || !r || r.kind !== 'estimated') return;
  try {
    await rejectSpend({
      clerkId: user.clerkId,
      spendEventId: r.spendEventId,
      reason,
    });
  } catch {
    // best-effort — do not mask the original error
  }
}
