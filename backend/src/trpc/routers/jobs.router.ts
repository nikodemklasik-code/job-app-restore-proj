import { randomUUID } from 'crypto';
import { z } from 'zod';
import { eq, and, desc, like, or, inArray } from 'drizzle-orm';
import { publicProcedure, protectedProcedure, router } from '../trpc.js';
import { db } from '../../db/index.js';
import { jobs, profiles, skills, users, userJobSessions, applications, interviewSessions, savedJobs, careerGoals } from '../../db/schema.js';
import { JobDiscoveryService } from '../../services/jobSources/jobDiscoveryService.js';
import { discoverJobsForProfile } from '../../services/jobSources/profileDrivenDiscovery.js';
import { explainJobFit, getCompanyProfile } from '../../services/aiPersonalizer.js';
import { assessJobScamRisk } from '../../services/jobProtection.js';
import { buildCandidateInsights } from '../../services/adaptiveInterviewer.js';

const PUBLIC_JOB_PROVIDERS = ['reed', 'adzuna', 'jooble'];
const DEFAULT_JOBS_MIN_FIT_SCORE = 0;

function normaliseFitThreshold(value: number): number {
  return Number.isFinite(value) ? Math.min(100, Math.max(0, Math.round(value))) : DEFAULT_JOBS_MIN_FIT_SCORE;
}

async function ensureCareerGoalsRow(userId: string): Promise<void> {
  const existing = await db.select({ id: careerGoals.id }).from(careerGoals).where(eq(careerGoals.userId, userId)).limit(1);
  if (existing[0]) return;
  await db.insert(careerGoals).values({
    id: randomUUID(),
    userId,
    autoApplyMinScore: DEFAULT_JOBS_MIN_FIT_SCORE,
  });
}

async function getJobsMinFitScore(userId: string): Promise<number> {
  const [row] = await db
    .select({ autoApplyMinScore: careerGoals.autoApplyMinScore })
    .from(careerGoals)
    .where(eq(careerGoals.userId, userId))
    .limit(1);

  return normaliseFitThreshold(row?.autoApplyMinScore ?? DEFAULT_JOBS_MIN_FIT_SCORE);
}

function mapRequestedProviders(sources: string[]): string[] {
  return sources.map((source) => {
    if (source === 'indeed') return 'indeed-browser';
    return source;
  });
}

function isBroadUkLocation(location: string): boolean {
  const value = location.trim().toLowerCase();
  return [
    '',
    'england',
    'all england',
    'whole england',
    'cała anglia',
    'cala anglia',
    'uk',
    'united kingdom',
    'great britain',
    'gb',
    'anywhere',
    'remote',
  ].includes(value);
}

function locationFallbacks(location: string): string[] {
  const original = location.trim();
  const value = original.toLowerCase();
  const fallbacks = isBroadUkLocation(original)
    ? [original, 'United Kingdom', 'England', '']
    : value === 'manchester'
      ? [original, 'Manchester', 'Greater Manchester', '']
      : [original];
  return Array.from(new Set(fallbacks));
}

function queryFallbacks(query: string): string[] {
  const original = query.trim();
  const value = original.toLowerCase();
  const fallbackTerms: string[] = [original];

  if (/\bwaiter\b|\bwaitress\b|\bserver\b/.test(value)) {
    fallbackTerms.push(
      'waiter waitress',
      'restaurant waiter',
      'front of house',
      'bar staff',
      'hospitality assistant',
      'restaurant staff',
      'cafe assistant',
    );
  }

  return Array.from(new Set(fallbackTerms.filter(Boolean)));
}

async function runManualDiscoveryWithFallbacks(input: {
  query: string;
  location: string;
  limit: number;
  userId?: string;
  providers: string[];
}, providerContext: { sessionCookies?: { indeed?: string; gumtree?: string }; userId?: string }): Promise<Awaited<ReturnType<typeof JobDiscoveryService.discover>>['jobs']> {
  const providers = Array.from(new Set([...input.providers, ...PUBLIC_JOB_PROVIDERS]));
  const attempts: Array<{ query: string; location: string }> = [];

  for (const query of queryFallbacks(input.query)) {
    for (const location of locationFallbacks(input.location)) {
      attempts.push({ query, location });
    }
  }

  for (const attempt of attempts) {
    const result = await JobDiscoveryService.discover(
      { ...input, query: attempt.query, location: attempt.location, providers },
      providerContext,
    );
    if (result.jobs.length > 0) return result.jobs;
  }

  return [];
}

