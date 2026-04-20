import { and, desc, eq, inArray } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { protectedProcedure, router } from '../trpc.js';
import { db } from '../../db/index.js';
import { applications, jobs } from '../../db/schema.js';

const reviewStatusValues = ['draft', 'sent', 'viewed', 'interview', 'offer', 'accepted', 'rejected', 'archived'] as const;
const reviewStatusSchema = z.enum(reviewStatusValues);

const queueItemSchema = z.object({
  applicationId: z.string(),
  company: z.string(),
  role: z.string(),
  status: reviewStatusSchema,
  silenceDays: z.number().int().min(0),
  lastFollowedUpAt: z.string().nullable(),
  relatedJob: z.object({
    id: z.string(),
    title: z.string(),
    company: z.string(),
    location: z.string().nullable(),
    url: z.string().nullable(),
    isActive: z.boolean(),
  }).nullable(),
});

export type ReviewQueueItem = z.infer<typeof queueItemSchema>;

export function mergeQueueWithJobs(
  appRows: Array<{
    id: string;
    company: string;
    jobTitle: string;
    status: string;
    silenceDays: number;
    lastFollowedUpAt: Date | null;
    jobId: string | null;
  }>,
  jobRows: Array<{
    id: string;
    title: string;
    company: string;
    location: string | null;
    applyUrl: string | null;
    isActive: boolean;
  }>,
): ReviewQueueItem[] {
  const jobsById = new Map(jobRows.map((j) => [j.id, j]));

  return appRows.map((app) => {
    const job = app.jobId ? jobsById.get(app.jobId) ?? null : null;
    return {
      applicationId: app.id,
      company: app.company,
      role: app.jobTitle,
      status: app.status as ReviewQueueItem['status'],
      silenceDays: app.silenceDays,
      lastFollowedUpAt: app.lastFollowedUpAt ? app.lastFollowedUpAt.toISOString() : null,
      relatedJob: job
        ? { id: job.id, title: job.title, company: job.company, location: job.location, url: job.applyUrl, isActive: job.isActive }
        : null,
    };
  });
}

export const reviewRouter = router({
  getQueue: protectedProcedure
    .input(z.object({ silenceThresholdDays: z.number().int().positive().max(365).default(7) }))
    .output(z.array(queueItemSchema))
    .query(async ({ ctx, input }) => {
      const appRows = await db
        .select({
          id: applications.id,
          company: applications.company,
          jobTitle: applications.jobTitle,
          status: applications.status,
          silenceDays: applications.silenceDays,
          lastFollowedUpAt: applications.lastFollowedUpAt,
          jobId: applications.jobId,
        })
        .from(applications)
        .where(
          and(
            eq(applications.userId, ctx.user.id),
            inArray(applications.status, ['sent', 'viewed', 'interview']),
          ),
        )
        .orderBy(desc(applications.silenceDays), desc(applications.updatedAt))
        .limit(50);

      const filtered = appRows.filter((r) => r.silenceDays >= input.silenceThresholdDays);

      const jobIds = filtered
        .map((r) => r.jobId)
        .filter((id): id is string => typeof id === 'string' && id.length > 0);

      const jobRows = jobIds.length === 0
        ? []
        : await db
            .select({
              id: jobs.id,
              title: jobs.title,
              company: jobs.company,
              location: jobs.location,
              applyUrl: jobs.applyUrl,
              isActive: jobs.isActive,
            })
            .from(jobs)
            .where(inArray(jobs.id, jobIds));

      return mergeQueueWithJobs(filtered, jobRows);
    }),

  followUp: protectedProcedure
    .input(z.object({
      applicationId: z.string().min(1),
      note: z.string().min(1).max(2000),
    }))
    .output(z.object({ success: z.literal(true) }))
    .mutation(async ({ ctx, input }) => {
      const [app] = await db
        .select({ id: applications.id, userId: applications.userId })
        .from(applications)
        .where(and(eq(applications.id, input.applicationId), eq(applications.userId, ctx.user.id)))
        .limit(1);

      if (!app) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Application not found or access denied' });
      }

      await db
        .update(applications)
        .set({ lastFollowedUpAt: new Date(), silenceDays: 0, notes: input.note })
        .where(and(eq(applications.id, input.applicationId), eq(applications.userId, ctx.user.id)));

      return { success: true };
    }),
});
