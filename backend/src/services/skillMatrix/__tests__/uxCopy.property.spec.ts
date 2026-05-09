/**
 * Property-Based Tests — UX Copy Standards (Property 20)
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { computeActionPriority } from '../../scoring/actionPriority.js';
import { detectAllSignals, type JobListingInput } from '../../employerIntel/signalDetector.js';

const FORBIDDEN_PHRASES = [
    'this employer is bad',
    'ai verified this company',
    'do not apply',
    'you are missing',
    'you must learn',
    'this company is',
    'definitely avoid',
    'guaranteed',
];

describe('Property 20: No Forbidden Phrases in Risk Communications', () => {
    it('action priority explanations never contain forbidden phrases', () => {
        fc.assert(fc.property(
            fc.integer({ min: 0, max: 100 }),
            fc.integer({ min: 0, max: 100 }),
            fc.integer({ min: 0, max: 100 }),
            fc.integer({ min: 0, max: 100 }),
            fc.integer({ min: 0, max: 100 }),
            (jobFit, trust, risk, market, readiness) => {
                const result = computeActionPriority({
                    jobFit, employerTrust: trust, employerRisk: risk,
                    marketValue: market, skillReadiness: readiness,
                });

                const lower = result.explanation.toLowerCase();
                for (const phrase of FORBIDDEN_PHRASES) {
                    expect(lower).not.toContain(phrase);
                }
            },
        ), { numRuns: 100 });
    });

    it('signal detector explanations never contain forbidden phrases', () => {
        fc.assert(fc.property(
            fc.string({ minLength: 5, maxLength: 100 }),
            fc.string({ minLength: 10, maxLength: 500 }),
            fc.string({ minLength: 2, maxLength: 50 }),
            (title, description, company) => {
                const listing: JobListingInput = { title, description, company };
                const signals = detectAllSignals(listing);

                for (const signal of signals) {
                    const lower = signal.explanation.toLowerCase();
                    for (const phrase of FORBIDDEN_PHRASES) {
                        expect(lower).not.toContain(phrase);
                    }
                }
            },
        ), { numRuns: 100 });
    });
});
