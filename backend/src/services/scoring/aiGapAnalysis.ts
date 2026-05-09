/**
 * AI-Powered Skill Gap Analysis (Paid Feature)
 *
 * Generates comprehensive gap analysis with learning recommendations,
 * time-to-close estimates, and signal language.
 */

import { buildTrustMetadata } from '../skillMatrix/trustMetadata.js';
import type { EvidenceLevel, SkillEvidenceRecord, TrustMetadata } from '../skillMatrix/types.js';
import { EVIDENCE_LEVEL_SCORES } from '../skillMatrix/constants.js';

export interface GapAnalysisInput {
    userId: string;
    userSkills: Array<{ skillId: string; skillName: string; evidenceLevel: EvidenceLevel; confidence: number }>;
    targetRoleRequirements: Array<{ skillId: string; skillName: string; weight: number; frequency: number }>;
    targetRole?: string;
}

export interface SkillGap {
    skillId: string;
    skillName: string;
    severity: 'critical' | 'important' | 'nice_to_have';
    currentLevel: EvidenceLevel | null;
    targetLevel: EvidenceLevel;
    frequency: number;
    salaryImpact: number;
    recommendation: string;
    estimatedWeeksToClose: number;
    suggestedActions: string[];
}

export interface GapAnalysisResult {
    gaps: SkillGap[];
    summary: string;
    totalGaps: number;
    criticalGaps: number;
    estimatedFitImprovement: number;
    trustMetadata: TrustMetadata;
}

/**
 * Generate skill gap analysis.
 * Uses deterministic heuristics with signal language.
 */
export function generateGapAnalysis(input: GapAnalysisInput): GapAnalysisResult {
    const gaps: SkillGap[] = [];

    for (const req of input.targetRoleRequirements) {
        const userSkill = input.userSkills.find((s) => s.skillId === req.skillId);

        if (!userSkill || EVIDENCE_LEVEL_SCORES[userSkill.evidenceLevel] < 60) {
            const currentLevel = userSkill?.evidenceLevel ?? null;
            const severity = req.frequency >= 0.7 ? 'critical' : req.frequency >= 0.4 ? 'important' : 'nice_to_have';

            gaps.push({
                skillId: req.skillId,
                skillName: req.skillName,
                severity,
                currentLevel,
                targetLevel: 'demonstrated',
                frequency: req.frequency,
                salaryImpact: Math.round(req.frequency * req.weight * 15),
                recommendation: generateRecommendation(req.skillName, currentLevel, severity),
                estimatedWeeksToClose: estimateTimeToClose(currentLevel),
                suggestedActions: generateActions(req.skillName, currentLevel),
            });
        }
    }

    // Sort by severity then frequency
    gaps.sort((a, b) => {
        const severityOrder = { critical: 0, important: 1, nice_to_have: 2 };
        if (severityOrder[a.severity] !== severityOrder[b.severity]) {
            return severityOrder[a.severity] - severityOrder[b.severity];
        }
        return b.frequency - a.frequency;
    });

    const criticalGaps = gaps.filter((g) => g.severity === 'critical').length;
    const estimatedFitImprovement = Math.min(30, criticalGaps * 8 + (gaps.length - criticalGaps) * 3);

    const role = input.targetRole ?? 'your target role';
    const summary = gaps.length === 0
        ? `Your skill profile appears well-aligned with ${role}. No significant gaps detected.`
        : `${gaps.length} skill gap${gaps.length > 1 ? 's' : ''} identified for ${role}. ${criticalGaps} appear${criticalGaps === 1 ? 's' : ''} in 70%+ of listings. Addressing these could improve your fit score by approximately ${estimatedFitImprovement} points.`;

    return {
        gaps,
        summary,
        totalGaps: gaps.length,
        criticalGaps,
        estimatedFitImprovement,
        trustMetadata: buildTrustMetadata({
            sourceName: 'Gap Analysis Engine',
            sourceType: 'scoring_engine',
            observedAt: new Date(),
            confidence: 0.7,
            explanationType: 'deterministic',
            userVisibleReason: 'Analysis based on job listing frequency and your current evidence levels',
        }),
    };
}

function generateRecommendation(skillName: string, currentLevel: EvidenceLevel | null, severity: string): string {
    if (!currentLevel) {
        return `${skillName} appears in ${severity === 'critical' ? 'most' : 'many'} listings for your target role. Building demonstrable experience through a project or course could strengthen your applications.`;
    }
    if (currentLevel === 'declared') {
        return `${skillName} is currently self-declared. Adding a portfolio project, open-source contribution, or certification could move your evidence from declared to demonstrated.`;
    }
    return `Your ${skillName} evidence could be strengthened. Consider a recent project or refresher to update your profile.`;
}

function estimateTimeToClose(currentLevel: EvidenceLevel | null): number {
    if (!currentLevel) return 8;
    switch (currentLevel) {
        case 'declared': return 6;
        case 'observed': return 4;
        case 'demonstrated': return 2;
        default: return 4;
    }
}

function generateActions(skillName: string, currentLevel: EvidenceLevel | null): string[] {
    const actions: string[] = [];
    if (!currentLevel || currentLevel === 'declared') {
        actions.push(`Complete a hands-on project using ${skillName}`);
        actions.push(`Contribute to an open-source ${skillName} project`);
        actions.push(`Take a certification or structured course`);
    } else {
        actions.push(`Build a recent portfolio piece showcasing ${skillName}`);
        actions.push(`Write a technical blog post about ${skillName}`);
    }
    return actions;
}
