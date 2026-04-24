import { randomUUID } from 'crypto';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { protectedProcedure, router } from '../trpc.js';
import { db } from '../../db/index.js';
import { applicationLogs, applications, jobs } from '../../db/schema.js';

const reviewStatusValues = ['draft', 'sent', 'viewed', 'interview', 'offer', 'accepted', 'rejected', 'archived'] as const;
const reviewStatusSchema = z.enum(reviewStatusValues);
const recommendationActionValues = ['wait', 'follow_up', 'close_application', 'move_to_interview', 'none'] as const;
const recommendationActionSchema = z.enum(recommendationActionValues);
const listingStatusValues = ['active', 'inactive', 'unknown'] as const;
const listingStatusSchema = z.enum(listingStatusValues);

const queueItemSchema = z.object({
  applicationId: z.string(),
  company: z.string(),
  role: z.string(),
  status: reviewStatusSchema,
  silenceDays: z.number().int().min(0),
  lastFollowedUpAt: z.string().nullable(),
  listingStatus: listingStatusSchema,
  recommendedAction: recommendationActionSchema,
  recommendationReasons: z.array(z.string()).max(5),
  relatedJob: z.object({
    id: z.string(),
    title: z.string(),
    company: z.string(),
    location: z.string().nullable(),
    url: z.string().nullable(),
    isActive: z.boolean(),
  }).nullable(),
});

const successSchema = z.object({ success: z.literal(true) });

export type ReviewQueueItem = z.infer<typeof queueItemSchema>;

function buildRecommendation(input: {
  status: string;
  silenceDays: number;
  lastFollowedUpAt: Date | null;
  relatedJob: { isActive: boolean } | null;
}): Pick<ReviewQueueItem, 'recommendedAction' | 'recommendationReasons' | 'listingStatus'> {
  const reasons: string[] = [];
  const listingStatus: ReviewQueueItem['listingStatus'] = input.relatedJob
    ? (input.relatedJob.isActive ? 'active' : 'inactive')
    : 'unknown';

  if (listingStatus === 'inactive') {
    reasons.push('The original listing no longer appears active.');
  }
  if (input.silenceDays >= 7) {
    reasons.push(`${input.silenceDays} days have passed without a fresh status update.`);
  }
  if (input.lastFollowedUpAt) {
    reasons.push('A previous follow-up already exists in the timeline.');
  }

  if (input.status === 'interview') {
    return {
      recommendedAction: 'wait',
      recommendationReasons: reasons.length > 0 ? reasons : ['This application is already in the interview stage.'],
      listingStatus,
    };
  }

  if (listingStatus === 'inactive' && input.silenceDays >= 21) {
    return {
      recommendedAction: 'close_application',
      recommendationReasons: reasons.length > 0 ? reasons : ['The listing is inactive and the application has gone stale.'],
      listingStatus,
    };
  }

  if (input.lastFollowedUpAt && input.silenceDays < 7) {
    return {
      recommendedAction: 'wait',
      recommendationReasons: reasons.length > 0 ? reasons : ['A recent follow-up is already recorded.'],
      listingStatus,
    };
  }

  if (input.silenceDays >= 10) {
    return {
      recommendedAction: 'follow_up',
      recommendationReasons: reasons.length > 0 ? reasons : ['Enough time has passed to justify a polite follow-up.'],
      listingStatus,
    };
  }

  if (input.silenceDays >= 5) {
    return {
      recommendedAction: 'wait',
      recommendationReasons: reasons.length > 0 ? reasons : ['The application is active, but it is slightly early to follow up.'],
      listingStatus,
    };
  }

  return {
    recommendedAction: 'none',
    recommendationReasons: reasons.length > 0 ? reasons : ['No immediate action is recommended yet.'],
    listingStatus,
  };
}

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
    const recommendation = buildRecommendation({
      status: app.status,
      silenceDays: app.silenceDays,
      lastFollowedUpAt: app.lastFollowedUpAt,
      relatedJob: job,
    });
    return {
      applicationId: app.id,
      company: app.company,
      role: app.jobTitle,
      status: app.status as ReviewQueueItem['status'],
      silenceDays: app.silenceDays,
      lastFollowedUpAt: app.lastFollowedUpAt ? app.lastFollowedUpAt.toISOString() : null,
      listingStatus: recommendation.listingStatus,
      recommendedAction: recommendation.recommendedAction,
      recommendationReasons: recommendation.recommendationReasons,
      relatedJob: job
        ? { id: job.id, title: job.title, company: job.company, location: job.location, url: job.applyUrl, isActive: job.isActive }
        : null,
    };
  });
}

async function assertOwnedApplication(applicationId: string, userId: string) {
  const [app] = await db
    .select({ id: applications.id, userId: applications.userId })
    .from(applications)
    .where(and(eq(applications.id, applicationId), eq(applications.userId, userId)))
    .limit(1);

  if (!app) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Application not found or access denied' });
  }
}

async function appendApplicationLog(applicationId: string, action: string, meta?: Record<string, unknown>) {
  await db.insert(applicationLogs).values({
    id: randomUUID(),
    applicationId,
    action,
    meta: meta ?? null,
    createdAt: new Date(),
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
    .output(successSchema)
    .mutation(async ({ ctx, input }) => {
      await assertOwnedApplication(input.applicationId, ctx.user.id);

      await db
        .update(applications)
        .set({ lastFollowedUpAt: new Date(), silenceDays: 0, notes: input.note, status: 'viewed' })
        .where(and(eq(applications.id, input.applicationId), eq(applications.userId, ctx.user.id)));

      await appendApplicationLog(input.applicationId, 'review_follow_up', { note: input.note });

      return { success: true };
    }),

  markInterview: protectedProcedure
    .input(z.object({ applicationId: z.string().min(1), note: z.string().max(2000).optional() }))
    .output(successSchema)
    .mutation(async ({ ctx, input }) => {
      await assertOwnedApplication(input.applicationId, ctx.user.id);
      await db
        .update(applications)
        .set({ status: 'interview', notes: input.note, silenceDays: 0 })
        .where(and(eq(applications.id, input.applicationId), eq(applications.userId, ctx.user.id)));
      await appendApplicationLog(input.applicationId, 'review_mark_interview', { note: input.note ?? null });
      return { success: true };
    }),

  closeApplication: protectedProcedure
    .input(z.object({ applicationId: z.string().min(1), note: z.string().max(2000).optional() }))
    .output(successSchema)
    .mutation(async ({ ctx, input }) => {
      await assertOwnedApplication(input.applicationId, ctx.user.id);
      await db
        .update(applications)
        .set({ status: 'archived', notes: input.note })
        .where(and(eq(applications.id, input.applicationId), eq(applications.userId, ctx.user.id)));
      await appendApplicationLog(input.applicationId, 'review_close_application', { note: input.note ?? null });
      return { success: true };
    }),

  markNoResponse: protectedProcedure
    .input(z.object({ applicationId: z.string().min(1), note: z.string().max(2000).optional() }))
    .output(successSchema)
    .mutation(async ({ ctx, input }) => {
      await assertOwnedApplication(input.applicationId, ctx.user.id);
      await db
        .update(applications)
        .set({ status: 'archived', notes: input.note })
        .where(and(eq(applications.id, input.applicationId), eq(applications.userId, ctx.user.id)));
      await appendApplicationLog(input.applicationId, 'review_mark_no_response', { note: input.note ?? null });
      return { success: true };
    }),
});
