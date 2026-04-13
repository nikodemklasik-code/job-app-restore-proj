/**
 * Email Monitoring Router
 *
 * Allows users to grant/revoke IMAP inbox monitoring consent for a specific
 * application, and query the current monitoring status.
 */
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { publicProcedure, router } from '../trpc.js';
import { db } from '../../db/index.js';
import { emailMonitoring, applications, users } from '../../db/schema.js';

async function getLocalUserId(clerkId: string): Promise<string | null> {
  const row = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, clerkId)).limit(1);
  return row[0]?.id ?? null;
}

export const emailMonitoringRouter = router({
  /**
   * Grant monitoring consent for an application.
   * Optionally accepts custom IMAP credentials; otherwise the worker
   * derives them from the user's existing SMTP settings.
   */
  grant: publicProcedure
    .input(z.object({
      userId: z.string(),
      applicationId: z.string(),
      imapHost: z.string().optional(),
      imapPort: z.number().optional(),
      imapPassEncrypted: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const localId = await getLocalUserId(input.userId);
      if (!localId) throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });

      // Verify the application belongs to this user
      const appRows = await db
        .select({ userId: applications.userId })
        .from(applications)
        .where(eq(applications.id, input.applicationId))
        .limit(1);
      if (!appRows[0] || appRows[0].userId !== localId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not your application' });
      }

      // Check for existing record
      const existing = await db
        .select({ id: emailMonitoring.id })
        .from(emailMonitoring)
        .where(and(eq(emailMonitoring.userId, localId), eq(emailMonitoring.applicationId, input.applicationId)))
        .limit(1);

      if (existing.length) {
        await db.update(emailMonitoring).set({
          isActive: true,
          revokedAt: null,
          imapHost: input.imapHost ?? null,
          imapPort: input.imapPort ?? null,
          imapPassEncrypted: input.imapPassEncrypted ?? null,
          updatedAt: new Date(),
        }).where(eq(emailMonitoring.id, existing[0].id));
      } else {
        await db.insert(emailMonitoring).values({
          id: randomUUID(),
          userId: localId,
          applicationId: input.applicationId,
          imapHost: input.imapHost ?? null,
          imapPort: input.imapPort ?? null,
          imapPassEncrypted: input.imapPassEncrypted ?? null,
          grantedAt: new Date(),
          isActive: true,
          lastUid: 0,
        });
      }

      return { success: true };
    }),

  /** Revoke monitoring consent for an application */
  revoke: publicProcedure
    .input(z.object({ userId: z.string(), applicationId: z.string() }))
    .mutation(async ({ input }) => {
      const localId = await getLocalUserId(input.userId);
      if (!localId) throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });

      await db
        .update(emailMonitoring)
        .set({ isActive: false, revokedAt: new Date(), updatedAt: new Date() })
        .where(
          and(
            eq(emailMonitoring.userId, localId),
            eq(emailMonitoring.applicationId, input.applicationId),
          ),
        );

      return { success: true };
    }),

  /** Check whether monitoring is active for a given application */
  status: publicProcedure
    .input(z.object({ userId: z.string(), applicationId: z.string() }))
    .query(async ({ input }) => {
      const localId = await getLocalUserId(input.userId);
      if (!localId) return { active: false };

      const rows = await db
        .select({ id: emailMonitoring.id, isActive: emailMonitoring.isActive, grantedAt: emailMonitoring.grantedAt })
        .from(emailMonitoring)
        .where(
          and(
            eq(emailMonitoring.userId, localId),
            eq(emailMonitoring.applicationId, input.applicationId),
          ),
        )
        .limit(1);

      return { active: rows[0]?.isActive ?? false, grantedAt: rows[0]?.grantedAt ?? null };
    }),
});
