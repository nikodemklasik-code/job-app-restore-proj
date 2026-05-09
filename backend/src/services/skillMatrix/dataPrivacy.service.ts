/**
 * Data Privacy Service
 *
 * Implements user data export (JSON) and deletion with anonymization.
 * Compliant with data protection principles.
 */

import { and, eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { skillEvidence as skillEvidenceTable } from '../../db/schemas/skillup.js';
import {
    applicationEvents,
    matrixSkillSignals,
    productEvents,
    scoreAuditLog,
} from '../../db/schemas/skills-matrix.js';
import { DATA_DELETION_SLA_DAYS } from './constants.js';

// ── Data Export ──────────────────────────────────────────────────────────────

export interface UserDataExport {
    exportedAt: string;
    userId: string;
    skills: Array<{
        skillId: string;
        sourceType: string;
        evidenceText: string;
        confidence: string;
        createdAt: string;
    }>;
    signals: Array<{
        skillId: string;
        signalType: string;
        title: string;
        explanation: string;
        createdAt: string;
    }>;
    telemetryEvents: Array<{
        eventName: string;
        entityType: string;
        entityId: string;
        occurredAt: string;
    }>;
    applicationHistory: Array<{
        applicationId: string;
        eventType: string;
        occurredAt: string;
    }>;
}

/**
 * Export all user data in machine-readable JSON format.
 * Includes skills, evidence, scores, and application history.
 */
export async function exportUserData(userId: string): Promise<UserDataExport> {
    const [evidence, signals, events, appEvents] = await Promise.all([
        db.select().from(skillEvidenceTable).where(eq(skillEvidenceTable.userId, userId)),
        db.select().from(matrixSkillSignals).where(eq(matrixSkillSignals.userId, userId)),
        db.select().from(productEvents).where(eq(productEvents.userId, userId)),
        db.select().from(applicationEvents).where(eq(applicationEvents.userId, userId)),
    ]);

    return {
        exportedAt: new Date().toISOString(),
        userId,
        skills: evidence.map((e) => ({
            skillId: e.skillKey,
            sourceType: e.sourceType,
            evidenceText: e.evidenceText,
            confidence: e.confidence,
            createdAt: e.createdAt.toISOString(),
        })),
        signals: signals.map((s) => ({
            skillId: s.skillId,
            signalType: s.signalType,
            title: s.title,
            explanation: s.explanation,
            createdAt: s.createdAt.toISOString(),
        })),
        telemetryEvents: events.map((e) => ({
            eventName: e.eventName,
            entityType: e.entityType,
            entityId: e.entityId,
            occurredAt: e.occurredAt.toISOString(),
        })),
        applicationHistory: appEvents.map((e) => ({
            applicationId: e.applicationId,
            eventType: e.eventType,
            occurredAt: e.occurredAt.toISOString(),
        })),
    };
}

// ── Data Deletion ────────────────────────────────────────────────────────────

export interface DeletionResult {
    userId: string;
    deletedEvidence: number;
    deletedSignals: number;
    deletedEvents: number;
    deletedAppEvents: number;
    anonymizedAuditLogs: number;
    completedAt: string;
}

/**
 * Delete all personal data for a user.
 * - Removes skill evidence, signals, telemetry events, application records
 * - Anonymizes audit log entries (removes userId linkage, retains aggregate data)
 * - SLA: within 30 days of request
 */
export async function deleteUserData(userId: string): Promise<DeletionResult> {
    // Delete personal evidence
    const evidenceResult = await db
        .delete(skillEvidenceTable)
        .where(eq(skillEvidenceTable.userId, userId));

    // Delete signals
    const signalsResult = await db
        .delete(matrixSkillSignals)
        .where(eq(matrixSkillSignals.userId, userId));

    // Delete telemetry events
    const eventsResult = await db
        .delete(productEvents)
        .where(eq(productEvents.userId, userId));

    // Delete application events
    const appEventsResult = await db
        .delete(applicationEvents)
        .where(eq(applicationEvents.userId, userId));

    // Anonymize audit log entries — remove userId from entityId where entityType references user
    // We keep the scoring data for aggregate analysis but remove the user link
    const auditLogs = await db
        .select()
        .from(scoreAuditLog)
        .where(eq(scoreAuditLog.entityId, userId));

    for (const log of auditLogs) {
        await db
            .update(scoreAuditLog)
            .set({ entityId: 'anonymized' })
            .where(eq(scoreAuditLog.id, log.id));
    }

    return {
        userId,
        deletedEvidence: (evidenceResult as any)[0]?.affectedRows ?? 0,
        deletedSignals: (signalsResult as any)[0]?.affectedRows ?? 0,
        deletedEvents: (eventsResult as any)[0]?.affectedRows ?? 0,
        deletedAppEvents: (appEventsResult as any)[0]?.affectedRows ?? 0,
        anonymizedAuditLogs: auditLogs.length,
        completedAt: new Date().toISOString(),
    };
}
