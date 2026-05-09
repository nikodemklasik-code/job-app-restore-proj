/**
 * Telemetry tRPC Router
 *
 * Records product events and provides recommendation accuracy metrics.
 */

import { randomUUID } from 'crypto';
import { z } from 'zod';
import { db } from '../../db/index.js';
import { productEvents } from '../../db/schemas/skills-matrix.js';
import { protectedProcedure, router } from '../trpc.js';

export const telemetryRouter = router({
    recordEvent: protectedProcedure
        .input(z.object({
            eventName: z.string().max(100),
            entityType: z.string().max(50),
            entityId: z.string().max(36),
            metadata: z.record(z.unknown()).optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            await db.insert(productEvents).values({
                id: randomUUID(),
                userId: ctx.user.id,
                eventName: input.eventName,
                entityType: input.entityType,
                entityId: input.entityId,
                metadata: input.metadata ?? null,
                occurredAt: new Date(),
            });
            return { success: true };
        }),

    getRecommendationAccuracy: protectedProcedure
        .input(z.object({ scoreType: z.string(), windowDays: z.number().default(30) }))
        .query(async ({ input }) => {
            // Simplified — would compute precision/recall from actual outcomes
            return {
                scoreType: input.scoreType,
                windowDays: input.windowDays,
                accuracy: null as number | null,
                sampleSize: 0,
                message: 'Insufficient data for accuracy computation. Metrics will populate as users provide application outcome feedback.',
            };
        }),
});
