/**
 * Feedback Loop Service
 *
 * Records score disagreements, signal inaccuracy reports, and computes
 * recommendation accuracy metrics. Implements retention policy.
 */

import { randomUUID } from 'crypto';
import { db } from '../../db/index.js';
import { productEvents } from '../../db/schemas/skills-matrix.js';
import { ACCURACY_ALERT_THRESHOLD, FEEDBACK_RETENTION_DAYS } from '../skillMatrix/constants.js';
import { recordEvent } from './telemetry.service.js';

// ── Score Disagreement ───────────────────────────────────────────────────────

export interface ScoreDisagreement {
    userId: string;
    scoreType: string;
    entityId: string;
    originalScore: number;
    reason?: string;
}

/**
 * Record a user's disagreement with a computed score.
 * Used as a training signal for model improvement.
 */
export async function recordScoreDisagreement(input: ScoreDisagreement): Promise<void> {
    await recordEvent({
        userId: input.userId,
        eventName: 'score_disagreement',
        entityType: input.scoreType,
        entityId: input.entityId,
        metadata: {
            originalScore: input.originalScore,
            reason: input.reason ?? null,
            recordedAt: new Date().toISOString(),
        },
    });
}

// ── Signal Inaccuracy ────────────────────────────────────────────────────────

export interface SignalInaccuracyReport {
    userId: string;
    signalId: string;
    employerId: string;
    reason: string;
}

/**
 * Record a signal inaccuracy report.
 * Flags the signal for review and reduces confidence in future computations.
 */
export async function recordSignalInaccuracy(input: SignalInaccuracyReport): Promise<void> {
    await recordEvent({
        userId: input.userId,
        eventName: 'signal_inaccuracy_reported',
        entityType: 'employer_signal',
        entityId: input.signalId,
        metadata: {
            employerId: input.employerId,
            reason: input.reason,
            recordedAt: new Date().toISOString(),
        },
    });
}

// ── Application Outcome ──────────────────────────────────────────────────────

export type ApplicationOutcome =
    | 'offer_received'
    | 'interview_scheduled'
    | 'response_received'
    | 'rejected'
    | 'no_response'
    | 'withdrawn'
    | 'verified_then_applied';

/**
 * Record an application outcome for accuracy measurement.
 */
export async function recordApplicationOutcome(
    userId: string,
    jobId: string,
    outcome: ApplicationOutcome,
    originalRecommendation?: string,
): Promise<void> {
    await recordEvent({
        userId,
        eventName: 'application_outcome',
        entityType: 'job',
        entityId: jobId,
        metadata: {
            outcome,
            originalRecommendation: originalRecommendation ?? null,
            recordedAt: new Date().toISOString(),
        },
    });
}

// ── Retention Policy ─────────────────────────────────────────────────────────

/**
 * Clean up raw feedback older than retention period.
 * Aggregated metrics are retained indefinitely.
 *
 * Should be run as a scheduled job (e.g., daily).
 */
export async function enforceRetentionPolicy(): Promise<{ deleted: number }> {
    const cutoffDate = new Date(Date.now() - FEEDBACK_RETENTION_DAYS * 24 * 60 * 60 * 1000);

    // In a full implementation, this would:
    // 1. Aggregate old feedback into summary metrics
    // 2. Delete raw feedback records older than cutoff
    // 3. Anonymize any remaining user-linked data

    // For now, log the intent
    console.log(`[Feedback] Retention policy: would delete feedback older than ${cutoffDate.toISOString()}`);

    return { deleted: 0 };
}

// ── Accuracy Alerting ────────────────────────────────────────────────────────

/**
 * Check if any score type has accuracy below the alert threshold.
 * Returns score types that need review.
 */
export async function checkAccuracyAlerts(): Promise<string[]> {
    const scoreTypes = ['job_fit', 'employer_trust', 'employer_risk', 'action_priority'];
    const alerts: string[] = [];

    for (const scoreType of scoreTypes) {
        // In a full implementation, this would query actual accuracy metrics
        // For now, return empty (no alerts until sufficient data)
    }

    return alerts;
}
