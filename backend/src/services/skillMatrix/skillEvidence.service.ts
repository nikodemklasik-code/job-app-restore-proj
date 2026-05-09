/**
 * Skill Evidence Service
 *
 * Manages skill evidence records — adding, classifying, confirming, and
 * selecting the best evidence for scoring. Integrates with the existing
 * SkillUp `skill_evidence` table.
 */

import { randomUUID } from 'crypto';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { skillEvidence as skillEvidenceTable } from '../../db/schemas/skillup.js';
import { STALE_EVIDENCE_MONTHS } from './constants.js';
import { classifyEvidenceLevel, computeSourceConfidence, isEvidenceStale } from './skillEvidenceUtils.js';
import type { EvidenceLevel, EvidenceSourceType, SkillEvidenceRecord } from './types.js';

// Re-export pure functions for backward compatibility
export { classifyEvidenceLevel, computeSourceConfidence, isEvidenceStale } from './skillEvidenceUtils.js';

// ── Service Functions ────────────────────────────────────────────────────────

export interface AddEvidenceInput {
    userId: string;
    skillId: string;
    sourceType: EvidenceSourceType;
    sourceId?: string | null;
    evidenceText: string;
    evidenceUrl?: string | null;
    occurredAt?: Date | null;
    confidence?: number;
}

/**
 * Add a new evidence record for a user's skill.
 */
export async function addEvidence(input: AddEvidenceInput): Promise<SkillEvidenceRecord> {
    const id = randomUUID();
    const evidenceType = classifyEvidenceLevel(input.sourceType, input.occurredAt ?? null);
    const confidence = input.confidence ?? computeSourceConfidence(input.sourceType);

    await db.insert(skillEvidenceTable).values({
        id,
        userId: input.userId,
        skillKey: input.skillId,
        sourceType: input.sourceType as any,
        sourceRefId: input.sourceId ?? null,
        evidenceDirection: 'supports',
        evidenceStrength: confidence >= 0.8 ? 'high' : confidence >= 0.5 ? 'medium' : 'low',
        observedLevel: evidenceType === 'verified' ? 'expert' : evidenceType === 'demonstrated' ? 'advanced' : 'intermediate',
        evidenceText: input.evidenceText,
        structuredPayload: {
            evidenceUrl: input.evidenceUrl ?? null,
            occurredAt: input.occurredAt?.toISOString() ?? null,
            verifiedByUser: null,
            matrixEvidenceType: evidenceType,
            matrixConfidence: confidence,
        },
        freshnessScore: computeFreshnessScore(input.occurredAt ?? null),
        confidence: confidence >= 0.8 ? 'high' : confidence >= 0.5 ? 'medium' : 'low',
        createdAt: new Date(),
    });

    return {
        id,
        userId: input.userId,
        skillId: input.skillId,
        sourceType: input.sourceType,
        evidenceType,
        evidenceText: input.evidenceText,
        evidenceUrl: input.evidenceUrl ?? null,
        occurredAt: input.occurredAt ?? null,
        confidence,
        verifiedByUser: null,
    };
}

/**
 * Get all evidence records for a specific skill of a user.
 */
export async function getEvidenceForSkill(
    userId: string,
    skillId: string,
): Promise<SkillEvidenceRecord[]> {
    const rows = await db
        .select()
        .from(skillEvidenceTable)
        .where(and(eq(skillEvidenceTable.userId, userId), eq(skillEvidenceTable.skillKey, skillId)))
        .orderBy(desc(skillEvidenceTable.createdAt));

    return rows.map(rowToEvidenceRecord);
}

/**
 * Get all evidence records for a user.
 */
export async function getUserEvidence(userId: string): Promise<SkillEvidenceRecord[]> {
    const rows = await db
        .select()
        .from(skillEvidenceTable)
        .where(eq(skillEvidenceTable.userId, userId))
        .orderBy(desc(skillEvidenceTable.createdAt));

    return rows.map(rowToEvidenceRecord);
}

/**
 * Confirm or reject evidence, adjusting confidence.
 */
export async function confirmEvidence(
    evidenceId: string,
    confirmed: boolean,
): Promise<void> {
    const rows = await db
        .select()
        .from(skillEvidenceTable)
        .where(eq(skillEvidenceTable.id, evidenceId))
        .limit(1);

    if (rows.length === 0) return;

    const row = rows[0];
    const payload = (row.structuredPayload as Record<string, unknown>) ?? {};
    const currentConfidence = (payload.matrixConfidence as number) ?? 0.5;

    // Adjust confidence: +0.15 for confirmed, -0.2 for rejected
    const newConfidence = confirmed
        ? Math.min(1.0, currentConfidence + 0.15)
        : Math.max(0.0, currentConfidence - 0.2);

    await db
        .update(skillEvidenceTable)
        .set({
            structuredPayload: {
                ...payload,
                verifiedByUser: confirmed,
                matrixConfidence: newConfidence,
            },
            confidence: newConfidence >= 0.8 ? 'high' : newConfidence >= 0.5 ? 'medium' : 'low',
        })
        .where(eq(skillEvidenceTable.id, evidenceId));
}

/**
 * Get the best evidence record for a (userId, skillId) pair.
 * Selects highest confidence, most-recent occurredAt as tiebreaker.
 */
export async function getBestEvidence(
    userId: string,
    skillId: string,
): Promise<SkillEvidenceRecord | null> {
    const evidence = await getEvidenceForSkill(userId, skillId);
    if (evidence.length === 0) return null;

    return evidence.sort((a, b) => {
        if (b.confidence !== a.confidence) return b.confidence - a.confidence;
        const aTime = a.occurredAt?.getTime() ?? 0;
        const bTime = b.occurredAt?.getTime() ?? 0;
        return bTime - aTime;
    })[0];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function computeFreshnessScore(occurredAt: Date | null): number {
    if (!occurredAt) return 20;
    const monthsAgo = (Date.now() - occurredAt.getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (monthsAgo <= 6) return 100;
    if (monthsAgo <= 12) return 70;
    if (monthsAgo <= 24) return 40;
    return 20;
}

function rowToEvidenceRecord(row: typeof skillEvidenceTable.$inferSelect): SkillEvidenceRecord {
    const payload = (row.structuredPayload as Record<string, unknown>) ?? {};
    const matrixConfidence = (payload.matrixConfidence as number) ??
        (row.confidence === 'high' ? 0.85 : row.confidence === 'medium' ? 0.6 : 0.35);
    const matrixEvidenceType = (payload.matrixEvidenceType as EvidenceLevel) ??
        classifyEvidenceLevel(row.sourceType as EvidenceSourceType, null);

    return {
        id: row.id,
        userId: row.userId,
        skillId: row.skillKey,
        sourceType: row.sourceType as EvidenceSourceType,
        evidenceType: matrixEvidenceType,
        evidenceText: row.evidenceText,
        evidenceUrl: (payload.evidenceUrl as string) ?? null,
        occurredAt: payload.occurredAt ? new Date(payload.occurredAt as string) : null,
        confidence: matrixConfidence,
        verifiedByUser: (payload.verifiedByUser as boolean) ?? null,
    };
}
