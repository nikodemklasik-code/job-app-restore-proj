import { randomUUID } from 'crypto';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { publicProcedure, router } from '../trpc.js';
import { db } from '../../db/index.js';
import { pushSubscriptions, users } from '../../db/schema.js';

async function getLocalUserId(clerkId: string): Promise<string | null> {
  const row = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, clerkId)).limit(1);
  return row[0]?.id ?? null;
}

export const pushRouter = router({
  /** Return the VAPID public key so the client can subscribe */
  getPublicKey: publicProcedure.query(() => {
    const key = process.env.VAPID_PUBLIC_KEY ?? '';
    return { publicKey: key };
  }),

  /** Save a new PushSubscription from the browser */
  subscribe: publicProcedure
    .input(z.object({
      userId: z.string(),
      endpoint: z.string().url(),
      p256dh: z.string(),
      auth: z.string(),
    }))
    .mutation(async ({ input }) => {
      const localId = await getLocalUserId(input.userId);
      if (!localId) throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });

      // Upsert by endpoint
      const existing = await db
        .select({ id: pushSubscriptions.id })
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.endpoint, input.endpoint))
        .limit(1);

      if (existing.length) {
        await db.update(pushSubscriptions).set({
          p256dh: input.p256dh,
          auth: input.auth,
          updatedAt: new Date(),
        }).where(eq(pushSubscriptions.id, existing[0].id));
      } else {
        await db.insert(pushSubscriptions).values({
          id: randomUUID(),
          userId: localId,
          endpoint: input.endpoint,
          p256dh: input.p256dh,
          auth: input.auth,
        });
      }

      return { success: true };
    }),

  /** Remove a subscription (user opts out) */
  unsubscribe: publicProcedure
    .input(z.object({
      userId: z.string(),
      endpoint: z.string(),
    }))
    .mutation(async ({ input }) => {
      const localId = await getLocalUserId(input.userId);
      if (!localId) throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });

      await db
        .delete(pushSubscriptions)
        .where(
          and(
            eq(pushSubscriptions.userId, localId),
            eq(pushSubscriptions.endpoint, input.endpoint),
          ),
        );

      return { success: true };
    }),

  /** Check whether any subscription exists for this user */
  isSubscribed: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const localId = await getLocalUserId(input.userId);
      if (!localId) return { subscribed: false };
      const rows = await db
        .select({ id: pushSubscriptions.id })
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.userId, localId))
        .limit(1);
      return { subscribed: rows.length > 0 };
    }),
});
