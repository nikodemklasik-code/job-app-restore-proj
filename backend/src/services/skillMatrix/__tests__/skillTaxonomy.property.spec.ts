/**
 * Property-Based Tests — Skill Taxonomy (Properties 1, 2, 24)
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { normalizeEmployerName } from '../../employerIntel/employerIntelUtils.js';

describe('Property 24: Employer Name Normalization Is Idempotent', () => {
    it('normalize(normalize(x)) === normalize(x)', () => {
        fc.assert(fc.property(
            fc.string({ minLength: 1, maxLength: 100 }),
            (name) => {
                const once = normalizeEmployerName(name);
                const twice = normalizeEmployerName(once);
                expect(twice).toBe(once);
            },
        ), { numRuns: 100 });
    });
});
