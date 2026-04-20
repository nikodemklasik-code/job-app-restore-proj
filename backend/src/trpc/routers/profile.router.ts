import { randomUUID } from 'crypto';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { publicProcedure, protectedProcedure, router } from '../trpc.js';
import { db } from '../../db/index.js';
import {
  profiles,
  skills,
  users,
  experiences,
  educations,
  trainings,
  careerGoals,
  socialConsents,
  userPreferenceFlags,
} from '../../db/schema.js';
import type {
  ProfileSnapshot,
  ProfileStrategyJson,
  CareerGoalsSnapshot,
  SocialConsentsSnapshot,
  UserPreferenceFlagsSnapshot,
} from '../../../../shared/profile.js';
import { getProfileMatchContextByLocalId } from '../../services/profileSourceOfTruth.js';
import { isBlockedJob } from '../../services/profileSourceOfTruth.policy.js';

const DEFAULT_CAREER_GOALS: CareerGoalsSnapshot = {
  currentJobTitle: null,
  currentSalary: null,
  targetJobTitle: null,
  targetSalary: null,
  targetSalaryMin: null,
  targetSalaryMax: null,
  targetSeniority: null,
  workValues: [],
  autoApplyMinScore: 75,
  strategy: {},
};

const DEFAULT_SOCIAL: SocialConsentsSnapshot = {
  linkedinConsent: false,
  facebookConsent: false,
  instagramConsent: false,
};

const DEFAULT_PREFS: UserPreferenceFlagsSnapshot = {
  caseStudyOptIn: false,
  communityVisibility: false,
  referralParticipation: true,
  sharedSessionsDiscoverable: false,
  aiPersonalizationEnabled: true,
};

const strategyPatchSchema = z
  .object({
    growthPlan: z.array(z.string()).optional(),
    roadmap: z
      .array(z.object({ title: z.string().min(1), done: z.boolean().optional() }))
      .optional(),
    skillCourseLinks: z
      .array(
        z.object({
          skillName: z.string().min(1),
          courseId: z.string().optional(),
          note: z.string().optional(),
        }),
      )
      .optional(),
    practiceAreas: z.array(z.string()).optional(),
    blockedAreas: z.array(z.string()).optional(),
    highImpactImprovements: z.array(z.string()).optional(),
  })
  .strict();

function workValuesFromDb(raw: string | null): string[] {
  if (!raw?.trim()) return [];
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

function workValuesToDb(values: string[]): string | null {
  const s = values.map((v) => v.trim()).filter(Boolean);
  return s.length ? s.join(', ') : null;
}

function normalizeStrategy(raw: unknown): ProfileStrategyJson {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as ProfileStrategyJson;
  }
  return {};
}

function careerRowToSnapshot(row: typeof careerGoals.$inferSelect): CareerGoalsSnapshot {
  return {
    currentJobTitle: row.currentJobTitle ?? null,
    currentSalary: row.currentSalary ?? null,
    targetJobTitle: row.targetJobTitle ?? null,
    targetSalary: row.targetSalary ?? null,
    targetSalaryMin: row.targetSalaryMin ?? null,
    targetSalaryMax: row.targetSalaryMax ?? null,
    targetSeniority: row.targetSeniority ?? null,
    workValues: workValuesFromDb(row.workValues),
    autoApplyMinScore: row.autoApplyMinScore ?? 75,
    strategy: normalizeStrategy(row.strategyJson),
  };
}

async function ensureCareerGoalsRow(userId: string): Promise<void> {
  const existing = await db.select({ id: careerGoals.id }).from(careerGoals).where(eq(careerGoals.userId, userId)).limit(1);
  if (existing[0]) return;
  await db.insert(careerGoals).values({
    id: randomUUID(),
    userId,
    autoApplyMinScore: 75,
  });
}

async function ensureSocialConsentsRow(userId: string): Promise<void> {
  const existing = await db.select({ id: socialConsents.id }).from(socialConsents).where(eq(socialConsents.userId, userId)).limit(1);
  if (existing[0]) return;
  await db.insert(socialConsents).values({
    id: randomUUID(),
    userId,
  });
}

async function ensurePreferenceFlagsRow(userId: string): Promise<void> {
  const existing = await db
    .select({ userId: userPreferenceFlags.userId })
    .from(userPreferenceFlags)
    .where(eq(userPreferenceFlags.userId, userId))
    .limit(1);
  if (existing[0]) return;
  await db.insert(userPreferenceFlags).values({ userId });
}

