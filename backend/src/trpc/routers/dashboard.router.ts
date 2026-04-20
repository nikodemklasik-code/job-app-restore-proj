import { TRPCError } from '@trpc/server';
import { and, count, desc, eq, inArray, lt, sql } from 'drizzle-orm';
import { z } from 'zod';
import { protectedProcedure, router } from '../trpc.js';
import { db } from '../../db/index.js';
import {
  applications,
  careerGoals,
  documentUploads,
  experiences,
  interviewSessions,
  profiles,
  skills,
  users,
} from '../../db/schema.js';
import { getAccountState as getAccountStateService } from '../../services/creditsBilling.js';
import {
  dashboardApplicationStatuses,
  mapApplicationStatusToDashboard,
  type DashboardApplicationStatus,
} from './dashboard-snapshot.mapper.js';

const STALE_MS = 7 * 24 * 60 * 60 * 1000;

const snapshotOutputSchema = z.object({
  userId: z.string(),
  profile: z.object({
    fullName: z.string().nullable(),
    targetRole: z.string().nullable(),
    completeness: z.number().int().min(0).max(100),
    missingCriticalFields: z.array(z.string()),
  }),
  applications: z.object({
    total: z.number().int().min(0),
    byStatus: z.object({
      draft: z.number().int().min(0),
      saved: z.number().int().min(0),
      applied: z.number().int().min(0),
      interview: z.number().int().min(0),
      offer: z.number().int().min(0),
      rejected: z.number().int().min(0),
      archived: z.number().int().min(0),
    }),
    recent: z.array(
      z.object({
        id: z.string(),
        companyName: z.string(),
        roleTitle: z.string(),
        status: z.enum(dashboardApplicationStatuses),
        updatedAt: z.string(),
      }),
    ),
    needsReviewCount: z.number().int().min(0),
  }),
  billing: z.object({
    currency: z.literal('GBP'),
    postedDebitCents: z.number().int(),
    postedCreditCents: z.number().int(),
    postedNetCents: z.number().int(),
    pendingDebitCents: z.number().int(),
    pendingCreditCents: z.number().int(),
    pendingNetCents: z.number().int(),
    availableBalanceCents: z.number().int(),
  }),
  practice: z.object({
    totalSessions: z.number().int().min(0),
    completedSessions: z.number().int().min(0),
    averageScore: z.number().nullable(),
    lastCompletedAt: z.string().nullable(),
  }),
  nextAction: z.object({
    label: z.string(),
    href: z.string(),
    reason: z.string(),
  }),
  generatedAt: z.string(),
});

function emptyByStatus(): Record<DashboardApplicationStatus, number> {
  return {
    draft: 0,
    saved: 0,
    applied: 0,
    interview: 0,
    offer: 0,
    rejected: 0,
    archived: 0,
  };
}

function clampCompleteness(value: number): number {
  if (value < 0) return 0;
  if (value > 100) return 100;
  return Math.round(value);
}

function computeProfileCompleteness(input: {
  fullName: string | null | undefined;
  summary: string | null | undefined;
  skillCount: number;
  experienceCount: number;
  targetJobTitle: string | null | undefined;
  targetSalaryMin: number | null | undefined;
  targetSalaryMax: number | null | undefined;
  targetSalary: number | null | undefined;
  targetSeniority: string | null | undefined;
  workValues: string | null | undefined;
  documentCount: number;
}): { completeness: number; missingCriticalFields: string[] } {
  const checks: Array<{ key: string; passed: boolean; weight: number }> = [
    { key: 'fullName', passed: Boolean(input.fullName?.trim()), weight: 12 },
    { key: 'summary', passed: Boolean(input.summary?.trim()), weight: 12 },
    { key: 'skills', passed: input.skillCount > 0, weight: 12 },
    { key: 'experience', passed: input.experienceCount > 0, weight: 12 },
    { key: 'targetRole', passed: Boolean(input.targetJobTitle?.trim()), weight: 12 },
    {
      key: 'salary',
      passed:
        !!input.targetSalary ||
        (typeof input.targetSalaryMin === 'number' &&
          typeof input.targetSalaryMax === 'number' &&
          input.targetSalaryMin > 0 &&
          input.targetSalaryMax >= input.targetSalaryMin),
      weight: 12 },
    { key: 'seniority', passed: Boolean(input.targetSeniority?.trim()), weight: 10 },
    { key: 'workValues', passed: Boolean(input.workValues?.trim()), weight: 10 },
    { key: 'documents', passed: input.documentCount > 0, weight: 8 },
  ];

  const completeness = clampCompleteness(
    checks.reduce((sum, check) => sum + (check.passed ? check.weight : 0), 0),
  );

  const missingCriticalFields = checks.filter((check) => !check.passed).map((check) => check.key);

  return { completeness, missingCriticalFields };
}

