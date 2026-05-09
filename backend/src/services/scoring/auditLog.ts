/**
 * Score Audit Log — writes immutable records of every score computation.
 *
 * Computes a deterministic SHA-256 hash of inputs for reproducibility.
 * Never blocks score delivery — retries on failure, logs to error queue.
 */

import { createHash, randomUUID } from 'crypto';
import { db } from '../../db/index.js';
import { scoreAuditLog } from '../../db/schemas/skills-matrix.js';
import { SCORING_MODEL_VERSION } from '../skillMatrix/trustMetadata.js';
import type { ScoreEntityType, ScoreType } from '../skillMatrix/types.js';

/**
 * Compute a deterministic SHA-256 hash of the scoring inputs.
 * Ensures reproducibility checks — same inputs produce same hash.
 */
export function computeInputHash(inputs: Record<string, unknown>): string {
    const serialized = JSON.stringify(inputs, Object.keys(inputs).sort());
    return createHash('sha256').update(serialized).digest('hex');
}

/**
 * Write an audit log entry for a score computation.
 * Returns the audit log entry ID.
 *
 * On failure: retries up to 3 times, then logs error but never blocks score delivery.
 */
export async function writeAuditEntry(params: {
    entityType: ScoreEntityType;
    entityId: string;
    scoreType: ScoreType;
    inputs: Record<string, unknown>;
    output: Record<string, unknown>;
    modelVersion?: string;
}): Promise<string> {
    const id = randomUUID();
    const inputHash = computeInputHash(params.inputs);

    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
        try {
            await db.insert(scoreAuditLog).values({
                id,
                entityType: params.entityType,
                entityId: params.entityId,
                scoreType: params.scoreType,
                inputHash,
                output: params.output,
                modelVersion: params.modelVersion ?? SCORING_MODEL_VERSION,
                generatedAt: new Date(),
            });
            return id;
        } catch (error) {
            attempts++;
            if (attempts >= maxAttempts) {
                // Log error but don't block score delivery
                console.error('[ScoreAuditLog] Failed to write audit entry after 3 attempts:', {
                    entityType: params.entityType,
                    entityId: params.entityId,
                    scoreType: params.scoreType,
                    error: error instanceof Error ? error.message : String(error),
                });
                return id; // Return ID anyway — score delivery is not blocked
            }
            // Brief delay before retry
            await new Promise((resolve) => setTimeout(resolve, 100 * attempts));
        }
    }

    return id;
}
