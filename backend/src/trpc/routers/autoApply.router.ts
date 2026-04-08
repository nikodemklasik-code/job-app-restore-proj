import { randomUUID } from 'crypto';
import { z } from 'zod';
import { eq, desc, sql } from 'drizzle-orm';
import { publicProcedure, router } from '../trpc.js';
import { db } from '../../db/index.js';
import { autoApplyQueue, users } from '../../db/schema.js';

async function getLocalUserId(clerkId: string): Promise<string | null> {
  const row = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, clerkId)).limit(1);
  return row[0]?.id ?? null;
}


export const autoApplyRouter = router({
  getQueue: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const localId = await getLocalUserId(input.userId);
      if (!localId) return [];

      return db.select().from(autoApplyQueue)
        .where(eq(autoApplyQueue.userId, localId))
        .orderBy(desc(autoApplyQueue.createdAt))
        .limit(50);
    }),

  addToQueue: publicProcedure
    .input(z.object({
      userId: z.string(),
      jobId: z.string().optional(),
      jobTitle: z.string().min(1),
      company: z.string().min(1),
      applyUrl: z.string().url(),
      source: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const localId = await getLocalUserId(input.userId);
      if (!localId) throw new Error('User not found');

      const id = randomUUID();
      await db.insert(autoApplyQueue).values({
        id,
        userId: localId,
        jobId: input.jobId ?? null,
        jobTitle: input.jobTitle,
        company: input.company,
        applyUrl: input.applyUrl,
        source: input.source ?? 'indeed',
        status: 'pending',
      });

      return { id };
    }),

  updateStatus: publicProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(['pending', 'processing', 'applied', 'failed', 'skipped']),
      errorMessage: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await db.update(autoApplyQueue).set({
        status: input.status,
        errorMessage: input.errorMessage ?? null,
        ...(input.status === 'applied' ? { appliedAt: new Date() } : {}),
        updatedAt: new Date(),
      }).where(eq(autoApplyQueue.id, input.id));

      return { success: true };
    }),

  clearCompleted: publicProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ input }) => {
      const localId = await getLocalUserId(input.userId);
      if (!localId) return { deleted: 0 };

      const result = await db.delete(autoApplyQueue).where(
        sql`${autoApplyQueue.userId} = ${localId} AND ${autoApplyQueue.status} IN ('applied', 'failed', 'skipped')`,
      );

      return { deleted: (result as unknown as { affectedRows: number }).affectedRows ?? 0 };
    }),

  getStats: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const localId = await getLocalUserId(input.userId);
      if (!localId) return { pending: 0, processing: 0, applied: 0, failed: 0, skipped: 0, total: 0 };

      const rows = await db.select({
        status: autoApplyQueue.status,
        count: sql<number>`COUNT(*)`,
      }).from(autoApplyQueue)
        .where(eq(autoApplyQueue.userId, localId))
        .groupBy(autoApplyQueue.status);

      const stats: Record<string, number> = { pending: 0, processing: 0, applied: 0, failed: 0, skipped: 0 };
      let total = 0;
      for (const row of rows) {
        const key = row.status ?? 'pending';
        stats[key] = Number(row.count);
        total += Number(row.count);
      }

      return { ...stats, total };
    }),
});
