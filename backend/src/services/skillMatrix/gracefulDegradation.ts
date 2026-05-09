/**
 * Graceful Degradation
 *
 * Fallback logic when the new scoring system is unavailable.
 * Falls back to existing services for continuity.
 */

import type { ActionPriorityInput, JobFitInput } from './types.js';

/**
 * Attempt to compute job fit using the new system.
 * Falls back to a simplified score if the new system throws.
 */
export async function computeJobFitWithFallback(
    input: JobFitInput,
    newSystemFn: (input: JobFitInput) => { score: number; perSkillContribution: any[] },
): Promise<{ score: number; perSkillContribution: any[]; usedFallback: boolean }> {
    try {
        const result = newSystemFn(input);
        return { ...result, usedFallback: false };
    } catch (error) {
        console.warn('[GracefulDegradation] New scoring unavailable, using fallback:', error);

        // Simplified fallback: percentage of required skills the user has
        const matched = input.jobRequirements.filter((req) =>
            input.userSkills.some((us) => us.canonicalId === req.skillId),
        );
        const score = input.jobRequirements.length > 0
            ? Math.round((matched.length / input.jobRequirements.length) * 100)
            : 0;

        return {
            score,
            perSkillContribution: matched.map((m) => ({
                skillId: m.skillId,
                skillName: m.skillName,
                evidenceLevel: 'declared',
                contribution: m.weight,
                matched: true,
            })),
            usedFallback: true,
        };
    }
}

/**
 * Attempt to compute employer trust/risk using the new system.
 * Falls back to neutral scores if unavailable.
 */
export function computeEmployerScoresWithFallback(
    employerId: string,
    newSystemFn: () => { trust: number; risk: number },
): { trust: number; risk: number; usedFallback: boolean } {
    try {
        const result = newSystemFn();
        return { ...result, usedFallback: false };
    } catch (error) {
        console.warn('[GracefulDegradation] Employer scoring unavailable, using neutral fallback');
        return { trust: 50, risk: 20, usedFallback: true };
    }
}

/**
 * Check if the new scoring system is available (tables exist, service healthy).
 * Used by Job Radar to decide whether to show new scores or legacy fitScore.
 */
export async function isNewScoringAvailable(): Promise<boolean> {
    try {
        // Simple health check — try to import and call a pure function
        const { computeSkillReadiness } = await import('../scoring/skillReadiness.js');
        const testResult = computeSkillReadiness({
            claimedLevel: 50,
            requiredLevel: 50,
            evidence: [],
            relationships: [],
            marketDemandScore: 50,
            roleRelevanceScore: 50,
        });
        return typeof testResult === 'number' && testResult >= 0;
    } catch {
        return false;
    }
}
