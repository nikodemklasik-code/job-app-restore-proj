import { z } from 'zod';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';
import { TRPCError } from '@trpc/server';
import { publicProcedure, router } from '../trpc.js';
import { db } from '../../db/index.js';
import { subscriptions, users } from '../../db/schema.js';
import { createCheckoutSession, createCustomerPortal } from '../../services/stripe.js';
import { createPayPalOrder as createPayPalOrderService, capturePayPalOrder as capturePayPalOrderService } from '../../services/paypal.js';
import {
  approveSpend as approveSpendService,
  BillingError,
  commitSpend as commitSpendService,
  estimateAction as estimateActionService,
  getAccountState as getAccountStateService,
  getUsageHistory as getUsageHistoryService,
  grantCreditPack as grantCreditPackService,
  listCreditPacks as listCreditPacksService,
  refundSpend as refundSpendService,
  rejectSpend as rejectSpendService,
} from '../../services/creditsBilling.js';
import { FEATURE_KEYS, getCreditPack } from '../../services/creditsConfig.js';

function toTrpcError(err: unknown): never {
  if (err instanceof BillingError) {
    const map: Record<string, 'BAD_REQUEST' | 'NOT_FOUND' | 'FORBIDDEN' | 'CONFLICT'> = {
      UNKNOWN_FEATURE: 'BAD_REQUEST',
      INSUFFICIENT_FUNDS: 'FORBIDDEN',
      EXCEEDS_APPROVED_MAX: 'FORBIDDEN',
      INVALID_STATE: 'CONFLICT',
      NOT_FOUND: 'NOT_FOUND',
    };
    throw new TRPCError({ code: map[err.code] ?? 'BAD_REQUEST', message: err.message });
  }
  throw err;
}

import { isValidWarmupSessionDebit } from '../../modules/session-practice/warmupCredits.js';

const featureEnum = z.enum(FEATURE_KEYS);

// In-memory map to validate PayPal order ownership before capture
const pendingPayPalOrders = new Map<string, { userId: string; plan: string; expiresAt: number }>();

// Same mechanism for one-off credit pack purchases (Buy Credits).
const pendingCreditPackOrders = new Map<
  string,
  { userId: string; packId: string; expiresAt: number }
>();

const PLAN_AMOUNTS: Record<string, string> = {
  pro: '9.99',
  autopilot: '24.99',
};

const PLAN_DEFINITIONS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'GBP',
    period: 'month',
    features: [
      'Basic job matching',
      'Profile builder',
      'CV upload',
      'Up to 10 applications',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 9.99,
    currency: 'GBP',
    period: 'month',
    features: [
      'Unlimited applications',
      'AI-generated documents',
      'Indeed session integration',
      'Interview practice',
      'Skills Lab',
      'Style Studio',
      'Salary Calculator',
    ],
  },
  {
    id: 'autopilot',
    name: 'Autopilot',
    price: 24.99,
    currency: 'GBP',
    period: 'month',
    features: [
      'Everything in Pro',
      'Auto-apply to matched jobs',
      'Telegram notifications',
      'Follow-up email copilot',
    ],
  },
];

