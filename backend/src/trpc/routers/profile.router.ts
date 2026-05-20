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
  ProfileFieldProvenance,
  ProfileSnapshotProvenance,
  ProfileExperienceProvenance,
  ProfileEducationProvenance,
  ProfileTrainingProvenance,
} from '../../../../shared/profile.js';
import { getProfileMatchContextByLocalId } from '../../services/profileSourceOfTruth.js';
import { isBlockedJob } from '../../services/profileSourceOfTruth.policy.js';
import { generateProfileRoadmap } from '../../services/profileRoadmapGenerator.js';

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
  .passthrough();

function workValuesFromDb(raw: string | null): string[] {
  if (!raw?.trim()) return [];
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

function workValuesToDb(values: string[]): string | null {
  const s = values.map((v) => v.trim()).filter(Boolean);
  return s.length ? s.join(', ') : null;
}

function normalizeAchievements(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeStrategy(raw: unknown): ProfileStrategyJson {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as ProfileStrategyJson;
  }
  return {};
}

function provenance(source: ProfileFieldProvenance['source'], updatedAt?: Date | string | null, note?: string): ProfileFieldProvenance {
  return {
    source,
    updatedAt: updatedAt ? new Date(updatedAt).toISOString() : null,
    note,
  };
}

function userConfirmed(updatedAt?: Date | string | null, note?: string): ProfileFieldProvenance {
  return provenance('user_confirmed', updatedAt, note ?? 'Approved profile state');
}

function unknownProvenance(note?: string): ProfileFieldProvenance {
  return provenance('unknown', null, note ?? 'No approved value yet');
}

function normalizeStoredProvenance(raw: unknown): ProfileFieldProvenance | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const candidate = raw as Record<string, unknown>;
  const source = candidate.source;
  if (
    source !== 'unknown'
    && source !== 'imported_from_cv'
    && source !== 'user_confirmed'
    && source !== 'ai_suggested'
  ) {
    return null;
  }
  return {
    source,
    note: typeof candidate.note === 'string' ? candidate.note : undefined,
    updatedAt: typeof candidate.updatedAt === 'string' ? candidate.updatedAt : null,
  };
}

function withStoredProvenance(fallback: ProfileFieldProvenance, raw: unknown): ProfileFieldProvenance {
  return normalizeStoredProvenance(raw) ?? fallback;
}

function emptyPersonalInfoProvenance(): ProfileSnapshotProvenance['personalInfo'] {
  return {
    fullName: unknownProvenance(),
    email: unknownProvenance(),
    phone: unknownProvenance(),
    location: unknownProvenance(),
    headline: unknownProvenance(),
    summary: unknownProvenance(),
    linkedinUrl: unknownProvenance(),
    cvUrl: unknownProvenance(),
  };
}

function experienceProvenance(updatedAt?: Date | string | null): ProfileExperienceProvenance {
  const base = userConfirmed(updatedAt);
  return {
    record: base,
    employerName: base,
    jobTitle: base,
    startDate: base,
    endDate: base,
    description: base,
    achievements: base,
  };
}

function educationProvenance(updatedAt?: Date | string | null): ProfileEducationProvenance {
  const base = userConfirmed(updatedAt);
  return {
    record: base,
    schoolName: base,
    degree: base,
    fieldOfStudy: base,
    startDate: base,
    endDate: base,
  };
}

function trainingProvenance(updatedAt?: Date | string | null): ProfileTrainingProvenance {
  const base = userConfirmed(updatedAt);
  return {
    record: base,
    title: base,
    providerName: base,
    issuedAt: base,
    expiresAt: base,
    credentialUrl: base,
  };
}

function applyExperienceStoredProvenance(base: ProfileExperienceProvenance, raw: unknown): ProfileExperienceProvenance {
  const stamp = normalizeStoredProvenance(raw);
  if (!stamp) return base;
  return {
    record: stamp,
    employerName: stamp,
    jobTitle: stamp,
    startDate: stamp,
    endDate: stamp,
    description: stamp,
    achievements: stamp,
  };
}

function applyEducationStoredProvenance(base: ProfileEducationProvenance, raw: unknown): ProfileEducationProvenance {
  const stamp = normalizeStoredProvenance(raw);
  if (!stamp) return base;
  return {
    record: stamp,
    schoolName: stamp,
    degree: stamp,
    fieldOfStudy: stamp,
    startDate: stamp,
    endDate: stamp,
  };
}

