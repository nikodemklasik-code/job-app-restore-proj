/**
 * Telemetry Service
 *
 * Records product events and provides recommendation accuracy metrics.
 * Ensures no PII in event metadata — only anonymized entity references.
 */

import { randomUUID } from 'crypto';
import { and, between, eq, sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { productEvents } from '../../db/schemas/skills-matrix.js';
import { ACCURACY_ALERT_THRESHOLD } from '../skillMatrix/constants.js';
import type { ProductEventInput } from '../skillMatrix/types.js';

// ── Event Recording ──────────────────────────────────────────────────────────

/**
 * Record a product event. Strips any PII from metadata.
 */
export async function recordEvent(event: ProductEventInput): Promise<string> {
    const id = randomUUID();

    // Strip potential PII from metadata
    const sanitizedMetadata = event.metadata ? sanitizeMetadata(event.metadata) : null;

    await db.insert(productEvents).values({
        id,
        userId: event.userId,
        eventName: event.eventName,
        entityType: event.entityType,
        entityId: event.entityId,
        metadata: sanitizedMetadata,
        occurredAt: new Date(),
    });

    return id;
}

/**
 * Record a batch of events efficiently.
 */
export async function recordEvents(events: ProductEventInput[]): Promise<number> {
    if (events.length === 0) return 0;

    const values = events.map((event) => ({
        id: randomUUID(),
        userId: event.userId,
        eventName: event.eventName,
        entityType: event.entityType,
        entityId: event.entityId,
        metadata: event.metadata ? sanitizeMetadata(event.metadata) : null,
        occurredAt: new Date(),
    }));

    await db.insert(productEvents).values(values);
    return values.length;
}

// ── Event Queries ────────────────────────────────────────────────────────────

export interface EventFilter {
    userId?: string;
    eventName?: string;
    entityType?: string;
    entityId?: string;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
}

/**
 * Query events with optional filters.
 */
export async function queryEvents(filter: EventFilter) {
    const conditions: ReturnType<typeof eq>[] = [];

    if (filter.userId) conditions.push(eq(productEvents.userId, filter.userId));
    if (filter.eventName) conditions.push(eq(productEvents.eventName, filter.eventName));
    if (filter.entityType) conditions.push(eq(productEvents.entityType, filter.entityType));
    if (filter.entityId) conditions.push(eq(productEvents.entityId, filter.entityId));
    if (filter.fromDate && filter.toDate) {
        conditions.push(between(productEvents.occurredAt, filter.fromDate, filter.toDate) as any);
    }

    if (conditions.length === 0) {
        return db.select().from(productEvents).limit(filter.limit ?? 100);
    }

    return db
        .select()
        .from(productEvents)
        .where(and(...conditions))
        .limit(filter.limit ?? 100);
}

// ── Recommendation Accuracy ──────────────────────────────────────────────────

export interface AccuracyMetrics {
    scoreType: string;
    windowDays: number;
    totalPredictions: number;
    correctPredictions: number;
    accuracy: number | null;
    belowThreshold: boolean;
}

/**
 * Compute recommendation accuracy for a score type over a rolling window.
 *
 * Compares action priority recommendations against actual application outcomes:
 * - apply_now + offer_received/interview_scheduled = correct
 * - reject + no_response/rejected = correct
 * - verify_employer + user_verified_then_applied = correct
 */
export async function getRecommendationAccuracy(
    scoreType: string,
    windowDays: number = 30,
): Promise<AccuracyMetrics> {
    const fromDate = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
    const toDate = new Date();

    // Get recommendation events
    const recommendations = await queryEvents({
        eventName: 'action_priority_acted',
        fromDate,
        toDate,
        limit: 1000,
    });

    // Get outcome events
    const outcomes = await queryEvents({
        eventName: 'application_outcome',
        fromDate,
        toDate,
        limit: 1000,
    });

    if (recommendations.length === 0) {
        return {
            scoreType,
            windowDays,
            totalPredictions: 0,
            correctPredictions: 0,
            accuracy: null,
            belowThreshold: false,
        };
    }

    // Match recommendations to outcomes
    let correct = 0;
    let total = 0;

    for (const rec of recommendations) {
        const metadata = (rec.metadata as Record<string, unknown>) ?? {};
        const recommendation = metadata.recommendation as string;
        const entityId = rec.entityId;

        // Find matching outcome
        const outcome = outcomes.find(
            (o: any) => o.entityId === entityId,
        );

        if (!outcome) continue;

        total++;
        const outcomeType = ((outcome as any).metadata as Record<string, unknown>)?.outcome as string;

        if (isCorrectPrediction(recommendation, outcomeType)) {
            correct++;
        }
    }

    const accuracy = total > 0 ? correct / total : null;

    return {
        scoreType,
        windowDays,
        totalPredictions: total,
        correctPredictions: correct,
        accuracy,
        belowThreshold: accuracy !== null && accuracy < ACCURACY_ALERT_THRESHOLD,
    };
}

/**
 * Check if a recommendation was correct given the outcome.
 */
function isCorrectPrediction(recommendation: string, outcome: string): boolean {
    switch (recommendation) {
        case 'apply_now':
            return ['offer_received', 'interview_scheduled', 'response_received'].includes(outcome);
        case 'reject':
            return ['no_response', 'rejected', 'withdrawn'].includes(outcome);
        case 'save':
            return true; // Save is always "correct" — it's a neutral recommendation
        case 'verify_employer':
            return ['verified_then_applied', 'withdrawn'].includes(outcome);
        default:
            return false;
    }
}

// ── Aggregation Queries ──────────────────────────────────────────────────────

/**
 * Get signal engagement rates (how often users expand/view signals).
 */
export async function getSignalEngagementRate(windowDays: number = 30): Promise<{
    viewRate: number;
    expandRate: number;
    totalViews: number;
}> {
    const fromDate = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

    const views = await queryEvents({
        eventName: 'skill_signal_viewed',
        fromDate,
        toDate: new Date(),
        limit: 10000,
    });

    const expands = await queryEvents({
        eventName: 'employer_signals_expanded',
        fromDate,
        toDate: new Date(),
        limit: 10000,
    });

    return {
        viewRate: views.length > 0 ? 1.0 : 0,
        expandRate: expands.length > 0 ? expands.length / Math.max(1, views.length) : 0,
        totalViews: views.length,
    };
}

// ── PII Sanitization ─────────────────────────────────────────────────────────

const PII_KEYS = ['email', 'phone', 'address', 'name', 'firstName', 'lastName', 'ssn', 'ni_number', 'passport'];

/**
 * Remove potential PII fields from event metadata.
 */
function sanitizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(metadata)) {
        if (PII_KEYS.some((pii) => key.toLowerCase().includes(pii))) {
            continue; // Skip PII fields
        }
        sanitized[key] = value;
    }

    return sanitized;
}
