import { randomUUID } from 'crypto';
import { z } from 'zod';
import { eq, and, desc, like, or, inArray } from 'drizzle-orm';
import { publicProcedure, protectedProcedure, router } from '../trpc.js';
import { db } from '../../db/index.js';
import { jobs, profiles, skills, users, userJobSessions, applications, interviewSessions, savedJobs } from '../../db/schema.js';
import { searchAllProviders } from '../../services/jobProviders.js';
import { scoreJobFit, explainJobFit, getCompanyProfile } from '../../services/aiPersonalizer.js';
import { assessJobScamRisk } from '../../services/jobProtection.js';
import { buildCandidateInsights } from '../../services/adaptiveInterviewer.js';

export const jobsRouter = router({
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
        // Fetch session cookies for Indeed/Gumtree if user is signed in
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

        const listings = await searchAllProviders(input.query, input.location, input.limit, input.sources, sessionCookies);

        let profileForScoring: { summary?: string; skills?: string[] } = {};
        if (input.userId) {
          const userRecord = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, input.userId)).limit(1);
          if (userRecord[0]) {
            const profileRecord = await db.select({ id: profiles.id, summary: profiles.summary })
              .from(profiles).where(eq(profiles.userId, userRecord[0].id)).limit(1);
            if (profileRecord[0]) {
              const skillRecords = await db.select({ name: skills.name }).from(skills).where(eq(skills.profileId, profileRecord[0].id));
              profileForScoring = { summary: profileRecord[0].summary ?? '', skills: skillRecords.map((s) => s.name) };
            }
          }
        }

        const result = await Promise.all(listings.map(async (job) => {
          let fitScore = 60;
          if (Object.keys(profileForScoring).length > 0) {
            const scored = await scoreJobFit(profileForScoring, job);
            fitScore = scored.score;
          }

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

          const jobId = existing[0]?.id ?? job.id;
          if (existing.length === 0) {
            await db.insert(jobs).values({
              id: job.id, externalId: job.externalId, source: job.source,
              title: job.title, company: job.company, location: job.location,
              description: job.description, applyUrl: job.applyUrl,
              salaryMin: job.salaryMin ? String(job.salaryMin) : undefined,
              salaryMax: job.salaryMax ? String(job.salaryMax) : undefined,
              workMode: job.workMode ?? undefined, fitScore,
            });
          }

          return { ...job, fitScore, id: jobId, scamAnalysis };
        }));

        return result.sort((a, b) => b.fitScore - a.fitScore);
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
        // Facultatively incorporate interview performance data
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

      // Save extracted requirements back to DB if the job has none yet
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