// ── Helpers ────────────────────────────────────────────────────────────────────

async function ensureProfileForUser(userId: string): Promise<string> {
  const existing = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.userId, userId)).limit(1);
  if (existing[0]) return existing[0].id;
  const id = randomUUID();
  await db.insert(profiles).values({ id, userId, fullName: '' });
  return id;
}

async function fetchProfileSnapshot(userId: string, email: string): Promise<ProfileSnapshot> {
  const [profileRecord, careerRow, socialRow, prefRow] = await Promise.all([
    db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1),
    db.select().from(careerGoals).where(eq(careerGoals.userId, userId)).limit(1),
    db.select().from(socialConsents).where(eq(socialConsents.userId, userId)).limit(1),
    db.select().from(userPreferenceFlags).where(eq(userPreferenceFlags.userId, userId)).limit(1),
  ]);

  const careerGoalsSnapshot = careerRow[0] ? careerRowToSnapshot(careerRow[0]) : DEFAULT_CAREER_GOALS;
  const socialSnapshot: SocialConsentsSnapshot = socialRow[0]
    ? {
        linkedinConsent: socialRow[0].linkedinConsent,
        facebookConsent: socialRow[0].facebookConsent,
        instagramConsent: socialRow[0].instagramConsent,
      }
    : DEFAULT_SOCIAL;
  const preferenceSnapshot: UserPreferenceFlagsSnapshot = prefRow[0]
    ? {
        caseStudyOptIn: prefRow[0].caseStudyOptIn,
        communityVisibility: prefRow[0].communityVisibility,
        referralParticipation: prefRow[0].referralParticipation,
        sharedSessionsDiscoverable: prefRow[0].sharedSessionsDiscoverable,
        aiPersonalizationEnabled: prefRow[0].aiPersonalizationEnabled,
      }
    : DEFAULT_PREFS;

  const profile = profileRecord[0];
  if (!profile) {
    return {
      personalInfo: { fullName: '', email, phone: '', location: '', headline: '', summary: '', linkedinUrl: '', cvUrl: '' },
      skills: [],
      experiences: [],
      educations: [],
      trainings: [],
      careerGoals: careerGoalsSnapshot,
      socialConsents: socialSnapshot,
      preferenceFlags: preferenceSnapshot,
    };
  }

  const [skillRecords, experienceRecords, educationRecords, trainingRecords] = await Promise.all([
    db.select({ name: skills.name }).from(skills).where(eq(skills.profileId, profile.id)),
    db.select().from(experiences).where(eq(experiences.profileId, profile.id)),
    db.select().from(educations).where(eq(educations.profileId, profile.id)),
    db.select().from(trainings).where(eq(trainings.profileId, profile.id)),
  ]);

  return {
    personalInfo: {
      fullName: profile.fullName,
      email,
      phone: profile.phone ?? '',
      location: profile.location ?? '',
      headline: profile.headline ?? '',
      summary: profile.summary ?? '',
      linkedinUrl: profile.linkedinUrl ?? '',
      cvUrl: profile.cvUrl ?? '',
    },
    skills: skillRecords.map((s) => s.name),
    experiences: experienceRecords.map((e) => ({
      id: e.id,
      employerName: e.employerName,
      jobTitle: e.jobTitle,
      startDate: e.startDate,
      endDate: e.endDate ?? null,
      description: e.description ?? '',
    })),
    educations: educationRecords.map((e) => ({
      id: e.id,
      schoolName: e.schoolName,
      degree: e.degree,
      fieldOfStudy: e.fieldOfStudy ?? '',
      startDate: e.startDate,
      endDate: e.endDate ?? null,
    })),
    trainings: trainingRecords.map((t) => ({
      id: t.id,
      title: t.title,
      providerName: t.providerName,
      issuedAt: t.issuedAt,
      expiresAt: t.expiresAt ?? null,
      credentialUrl: t.credentialUrl ?? '',
    })),
    careerGoals: careerGoalsSnapshot,
    socialConsents: socialSnapshot,
    preferenceFlags: preferenceSnapshot,
  };
}

// ── Router ─────────────────────────────────────────────────────────────────────