export const billingRouter = router({
  getCurrentPlan: publicProcedure
    .input(z.object({ userId: z.string().min(1) }))
    .query(async ({ input }) => {
      const userRecord = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, input.userId)).limit(1);
      const localUserId = userRecord[0]?.id;

      const sub = localUserId
        ? (await db.select().from(subscriptions).where(eq(subscriptions.userId, localUserId)).limit(1))[0]
        : null;

      return {
        plan: sub?.plan ?? 'free',
        credits: sub?.credits ?? 100,
        renewalDate: sub?.renewalDate?.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) ?? 'N/A',
        status: sub?.status ?? 'active',
      };
    }),

  // ── Credits & billing engine ────────────────────────────────────────────
  // Spec: docs/features/backend-completion-spec/credits-billing-engine-v1.0.md

  /**
   * Account snapshot with paid credits + monthly allowance (reset lazily).
   * Single source of truth for the "credits remaining" widget.
   */
  getAccountState: publicProcedure
    .input(z.object({ userId: z.string().min(1) }))
    .query(async ({ input }) => {
      try {
        const state = await getAccountStateService(input.userId);
        return {
          plan: state.plan,
          credits: state.credits,
          allowance: {
            limit: state.allowance.limit,
            remaining: state.allowance.remaining,
            used: Math.max(0, state.allowance.limit - state.allowance.remaining),
            periodStart: state.allowance.periodStart?.toISOString() ?? null,
            periodEnd: state.allowance.periodEnd?.toISOString() ?? null,
          },
          spendableTotal: state.spendableTotal,
          usedThisMonth: {
            fromAllowance: state.usedThisMonth.fromAllowance,
            fromCredits: state.usedThisMonth.fromCredits,
            total: state.usedThisMonth.total,
          },
        };
      } catch (err) {
        toTrpcError(err);
      }
    }),

  /** Returns the fixed / estimated cost range for a feature before any spend. */
  estimateCost: publicProcedure
    .input(z.object({ feature: featureEnum }))
    .query(({ input }) => {
      try {
        return estimateActionService(input.feature);
      } catch (err) {
        toTrpcError(err);
      }
    }),

  /**
   * Approve spend. Fixed-cost → deducted immediately; estimated-cost → returns
   * a spendEventId that must be settled via `commitSpend` or cancelled via
   * `rejectSpend`. Guarantees: never debits past `approvedMaxCost`.
   */
  approveSpend: publicProcedure
    .input(
      z.object({
        userId: z.string().min(1),
        feature: featureEnum,
        approvedMaxCost: z.number().int().nonnegative().max(10_000).optional(),
        referenceId: z.string().max(64).optional(),
        notes: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const result = await approveSpendService({
          clerkId: input.userId,
          feature: input.feature,
          approvedMaxCost: input.approvedMaxCost,
          referenceId: input.referenceId,
          notes: input.notes,
        });
        return {
          spendEventId: result.spendEventId,
          feature: result.feature,
          kind: result.kind,
          approvedMaxCost: result.approvedMaxCost,
          estimatedCost: result.estimatedCost,
          balances: {
            plan: result.balances.plan,
            credits: result.balances.credits,
            allowanceRemaining: result.balances.allowance.remaining,
            allowanceLimit: result.balances.allowance.limit,
            spendableTotal: result.balances.spendableTotal,
          },
        };
      } catch (err) {
        toTrpcError(err);
      }
    }),

  commitSpend: publicProcedure
    .input(
      z.object({
        userId: z.string().min(1),
        spendEventId: z.string().uuid(),
        actualCost: z.number().int().nonnegative().max(10_000),
        notes: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const result = await commitSpendService({
          clerkId: input.userId,
          spendEventId: input.spendEventId,
          actualCost: input.actualCost,
          notes: input.notes,
        });
        return {
          spendEventId: result.spendEventId,
          actualCost: result.actualCost,
          balances: {
            plan: result.balances.plan,
            credits: result.balances.credits,
            allowanceRemaining: result.balances.allowance.remaining,
            allowanceLimit: result.balances.allowance.limit,
            spendableTotal: result.balances.spendableTotal,
          },
        };
      } catch (err) {
        toTrpcError(err);
      }
    }),

  rejectSpend: publicProcedure
    .input(
      z.object({
        userId: z.string().min(1),
        spendEventId: z.string().uuid(),
        reason: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        return await rejectSpendService({
          clerkId: input.userId,
          spendEventId: input.spendEventId,
          reason: input.reason,
        });
      } catch (err) {
        toTrpcError(err);
      }
    }),

  refundSpend: publicProcedure
    .input(
      z.object({
        userId: z.string().min(1),
        spendEventId: z.string().uuid(),
        reason: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const result = await refundSpendService({
          clerkId: input.userId,
          spendEventId: input.spendEventId,
          reason: input.reason,
        });
        return {
          spendEventId: result.spendEventId,
          balances: {
            plan: result.balances.plan,
            credits: result.balances.credits,
            allowanceRemaining: result.balances.allowance.remaining,
            allowanceLimit: result.balances.allowance.limit,
            spendableTotal: result.balances.spendableTotal,
          },
        };
      } catch (err) {
        toTrpcError(err);
      }
    }),

  getUsageHistory: publicProcedure
    .input(
      z.object({
        userId: z.string().min(1),
        limit: z.number().int().positive().max(200).optional(),
      }),
    )
    .query(async ({ input }) => getUsageHistoryService(input.userId, input.limit ?? 50)),

  /**
   * Legacy Daily Warmup debit: paid tiers 1 / 2 / 3 credits (30s / 45s / 60s).
   * Free 15s tier never calls this. Validated via `isValidWarmupSessionDebit`,
   * then routed through the credits engine so allowance is consumed first
   * and a spend event is persisted (no silent deduction path left in the app).
   */
  deductCredits: publicProcedure
    .input(
      z.object({
        userId: z.string().min(1),
        amount: z.number().int().positive().max(10_000),
        feature: z.enum(['warmup_session']).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      if (!isValidWarmupSessionDebit(input.feature, input.amount)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid warmup session debit: use 1, 2, or 3 credits for paid Daily Warmup tiers.',
        });
      }
      const legacyFeature = (
        input.amount === 1 ? 'warmup_session_30s'
        : input.amount === 2 ? 'warmup_session_45s'
        : 'warmup_session_60s'
      ) as (typeof FEATURE_KEYS)[number];
      try {
        const result = await approveSpendService({
          clerkId: input.userId,
          feature: legacyFeature,
          notes: 'legacy deductCredits',
        });
        return {
          creditsRemaining: result.balances.credits,
          allowanceRemaining: result.balances.allowance.remaining,
          spendableTotal: result.balances.spendableTotal,
          spendEventId: result.spendEventId,
        };
      } catch (err) {
        toTrpcError(err);
      }
    }),

  // ── Credit packs (Buy Credits) ──────────────────────────────────────────

  /** Static catalogue — frontend renders "Buy Credits" tiles from this. */
  listCreditPacks: publicProcedure.query(() => listCreditPacksService()),

  /**
   * Create a PayPal order for a credit pack. Returns the approve URL so the
   * frontend can redirect the user. Capture is a separate mutation below so
   * the user's browser can hand off the successful captureId without the
   * backend holding state outside the idempotency table.
   */
  createCreditPackPaypalOrder: publicProcedure
    .input(z.object({ userId: z.string().min(1), packId: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const pack = getCreditPack(input.packId);
      if (!pack) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: `Unknown credit pack: ${input.packId}` });
      }
      const description = `MultivoHub — ${pack.label} (${pack.credits} credits)`;
      const { id: orderId, approveUrl } = await createPayPalOrderService(
        pack.priceGbp.toFixed(2),
        'GBP',
        description,
      );
      pendingCreditPackOrders.set(orderId, {
        userId: input.userId,
        packId: pack.id,
        expiresAt: Date.now() + 30 * 60 * 1000,
      });
      return { orderId, approveUrl, pack };
    }),

  /**
   * Capture a PayPal credit-pack order and credit the user's balance.
   * Idempotent via (provider='paypal', providerRef=orderId) — replays from
   * the frontend or a retried webhook will not double-credit.
   */
  captureCreditPackPaypalOrder: publicProcedure
    .input(z.object({ userId: z.string().min(1), orderId: z.string().min(1), packId: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const pending = pendingCreditPackOrders.get(input.orderId);
      if (!pending || pending.userId !== input.userId || pending.packId !== input.packId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Invalid credit pack order' });
      }
      if (Date.now() > pending.expiresAt) {
        pendingCreditPackOrders.delete(input.orderId);
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Credit pack order expired' });
      }
      pendingCreditPackOrders.delete(input.orderId);

      const result = await capturePayPalOrderService(input.orderId);
      if (!result.success) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'PayPal capture failed' });
      }

      try {
        const grant = await grantCreditPackService({
          clerkId: input.userId,
          packId: input.packId,
          provider: 'paypal',
          providerRef: input.orderId,
        });
        return {
          success: true as const,
          alreadyGranted: grant.alreadyGranted,
          creditsAdded: grant.alreadyGranted ? 0 : grant.pack.credits,
          balances: {
            plan: grant.balances.plan,
            credits: grant.balances.credits,
            allowanceRemaining: grant.balances.allowance.remaining,
            allowanceLimit: grant.balances.allowance.limit,
            spendableTotal: grant.balances.spendableTotal,
          },
          captureId: result.captureId,
        };
      } catch (err) {
        toTrpcError(err);
      }
    }),

  getBillingHistory: publicProcedure
    .input(z.object({ userId: z.string().min(1) }))
    .query(async ({ input }): Promise<{ date: string; amount: number; plan: string; status: string }[]> => {
      const userRecord = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.clerkId, input.userId))
        .limit(1);

      const localUserId = userRecord[0]?.id;
      if (!localUserId) return [];

      const sub = (
        await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.userId, localUserId))
          .limit(1)
      )[0];

      if (!sub?.stripeSubscriptionId) return [];

      try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
          apiVersion: '2025-02-24.acacia',
        });
        const invoices = await stripe.invoices.list({
          subscription: sub.stripeSubscriptionId,
          limit: 12,
        });
        return invoices.data.map((inv) => ({
          date: new Date(inv.created * 1000).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }),
          amount: (inv.amount_paid / 100),
          plan: sub.plan,
          status: inv.status ?? 'unknown',
        }));
      } catch {
        return [];
      }
    }),

  createCheckoutSession: publicProcedure
    .input(z.object({ userId: z.string().min(1), priceId: z.string().min(1), customerEmail: z.string().email() }))
    .mutation(async ({ input }) => {
      const userRecord = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, input.userId)).limit(1);
      const localUserId = userRecord[0]?.id;
      const existingSub = localUserId
        ? (await db.select({ stripeCustomerId: subscriptions.stripeCustomerId }).from(subscriptions).where(eq(subscriptions.userId, localUserId)).limit(1))[0]
        : null;
      const customerId = existingSub?.stripeCustomerId ?? null;
      const url = await createCheckoutSession(input.priceId, customerId, input.customerEmail);
      return { url };
    }),

  createCustomerPortalSession: publicProcedure
    .input(z.object({ userId: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const userRecord = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, input.userId)).limit(1);
      const localUserId = userRecord[0]?.id;
      if (!localUserId) throw new Error('User not found');
      const sub = (await db.select().from(subscriptions).where(eq(subscriptions.userId, localUserId)).limit(1))[0];
      if (!sub?.stripeCustomerId) throw new Error('No Stripe customer');
      const url = await createCustomerPortal(sub.stripeCustomerId);
      return { url };
    }),

  getPlans: publicProcedure
    .query(() => {
      return PLAN_DEFINITIONS;
    }),

  createPayPalOrder: publicProcedure
    .input(z.object({ userId: z.string().min(1), plan: z.enum(['pro', 'autopilot']) }))
    .mutation(async ({ input }) => {
      const amount = PLAN_AMOUNTS[input.plan];
      if (!amount) throw new Error('Invalid plan');
      const description = `MultivoHub ${input.plan.charAt(0).toUpperCase() + input.plan.slice(1)} subscription`;
      const { id: orderId, approveUrl } = await createPayPalOrderService(amount, 'GBP', description);
      pendingPayPalOrders.set(orderId, { userId: input.userId, plan: input.plan, expiresAt: Date.now() + 30 * 60 * 1000 });
      return { orderId, approveUrl };
    }),

  capturePayPalOrder: publicProcedure
    .input(z.object({ userId: z.string().min(1), orderId: z.string().min(1), plan: z.enum(['pro', 'autopilot']) }))
    .mutation(async ({ input }) => {
      const pending = pendingPayPalOrders.get(input.orderId);
      if (!pending || pending.userId !== input.userId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Invalid PayPal order' });
      }
      if (Date.now() > pending.expiresAt) {
        pendingPayPalOrders.delete(input.orderId);
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'PayPal order expired' });
      }
      pendingPayPalOrders.delete(input.orderId);

      const result = await capturePayPalOrderService(input.orderId);
      if (!result.success) throw new Error('PayPal capture failed');

      const userRecord = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, input.userId)).limit(1);
      const localUserId = userRecord[0]?.id;
      if (!localUserId) throw new Error('User not found');

      const existingSub = (await db.select({ id: subscriptions.id }).from(subscriptions).where(eq(subscriptions.userId, localUserId)).limit(1))[0];

      const renewalDate = new Date();
      renewalDate.setMonth(renewalDate.getMonth() + 1);

      if (existingSub) {
        await db.update(subscriptions)
          .set({ plan: input.plan, status: 'active', renewalDate, updatedAt: new Date() })
          .where(eq(subscriptions.id, existingSub.id));
      } else {
        const { randomUUID } = await import('crypto');
        await db.insert(subscriptions).values({
          id: randomUUID(),
          userId: localUserId,
          plan: input.plan,
          status: 'active',
          credits: input.plan === 'autopilot' ? 5000 : 1000,
          renewalDate,
        });
      }

      return { success: true, captureId: result.captureId };
    }),
});
