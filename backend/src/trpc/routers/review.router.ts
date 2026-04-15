import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import { publicProcedure, router } from '../trpc.js';
import { db } from '../../db/index.js';
import { applications, users } from '../../db/schema.js';

export const reviewRouter = router({
  getQueue: publicProcedure
    .input(z.object({ userId: z.string().min(1) }))
    .query(async ({ input }) => {
      const userRecord = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.clerkId, input.userId))
        .limit(1);

      const localUserId = userRecord[0]?.id;
      if (!localUserId) return [];

      const rows = await db
        .select({
          id: applications.id,
          jobTitle: applications.jobTitle,
          company: applications.company,
          status: applications.status,
          fitScore: applications.fitScore,
          createdAt: applications.createdAt,
          notes: applications.notes,
          cvSnapshot: applications.cvSnapshot,
        })
        .from(applications)
        .where(
          eq(applications.userId, localUserId),
        )
        .orderBy(desc(applications.createdAt))
        .limit(20);

      return rows
        .filter(
          (r) =>
            (r.fitScore ?? 0) >= 70 &&
            (r.status === 'draft' || r.status === 'sent'),
        )
        .map((r) => ({
          id: r.id,
          jobTitle: r.jobTitle,
          company: r.company,
          status: r.status,
          fitScore: r.fitScore,
          createdAt: r.createdAt,
          notes: r.notes,
          cvSnapshot: r.cvSnapshot,
        }));
    }),
});
