import { randomUUID } from 'crypto';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import { router, publicProcedure, protectedProcedure } from '../trpc.js';
import { BillingError } from '../../services/creditsBilling.js';
import { FEATURE_COSTS } from '../../services/creditsConfig.js';
import {
  analyzeCareerDocumentText,
  type AnalyzeDocumentResult,
} from '../../services/styleDocumentAnalysis.service.js';
import {
  billingToTrpc,
  requireSpendApproval,
  settleSpendFailure,
  settleSpendSuccess,
} from './_shared.js';
import { db } from '../../db/index.js';
import { educations, experiences, profiles, skills, skillClaims, trainings } from '../../db/schema.js';
import type { SkillState } from '../../ai/skills-engine/skill-record.types.js';
import { promoteSkillState } from '../../ai/skills-engine/skill-state-machine.js';
import { suggestedNextVerificationAction } from '../../services/skillLabSignals.service.js';
import { buildSkillLabCoreSignals, type SkillLabProfileSliceInput } from '../../services/skillLabCore.service.js';

const SKILL_STATES = [
  'declared',
  'observed',
  'strengthening',
  'verified',
  'strong_signal',
] as const satisfies readonly SkillState[];

const skillStateZod = z.enum(SKILL_STATES);

const skillCategoryZod = z.enum(['hard', 'soft', 'language', 'domain', 'tool']);
const skillLevelZod = z.enum(['basic', 'intermediate', 'advanced', 'expert']);
const claimSourceZod = z.enum(['cv', 'linkedin', 'profile_form', 'manual_edit']);

const SKILL_LAB_GAP_DEBIT =
  FEATURE_COSTS.skill_lab_gap_analysis.kind === 'estimated'
    ? FEATURE_COSTS.skill_lab_gap_analysis.maxCost
    : FEATURE_COSTS.skill_lab_gap_analysis.cost;

function normalizeSkillKey(raw: string): string {
  return raw.trim().toLowerCase().slice(0, 128);
}

async function resolveProfileId(userId: string): Promise<string | null> {
  const row = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.userId, userId)).limit(1);
  return row[0]?.id ?? null;
}

/**
 * Skill Lab — state hints + persisted `skill_claims` (SkillUp schema).
 */
