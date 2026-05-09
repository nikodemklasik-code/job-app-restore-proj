/**
 * AI-Powered Market Comparison (Paid Feature)
 *
 * Comparative analysis of user's skill portfolio against market demand.
 * Identifies above/below market skills and emerging trends.
 */

import { buildTrustMetadata } from '../skillMatrix/trustMetadata.js';
import type { TrustMetadata } from '../skillMatrix/types.js';

export interface MarketComparisonInput {
    userSkills: Array<{ skillId: string; skillName: string; evidenceLevel: string; confidence: number }>;
    marketData: {
        targetRole: string;
        geography: string;
        totalListings: number;
        salaryP25: number;
        salaryMedian: number;
        salaryP75: number;
        highDemandSkills: Array<{ skillId: string; skillName: string; frequency: number; trending: 'up' | 'stable' | 'down' }>;
    };
}

export interface MarketComparisonResult {
    aboveMarket: Array<{ skillName: string; reason: string }>;
    belowMarket: Array<{ skillName: string; reason: string }>;
    emergingSkills: Array<{ skillName: string; growthRate: string }>;
    salaryInsights: {
        p25: number;
        median: number;
        p75: number;
        sampleSize: number;
        confidence: string;
        userPosition: string;
    };
    summary: string;
    trustMetadata: TrustMetadata;
}

/**
 * Generate market comparison analysis.
 */
export function generateMarketComparison(input: MarketComparisonInput): MarketComparisonResult {
    const { userSkills, marketData } = input;

    const userSkillIds = new Set(userSkills.map((s) => s.skillId));

    // Above market: user has strong evidence for declining-demand skills
    const aboveMarket = marketData.highDemandSkills
        .filter((hd) => hd.trending === 'down' && userSkillIds.has(hd.skillId))
        .map((hd) => {
            const userSkill = userSkills.find((s) => s.skillId === hd.skillId)!;
            return {
                skillName: hd.skillName,
                reason: `Strong evidence (${userSkill.evidenceLevel}) but demand appears to be declining in ${marketData.geography}`,
            };
        });

    // Below market: weak evidence for rising-demand skills
    const belowMarket = marketData.highDemandSkills
        .filter((hd) => {
            if (!userSkillIds.has(hd.skillId)) return hd.trending === 'up';
            const userSkill = userSkills.find((s) => s.skillId === hd.skillId);
            return userSkill && userSkill.confidence < 0.5 && hd.trending === 'up';
        })
        .map((hd) => ({
            skillName: hd.skillName,
            reason: `Rising demand (${Math.round(hd.frequency * 100)}% of listings) but your evidence is limited or absent`,
        }));

    // Emerging skills: high demand + trending up + user doesn't have
    const emergingSkills = marketData.highDemandSkills
        .filter((hd) => hd.trending === 'up' && !userSkillIds.has(hd.skillId) && hd.frequency >= 0.3)
        .map((hd) => ({
            skillName: hd.skillName,
            growthRate: `Appears in ${Math.round(hd.frequency * 100)}% of recent listings, trending upward`,
        }));

    // Salary insights
    const confidence = marketData.totalListings >= 100 ? 'high' : marketData.totalListings >= 50 ? 'moderate' : 'low';
    const userCoverage = marketData.highDemandSkills.filter((hd) => userSkillIds.has(hd.skillId)).length / Math.max(1, marketData.highDemandSkills.length);
    const userPosition = userCoverage >= 0.8 ? 'above median' : userCoverage >= 0.5 ? 'around median' : 'below median';

    const summary = [
        `Market comparison for ${marketData.targetRole} in ${marketData.geography}:`,
        aboveMarket.length > 0 ? `${aboveMarket.length} skill${aboveMarket.length > 1 ? 's' : ''} where you exceed current market demand.` : '',
        belowMarket.length > 0 ? `${belowMarket.length} skill${belowMarket.length > 1 ? 's' : ''} where market demand outpaces your current evidence.` : '',
        emergingSkills.length > 0 ? `${emergingSkills.length} emerging skill${emergingSkills.length > 1 ? 's' : ''} showing rapid growth in your target market.` : '',
        `Based on ${marketData.totalListings} listings. Your skill portfolio positions you ${userPosition} for compensation.`,
    ].filter(Boolean).join(' ');

    return {
        aboveMarket,
        belowMarket,
        emergingSkills,
        salaryInsights: {
            p25: marketData.salaryP25,
            median: marketData.salaryMedian,
            p75: marketData.salaryP75,
            sampleSize: marketData.totalListings,
            confidence,
            userPosition,
        },
        summary,
        trustMetadata: buildTrustMetadata({
            sourceName: 'Market Comparison Engine',
            sourceType: 'scoring_engine',
            observedAt: new Date(),
            confidence: confidence === 'high' ? 0.85 : confidence === 'moderate' ? 0.65 : 0.45,
            explanationType: 'deterministic',
            userVisibleReason: `Comparison based on ${marketData.totalListings} listings in ${marketData.geography} for ${marketData.targetRole}`,
        }),
    };
}