function applyTrainingStoredProvenance(base: ProfileTrainingProvenance, raw: unknown): ProfileTrainingProvenance {
  const stamp = normalizeStoredProvenance(raw);
  if (!stamp) return base;
  return {
    record: stamp,
    title: stamp,
    providerName: stamp,
    issuedAt: stamp,
    expiresAt: stamp,
    credentialUrl: stamp,
  };
}

function strategyProfileProvenance(strategy: ProfileStrategyJson): Record<string, unknown> {
  const raw = strategy.profileProvenance;
  return raw && typeof raw === 'object' && !Array.isArray(raw)
    ? raw as Record<string, unknown>
    : {};
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
  const storedProfileProvenance = strategyProfileProvenance(careerGoalsSnapshot.strategy);
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
      provenance: {
        personalInfo: emptyPersonalInfoProvenance(),
        skills: [],
        experiences: {},
        educations: {},
        trainings: {},
      },
      careerGoals: careerGoalsSnapshot,
      socialConsents: socialSnapshot,
      preferenceFlags: preferenceSnapshot,
    };
  }

  const [skillRecords, experienceRecords, educationRecords, trainingRecords] = await Promise.all([
    db.select({ name: skills.name, createdAt: skills.createdAt }).from(skills).where(eq(skills.profileId, profile.id)),
    db.select().from(experiences).where(eq(experiences.profileId, profile.id)),
    db.select().from(educations).where(eq(educations.profileId, profile.id)),
    db.select().from(trainings).where(eq(trainings.profileId, profile.id)),
  ]);

  const profileUpdatedAt = profile.updatedAt ?? profile.createdAt ?? null;
  const skillSectionProvenance = storedProfileProvenance.skills;
  const experienceSectionProvenance = storedProfileProvenance.experiences;
  const educationSectionProvenance = storedProfileProvenance.educations;
  const trainingSectionProvenance = storedProfileProvenance.trainings;

  const provenanceSnapshot: ProfileSnapshotProvenance = {
    personalInfo: {
      fullName: profile.fullName?.trim() ? withStoredProvenance(userConfirmed(profileUpdatedAt), storedProfileProvenance['personalInfo.fullName']) : unknownProvenance(),
      email: email.trim() ? withStoredProvenance(userConfirmed(profileUpdatedAt, 'Synced from approved account identity'), storedProfileProvenance['personalInfo.email']) : unknownProvenance(),
      phone: profile.phone?.trim() ? withStoredProvenance(userConfirmed(profileUpdatedAt), storedProfileProvenance['personalInfo.phone']) : unknownProvenance(),
      location: profile.location?.trim() ? withStoredProvenance(userConfirmed(profileUpdatedAt), storedProfileProvenance['personalInfo.location']) : unknownProvenance(),
      headline: profile.headline?.trim() ? withStoredProvenance(userConfirmed(profileUpdatedAt), storedProfileProvenance['personalInfo.headline']) : unknownProvenance(),
      summary: profile.summary?.trim() ? withStoredProvenance(userConfirmed(profileUpdatedAt), storedProfileProvenance['personalInfo.summary']) : unknownProvenance(),
      linkedinUrl: profile.linkedinUrl?.trim() ? withStoredProvenance(userConfirmed(profileUpdatedAt), storedProfileProvenance['personalInfo.linkedinUrl']) : unknownProvenance(),
      cvUrl: profile.cvUrl?.trim() ? withStoredProvenance(userConfirmed(profileUpdatedAt), storedProfileProvenance['personalInfo.cvUrl']) : unknownProvenance(),
    },
    skills: skillRecords.map((s) => s.name?.trim() ? withStoredProvenance(userConfirmed(s.createdAt ?? profileUpdatedAt), skillSectionProvenance) : unknownProvenance()),
    experiences: Object.fromEntries(
      experienceRecords.map((e) => [e.id, applyExperienceStoredProvenance(experienceProvenance(e.createdAt ?? profileUpdatedAt), experienceSectionProvenance)]),
    ),
    educations: Object.fromEntries(
      educationRecords.map((e) => [e.id, applyEducationStoredProvenance(educationProvenance(e.createdAt ?? profileUpdatedAt), educationSectionProvenance)]),
    ),
    trainings: Object.fromEntries(
      trainingRecords.map((t) => [t.id, applyTrainingStoredProvenance(trainingProvenance(t.createdAt ?? profileUpdatedAt), trainingSectionProvenance)]),
    ),
  };

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
      achievements: normalizeAchievements(e.achievements),
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
    provenance: provenanceSnapshot,
    careerGoals: careerGoalsSnapshot,
    socialConsents: socialSnapshot,
    preferenceFlags: preferenceSnapshot,
  };
}

