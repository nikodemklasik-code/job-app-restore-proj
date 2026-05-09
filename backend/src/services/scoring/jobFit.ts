/**
 * Job Fit Score (0–100)
 *
 * Evidence-weighted skill matching against job requirements.
 * Higher evidence levels produce higher contribution.
 * Transferable skills count as partial matches.
 *
 * Pure function — no side effects, deterministic output.
 */

import { EVIDENCE_FIT_MULTIPLIERS } from '../skillMatrix/constants.js';
import type {
    EvidenceLevel,
    JobFitInput,
    JobFitResult,
    SkillEvidenceRecord,
    SkillRelationship,
    TrustMetadata,
} from '../skillMatrix/types.js';

/**
 * Find the best evidence record for a given skill.
 * Selects highest confidence, most-recent as tiebreaker.
 */
function getBestEvidence(
    evidence: SkillEvidenceRecord[],
    skillId: string,
): SkillEvidenceRecord | null {
    const matching = evidence.filter((e) => e.skillId === skillId);
    if (matching.length === 0) return null;

    return matching.sort((a, b) => {
        if (b.confidence !== a.confidence) return b.confidence - a.confidence;
        const aTime = a.occurredAt?.getTime() ?? 0;
        const bTime = b.occurredAt?.getTime() ?? 0;
        return bTime - aTime;
    })[0];
}

/**
 * Find a transferable skill match via relationships.
 */
function findTransferableMatch(
    targetSkillId: string,
    userSkills: Array<{ canonicalId: string }>,
    relationships: SkillRelationship[],
): { fromSkillId: string; strength: number } | null {
    // Look for relationships where toSkillId matches the target
    // and fromSkillId is in the user's skill set
    for (const rel of relationships) {
        if (
            rel.toSkillId === targetSkillId &&
            (rel.relationType === 'related' || rel.relationType === 'parent') &&
            userSkills.some((us) => us.canonicalId === rel.fromSkillId)
        ) {
            return { fromSkillId: rel.fromSkillId, strength: rel.strength };
        }
    }
    return null;
}

/**
 * Compute Job Fit Score with per-skill contribution breakdown.
 */
export function computeJobFit(input: JobFitInput): {
    score: number;
    perSkillContribution: JobFitResult['perSkillContribution'];
} {
    const { userSkills, jobRequirements, userEvidence, skillRelationships } = input;

    if (jobRequirements.length === 0) {
        return { score: 0, perSkillContribution: [] };
    }

    const perSkillContribution = jobRequirements.map((req) => {
        const userSkill = userSkills.find((us) => us.canonicalId === req.skillId);

        if (!userSkill) {
            // Check transferable skills
            const transferable = findTransferableMatch(req.skillId, userSkills, skillRelationships);
            if (transferable) {
                return {
                    skillId: req.skillId,
                    skillName: req.skillName,
                    evidenceLevel: 'declared' as EvidenceLevel,
                    contribution: 0.4 * req.weight * transferable.strength,
                    matched: false,
                    transferredFrom: transferable.fromSkillId,
                };
            }
            return {
                skillId: req.skillId,
                skillName: req.skillName,
                evidenceLevel: null,
                contribution: 0,
                matched: false,
            };
        }

        const bestEvidence = getBestEvidence(userEvidence, userSkill.canonicalId);
        const evidenceLevel: EvidenceLevel = bestEvidence?.evidenceType ?? 'declared';
        const evidenceMultiplier = EVIDENCE_FIT_MULTIPLIERS[evidenceLevel];

        return {
            skillId: req.skillId,
            skillName: req.skillName,
            evidenceLevel,
            contribution: req.weight * evidenceMultiplier,
            matched: true,
        };
    });

    const totalWeight = jobRequirements.reduce((sum, r) => sum + r.weight, 0);
    const achievedWeight = perSkillContribution.reduce((sum, c) => sum + c.contribution, 0);
    const score = Math.round((achievedWeight / Math.max(1, totalWeight)) * 100);

    return {
        score: Math.min(100, Math.max(0, score)),
        perSkillContribution,
    };
}