export const profileRouter = router({
  /** Creates local `users` + `profiles` on first sign-in; keeps email in sync; fills empty profile name from Clerk. */
  ensureFromClerk: publicProcedure
    .input(z.object({
      userId: z.string().min(1),
      email: z.string().email(),
      fullName: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const displayName = (input.fullName ?? '').trim();
      const existing = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, input.userId)).limit(1);
      const row = existing[0];

      if (!row) {
        const userId = randomUUID();
        await db.insert(users).values({
          id: userId,
          clerkId: input.userId,
          email: input.email,
          lastSeenAt: new Date(),
        });
        await db.insert(profiles).values({
          id: randomUUID(),
          userId,
          fullName: displayName,
        });
        return { created: true as const };
      }

      await db.update(users)
        .set({ email: input.email, updatedAt: new Date(), lastSeenAt: new Date() })
        .where(eq(users.id, row.id));

      if (!displayName) return { created: false as const };

      const profileRow = await db.select({ fullName: profiles.fullName }).from(profiles).where(eq(profiles.userId, row.id)).limit(1);
      const currentName = (profileRow[0]?.fullName ?? '').trim();
      if (!currentName) {
        await db.update(profiles)
          .set({ fullName: displayName, updatedAt: new Date() })
          .where(eq(profiles.userId, row.id));
      }

      return { created: false as const };
    }),

  getProfile: protectedProcedure
    .query(async ({ ctx }) => {
      return fetchProfileSnapshot(ctx.user.id, ctx.user.email);
    }),

  /**
   * Profile-driven match context used by Jobs, Job Radar, Auto-Apply, and
   * Skill Lab surfaces. Exposed so the frontend can render "why was this
   * job skipped?" / "below threshold" badges using the same rules the
   * backend enforces server-side.
   */
  getMatchContext: protectedProcedure
    .query(async ({ ctx }) => {
      return getProfileMatchContextByLocalId(ctx.user.id);
    }),

  /**
   * Profile-driven growth/roadmap surface used by Profile page, Dashboard,
   * and Skill Lab growth recommendations. Reads strategy + high-impact
   * improvements from `career_goals.strategyJson`, and exposes work values +
   * threshold so the UI can render "why Skill Lab suggested X" explanations.
   */
  getGrowthRecommendations: protectedProcedure
    .query(async ({ ctx }) => {
      const ctx2 = await getProfileMatchContextByLocalId(ctx.user.id);
      const [row] = await db
        .select({ strategyJson: careerGoals.strategyJson })
        .from(careerGoals)
        .where(eq(careerGoals.userId, ctx.user.id))
        .limit(1);
      const strategy = normalizeStrategy(row?.strategyJson);
      return {
        growthPlan: Array.isArray(strategy.growthPlan) ? strategy.growthPlan : [],
        highImpactImprovements: Array.isArray(strategy.highImpactImprovements)
          ? strategy.highImpactImprovements
          : [],
        roadmap: Array.isArray(strategy.roadmap) ? strategy.roadmap : [],
        skillCourseLinks: Array.isArray(strategy.skillCourseLinks) ? strategy.skillCourseLinks : [],
        practiceAreas: Array.isArray(strategy.practiceAreas) ? strategy.practiceAreas : [],
        workValues: ctx2.workValues,
        minAutoApplyScore: ctx2.minAutoApplyScore,
        targetJobTitle: ctx2.targetJobTitle,
        targetSeniority: ctx2.targetSeniority,
        targetSalaryMin: ctx2.targetSalaryMin,
        targetSalaryMax: ctx2.targetSalaryMax,
      };
    }),

  /**
   * Profile-driven employer / listing blocked check used by Job Radar,
   * employer validation, and manual-review surfaces. Returns `blocked: true`
   * when the given job title or company matches a user-configured blocked
   * area (case-insensitive substring). Pure policy call — no side effects.
   */
  isEmployerBlocked: protectedProcedure
    .input(
      z.object({
        jobTitle: z.string().optional(),
        company: z.string().optional(),
        tags: z.array(z.string()).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const match = await getProfileMatchContextByLocalId(ctx.user.id);
      const blocked = isBlockedJob(
        {
          title: input.jobTitle ?? '',
          company: input.company ?? null,
          description: null,
          seniority: null,
          salaryMin: null,
          salaryMax: null,
          tags: input.tags ?? [],
        },
        match.blockedAreas,
      );
      return {
        blocked,
        blockedAreas: match.blockedAreas,
        reason: blocked ? ('blocked_area' as const) : null,
      };
    }),

  savePersonalInfo: protectedProcedure
    .input(z.object({
      fullName: z.string(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      location: z.string().max(255).optional(),
      headline: z.string().max(255).optional(),
      summary: z.string().optional(),
      linkedinUrl: z.string().url().max(500).optional().or(z.literal('')),
      cvUrl: z.string().url().max(500).optional().or(z.literal('')),
    }))
    .mutation(async ({ ctx, input }) => {
      const localUserId = ctx.user.id;

      if (input.email) {
        await db.update(users)
          .set({ email: input.email, updatedAt: new Date() })
          .where(eq(users.id, localUserId));
      }

      await ensureProfileForUser(localUserId);
      await db.update(profiles)
        .set({
          fullName: input.fullName,
          phone: input.phone,
          location: input.location,
          headline: input.headline,
          summary: input.summary,
          linkedinUrl: input.linkedinUrl || null,
          cvUrl: input.cvUrl || null,
          updatedAt: new Date(),
        })
        .where(eq(profiles.userId, localUserId));

      const email = input.email ?? ctx.user.email;
      return fetchProfileSnapshot(localUserId, email);
    }),

  saveSkills: protectedProcedure
    .input(z.object({ skills: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      const localUserId = ctx.user.id;
      const profileId = await ensureProfileForUser(localUserId);

      await db.delete(skills).where(eq(skills.profileId, profileId));
      if (input.skills.length > 0) {
        await db.insert(skills).values(input.skills.map((name) => ({ id: randomUUID(), profileId, name })));
      }

      return fetchProfileSnapshot(localUserId, ctx.user.email);
    }),

  replaceExperiences: protectedProcedure
    .input(z.object({
      experiences: z.array(z.object({
        employerName: z.string().min(1),
        jobTitle: z.string().min(1),
        startDate: z.string(),
        endDate: z.string().nullable(),
        description: z.string(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const localUserId = ctx.user.id;
      const profileId = await ensureProfileForUser(localUserId);

      await db.delete(experiences).where(eq(experiences.profileId, profileId));
      if (input.experiences.length > 0) {
        await db.insert(experiences).values(input.experiences.map((item) => ({
          id: randomUUID(),
          profileId,
          employerName: item.employerName,
          jobTitle: item.jobTitle,
          startDate: item.startDate,
          endDate: item.endDate ?? null,
          description: item.description,
        })));
      }

      return fetchProfileSnapshot(localUserId, ctx.user.email);
    }),

  replaceEducations: protectedProcedure
    .input(z.object({
      educations: z.array(z.object({
        schoolName: z.string().min(1),
        degree: z.string().min(1),
        fieldOfStudy: z.string(),
        startDate: z.string(),
        endDate: z.string().nullable(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const localUserId = ctx.user.id;
      const profileId = await ensureProfileForUser(localUserId);

      await db.delete(educations).where(eq(educations.profileId, profileId));
      if (input.educations.length > 0) {
        await db.insert(educations).values(input.educations.map((item) => ({
          id: randomUUID(),
          profileId,
          schoolName: item.schoolName,
          degree: item.degree,
          fieldOfStudy: item.fieldOfStudy || null,
          startDate: item.startDate,
          endDate: item.endDate ?? null,
        })));
      }

      return fetchProfileSnapshot(localUserId, ctx.user.email);
    }),

  replaceTrainings: protectedProcedure
    .input(z.object({
      trainings: z.array(z.object({
        title: z.string().min(1),
        providerName: z.string().min(1),
        issuedAt: z.string(),
        expiresAt: z.string().nullable(),
        credentialUrl: z.string(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const localUserId = ctx.user.id;
      const profileId = await ensureProfileForUser(localUserId);

      await db.delete(trainings).where(eq(trainings.profileId, profileId));
      if (input.trainings.length > 0) {
        await db.insert(trainings).values(input.trainings.map((item) => ({
          id: randomUUID(),
          profileId,
          title: item.title,
          providerName: item.providerName,
          issuedAt: item.issuedAt,
          expiresAt: item.expiresAt ?? null,
          credentialUrl: item.credentialUrl || null,
        })));
      }

      return fetchProfileSnapshot(localUserId, ctx.user.email);
    }),

  saveCareerGoals: protectedProcedure
    .input(
      z.object({
        currentJobTitle: z.string().max(255).nullable().optional(),
        currentSalary: z.number().int().nullable().optional(),
        targetJobTitle: z.string().max(255).nullable().optional(),
        targetSalary: z.number().int().nullable().optional(),
        targetSalaryMin: z.number().int().nullable().optional(),
        targetSalaryMax: z.number().int().nullable().optional(),
        targetSeniority: z.string().max(80).nullable().optional(),
        workValues: z.array(z.string()).optional(),
        autoApplyMinScore: z.number().int().min(50).max(100).optional(),
        strategy: strategyPatchSchema.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const localUserId = ctx.user.id;
      await ensureCareerGoalsRow(localUserId);

      const [row] = await db.select().from(careerGoals).where(eq(careerGoals.userId, localUserId)).limit(1);
      const prevStrategy = row ? normalizeStrategy(row.strategyJson) : {};
      const nextStrategy: ProfileStrategyJson = input.strategy ? { ...prevStrategy, ...input.strategy } : prevStrategy;

      await db
        .update(careerGoals)
        .set({
          ...(input.currentJobTitle !== undefined ? { currentJobTitle: input.currentJobTitle } : {}),
          ...(input.currentSalary !== undefined ? { currentSalary: input.currentSalary } : {}),
          ...(input.targetJobTitle !== undefined ? { targetJobTitle: input.targetJobTitle } : {}),
          ...(input.targetSalary !== undefined ? { targetSalary: input.targetSalary } : {}),
          ...(input.targetSalaryMin !== undefined ? { targetSalaryMin: input.targetSalaryMin } : {}),
          ...(input.targetSalaryMax !== undefined ? { targetSalaryMax: input.targetSalaryMax } : {}),
          ...(input.targetSeniority !== undefined ? { targetSeniority: input.targetSeniority } : {}),
          ...(input.workValues !== undefined ? { workValues: workValuesToDb(input.workValues) } : {}),
          ...(input.autoApplyMinScore !== undefined ? { autoApplyMinScore: input.autoApplyMinScore } : {}),
          ...(input.strategy !== undefined ? { strategyJson: nextStrategy } : {}),
          updatedAt: new Date(),
        })
        .where(eq(careerGoals.userId, localUserId));

      return fetchProfileSnapshot(localUserId, ctx.user.email);
    }),

  saveSocialConsents: protectedProcedure
    .input(
      z.object({
        linkedinConsent: z.boolean().optional(),
        facebookConsent: z.boolean().optional(),
        instagramConsent: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const localUserId = ctx.user.id;
      await ensureSocialConsentsRow(localUserId);
      const [prev] = await db.select().from(socialConsents).where(eq(socialConsents.userId, localUserId)).limit(1);
      if (!prev) return fetchProfileSnapshot(localUserId, ctx.user.email);

      const nextLi = input.linkedinConsent ?? prev.linkedinConsent;
      const nextFb = input.facebookConsent ?? prev.facebookConsent;
      const nextIg = input.instagramConsent ?? prev.instagramConsent;

      await db
        .update(socialConsents)
        .set({
          linkedinConsent: nextLi,
          facebookConsent: nextFb,
          instagramConsent: nextIg,
          linkedinGrantedAt:
            input.linkedinConsent === true && !prev.linkedinConsent
              ? new Date()
              : input.linkedinConsent === false
                ? null
                : prev.linkedinGrantedAt,
          facebookGrantedAt:
            input.facebookConsent === true && !prev.facebookConsent
              ? new Date()
              : input.facebookConsent === false
                ? null
                : prev.facebookGrantedAt,
          instagramGrantedAt:
            input.instagramConsent === true && !prev.instagramConsent
              ? new Date()
              : input.instagramConsent === false
                ? null
                : prev.instagramGrantedAt,
          updatedAt: new Date(),
        })
        .where(eq(socialConsents.userId, localUserId));

      return fetchProfileSnapshot(localUserId, ctx.user.email);
    }),

  savePreferenceFlags: protectedProcedure
    .input(
      z.object({
        caseStudyOptIn: z.boolean().optional(),
        communityVisibility: z.boolean().optional(),
        referralParticipation: z.boolean().optional(),
        sharedSessionsDiscoverable: z.boolean().optional(),
        aiPersonalizationEnabled: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const localUserId = ctx.user.id;
      await ensurePreferenceFlagsRow(localUserId);
      const [prev] = await db.select().from(userPreferenceFlags).where(eq(userPreferenceFlags.userId, localUserId)).limit(1);
      if (!prev) return fetchProfileSnapshot(localUserId, ctx.user.email);

      await db
        .update(userPreferenceFlags)
        .set({
          caseStudyOptIn: input.caseStudyOptIn ?? prev.caseStudyOptIn,
          communityVisibility: input.communityVisibility ?? prev.communityVisibility,
          referralParticipation: input.referralParticipation ?? prev.referralParticipation,
          sharedSessionsDiscoverable: input.sharedSessionsDiscoverable ?? prev.sharedSessionsDiscoverable,
          aiPersonalizationEnabled: input.aiPersonalizationEnabled ?? prev.aiPersonalizationEnabled,
          updatedAt: new Date(),
        })
        .where(eq(userPreferenceFlags.userId, localUserId));

      return fetchProfileSnapshot(localUserId, ctx.user.email);
    }),

  // ── Legacy procedures (kept for backwards compatibility) ──────────────────

  getExperience: publicProcedure
    .input(z.object({ userId: z.string().min(1) }))
    .query(async ({ input }) => {
      const userRecord = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, input.userId)).limit(1);
      const localUserId = userRecord[0]?.id;
      if (!localUserId) return [];
      const profileRecord = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.userId, localUserId)).limit(1);
      const profileId = profileRecord[0]?.id;
      if (!profileId) return [];
      return db.select().from(experiences).where(eq(experiences.profileId, profileId));
    }),

  saveExperience: publicProcedure
    .input(z.object({
      userId: z.string().min(1),
      items: z.array(z.object({
        id: z.string().optional(),
        employerName: z.string().min(1),
        jobTitle: z.string().min(1),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        description: z.string().optional(),
      })),
    }))
    .mutation(async ({ input }) => {
      const userRecord = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, input.userId)).limit(1);
      const localUserId = userRecord[0]?.id;
      if (!localUserId) return { success: false };
      const profileRecord = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.userId, localUserId)).limit(1);
      const profileId = profileRecord[0]?.id;
      if (!profileId) return { success: false };
      await db.delete(experiences).where(eq(experiences.profileId, profileId));
      if (input.items.length > 0) {
        await db.insert(experiences).values(input.items.map((item) => ({
          id: item.id ?? randomUUID(),
          profileId,
          employerName: item.employerName,
          jobTitle: item.jobTitle,
          startDate: item.startDate ?? '',
          endDate: item.endDate ?? null,
          description: item.description ?? '',
        })));
      }
      return { success: true };
    }),

  getEducation: publicProcedure
    .input(z.object({ userId: z.string().min(1) }))
    .query(async ({ input }) => {
      const userRecord = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, input.userId)).limit(1);
      const localUserId = userRecord[0]?.id;
      if (!localUserId) return [];
      const profileRecord = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.userId, localUserId)).limit(1);
      const profileId = profileRecord[0]?.id;
      if (!profileId) return [];
      return db.select().from(educations).where(eq(educations.profileId, profileId));
    }),

  saveEducation: publicProcedure
    .input(z.object({
      userId: z.string().min(1),
      items: z.array(z.object({
        id: z.string().optional(),
        schoolName: z.string().min(1),
        degree: z.string().min(1),
        fieldOfStudy: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })),
    }))
    .mutation(async ({ input }) => {
      const userRecord = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, input.userId)).limit(1);
      const localUserId = userRecord[0]?.id;
      if (!localUserId) return { success: false };
      const profileRecord = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.userId, localUserId)).limit(1);
      const profileId = profileRecord[0]?.id;
      if (!profileId) return { success: false };
      await db.delete(educations).where(eq(educations.profileId, profileId));
      if (input.items.length > 0) {
        await db.insert(educations).values(input.items.map((item) => ({
          id: item.id ?? randomUUID(),
          profileId,
          schoolName: item.schoolName,
          degree: item.degree,
          fieldOfStudy: item.fieldOfStudy ?? null,
          startDate: item.startDate ?? '',
          endDate: item.endDate ?? null,
        })));
      }
      return { success: true };
    }),
});