export const profileRouter = router({
  ensureFromClerk: publicProcedure
    .input(z.object({
      userId: z.string().min(1),
      email: z.string().email(),
      fullName: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const displayName = (input.fullName ?? '').trim();
      const existing = await db.select({ id: users.id, email: users.email }).from(users).where(eq(users.clerkId, input.userId)).limit(1);
      const row = existing[0];

      if (!row) {
        const localId = randomUUID();
        await db.insert(users).values({
          id: localId,
          clerkId: input.userId,
          email: input.email,
        });
        const profileId = randomUUID();
        await db.insert(profiles).values({ id: profileId, userId: localId, fullName: displayName });
        await ensureCareerGoalsRow(localId);
        await ensureSocialConsentsRow(localId);
        await ensurePreferenceFlagsRow(localId);
        return { ok: true, created: true, localUserId: localId, profileId };
      }

      if (row.email !== input.email) {
        await db.update(users).set({ email: input.email }).where(eq(users.id, row.id));
      }
      const existingProfile = await db.select().from(profiles).where(eq(profiles.userId, row.id)).limit(1);
      if (!existingProfile[0]) {
        const profileId = randomUUID();
        await db.insert(profiles).values({ id: profileId, userId: row.id, fullName: displayName });
        await ensureCareerGoalsRow(row.id);
        await ensureSocialConsentsRow(row.id);
        await ensurePreferenceFlagsRow(row.id);
        return { ok: true, created: false, localUserId: row.id, profileId };
      }

      await ensureCareerGoalsRow(row.id);
      await ensureSocialConsentsRow(row.id);
      await ensurePreferenceFlagsRow(row.id);
      if (!existingProfile[0].fullName?.trim() && displayName) {
        await db.update(profiles).set({ fullName: displayName }).where(eq(profiles.id, existingProfile[0].id));
      }
      return { ok: true, created: false, localUserId: row.id, profileId: existingProfile[0].id };
    }),

  me: protectedProcedure.query(async ({ ctx }) => {
    const clerkId = ctx.auth.clerkUserId;
    const row = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
    if (!row[0]) return null;
    const snapshot = await fetchProfileSnapshot(row[0].id, row[0].email);
    return { localUserId: row[0].id, email: row[0].email, profile: snapshot };
  }),

  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const clerkId = ctx.auth.clerkUserId;
    const row = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
    if (!row[0]) {
      return {
        personalInfo: { fullName: '', email: '', phone: '', location: '', headline: '', summary: '', linkedinUrl: '', cvUrl: '' },
        skills: [],
        experiences: [],
        educations: [],
        trainings: [],
        provenance: {
          personalInfo: emptyPersonalInfoProvenance(),
          skills: [],
          experiences: {},
          educations: {},
          trainings: {},
        },
        careerGoals: DEFAULT_CAREER_GOALS,
        socialConsents: DEFAULT_SOCIAL,
        preferenceFlags: DEFAULT_PREFS,
      } satisfies ProfileSnapshot;
    }
    return fetchProfileSnapshot(row[0].id, row[0].email);
  }),

  updateProfile: protectedProcedure
    .input(z.object({
      personalInfo: z.object({
        fullName: z.string(),
        phone: z.string(),
        location: z.string(),
        headline: z.string(),
        summary: z.string(),
        linkedinUrl: z.string(),
        cvUrl: z.string(),
      }),
      skills: z.array(z.string()),
      experiences: z.array(z.object({
        employerName: z.string(),
        jobTitle: z.string(),
        startDate: z.string(),
        endDate: z.string().nullable(),
        description: z.string(),
        achievements: z.array(z.string()).optional(),
      })),
      educations: z.array(z.object({
        schoolName: z.string(),
        degree: z.string(),
        fieldOfStudy: z.string(),
        startDate: z.string(),
        endDate: z.string().nullable(),
      })),
      trainings: z.array(z.object({
        title: z.string(),
        providerName: z.string(),
        issuedAt: z.string(),
        expiresAt: z.string().nullable(),
        credentialUrl: z.string(),
      })),
      careerGoals: z.object({
        currentJobTitle: z.string().nullable().optional(),
        currentSalary: z.number().nullable().optional(),
        targetJobTitle: z.string().nullable().optional(),
        targetSalary: z.number().nullable().optional(),
        targetSalaryMin: z.number().nullable().optional(),
        targetSalaryMax: z.number().nullable().optional(),
        targetSeniority: z.string().nullable().optional(),
        workValues: z.array(z.string()).optional(),
        autoApplyMinScore: z.number().int().min(0).max(100).optional(),
        strategy: strategyPatchSchema.optional(),
      }).optional(),
      socialConsents: z.object({
        linkedinConsent: z.boolean().optional(),
        facebookConsent: z.boolean().optional(),
        instagramConsent: z.boolean().optional(),
      }).optional(),
      preferenceFlags: z.object({
        caseStudyOptIn: z.boolean().optional(),
        communityVisibility: z.boolean().optional(),
        referralParticipation: z.boolean().optional(),
        sharedSessionsDiscoverable: z.boolean().optional(),
        aiPersonalizationEnabled: z.boolean().optional(),
      }).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const clerkId = ctx.auth.clerkUserId;
      const row = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
      if (!row[0]) throw new Error('User not found');
      const localUserId = row[0].id;

      const profileId = await ensureProfileForUser(localUserId);
      await ensureCareerGoalsRow(localUserId);
      await ensureSocialConsentsRow(localUserId);
      await ensurePreferenceFlagsRow(localUserId);

      await db.update(profiles).set({
        fullName: input.personalInfo.fullName,
        phone: input.personalInfo.phone,
        location: input.personalInfo.location,
        headline: input.personalInfo.headline,
        summary: input.personalInfo.summary,
        linkedinUrl: input.personalInfo.linkedinUrl,
        cvUrl: input.personalInfo.cvUrl,
      }).where(eq(profiles.id, profileId));

      await db.delete(skills).where(eq(skills.profileId, profileId));
      const cleanedSkills = input.skills.map((s) => s.trim()).filter(Boolean);
      if (cleanedSkills.length) {
        await db.insert(skills).values(cleanedSkills.map((name) => ({ id: randomUUID(), profileId, name })));
      }

      await db.delete(experiences).where(eq(experiences.profileId, profileId));
      if (input.experiences.length) {
        await db.insert(experiences).values(input.experiences.map((e) => ({
          id: randomUUID(),
          profileId,
          employerName: e.employerName,
          jobTitle: e.jobTitle,
          startDate: e.startDate,
          endDate: e.endDate ?? null,
          description: e.description,
          achievements: normalizeAchievements(e.achievements),
        })));
      }

      await db.delete(educations).where(eq(educations.profileId, profileId));
      if (input.educations.length) {
        await db.insert(educations).values(input.educations.map((e) => ({
          id: randomUUID(),
          profileId,
          schoolName: e.schoolName,
          degree: e.degree,
          fieldOfStudy: e.fieldOfStudy,
          startDate: e.startDate,
          endDate: e.endDate ?? null,
        })));
      }

      await db.delete(trainings).where(eq(trainings.profileId, profileId));
      if (input.trainings.length) {
        await db.insert(trainings).values(input.trainings.map((t) => ({
          id: randomUUID(),
          profileId,
          title: t.title,
          providerName: t.providerName,
          issuedAt: t.issuedAt,
          expiresAt: t.expiresAt ?? null,
          credentialUrl: t.credentialUrl,
        })));
      }

      if (input.careerGoals) {
        const current = await db.select().from(careerGoals).where(eq(careerGoals.userId, localUserId)).limit(1);
        const currentRow = current[0];
        const nextStrategy = {
          ...(currentRow?.strategyJson && typeof currentRow.strategyJson === 'object' ? currentRow.strategyJson : {}),
          ...(input.careerGoals.strategy ? normalizeStrategy(input.careerGoals.strategy) : {}),
        };
        await db.update(careerGoals).set({
          currentJobTitle: input.careerGoals.currentJobTitle ?? currentRow?.currentJobTitle ?? null,
          currentSalary: input.careerGoals.currentSalary ?? currentRow?.currentSalary ?? null,
          targetJobTitle: input.careerGoals.targetJobTitle ?? currentRow?.targetJobTitle ?? null,
          targetSalary: input.careerGoals.targetSalary ?? currentRow?.targetSalary ?? null,
          targetSalaryMin: input.careerGoals.targetSalaryMin ?? currentRow?.targetSalaryMin ?? null,
          targetSalaryMax: input.careerGoals.targetSalaryMax ?? currentRow?.targetSalaryMax ?? null,
          targetSeniority: input.careerGoals.targetSeniority ?? currentRow?.targetSeniority ?? null,
          workValues: input.careerGoals.workValues ? workValuesToDb(input.careerGoals.workValues) : currentRow?.workValues ?? null,
          autoApplyMinScore: input.careerGoals.autoApplyMinScore ?? currentRow?.autoApplyMinScore ?? 75,
          strategyJson: nextStrategy,
        }).where(eq(careerGoals.userId, localUserId));
      }

      if (input.socialConsents) {
        const current = await db.select().from(socialConsents).where(eq(socialConsents.userId, localUserId)).limit(1);
        const rowSocial = current[0];
        await db.update(socialConsents).set({
          linkedinConsent: input.socialConsents.linkedinConsent ?? rowSocial?.linkedinConsent ?? false,
          facebookConsent: input.socialConsents.facebookConsent ?? rowSocial?.facebookConsent ?? false,
          instagramConsent: input.socialConsents.instagramConsent ?? rowSocial?.instagramConsent ?? false,
        }).where(eq(socialConsents.userId, localUserId));
      }

      if (input.preferenceFlags) {
        const current = await db.select().from(userPreferenceFlags).where(eq(userPreferenceFlags.userId, localUserId)).limit(1);
        const rowPref = current[0];
        await db.update(userPreferenceFlags).set({
          caseStudyOptIn: input.preferenceFlags.caseStudyOptIn ?? rowPref?.caseStudyOptIn ?? false,
          communityVisibility: input.preferenceFlags.communityVisibility ?? rowPref?.communityVisibility ?? false,
          referralParticipation: input.preferenceFlags.referralParticipation ?? rowPref?.referralParticipation ?? true,
          sharedSessionsDiscoverable: input.preferenceFlags.sharedSessionsDiscoverable ?? rowPref?.sharedSessionsDiscoverable ?? false,
          aiPersonalizationEnabled: input.preferenceFlags.aiPersonalizationEnabled ?? rowPref?.aiPersonalizationEnabled ?? true,
        }).where(eq(userPreferenceFlags.userId, localUserId));
      }

      return { ok: true, profileId };
    }),

  getMatchContext: protectedProcedure.query(async ({ ctx }) => {
    const clerkId = ctx.auth.clerkUserId;
    const row = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
    if (!row[0]) {
      return {
        workValues: [],
        minAutoApplyScore: 75,
        targetJobTitle: null,
        targetSeniority: null,
        targetSalaryMin: null,
        targetSalaryMax: null,
        blockedAreas: [],
      };
    }
    return getProfileMatchContextByLocalId(row[0].id);
  }),

  isJobBlocked: protectedProcedure
    .input(z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      company: z.string().optional(),
      location: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const clerkId = ctx.auth.clerkUserId;
      const row = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
      if (!row[0]) return { blocked: false, reasons: [] as string[] };
      const context = await getProfileMatchContextByLocalId(row[0].id);
      const blocked = isBlockedJob({
        title: input.title ?? '',
        company: input.company ?? null,
        description: input.description ?? null,
        seniority: null,
        salaryMin: null,
        salaryMax: null,
        tags: input.location ? [input.location] : [],
      }, context.blockedAreas);
      return { blocked, reasons: blocked ? context.blockedAreas : [] as string[] };
    }),

  getRoadmap: protectedProcedure.query(async ({ ctx }) => {
    const clerkId = ctx.auth.clerkUserId;
    const userRows = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
    const userRow = userRows[0];
    if (!userRow) {
      return { roadmap: [], workValues: [], targetJobTitle: null };
    }
    const snapshot = await fetchProfileSnapshot(userRow.id, userRow.email);
    return generateProfileRoadmap({
      targetRole: snapshot.careerGoals?.targetJobTitle ?? null,
      targetSeniority: snapshot.careerGoals?.targetSeniority ?? null,
      currentRole: snapshot.careerGoals?.currentJobTitle ?? snapshot.experiences[0]?.jobTitle ?? null,
      skills: snapshot.skills,
      experiences: snapshot.experiences.map((experience) => ({
        jobTitle: experience.jobTitle,
        employerName: experience.employerName,
        description: experience.description,
      })),
      educations: snapshot.educations.map((education) => ({
        degree: education.degree,
        fieldOfStudy: education.fieldOfStudy,
        schoolName: education.schoolName,
      })),
      trainings: snapshot.trainings.map((training) => ({
        title: training.title,
        providerName: training.providerName,
      })),
      workValues: snapshot.careerGoals?.workValues,
    });
  }),
});
