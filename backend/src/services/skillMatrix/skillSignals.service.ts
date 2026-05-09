/**
 * Skill Signal Generation Service
 *
 * Generates typed signals for each user skill: strength, gap, market_trend,
 * salary_leverage, cv_value, verification_needed, learning_recommendation,
 * interview_risk. Every signal carries TrustMetadata.
 */

import { randomUUID } from 'crypto';
import { and, eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { matrixSkillSignals } from '../../db/schemas/skills-matrix.js';
import { EVIDENCE_LEVEL_SCORES } from './constants.js';
import { isEvidenceStale } from './skillEvidence.service.js';
import { buildTrustMetadata } from './trustMetadata.js';
import type {
    EvidenceLevel,
    SignalSeverity,
    SkillEvidenceRecord,
    SkillSignalType,
    TrustMetadata,
} from './types.js';

export interface GeneratedSignal {
    id: string;
    userId: string;
    skillId: string;
    signalType: SkillSignalType;
    title: string;
    explanation: string;
    severity: SignalSeverity;
    metadata: Record<string, unknown>;
    trustMetadata: TrustMetadata;
}

export interface SignalContext {
    userId: string;
    skillId: string;
    skillName: string;
    evidence: SkillEvidenceRecord[];
    marketDemandScore?: number; // 0–100
    isRequiredForTargetRole?: boolean;
    interviewFrequency?: number; // 0–1 how often it appears in interviews
}

/**
 * Generate all applicable signals for a skill given its context.
 */
export function generateSignals(ctx: SignalContext): GeneratedSignal[] {
    const signals: GeneratedSignal[] = [];
    const now = new Date();

    const highestLevel = getHighestEvidenceLevel(ctx.evidence);
    const avgConfidence = ctx.evidence.length > 0
        ? ctx.evidence.reduce((sum, e) => sum + e.confidence, 0) / ctx.evidence.length
        : 0;

    // Strength signal: high evidence + high market demand
    if (
        highestLevel &&
        EVIDENCE_LEVEL_SCORES[highestLevel] >= 60 &&
        (ctx.marketDemandScore ?? 0) >= 60
    ) {
        signals.push(buildSignal(ctx, 'strength', {
            title: `Strong ${ctx.skillName} profile`,
            explanation: `Your ${ctx.skillName} skill has solid evidence (${highestLevel} level) and is in high demand in your target market.`,
            severity: 'info',
            metadata: { highestLevel, marketDemand: ctx.marketDemandScore },
        }));
    }

    // Gap signal: required for target role but missing or weak
    if (ctx.isRequiredForTargetRole && (!highestLevel || EVIDENCE_LEVEL_SCORES[highestLevel] < 40)) {
        signals.push(buildSignal(ctx, 'gap', {
            title: `${ctx.skillName} gap for target role`,
            explanation: `${ctx.skillName} appears as a requirement for your target role, but your current evidence is limited. Building demonstrable experience could strengthen your applications.`,
            severity: 'warning',
            metadata: { highestLevel, isRequired: true },
        }));
    }

    // Verification needed: only declared evidence
    if (highestLevel === 'declared' && ctx.evidence.length > 0) {
        signals.push(buildSignal(ctx, 'verification_needed', {
            title: `${ctx.skillName} could benefit from verification`,
            explanation: `Your ${ctx.skillName} skill is currently self-declared. Adding a portfolio project, certificate, or GitHub contribution could significantly boost your evidence score.`,
            severity: 'info',
            metadata: { currentLevel: 'declared' },
        }));
    }

    // Interview risk: weak evidence + frequent interview topic
    if (
        (ctx.interviewFrequency ?? 0) > 0.5 &&
        (!highestLevel || EVIDENCE_LEVEL_SCORES[highestLevel] < 60)
    ) {
        signals.push(buildSignal(ctx, 'interview_risk', {
            title: `${ctx.skillName} may come up in interviews`,
            explanation: `${ctx.skillName} frequently appears in interview questions for your target role. Strengthening your evidence or practicing this topic could help you feel more prepared.`,
            severity: 'warning',
            metadata: { interviewFrequency: ctx.interviewFrequency, currentLevel: highestLevel },
        }));
    }

    // Market trend: high demand score
    if ((ctx.marketDemandScore ?? 0) >= 75) {
        signals.push(buildSignal(ctx, 'market_trend', {
            title: `${ctx.skillName} is trending in your market`,
            explanation: `Demand for ${ctx.skillName} is elevated in your target market. This skill appears frequently in recent listings.`,
            severity: 'info',
            metadata: { marketDemand: ctx.marketDemandScore },
        }));
    }

    // Stale evidence warning
    if (ctx.evidence.length > 0 && isEvidenceStale(ctx.evidence)) {
        signals.push(buildSignal(ctx, 'verification_needed', {
            title: `${ctx.skillName} evidence may be outdated`,
            explanation: `All evidence for ${ctx.skillName} is older than 24 months. Recent activity or a refresher project could update your profile.`,
            severity: 'warning',
            metadata: { stale: true },
        }));
    }

    return signals;
}

/**
 * Persist generated signals to the database.
 */
export async function saveSignals(signals: GeneratedSignal[]): Promise<void> {
    if (signals.length === 0) return;

    await db.insert(matrixSkillSignals).values(
        signals.map((s) => ({
            id: s.id,
            userId: s.userId,
            skillId: s.skillId,
            signalType: s.signalType,
            title: s.title,
            explanation: s.explanation,
            severity: s.severity,
            metadata: s.metadata,
            trustMetadata: s.trustMetadata,
            createdAt: new Date(),
            expiresAt: null,
        })),
    );
}

/**
 * Get all signals for a user.
 */
export async function getUserSignals(userId: string): Promise<GeneratedSignal[]> {
    const rows = await db
        .select()
        .from(matrixSkillSignals)
        .where(eq(matrixSkillSignals.userId, userId));

    return rows.map((r) => ({
        id: r.id,
        userId: r.userId,
        skillId: r.skillId,
        signalType: r.signalType as SkillSignalType,
        title: r.title,
        explanation: r.explanation,
        severity: r.severity as SignalSeverity,
        metadata: (r.metadata as Record<string, unknown>) ?? {},
        trustMetadata: r.trustMetadata as TrustMetadata,
    }));
}

/**
 * Get signals for a specific job context.
 */
export async function getSignalsForJob(
    userId: string,
    skillIds: string[],
): Promise<GeneratedSignal[]> {
    const allSignals = await getUserSignals(userId);
    return allSignals.filter((s) => skillIds.includes(s.skillId));
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getHighestEvidenceLevel(evidence: SkillEvidenceRecord[]): EvidenceLevel | null {
    if (evidence.length === 0) return null;
    return evidence.reduce((best, e) => {
        if (!best) return e.evidenceType;
        return EVIDENCE_LEVEL_SCORES[e.evidenceType] > EVIDENCE_LEVEL_SCORES[best]
            ? e.evidenceType
            : best;
    }, null as EvidenceLevel | null);
}

function buildSignal(
    ctx: SignalContext,
    signalType: SkillSignalType,
    params: { title: string; explanation: string; severity: SignalSeverity; metadata: Record<string, unknown> },
): GeneratedSignal {
    return {
        id: randomUUID(),
        userId: ctx.userId,
        skillId: ctx.skillId,
        signalType,
        title: params.title,
        explanation: params.explanation,
        severity: params.severity,
        metadata: params.metadata,
        trustMetadata: buildTrustMetadata({
            sourceName: 'Skills Matrix Engine',
            sourceType: 'scoring_engine',
            observedAt: new Date(),
            confidence: 0.75,
            explanationType: 'deterministic',
            userVisibleReason: `Signal generated from skill evidence analysis for ${ctx.skillName}`,
        }),
    };
}
