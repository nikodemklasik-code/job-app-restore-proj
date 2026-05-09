/**
 * Property-Based Tests — Skill Evidence (Properties 3, 4, 5, 6, 7)
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
    classifyEvidenceLevel,
    computeSourceConfidence,
    isEvidenceStale,
} from '../skillEvidenceUtils.js';
import type { EvidenceSourceType, SkillEvidenceRecord } from '../types.js';

const SOURCE_TYPES: EvidenceSourceType[] = ['cv', 'github', 'portfolio', 'certificate', 'interview', 'profile', 'job_listing'];
const VALID_LEVELS = ['declared', 'observed', 'demonstrated', 'verified', 'recent'];

describe('Property 3: Evidence Classification Produces Exactly One Valid Level', () => {
    it('always returns one valid level for any source type and date', () => {
        fc.assert(fc.property(
            fc.constantFrom(...SOURCE_TYPES),
            fc.option(fc.date({ min: new Date('2020-01-01'), max: new Date('2026-01-01') }), { nil: null }),
            (sourceType, occurredAt) => {
                const level = classifyEvidenceLevel(sourceType, occurredAt);
                expect(VALID_LEVELS).toContain(level);
            },
        ), { numRuns: 100 });
    });
});

describe('Property 4: Confidence Is Always Bounded [0.0, 1.0]', () => {
    it('computeSourceConfidence always returns [0, 1]', () => {
        fc.assert(fc.property(
            fc.constantFrom(...SOURCE_TYPES),
            (sourceType) => {
                const confidence = computeSourceConfidence(sourceType);
                expect(confidence).toBeGreaterThanOrEqual(0);
                expect(confidence).toBeLessThanOrEqual(1);
            },
        ), { numRuns: 100 });
    });
});

describe('Property 7: Stale Evidence Flagging', () => {
    it('evidence older than 24 months is flagged stale', () => {
        const oldDate = new Date('2022-01-01'); // >24 months from May 2026
        const evidence: SkillEvidenceRecord[] = [{
            id: '1', userId: 'u', skillId: 's', sourceType: 'github',
            evidenceType: 'demonstrated', evidenceText: '', evidenceUrl: null,
            occurredAt: oldDate, confidence: 0.8, verifiedByUser: null,
        }];
        expect(isEvidenceStale(evidence)).toBe(true);
    });

    it('evidence within 24 months is NOT flagged stale', () => {
        const recentDate = new Date(); // now
        recentDate.setMonth(recentDate.getMonth() - 6); // 6 months ago
        const evidence: SkillEvidenceRecord[] = [{
            id: '1', userId: 'u', skillId: 's', sourceType: 'github',
            evidenceType: 'demonstrated', evidenceText: '', evidenceUrl: null,
            occurredAt: recentDate, confidence: 0.8, verifiedByUser: null,
        }];
        expect(isEvidenceStale(evidence)).toBe(false);
    });

    it('empty evidence is considered stale', () => {
        expect(isEvidenceStale([])).toBe(true);
    });
});