function computeNextAction(input: {
  completeness: number;
  needsReviewCount: number;
  appliedLikeCount: number;
}): { label: string; href: string; reason: string } {
  if (input.completeness < 80) {
    return {
      label: 'Complete Profile',
      href: '/profile',
      reason: 'Complete your profile to improve downstream recommendations and workflows.',
    };
  }

  if (input.needsReviewCount > 0) {
    return {
      label: 'Review Applications',
      href: '/review',
      reason:
        input.needsReviewCount === 1
          ? '1 application needs follow-up after inactivity.'
          : `${input.needsReviewCount} applications need follow-up after inactivity.`,
    };
  }

  if (input.appliedLikeCount === 0) {
    return {
      label: 'Browse Jobs',
      href: '/jobs',
      reason: 'Your job pipeline is still empty. Start tracking applications from Jobs.',
    };
  }

  return {
    label: 'Review Applications',
    href: '/review',
    reason: 'Keep your pipeline current and follow up on recent activity.',
  };
}

export const dashboardRouter = router({
  getSnapshot: protectedProcedure.output(snapshotOutputSchema).query(async ({ ctx }) => {
    const userId = ctx.user.id;

    const [userExists] = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1);
    if (!userExists) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Authenticated user was not found.' });
    }

    const [userRow] = await db
      .select({
        id: users.id,
        fullName: profiles.fullName,
        summary: profiles.summary,
        targetJobTitle: careerGoals.targetJobTitle,
        targetSalaryMin: careerGoals.targetSalaryMin,
        targetSalaryMax: careerGoals.targetSalaryMax,
        targetSalary: careerGoals.targetSalary,
        targetSeniority: careerGoals.targetSeniority,
        workValues: careerGoals.workValues,
      })
      .from(users)
      .leftJoin(profiles, eq(profiles.userId, users.id))
      .leftJoin(careerGoals, eq(careerGoals.userId, users.id))
      .where(eq(users.id, userId))
      .limit(1);

    if (!userRow) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Authenticated user was not found.' });
    }

    const [skillCountRow, experienceCountRow, documentCountRow] = await Promise.all([
      db
        .select({ c: count() })
        .from(skills)
        .innerJoin(profiles, eq(skills.profileId, profiles.id))
        .where(eq(profiles.userId, userId)),
      db
        .select({ c: count() })
        .from(experiences)
        .innerJoin(profiles, eq(experiences.profileId, profiles.id))
        .where(eq(profiles.userId, userId)),
      db.select({ c: count() }).from(documentUploads).where(eq(documentUploads.userId, userId)),
    ]);

    const skillCount = Number(skillCountRow[0]?.c ?? 0);
    const experienceCount = Number(experienceCountRow[0]?.c ?? 0);
    const documentCount = Number(documentCountRow[0]?.c ?? 0);

    const profileCompleteness = computeProfileCompleteness({
      fullName: userRow.fullName,
      summary: userRow.summary,
      skillCount,
      experienceCount,
      targetJobTitle: userRow.targetJobTitle,
      targetSalaryMin: userRow.targetSalaryMin,
      targetSalaryMax: userRow.targetSalaryMax,
      targetSalary: userRow.targetSalary,
      targetSeniority: userRow.targetSeniority,
      workValues: userRow.workValues,
      documentCount,
    });

    const statusCountsRaw = await db
      .select({
        status: applications.status,
        cnt: count(),
      })
      .from(applications)
      .where(eq(applications.userId, userId))
      .groupBy(applications.status);

    const byStatus = emptyByStatus();
    for (const row of statusCountsRaw) {
      const normalized = mapApplicationStatusToDashboard(row.status);
      byStatus[normalized] += Number(row.cnt);
    }

    const recentApplications = await db
      .select({
        id: applications.id,
        company: applications.company,
        jobTitle: applications.jobTitle,
        status: applications.status,
        updatedAt: applications.updatedAt,
      })
      .from(applications)
      .where(eq(applications.userId, userId))
      .orderBy(desc(applications.updatedAt))
      .limit(5);

    const staleThreshold = new Date(Date.now() - STALE_MS);

    const [needsReviewRow] = await db
      .select({ c: count() })
      .from(applications)
      .where(
        and(
          eq(applications.userId, userId),
          inArray(applications.status, ['sent', 'follow_up_sent', 'interview']),
          lt(applications.updatedAt, staleThreshold),
        ),
      );

    const [practiceSummary] = await db
      .select({
        totalSessions: count(),
        completedSessions: sql<number>`sum(case when ${interviewSessions.status} = 'completed' then 1 else 0 end)`,
        averageScore: sql<number | null>`avg(${interviewSessions.score})`,
        lastCompletedAt: sql<Date | null>`max(case when ${interviewSessions.status} = 'completed' then ${interviewSessions.createdAt} end)`,
      })
      .from(interviewSessions)
      .where(eq(interviewSessions.userId, userId));

    const accountState = await getAccountStateService(ctx.user.clerkId).catch(() => null);
    const spendable = Math.round(accountState?.spendableTotal ?? 0);
    const postedDebitCents = 0;
    const postedCreditCents = 0;
    const pendingDebitCents = 0;
    const pendingCreditCents = 0;
    const postedNetCents = postedCreditCents - postedDebitCents;
    const pendingNetCents = pendingCreditCents - pendingDebitCents;
    const availableBalanceCents = postedNetCents + pendingNetCents + spendable;

    const totalSessions = Number(practiceSummary?.totalSessions ?? 0);
    const completedSessions = Number(practiceSummary?.completedSessions ?? 0);
    const avgRaw = practiceSummary?.averageScore;
    const averageScore =
      avgRaw === null || avgRaw === undefined ? null : Number(Number(avgRaw).toFixed(1));
    const lastCompletedAt = practiceSummary?.lastCompletedAt
      ? new Date(practiceSummary.lastCompletedAt).toISOString()
      : null;

    const snapshot = {
      userId,
      profile: {
        fullName: userRow.fullName?.trim() ? userRow.fullName : null,
        targetRole: userRow.targetJobTitle?.trim() ? userRow.targetJobTitle : null,
        completeness: profileCompleteness.completeness,
        missingCriticalFields: profileCompleteness.missingCriticalFields,
      },
      applications: {
        total: Object.values(byStatus).reduce((sum, value) => sum + value, 0),
        byStatus,
        recent: recentApplications.map((application) => ({
          id: application.id,
          companyName: application.company,
          roleTitle: application.jobTitle,
          status: mapApplicationStatusToDashboard(application.status),
          updatedAt: application.updatedAt.toISOString(),
        })),
        needsReviewCount: Number(needsReviewRow?.c ?? 0),
      },
      billing: {
        currency: 'GBP' as const,
        postedDebitCents,
        postedCreditCents,
        postedNetCents,
        pendingDebitCents,
        pendingCreditCents,
        pendingNetCents,
        availableBalanceCents,
      },
      practice: {
        totalSessions,
        completedSessions,
        averageScore,
        lastCompletedAt,
      },
      nextAction: computeNextAction({
        completeness: profileCompleteness.completeness,
        needsReviewCount: Number(needsReviewRow?.c ?? 0),
        appliedLikeCount: byStatus.applied + byStatus.interview + byStatus.offer,
      }),
      generatedAt: new Date().toISOString(),
    };

    return snapshotOutputSchema.parse(snapshot);
  }),
});