export const skillLabRouter = router({
  /**
   * Deterministic Skill Lab “intelligence” layer: value bands, CV signals, course→skill mapping, growth hooks.
   * No fabricated salaries — qualitative tiers only.
   */
  coreSignals: protectedProcedure.query(async ({ ctx }) => {
    const profileId = await resolveProfileId(ctx.user.id);

    const claimRows = await db
      .select({
        skillKey: skillClaims.skillKey,
        claimedLevel: skillClaims.claimedLevel,
        claimSource: skillClaims.claimSource,
      })
      .from(skillClaims)
      .where(and(eq(skillClaims.userId, ctx.user.id), eq(skillClaims.isActive, true)));

    const claims = claimRows.map((c) => ({
      skillKey: c.skillKey,
      claimedLevel: c.claimedLevel,
      claimSource: c.claimSource,
    }));

    let profileSlice: SkillLabProfileSliceInput = {
      summaryPresent: false,
      experienceCount: 0,
      educationCount: 0,
      profileSkillNames: [] as string[],
      trainingTitles: [] as Array<{ title: string; providerName?: string | null }>,
      recentJobTitles: [],
    };

    if (profileId) {
      const [p] = await db
        .select({ summary: profiles.summary })
        .from(profiles)
        .where(eq(profiles.id, profileId))
        .limit(1);
      const exRows = await db.select({ id: experiences.id }).from(experiences).where(eq(experiences.profileId, profileId));
      const edRows = await db.select({ id: educations.id }).from(educations).where(eq(educations.profileId, profileId));
      const skillRows = await db.select({ name: skills.name }).from(skills).where(eq(skills.profileId, profileId));
      const trainingRows = await db
        .select({ title: trainings.title, providerName: trainings.providerName })
        .from(trainings)
        .where(eq(trainings.profileId, profileId));
      const titleRows = await db
        .select({ jobTitle: experiences.jobTitle })
        .from(experiences)
        .where(eq(experiences.profileId, profileId))
        .limit(12);

      profileSlice = {
        summaryPresent: Boolean(p?.summary?.trim()),
        experienceCount: exRows.length,
        educationCount: edRows.length,
        profileSkillNames: skillRows.map((s) => s.name).filter(Boolean),
        trainingTitles: trainingRows.map((t) => ({ title: t.title, providerName: t.providerName })),
        recentJobTitles: titleRows.map((t) => t.jobTitle).filter((t): t is string => Boolean(t?.trim())),
      };
    }

    return buildSkillLabCoreSignals({ profile: profileSlice, claims });
  }),

  /**
   * Job-description / target-text gap analysis (same document engine as Style, billed as Skill Lab gap analysis).
   */
  analyzeJobGap: protectedProcedure
    .use(requireSpendApproval('skill_lab_gap_analysis'))
    .input(z.object({ text: z.string().min(1).max(5000) }))
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required' });
      }
      let spendFinalized = false;
      const commitAndReturn = async (out: AnalyzeDocumentResult) => {
        try {
          await settleSpendSuccess(ctx, SKILL_LAB_GAP_DEBIT, 'skillLab.analyzeJobGap');
          spendFinalized = true;
        } catch (e) {
          await settleSpendFailure(ctx, e instanceof Error ? e.message : 'commit_failed');
          spendFinalized = true;
          if (e instanceof BillingError) billingToTrpc(e);
          throw e;
        }
        return out;
      };

      try {
        const result: AnalyzeDocumentResult = await analyzeCareerDocumentText({
          clerkId: user.clerkId,
          text: input.text,
          documentType: 'skills',
        });
        return commitAndReturn(result);
      } catch (e) {
        if (!spendFinalized) {
          await settleSpendFailure(ctx, e instanceof Error ? e.message : 'skill_lab_gap_analysis_failed');
        }
        if (e instanceof BillingError) billingToTrpc(e);
        if (e instanceof TRPCError) throw e;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: e instanceof Error ? e.message : 'Gap analysis failed',
        });
      }
    }),

  listSkillStates: publicProcedure.query(() => ({
    states: SKILL_STATES,
    description:
      'Skill capability progression: Declared → Observed → Strengthening → Verified → Strong signal (see skill-state-machine).',
  })),

  promoteStateDemo: publicProcedure
    .input(z.object({ current: skillStateZod }))
    .query(({ input }) => ({
      current: input.current,
      next: promoteSkillState(input.current as SkillState),
    })),

  suggestedAction: publicProcedure
    .input(
      z.object({
        skill: z.string().min(1).max(200),
        state: skillStateZod,
        evidenceNotes: z.array(z.string().max(500)).max(20).default([]),
      }),
    )
    .query(({ input }) => {
      const record = {
        skill: input.skill,
        state: input.state as SkillState,
        evidence: input.evidenceNotes.map((note, i) => ({
          sourceModule: 'assistant' as const,
          note,
          createdAt: new Date(Date.now() - i * 60_000).toISOString(),
        })),
      };
      return {
        skill: input.skill,
        state: input.state,
        evidenceCount: record.evidence.length,
        suggestedNextVerificationAction: suggestedNextVerificationAction(record),
      };
    }),

  listClaims: protectedProcedure.query(async ({ ctx }) => {
    const rows = await db
      .select({
        id: skillClaims.id,
        skillKey: skillClaims.skillKey,
        skillCategory: skillClaims.skillCategory,
        claimedLevel: skillClaims.claimedLevel,
        claimSource: skillClaims.claimSource,
        claimText: skillClaims.claimText,
        isActive: skillClaims.isActive,
        updatedAt: skillClaims.updatedAt,
      })
      .from(skillClaims)
      .where(and(eq(skillClaims.userId, ctx.user.id), eq(skillClaims.isActive, true)));

    return { items: rows };
  }),

  upsertClaim: protectedProcedure
    .input(
      z.object({
        skillKey: z.string().min(1).max(128),
        skillCategory: skillCategoryZod,
        claimedLevel: skillLevelZod,
        claimSource: claimSourceZod.default('manual_edit'),
        claimText: z.string().max(2000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const key = normalizeSkillKey(input.skillKey);
      const existing = await db
        .select({ id: skillClaims.id })
        .from(skillClaims)
        .where(and(eq(skillClaims.userId, ctx.user.id), eq(skillClaims.skillKey, key)))
        .limit(1);

      if (existing[0]) {
        await db
          .update(skillClaims)
          .set({
            skillCategory: input.skillCategory,
            claimedLevel: input.claimedLevel,
            claimSource: input.claimSource,
            claimText: input.claimText ?? null,
            isActive: true,
            updatedAt: new Date(),
          })
          .where(eq(skillClaims.id, existing[0].id));
      } else {
        await db.insert(skillClaims).values({
          id: randomUUID(),
          userId: ctx.user.id,
          skillKey: key,
          skillCategory: input.skillCategory,
          claimedLevel: input.claimedLevel,
          claimSource: input.claimSource,
          claimText: input.claimText ?? null,
          isActive: true,
        });
      }

      const rows = await db
        .select({
          id: skillClaims.id,
          skillKey: skillClaims.skillKey,
          skillCategory: skillClaims.skillCategory,
          claimedLevel: skillClaims.claimedLevel,
          claimSource: skillClaims.claimSource,
          claimText: skillClaims.claimText,
          isActive: skillClaims.isActive,
          updatedAt: skillClaims.updatedAt,
        })
        .from(skillClaims)
        .where(and(eq(skillClaims.userId, ctx.user.id), eq(skillClaims.isActive, true)));

      return { items: rows };
    }),

  syncFromProfileSkills: protectedProcedure.mutation(async ({ ctx }) => {
    const profileId = await resolveProfileId(ctx.user.id);
    if (!profileId) {
      return { synced: 0 as const, items: [] as typeof skillClaims.$inferSelect[] };
    }

    const skillRows = await db.select({ name: skills.name }).from(skills).where(eq(skills.profileId, profileId));
    let n = 0;
    for (const { name } of skillRows) {
      const key = normalizeSkillKey(name);
      if (!key) continue;
      const existing = await db
        .select({ id: skillClaims.id })
        .from(skillClaims)
        .where(and(eq(skillClaims.userId, ctx.user.id), eq(skillClaims.skillKey, key)))
        .limit(1);

      if (existing[0]) {
        await db
          .update(skillClaims)
          .set({
            skillCategory: 'hard',
            claimedLevel: 'intermediate',
            claimSource: 'profile_form',
            claimText: 'Synced from profile skills',
            isActive: true,
            updatedAt: new Date(),
          })
          .where(eq(skillClaims.id, existing[0].id));
      } else {
        await db.insert(skillClaims).values({
          id: randomUUID(),
          userId: ctx.user.id,
          skillKey: key,
          skillCategory: 'hard',
          claimedLevel: 'intermediate',
          claimSource: 'profile_form',
          claimText: 'Synced from profile skills',
          isActive: true,
        });
      }
      n += 1;
    }

    const rows = await db
      .select({
        id: skillClaims.id,
        skillKey: skillClaims.skillKey,
        skillCategory: skillClaims.skillCategory,
        claimedLevel: skillClaims.claimedLevel,
        claimSource: skillClaims.claimSource,
        claimText: skillClaims.claimText,
        isActive: skillClaims.isActive,
        updatedAt: skillClaims.updatedAt,
      })
      .from(skillClaims)
      .where(and(eq(skillClaims.userId, ctx.user.id), eq(skillClaims.isActive, true)));

    return { synced: n, items: rows };
  }),
});