export const jobsRouter = router({
  getFitThreshold: protectedProcedure
    .output(z.object({ minFitScore: z.number().int().min(0).max(100), source: z.literal('server') }))
    .query(async ({ ctx }) => {
      return { minFitScore: await getJobsMinFitScore(ctx.user.id), source: 'server' as const };
    }),

  updateFitThreshold: protectedProcedure
    .input(z.object({ minFitScore: z.number().int().min(0).max(100) }))
    .output(z.object({ minFitScore: z.number().int().min(0).max(100), source: z.literal('server') }))
    .mutation(async ({ ctx, input }) => {
      const minFitScore = normaliseFitThreshold(input.minFitScore);
      await ensureCareerGoalsRow(ctx.user.id);
      await db
        .update(careerGoals)
        .set({ autoApplyMinScore: minFitScore, updatedAt: new Date() })
        .where(eq(careerGoals.userId, ctx.user.id));
      return { minFitScore, source: 'server' as const };
    }),

  search: publicProcedure
    .input(z.object({
      query: z.string().default(''),
      location: z.string().default('United Kingdom'),
      sources: z.array(z.string()).default(['reed', 'adzuna', 'jooble']),
      limit: z.number().min(1).max(50).default(20),
      userId: z.string().optional(),
    }))
    .query(async ({ input }) => {
      try {
        let sessionCookies: { indeed?: string; gumtree?: string } | undefined;
        if (input.userId) {
          const userRecord = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, input.userId)).limit(1);
          if (userRecord[0]) {
            const sessions = await db.select({ provider: userJobSessions.provider, cookies: userJobSessions.cookies })
              .from(userJobSessions)
              .where(and(eq(userJobSessions.userId, userRecord[0].id), eq(userJobSessions.isActive, true)));
            if (sessions.length > 0) {
              sessionCookies = {};
              for (const s of sessions) {
                if (s.provider === 'indeed') sessionCookies.indeed = s.cookies;
                if (s.provider === 'gumtree') sessionCookies.gumtree = s.cookies;
              }
            }
          }
        }

        const trimmedQuery = input.query.trim();
        const providerContext = { sessionCookies, userId: input.userId };
        const discoveryInput = {
          query: trimmedQuery,
          location: input.location,
          limit: input.limit,
          userId: input.userId,
          providers: mapRequestedProviders(input.sources),
        };

        let discoveryJobs = input.userId && trimmedQuery.length === 0
          ? await discoverJobsForProfile(discoveryInput, providerContext)
          : (await JobDiscoveryService.discover(discoveryInput, providerContext)).jobs;

        if (discoveryJobs.length === 0 && trimmedQuery.length > 0) {
          discoveryJobs = await runManualDiscoveryWithFallbacks(discoveryInput, providerContext);
        }

        const result = await Promise.all(discoveryJobs.map(async (job) => {
          const fitScore = job.fitScore ?? 60;
          const scamAnalysis = assessJobScamRisk({
            title: job.title,
            company: job.company,
            description: job.description,
            applyUrl: job.applyUrl,
            salaryMin: job.salaryMin,
            salaryMax: job.salaryMax,
          });

          const existing = await db.select({ id: jobs.id }).from(jobs)
            .where(and(eq(jobs.externalId, job.externalId), eq(jobs.source, job.source))).limit(1);

          const jobId = existing[0]?.id ?? randomUUID();
          if (existing.length === 0) {
            await db.insert(jobs).values({
              id: jobId,
              externalId: job.externalId,
              source: job.source,
              title: job.title,
              company: job.company,
              location: job.location,
              description: job.description,
              applyUrl: job.applyUrl,
              salaryMin: job.salaryMin ? String(job.salaryMin) : undefined,
              salaryMax: job.salaryMax ? String(job.salaryMax) : undefined,
              workMode: job.workMode ?? undefined,
              fitScore,
              requirements: job.requirements,
            });
          }

          return { ...job, fitScore, id: jobId, scamAnalysis };
        }));

        return result.sort((a, b) => b.fitScore - a.fitScore).slice(0, input.limit);
      } catch (err) {
        console.error('[jobs.search]', err);
        const cached = await db.select().from(jobs).orderBy(desc(jobs.createdAt)).limit(input.limit);
        return cached.map((j) => ({
          id: j.id, externalId: j.externalId ?? '', source: j.source,
          title: j.title, company: j.company, location: j.location ?? '',
          description: j.description ?? '', applyUrl: j.applyUrl ?? '',
          salaryMin: j.salaryMin ? Number(j.salaryMin) : null,
          salaryMax: j.salaryMax ? Number(j.salaryMax) : null,
          workMode: j.workMode, requirements: (j.requirements as string[]) ?? [],
          postedAt: j.createdAt.toISOString(), fitScore: j.fitScore ?? 60,
          scamAnalysis: assessJobScamRisk({
            title: j.title,
            company: j.company,
            description: j.description ?? '',
            applyUrl: j.applyUrl ?? '',
            salaryMin: j.salaryMin ? Number(j.salaryMin) : null,
            salaryMax: j.salaryMax ? Number(j.salaryMax) : null,
          }),
        }));
      }
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const rows = await db.select().from(jobs).where(eq(jobs.id, input.id)).limit(1);
      return rows[0] ?? null;
    }),

  getFeed: publicProcedure
    .input(z.object({ limit: z.number().default(20), offset: z.number().default(0) }))
    .query(async ({ input }) => {
      return db.select().from(jobs).where(eq(jobs.isActive, true))
        .orderBy(desc(jobs.createdAt)).limit(input.limit).offset(input.offset);
    }),

  quickSearch: publicProcedure
    .input(z.object({ q: z.string().min(2) }))
    .query(async ({ input }) => {
      const q = `%${input.q}%`;
      return db.select().from(jobs).where(or(like(jobs.title, q), like(jobs.company, q))).limit(10);
    }),

  saveManual: publicProcedure
    .input(z.object({
      title: z.string().min(1),
      company: z.string().min(1),
      location: z.string().optional(),
      description: z.string().optional(),
      applyUrl: z.string().url().optional(),
      salaryMin: z.number().optional(),
      salaryMax: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const id = randomUUID();
      await db.insert(jobs).values({
        id, externalId: id, source: 'manual',
        title: input.title, company: input.company, location: input.location,
        description: input.description, applyUrl: input.applyUrl,
        salaryMin: input.salaryMin ? String(input.salaryMin) : undefined,
        salaryMax: input.salaryMax ? String(input.salaryMax) : undefined,
      });
      return { id };
    }),

  explainFit: publicProcedure
    .input(z.object({ userId: z.string(), jobId: z.string() }))
    .query(async ({ input }) => {
      const jobRow = await db.select().from(jobs).where(eq(jobs.id, input.jobId)).limit(1);
      if (!jobRow[0]) throw new Error('Job not found');
      const job = jobRow[0];

      const userRecord = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, input.userId)).limit(1);

      let profileData: { skills: string[]; summary?: string } = { skills: [] };
      let interviewInsights: Parameters<typeof explainJobFit>[2] | undefined;

      if (userRecord[0]) {
        const [profileRecord, sessionCount] = await Promise.all([
          db.select({ id: profiles.id, summary: profiles.summary })
            .from(profiles).where(eq(profiles.userId, userRecord[0].id)).limit(1),
          db.select({ id: interviewSessions.id })
            .from(interviewSessions).where(eq(interviewSessions.userId, userRecord[0].id)).limit(1),
        ]);
        if (profileRecord[0]) {
          const skillRecords = await db.select({ name: skills.name }).from(skills).where(eq(skills.profileId, profileRecord[0].id));
          profileData = {
            summary: profileRecord[0].summary ?? '',
            skills: skillRecords.map((s) => s.name),
          };
        }
        if (sessionCount.length > 0) {
          const insights = await buildCandidateInsights(userRecord[0].id);
          if (insights.sessionCount > 0) {
            interviewInsights = {
              averageScore: insights.averageScore,
              sessionCount: insights.sessionCount,
              strongAreas: insights.strongAreas,
              weakAreas: insights.weakAreas,
            };
          }
        }
      }

      const jobForAnalysis = {
        title: job.title,
        company: job.company,
        description: job.description ?? '',
        requirements: (job.requirements as string[]) ?? [],
      };

      const [fit, scam] = await Promise.all([
        explainJobFit(profileData, jobForAnalysis, interviewInsights),
        Promise.resolve(assessJobScamRisk({
          title: job.title,
          company: job.company,
          description: job.description ?? '',
          applyUrl: job.applyUrl ?? '',
          salaryMin: job.salaryMin ? Number(job.salaryMin) : null,
          salaryMax: job.salaryMax ? Number(job.salaryMax) : null,
        })),
      ]);

      if (fit.extractedRequirements && fit.extractedRequirements.length > 0 &&
          ((job.requirements as string[]) ?? []).length === 0) {
        await db.update(jobs)
          .set({ requirements: fit.extractedRequirements, updatedAt: new Date() })
          .where(eq(jobs.id, job.id));
      }

      return { fit, scam: { ...scam, isScam: scam.level === 'high' || scam.level === 'medium' } };
    }),

  getUserJobStatuses: publicProcedure
    .input(z.object({ userId: z.string(), jobIds: z.array(z.string()) }))
    .query(async ({ input }) => {
      if (input.jobIds.length === 0) return {};
      const userRecord = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, input.userId)).limit(1);
      if (!userRecord[0]) return {};

      const rows = await db
        .select({ jobId: applications.jobId, status: applications.status })
        .from(applications)
        .where(and(
          eq(applications.userId, userRecord[0].id),
          inArray(applications.jobId, input.jobIds),
        ));

      const map: Record<string, string> = {};
      for (const r of rows) {
        if (r.jobId) map[r.jobId] = r.status;
      }
      return map;
    }),

  getCompanyProfile: publicProcedure
    .input(z.object({ companyName: z.string().min(1), jobTitle: z.string().optional() }))
    .query(async ({ input }) => {
      return getCompanyProfile(input.companyName, input.jobTitle);
    }),

  saveJob: protectedProcedure
    .input(z.object({ jobId: z.string().min(1) }))
    .output(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await db.select({ id: savedJobs.id })
        .from(savedJobs)
        .where(and(eq(savedJobs.userId, ctx.user.id), eq(savedJobs.jobId, input.jobId)))
        .limit(1);
      if (existing[0]) return { id: existing[0].id };
      const id = randomUUID();
      await db.insert(savedJobs).values({ id, userId: ctx.user.id, jobId: input.jobId });
      return { id };
    }),

  unsaveJob: protectedProcedure
    .input(z.object({ jobId: z.string().min(1) }))
    .output(z.object({ success: z.literal(true) }))
    .mutation(async ({ ctx, input }) => {
      await db.delete(savedJobs)
        .where(and(eq(savedJobs.userId, ctx.user.id), eq(savedJobs.jobId, input.jobId)));
      return { success: true };
    }),

  getSavedJobs: protectedProcedure
    .output(z.array(z.object({
      savedId: z.string(),
      savedAt: z.string(),
      job: z.object({
        id: z.string(),
        title: z.string(),
        company: z.string(),
        location: z.string().nullable(),
        applyUrl: z.string().nullable(),
        isActive: z.boolean(),
        fitScore: z.number().nullable(),
      }),
    })))
    .query(async ({ ctx }) => {
      const rows = await db
        .select({
          savedId: savedJobs.id,
          savedAt: savedJobs.savedAt,
          jobId: jobs.id,
          title: jobs.title,
          company: jobs.company,
          location: jobs.location,
          applyUrl: jobs.applyUrl,
          isActive: jobs.isActive,
          fitScore: jobs.fitScore,
        })
        .from(savedJobs)
        .innerJoin(jobs, eq(jobs.id, savedJobs.jobId))
        .where(eq(savedJobs.userId, ctx.user.id))
        .orderBy(desc(savedJobs.savedAt));

      return rows.map((r) => ({
        savedId: r.savedId,
        savedAt: r.savedAt.toISOString(),
        job: {
          id: r.jobId,
          title: r.title,
          company: r.company,
          location: r.location ?? null,
          applyUrl: r.applyUrl ?? null,
          isActive: r.isActive,
          fitScore: r.fitScore ?? null,
        },
      }));
    }),
});
