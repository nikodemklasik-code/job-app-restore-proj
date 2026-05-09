/**
 * Employer Intelligence tRPC Router
 *
 * Exposes employer profiles, signals, trust/risk scores, and feedback endpoints.
 */

import { z } from 'zod';
import { protectedProcedure, router } from '../trpc.js';
import * as employerService from '../../services/employerIntel/employerIntel.service.js';
import { computeEmployerTrust } from '../../services/scoring/employerTrust.js';
import { computeEmployerRisk } from '../../services/scoring/employerRisk.js';

const signalCategorySchema = z.enum([
    'identity_credibility',
    'offer_transparency',
    'compensation_benefits',
    'business_stability',
    'culture_management',
    'recruitment_process',
    'technology_maturity',
    'uk_local_risks',
    'scam_fraud',
]);

export const employerIntelRouter = router({
    getEmployerProfile: protectedProcedure
        .input(z.object({ employerId: z.string() }))
        .query(async ({ input }) => {
            return employerService.getEmployerProfile(input.employerId);
        }),

    getEmployerByName: protectedProcedure
        .input(z.object({ name: z.string().min(1) }))
        .query(async ({ input }) => {
            return employerService.findEmployerByName(input.name);
        }),

    getSignalsByCategory: protectedProcedure
        .input(z.object({
            employerId: z.string(),
            category: signalCategorySchema.optional(),
        }))
        .query(async ({ input }) => {
            return employerService.getSignalsByCategory(input.employerId, input.category);
        }),

    getTrustRiskScores: protectedProcedure
        .input(z.object({ employerId: z.string() }))
        .query(async ({ input }) => {
            const profile = await employerService.getEmployerProfile(input.employerId);
            if (!profile) return null;

            const trustScore = computeEmployerTrust(profile.signals, profile.sources.length);
            const riskScore = computeEmployerRisk(profile.signals);

            return {
                employerId: input.employerId,
                employerName: profile.name,
                trustScore,
                riskScore,
                sourceCount: profile.sources.length,
                signalCount: profile.signals.length,
            };
        }),

    getUkSignals: protectedProcedure
        .input(z.object({ employerId: z.string() }))
        .query(async ({ input }) => {
            return employerService.getSignalsByCategory(input.employerId, 'uk_local_risks');
        }),

    reportSignalInaccuracy: protectedProcedure
        .input(z.object({ signalId: z.string(), reason: z.string().max(500) }))
        .mutation(async ({ ctx, input }) => {
            // Record the feedback — in a full implementation this would update signal confidence
            // and record a telemetry event
            console.log(`[EmployerIntel] Signal inaccuracy reported by ${ctx.user.id}:`, {
                signalId: input.signalId,
                reason: input.reason,
            });
            return { success: true };
        }),
});
