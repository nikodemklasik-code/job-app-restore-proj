/**
 * Market Value Score (0–100)
 *
 * Represents the market value of a user's skill portfolio for their target role.
 * Considers job listing frequency, salary correlation, and coverage of high-demand skills.
 *
 * Pure function — no side effects, deterministic output.
 */

import { COVERAGE_BONUS, MIN_LISTINGS_FULL_CONFIDENCE } from '../skillMatrix/constants.js';
import type { MarketValueInput } from '../skillMatrix/types.js';

export interface MarketValueResult {
    score: number;
    lowConfidence: boolean;
}

/**
 * Compute salary leverage for a skill based on listings that require it.
 * Skills that appear in higher-salary listings get higher leverage.
 */
function computeSalaryLeverage(
    skillId: string,
    listings: MarketValueInput['targetRoleListings'],
): number {
    const withSkill = listings.filter((l) => l.requiredSkills.includes(skillId));
    const withoutSkill = listings.filter((l) => !l.requiredSkills.includes(skillId));

    if (withSkill.length === 0 || withoutSkill.length === 0) return 1.0;

    const avgWithSkill =
        withSkill.reduce((sum, l) => sum + ((l.salaryMax ?? l.salaryMin ?? 0) + (l.salaryMin ?? 0)) / 2, 0) /
        withSkill.length;
    const avgWithoutSkill =
        withoutSkill.reduce((sum, l) => sum + ((l.salaryMax ?? l.salaryMin ?? 0) + (l.salaryMin ?? 0)) / 2, 0) /
        withoutSkill.length;

    if (avgWithoutSkill === 0) return 1.0;

    // Leverage is the ratio of salary with skill vs without, capped at 2.0
    return Math.min(2.0, Math.max(0.5, avgWithSkill / avgWithoutSkill));
}

/**
 * Get high-demand skills (appear in >30% of listings).
 */
function getHighDemandSkills(
    listings: MarketValueInput['targetRoleListings'],
): Array<{ skillId: string; frequency: number }> {
    const skillCounts: Record<string, number> = {};

    for (const listing of listings) {
        for (const skillId of listing.requiredSkills) {
            skillCounts[skillId] = (skillCounts[skillId] ?? 0) + 1;
        }
    }

    const threshold = listings.length * 0.3;
    return Object.entries(skillCounts)
        .filter(([, count]) => count >= threshold)
        .map(([skillId, count]) => ({ skillId, frequency: count / listings.length }));
}

/**
 * Compute Market Value Score.
 */
export function computeMarketValue(input: MarketValueInput): MarketValueResult {
    const { userSkills, targetRoleListings } = input;

    if (userSkills.length === 0 || targetRoleListings.length === 0) {
        return { score: 0, lowConfidence: true };
    }

    const lowConfidence = targetRoleListings.length < MIN_LISTINGS_FULL_CONFIDENCE;

    // Compute demand frequency and salary leverage for each user skill
    const skillDemand = userSkills.map((skill) => {
        const frequency =
            targetRoleListings.filter((listing) => listing.requiredSkills.includes(skill.canonicalId))
                .length / targetRoleListings.length;

        const salaryLeverage = computeSalaryLeverage(skill.canonicalId, targetRoleListings);

        return { skill, frequency, salaryLeverage };
    });

    // Weighted score by salary leverage
    const weightedScore =
        skillDemand.reduce((sum, { frequency, salaryLeverage }) => {
            return sum + frequency * salaryLeverage * 100;
        }, 0) / Math.max(1, skillDemand.length);

    // Coverage bonus: if user covers 80%+ of high-demand skills, score > 70
    const highDemandSkills = getHighDemandSkills(targetRoleListings);
    const coverage =
        highDemandSkills.length === 0
            ? 0
            : highDemandSkills.filter((hd) =>
                userSkills.some((us) => us.canonicalId === hd.skillId),
            ).length / highDemandSkills.length;

    let coverageBonus = 0;
    if (coverage >= COVERAGE_BONUS.high.threshold) {
        coverageBonus = COVERAGE_BONUS.high.bonus;
    } else if (coverage >= COVERAGE_BONUS.medium.threshold) {
        coverageBonus = COVERAGE_BONUS.medium.bonus;
    }

    const score = Math.round(Math.min(100, Math.max(0, weightedScore + coverageBonus)));

    return { score, lowConfidence };
}
