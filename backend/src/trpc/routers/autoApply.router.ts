import { randomUUID } from 'crypto';
import { z } from 'zod';
import { eq, desc, sql, and, gte } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { publicProcedure, router } from '../trpc.js';
import { db } from '../../db/index.js';
import { autoApplyQueue, users } from '../../db/schema.js';
import { getUserPlan, PLAN_LIMITS } from '../../services/billingGuard.js';

async function getLocalUserId(clerkId: string): Promise<string | null> {
  const row = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, clerkId)).limit(1);
  return row[0]?.id ?? null;
}

/** Returns the Monday of the current ISO week at 00:00:00 UTC */
function startOfCurrentWeek(): Date {
  const now = new Date();
  const day = now.getUTCDay(); // 0 = Sun, 1 = Mon …
  const diffToMonday = (day === 0 ? -6 : 1 - day);
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + diffToMonday));
  return monday;
}

/** Count jobs queued (pending/processing/applied) since Monday of this week */
async function countThisWeekUsage(localUserId: string): Promise<number> {
  const weekStart = startOfCurrentWeek();
  const rows = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(autoApplyQueue)
    .where(
      and(
        eq(autoApplyQueue.userId, localUserId),
        gte(autoApplyQueue.createdAt, weekStart),
        sql`${autoApplyQueue.status} IN ('pending', 'processing', 'applied')`,
      ),
    );
  return Number(rows[0]?.count ?? 0);
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
      if (!localId) throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });

      // ── Weekly cap enforcement ──────────────────────────────────────────────
      const plan = await getUserPlan(input.userId);
      const weeklyLimit = PLAN_LIMITS[plan].weeklyAutoApply;
      const weeklyUsed = await countThisWeekUsage(localId);

      if (weeklyUsed >= weeklyLimit) {
        const planLabels: Record<string, string> = { free: 'Free (3/week)', pro: 'Pro (15/week)', autopilot: 'Autopilot (50/week)' };
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Weekly auto-apply limit reached for your ${planLabels[plan] ?? plan} plan. Resets every Monday. Upgrade for a higher limit.`,
        });
      }
      // ───────────────────────────────────────────────────────────────────────

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
      if (!localId) {
        return { pending: 0, processing: 0, applied: 0, failed: 0, skipped: 0, total: 0, weeklyUsed: 0, weeklyLimit: 3, plan: 'free' as const };
      }

      const [rows, plan, weeklyUsed] = await Promise.all([
        db.select({
          status: autoApplyQueue.status,
          count: sql<number>`COUNT(*)`,
        }).from(autoApplyQueue)
          .where(eq(autoApplyQueue.userId, localId))
          .groupBy(autoApplyQueue.status),
        getUserPlan(input.userId),
        countThisWeekUsage(localId),
      ]);

      const stats: Record<string, number> = { pending: 0, processing: 0, applied: 0, failed: 0, skipped: 0 };
      let total = 0;
      for (const row of rows) {
        const key = row.status ?? 'pending';
        stats[key] = Number(row.count);
        total += Number(row.count);
      }

      return {
        ...stats,
        total,
        weeklyUsed,
        weeklyLimit: PLAN_LIMITS[plan].weeklyAutoApply,
        plan,
      };
    }),
});

