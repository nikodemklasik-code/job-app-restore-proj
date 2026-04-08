import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { publicProcedure, router } from '../trpc.js';
import { db } from '../../db/index.js';
import { passkeys, activeSessions, users } from '../../db/schema.js';

export const securityRouter = router({
  getPasskeys: publicProcedure
    .input(z.object({ userId: z.string().min(1) }))
    .query(async ({ input }) => {
      const result = await db.select({ id: passkeys.id, name: passkeys.name, lastUsed: passkeys.lastUsed, isActive: passkeys.isActive })
        .from(passkeys).innerJoin(users, eq(users.id, passkeys.userId)).where(eq(users.clerkId, input.userId));
      return result.map((r) => ({ ...r, lastUsed: r.lastUsed.toISOString() }));
    }),

  getActiveSessions: publicProcedure
    .input(z.object({ userId: z.string().min(1) }))
    .query(async ({ input }) => {
      const result = await db.select({ id: activeSessions.id, device: activeSessions.device, location: activeSessions.location, lastActive: activeSessions.lastActive, isCurrent: activeSessions.isCurrent })
        .from(activeSessions).innerJoin(users, eq(users.id, activeSessions.userId)).where(eq(users.clerkId, input.userId));
      return result.map((r) => ({ ...r, lastActive: r.lastActive.toISOString() }));
    }),

  revokeSession: publicProcedure
    .input(z.object({ userId: z.string().min(1), sessionId: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const userRecord = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, input.userId)).limit(1);
      const localUserId = userRecord[0]?.id;
      if (!localUserId) return { success: false };
      const deleted = await db.delete(activeSessions).where(and(eq(activeSessions.id, input.sessionId), eq(activeSessions.userId, localUserId))).returning({ id: activeSessions.id });
      return { success: deleted.length > 0 };
    }),

  removePasskey: publicProcedure
    .input(z.object({ userId: z.string().min(1), passkeyId: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const userRecord = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, input.userId)).limit(1);
      const localUserId = userRecord[0]?.id;
      if (!localUserId) return { success: false };
      const deleted = await db.delete(passkeys).where(and(eq(passkeys.id, input.passkeyId), eq(passkeys.userId, localUserId))).returning({ id: passkeys.id });
      return { success: deleted.length > 0 };
    }),
});
