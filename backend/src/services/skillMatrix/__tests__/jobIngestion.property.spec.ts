/**
 * Property-Based Tests — Job Ingestion (Property 21)
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { computeContentHash } from '../jobIngestion.service.js';

describe('Property 21: Content Hash Is Deterministic', () => {
    it('same input produces same hash', () => {
        fc.assert(fc.property(
            fc.string({ minLength: 1, maxLength: 200 }),
            fc.string({ minLength: 1, maxLength: 1000 }),
            fc.string({ minLength: 1, maxLength: 100 }),
            (title, description, company) => {
                const input = { title, description, company };
                const hash1 = computeContentHash(input);
                const hash2 = computeContentHash(input);
                expect(hash1).toBe(hash2);
                expect(hash1).toHaveLength(64); // SHA-256 hex
            },
        ), { numRuns: 100 });
    });

    it('different input produces different hash', () => {
        fc.assert(fc.property(
            fc.string({ minLength: 1, maxLength: 200 }),
            fc.string({ minLength: 1, maxLength: 200 }),
            fc.string({ minLength: 1, maxLength: 1000 }),
            fc.string({ minLength: 1, maxLength: 100 }),
            (title1, title2, description, company) => {
                fc.pre(title1 !== title2);
                const hash1 = computeContentHash({ title: title1, description, company });
                const hash2 = computeContentHash({ title: title2, description, company });
                expect(hash1).not.toBe(hash2);
            },
        ), { numRuns: 100 });
    });
});
