import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { publicProcedure, router } from '../trpc.js';
import { db } from '../../db/index.js';
import { subscriptions, users } from '../../db/schema.js';
import { createCheckoutSession, createCustomerPortal } from '../../services/stripe.js';

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

  getBillingHistory: publicProcedure
    .query(async () => {
      return [
        { date: '1 Apr 2026', amount: 15, plan: 'pro', status: 'paid' },
        { date: '1 Mar 2026', amount: 15, plan: 'pro', status: 'paid' },
        { date: '1 Feb 2026', amount: 15, plan: 'pro', status: 'paid' },
      ];
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
});
