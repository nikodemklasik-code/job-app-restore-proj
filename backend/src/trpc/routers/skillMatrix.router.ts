/**
 * Skill Matrix tRPC Router
 *
 * Exposes skill taxonomy, evidence, signals, and scoring endpoints.
 */

import { z } from 'zod';
import { protectedProcedure, router } from '../trpc.js';
import * as taxonomyService from '../../services/skillMatrix/skillTaxonomy.service.js';
import * as evidenceService from '../../services/skillMatrix/skillEvidence.service.js';
import * as signalsService from '../../services/skillMatrix/skillSignals.service.js';
import { computeSkillReadiness } from '../../services/scoring/skillReadiness.js';
import { computeEvidenceStrength } from '../../services/scoring/evidenceStrength.js';

export const skillMatrixRouter = router({
    // ── Taxonomy ─────────────────────────────────────────────────────────────

    searchSkills: protectedProcedure
        .input(z.object({ query: z.string().min(1).max(200), limit: z.number().max(50).default(20) }))
        .query(async ({ input }) => {
            return taxonomyService.searchSkills(input.query, input.limit);
        }),

    getSkillDetails: protectedProcedure
        .input(z.object({ skillId: z.string() }))
        .query(async ({ input }) => {
            const skill = await taxonomyService.getCanonicalSkill(input.skillId);
            if (!skill) return null;
            const relationships = await taxonomyService.getRelatedSkills(input.skillId);
            return { ...skill, relationships };
        }),

    resolveSkill: protectedProcedure
        .input(z.object({ name: z.string().min(1).max(200) }))
        .mutation(async ({ input }) => {
            return taxonomyService.resolveSkill(input.name);
        }),

    // ── Evidence ─────────────────────────────────────────────────────────────

    getUserEvidence: protectedProcedure.query(async ({ ctx }) => {
        return evidenceService.getUserEvidence(ctx.user.id);
    }),

    addEvidence: protectedProcedure
        .input(
            z.object({
                skillId: z.string(),
                sourceType: z.enum(['cv', 'github', 'portfolio', 'certificate', 'interview', 'profile', 'job_listing']),
                sourceId: z.string().optional(),
                evidenceText: z.string().min(1).max(2000),
                evidenceUrl: z.string().url().optional(),
                occurredAt: z.string().datetime().optional(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            return evidenceService.addEvidence({
                userId: ctx.user.id,
                skillId: input.skillId,
                sourceType: input.sourceType,
                sourceId: input.sourceId,
                evidenceText: input.evidenceText,
                evidenceUrl: input.evidenceUrl,
                occurredAt: input.occurredAt ? new Date(input.occurredAt) : null,
            });
        }),

    confirmEvidence: protectedProcedure
        .input(z.object({ evidenceId: z.string(), confirmed: z.boolean() }))
        .mutation(async ({ input }) => {
            await evidenceService.confirmEvidence(input.evidenceId, input.confirmed);
            return { success: true };
        }),

    // ── Signals ──────────────────────────────────────────────────────────────

    getUserSignals: protectedProcedure.query(async ({ ctx }) => {
        return signalsService.getUserSignals(ctx.user.id);
    }),

    getSignalsForJob: protectedProcedure
        .input(z.object({ skillIds: z.array(z.string()) }))
        .query(async ({ ctx, input }) => {
            return signalsService.getSignalsForJob(ctx.user.id, input.skillIds);
        }),

    // ── Scores ───────────────────────────────────────────────────────────────

    getSkillReadiness: protectedProcedure
        .input(z.object({ skillId: z.string() }))
        .query(async ({ ctx, input }) => {
            const evidence = await evidenceService.getEvidenceForSkill(ctx.user.id, input.skillId);
            const relationships = await taxonomyService.getRelatedSkills(input.skillId);

            const score = computeSkillReadiness({
                claimedLevel: 50, // Default; could be enhanced with user profile data
                requiredLevel: 70,
                evidence,
                relationships,
                marketDemandScore: 50, // Default; could be enhanced with market data
                roleRelevanceScore: 50,
            });

            const evidenceStrength = computeEvidenceStrength(evidence);

            return { score, evidenceStrength, evidenceCount: evidence.length };
        }),

    getPortfolioOverview: protectedProcedure.query(async ({ ctx }) => {
        const evidence = await evidenceService.getUserEvidence(ctx.user.id);
        const signals = await signalsService.getUserSignals(ctx.user.id);

        // Group evidence by skill
        const skillMap = new Map<string, typeof evidence>();
        for (const e of evidence) {
            const existing = skillMap.get(e.skillId) ?? [];
            existing.push(e);
            skillMap.set(e.skillId, existing);
        }

        // Compute readiness per skill
        const skills = await Promise.all(
            Array.from(skillMap.entries()).map(async ([skillId, skillEvidence]) => {
                const skill = await taxonomyService.getCanonicalSkill(skillId);
                const relationships = await taxonomyService.getRelatedSkills(skillId);
                const readiness = computeSkillReadiness({
                    claimedLevel: 50,
                    requiredLevel: 70,
                    evidence: skillEvidence,
                    relationships,
                    marketDemandScore: 50,
                    roleRelevanceScore: 50,
                });
                const strength = computeEvidenceStrength(skillEvidence);

                return {
                    skillId,
                    skillName: skill?.canonicalName ?? skillId,
                    category: skill?.category ?? 'tool',
                    readinessScore: readiness,
                    evidenceStrength: strength,
                    evidenceCount: skillEvidence.length,
                    isStale: evidenceService.isEvidenceStale(skillEvidence),
                };
            }),
        );

        return {
            skills,
            signals,
            totalSkills: skills.length,
            averageReadiness: skills.length > 0
                ? Math.round(skills.reduce((sum, s) => sum + s.readinessScore, 0) / skills.length)
                : 0,
        };
    }),
});
