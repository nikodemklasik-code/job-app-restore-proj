/**
 * Property-Based Tests — Trust Metadata (Property 19)
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { buildTrustMetadata, computeFreshness } from '../trustMetadata.js';

describe('Property 19: Trust Metadata Present on Every Insight', () => {
    it('buildTrustMetadata always produces all required fields', () => {
        fc.assert(fc.property(
            fc.string({ minLength: 1, maxLength: 50 }),
            fc.string({ minLength: 1, maxLength: 50 }),
            fc.date({ min: new Date('2020-01-01'), max: new Date() }),
            fc.double({ min: 0, max: 1, noNaN: true }),
            fc.constantFrom('deterministic', 'ai_generated', 'heuristic', 'user_reported') as fc.Arbitrary<any>,
            fc.string({ minLength: 1, maxLength: 200 }),
            (sourceName, sourceType, observedAt, confidence, explanationType, reason) => {
                const meta = buildTrustMetadata({
                    sourceName,
                    sourceType,
                    observedAt,
                    confidence,
                    explanationType,
                    userVisibleReason: reason,
                });

                // All required fields must be non-null
                expect(meta.sourceName).toBeTruthy();
                expect(meta.sourceType).toBeTruthy();
                expect(meta.observedAt).toBeInstanceOf(Date);
                expect(['fresh', 'recent', 'aging', 'stale']).toContain(meta.freshness);
                expect(meta.confidence).toBeGreaterThanOrEqual(0);
                expect(meta.confidence).toBeLessThanOrEqual(1);
                expect(meta.explanationType).toBeTruthy();
                expect(meta.modelVersion).toBeTruthy();
                expect(meta.userVisibleReason).toBeTruthy();
                expect(typeof meta.riskLanguage).toBe('boolean');
            },
        ), { numRuns: 100 });
    });

    it('computeFreshness returns valid category for any date', () => {
        fc.assert(fc.property(
            fc.date({ min: new Date('2020-01-01'), max: new Date('2026-12-31') }),
            (observedAt) => {
                const freshness = computeFreshness(observedAt);
                expect(['fresh', 'recent', 'aging', 'stale']).toContain(freshness);
            },
        ), { numRuns: 100 });
    });
});
