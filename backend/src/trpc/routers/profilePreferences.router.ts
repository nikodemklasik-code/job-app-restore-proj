import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { protectedProcedure, router } from '../trpc.js';
import { db } from '../../db/index.js';
import { careerGoals } from '../../db/schema.js';
import type { ProfileStrategyJson } from '../../../../shared/profile.js';

const workModePreferenceZ = z.enum(['remote', 'hybrid', 'onsite']);
const employmentTypePreferenceZ = z.enum(['full_time', 'part_time', 'temporary', 'occasional']);
const contractTypePreferenceZ = z.enum([
  'employment_contract',
  'b2b',
  'self_employed',
  'fixed_term',
  'contract',
]);

const languageInputZ = z.object({
  name: z.string().trim().min(1).max(80),
  proficiency: z.string().trim().min(1).max(80),
  certificate: z.string().trim().max(160).nullable().optional(),
});

const hobbyInputZ = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(500).nullable().optional(),
});

const workSetupInputZ = z.object({
  workModePreferences: z.array(workModePreferenceZ).default([]),
  employmentTypePreferences: z.array(employmentTypePreferenceZ).default([]),
  contractPreferences: z.array(contractTypePreferenceZ).default([]),
  preferredHoursPerWeek: z.number().int().min(1).max(80).nullable().optional(),
  preferredWorkRatio: z.number().int().min(1).max(100).nullable().optional(),
});

function normalizeStrategy(raw: unknown): ProfileStrategyJson {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as ProfileStrategyJson;
  }
  return {};
}

async function ensureCareerGoalsRow(userId: string): Promise<void> {
  const existing = await db
    .select({ id: careerGoals.id })
    .from(careerGoals)
    .where(eq(careerGoals.userId, userId))
    .limit(1);

  if (existing[0]) return;

  await db.insert(careerGoals).values({
    id: randomUUID(),
    userId,
    autoApplyMinScore: 75,
  });
}

async function getStrategy(userId: string): Promise<ProfileStrategyJson> {
  await ensureCareerGoalsRow(userId);
  const [row] = await db
    .select({ strategyJson: careerGoals.strategyJson })
    .from(careerGoals)
    .where(eq(careerGoals.userId, userId))
    .limit(1);

  return normalizeStrategy(row?.strategyJson);
}

async function patchStrategy(userId: string, patch: ProfileStrategyJson): Promise<ProfileStrategyJson> {
  const previous = await getStrategy(userId);
  const next: ProfileStrategyJson = { ...previous, ...patch };

  await db
    .update(careerGoals)
    .set({ strategyJson: next, updatedAt: new Date() })
    .where(eq(careerGoals.userId, userId));

  return next;
}

function getWorkSetup(strategy: ProfileStrategyJson) {
  return {
    workModePreferences: Array.isArray(strategy.workModePreferences)
      ? strategy.workModePreferences
      : [],
    employmentTypePreferences: Array.isArray(strategy.employmentTypePreferences)
      ? strategy.employmentTypePreferences
      : [],
    contractPreferences: Array.isArray(strategy.contractPreferences)
      ? strategy.contractPreferences
      : [],
    preferredHoursPerWeek:
      typeof strategy.preferredHoursPerWeek === 'number' ? strategy.preferredHoursPerWeek : null,
    preferredWorkRatio:
      typeof strategy.preferredWorkRatio === 'number' ? strategy.preferredWorkRatio : null,
  };
}

export const profilePreferencesRouter = router({
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    const strategy = await getStrategy(ctx.user.id);
    return {
      preferredWorkSetup: getWorkSetup(strategy),
      languages: Array.isArray(strategy.languages) ? strategy.languages : [],
      hobbies: Array.isArray(strategy.hobbies) ? strategy.hobbies : [],
    };
  }),

  saveWorkSetup: protectedProcedure
    .input(workSetupInputZ)
    .mutation(async ({ ctx, input }) => {
      const next = await patchStrategy(ctx.user.id, {
        workModePreferences: input.workModePreferences,
        employmentTypePreferences: input.employmentTypePreferences,
        contractPreferences: input.contractPreferences,
        preferredHoursPerWeek: input.preferredHoursPerWeek ?? null,
        preferredWorkRatio: input.preferredWorkRatio ?? null,
      });

      return getWorkSetup(next);
    }),

  replaceLanguages: protectedProcedure
    .input(z.object({ languages: z.array(languageInputZ).default([]) }))
    .mutation(async ({ ctx, input }) => {
      const languages = input.languages.map((language) => ({
        name: language.name.trim(),
        proficiency: language.proficiency.trim(),
        certificate: language.certificate?.trim() || null,
      }));
      const next = await patchStrategy(ctx.user.id, { languages });
      return Array.isArray(next.languages) ? next.languages : [];
    }),

  replaceHobbies: protectedProcedure
    .input(z.object({ hobbies: z.array(hobbyInputZ).default([]) }))
    .mutation(async ({ ctx, input }) => {
      const hobbies = input.hobbies.map((hobby) => ({
        name: hobby.name.trim(),
        description: hobby.description?.trim() || null,
      }));
      const next = await patchStrategy(ctx.user.id, { hobbies });
      return Array.isArray(next.hobbies) ? next.hobbies : [];
    }),
});
