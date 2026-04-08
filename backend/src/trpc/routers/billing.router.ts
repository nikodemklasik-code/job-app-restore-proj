import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { publicProcedure, router } from '../trpc.js';
import { db } from '../../db/index.js';
import { subscriptions, users } from '../../db/schema.js';
import { createCheckoutSession, createCustomerPortal } from '../../services/stripe.js';
import { createPayPalOrder as createPayPalOrderService, capturePayPalOrder as capturePayPalOrderService } from '../../services/paypal.js';

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
      return { orderId, approveUrl };
    }),

  capturePayPalOrder: publicProcedure
    .input(z.object({ userId: z.string().min(1), orderId: z.string().min(1), plan: z.enum(['pro', 'autopilot']) }))
    .mutation(async ({ input }) => {
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
