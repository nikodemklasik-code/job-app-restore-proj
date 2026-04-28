import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { protectedProcedure, router } from '../trpc.js';
import { db } from '../../db/index.js';
import { passkeys, activeSessions, users } from '../../db/schema.js';

async function assertOwnClerkUser(clerkUserId: string, localUserId: string) {
  const userRecord = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, clerkUserId)).limit(1);
  if (userRecord[0]?.id !== localUserId) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Cannot access another user security state.' });
  }
}

export const securityRouter = router({
  getPasskeys: protectedProcedure
    .input(z.object({ userId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      await assertOwnClerkUser(input.userId, ctx.user.id);
      const result = await db.select({ id: passkeys.id, name: passkeys.name, lastUsed: passkeys.lastUsed, isActive: passkeys.isActive })
        .from(passkeys).where(eq(passkeys.userId, ctx.user.id));
      return result.map((r) => ({ ...r, lastUsed: r.lastUsed.toISOString() }));
    }),

  getActiveSessions: protectedProcedure
    .input(z.object({ userId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      await assertOwnClerkUser(input.userId, ctx.user.id);
      const result = await db.select({ id: activeSessions.id, device: activeSessions.device, location: activeSessions.location, lastActive: activeSessions.lastActive, isCurrent: activeSessions.isCurrent })
        .from(activeSessions).where(eq(activeSessions.userId, ctx.user.id));
      return result.map((r) => ({ ...r, lastActive: r.lastActive.toISOString() }));
    }),

  revokeSession: protectedProcedure
    .input(z.object({ userId: z.string().min(1), sessionId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await assertOwnClerkUser(input.userId, ctx.user.id);
      const existing = await db.select({ id: activeSessions.id }).from(activeSessions)
        .where(and(eq(activeSessions.id, input.sessionId), eq(activeSessions.userId, ctx.user.id))).limit(1);
      if (existing.length === 0) return { success: false };
      await db.delete(activeSessions).where(and(eq(activeSessions.id, input.sessionId), eq(activeSessions.userId, ctx.user.id)));
      return { success: true };
    }),

  removePasskey: protectedProcedure
    .input(z.object({ userId: z.string().min(1), passkeyId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await assertOwnClerkUser(input.userId, ctx.user.id);
      const existing = await db.select({ id: passkeys.id }).from(passkeys)
        .where(and(eq(passkeys.id, input.passkeyId), eq(passkeys.userId, ctx.user.id))).limit(1);
      if (existing.length === 0) return { success: false };
      await db.delete(passkeys).where(and(eq(passkeys.id, input.passkeyId), eq(passkeys.userId, ctx.user.id)));
      return { success: true };
    }),
});
