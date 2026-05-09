/**
 * Scoring tRPC Router
 *
 * Exposes Job Fit, Action Priority, Market Value scores, and paid AI actions.
 */

import { z } from 'zod';
import { protectedProcedure, router } from '../trpc.js';
import { computeActionPriority } from '../../services/scoring/actionPriority.js';
import { computeEmployerRisk } from '../../services/scoring/employerRisk.js';
import { computeEmployerTrust } from '../../services/scoring/employerTrust.js';
import { computeJobFit } from '../../services/scoring/jobFit.js';
import { computeMarketValue } from '../../services/scoring/marketValue.js';
import * as employerService from '../../services/employerIntel/employerIntel.service.js';
import * as evidenceService from '../../services/skillMatrix/skillEvidence.service.js';
import * as taxonomyService from '../../services/skillMatrix/skillTaxonomy.service.js';

export const scoringRouter = router({
    getJobFit: protectedProcedure
        .input(z.object({ jobId: z.string(), requiredSkills: z.array(z.object({ skillId: z.string(), skillName: z.string(), weight: z.number() })).optional() }))
        .query(async ({ ctx, input }) => {
            const evidence = await evidenceService.getUserEvidence(ctx.user.id);

            // Get user's skill IDs from evidence
            const userSkillIds = [...new Set(evidence.map((e) => e.skillId))];
            const userSkills = await Promise.all(
                userSkillIds.map(async (id) => {
                    const skill = await taxonomyService.getCanonicalSkill(id);
                    return { canonicalId: id, canonicalName: skill?.canonicalName ?? id };
                }),
            );

            // Use provided requirements or empty (would normally come from job data)
            const jobRequirements = input.requiredSkills ?? [];

            const result = computeJobFit({
                userSkills,
                jobRequirements,
                userEvidence: evidence,
                skillRelationships: [],
            });

            return result;
        }),

    getActionPriority: protectedProcedure
        .input(z.object({ jobId: z.string(), employerId: z.string().optional() }))
        .query(async ({ ctx, input }) => {
            const evidence = await evidenceService.getUserEvidence(ctx.user.id);

            // Compute job fit (simplified — would normally use job requirements)
            const userSkillIds = [...new Set(evidence.map((e) => e.skillId))];
            const userSkills = userSkillIds.map((id) => ({ canonicalId: id, canonicalName: id }));
            const jobFitResult = computeJobFit({
                userSkills,
                jobRequirements: [],
                userEvidence: evidence,
                skillRelationships: [],
            });

            // Compute employer scores if employer provided
            let employerTrust = 50;
            let employerRisk = 20;

            if (input.employerId) {
                const profile = await employerService.getEmployerProfile(input.employerId);
                if (profile) {
                    employerTrust = computeEmployerTrust(profile.signals, profile.sources.length);
                    employerRisk = computeEmployerRisk(profile.signals);
                }
            }

            const result = computeActionPriority({
                jobFit: jobFitResult.score,
                employerTrust,
                employerRisk,
                marketValue: 50, // Default; would be computed from market data
                skillReadiness: 50,
            });

            return result;
        }),

    getMarketValue: protectedProcedure.query(async ({ ctx }) => {
        // Simplified — would normally use real market data
        const evidence = await evidenceService.getUserEvidence(ctx.user.id);
        const userSkillIds = [...new Set(evidence.map((e) => e.skillId))];
        const userSkills = userSkillIds.map((id) => ({ canonicalId: id, canonicalName: id }));

        const result = computeMarketValue({
            userSkills,
            targetRoleListings: [], // Would come from job ingestion
            targetMarket: 'uk',
        });

        return result;
    }),

    disagreeWithScore: protectedProcedure
        .input(z.object({
            scoreType: z.string(),
            entityId: z.string(),
            reason: z.string().max(500).optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            // Record disagreement for feedback loop
            console.log(`[Scoring] Score disagreement from ${ctx.user.id}:`, {
                scoreType: input.scoreType,
                entityId: input.entityId,
                reason: input.reason,
            });
            return { success: true };
        }),
});
