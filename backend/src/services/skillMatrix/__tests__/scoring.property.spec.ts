/**
 * Property-Based Tests — Scoring Algorithms (Properties 8–17)
 *
 * All scoring algorithms are pure functions, ideal for PBT.
 * Minimum 100 iterations per property.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { computeSkillReadiness } from '../../scoring/skillReadiness.js';
import { computeEvidenceStrength } from '../../scoring/evidenceStrength.js';
import { computeRecencyDimension } from '../../scoring/recency.js';
import { computeEmployerTrust } from '../../scoring/employerTrust.js';
import { computeEmployerRisk } from '../../scoring/employerRisk.js';
import { computeJobFit } from '../../scoring/jobFit.js';
import { computeActionPriority } from '../../scoring/actionPriority.js';
import type { EmployerSignalRecord, SignalCategory, SkillEvidenceRecord } from '../types.js';

const EVIDENCE_LEVELS = ['declared', 'observed', 'demonstrated', 'verified', 'recent'] as const;
const SOURCE_TYPES = ['cv', 'github', 'portfolio', 'certificate', 'interview', 'profile', 'job_listing'] as const;
const SIGNAL_CATEGORIES: SignalCategory[] = [
    'identity_credibility', 'offer_transparency', 'compensation_benefits',
    'business_stability', 'culture_management', 'recruitment_process',
    'technology_maturity', 'uk_local_risks', 'scam_fraud',
];

// Arbitrary generators
const evidenceRecordArb = fc.record({
    id: fc.uuid(),
    userId: fc.uuid(),
    skillId: fc.uuid(),
    sourceType: fc.constantFrom(...SOURCE_TYPES),
    evidenceType: fc.constantFrom(...EVIDENCE_LEVELS),
    evidenceText: fc.string(),
    evidenceUrl: fc.option(fc.webUrl(), { nil: null }),
    occurredAt: fc.option(fc.date({ min: new Date('2020-01-01'), max: new Date() }), { nil: null }),
    confidence: fc.double({ min: 0, max: 1, noNaN: true }),
    verifiedByUser: fc.option(fc.boolean(), { nil: null }),
}) as fc.Arbitrary<SkillEvidenceRecord>;

const signalRecordArb = (scoreRange: { min: number; max: number }) => fc.record({
    id: fc.uuid(),
    employerId: fc.uuid(),
    signalType: fc.string(),
    category: fc.constantFrom(...SIGNAL_CATEGORIES),
    score: fc.integer({ min: scoreRange.min, max: scoreRange.max }),
    severity: fc.constantFrom('positive', 'neutral', 'warning', 'critical') as fc.Arbitrary<any>,
    title: fc.string(),
    explanation: fc.string(),
    sourceId: fc.option(fc.uuid(), { nil: null }),
    trustMetadata: fc.constant({} as any),
    createdAt: fc.date(),
}) as fc.Arbitrary<EmployerSignalRecord>;

describe('Property 8: All Scores Are Bounded [0, 100]', () => {
    it('computeSkillReadiness always returns [0, 100]', () => {
        fc.assert(fc.property(
            fc.integer({ min: 0, max: 100 }),
            fc.integer({ min: 0, max: 100 }),
            fc.array(evidenceRecordArb, { minLength: 0, maxLength: 5 }),
            fc.integer({ min: 0, max: 100 }),
            fc.integer({ min: 0, max: 100 }),
            (claimed, required, evidence, market, role) => {
                const score = computeSkillReadiness({
                    claimedLevel: claimed,
                    requiredLevel: required,
                    evidence,
                    relationships: [],
                    marketDemandScore: market,
                    roleRelevanceScore: role,
                });
                expect(score).toBeGreaterThanOrEqual(0);
                expect(score).toBeLessThanOrEqual(100);
            },
        ), { numRuns: 100 });
    });

    it('computeEvidenceStrength always returns [0, 100]', () => {
        fc.assert(fc.property(
            fc.array(evidenceRecordArb, { minLength: 0, maxLength: 10 }),
            (evidence) => {
                const score = computeEvidenceStrength(evidence);
                expect(score).toBeGreaterThanOrEqual(0);
                expect(score).toBeLessThanOrEqual(100);
            },
        ), { numRuns: 100 });
    });

    it('computeEmployerTrust always returns [0, 100]', () => {
        fc.assert(fc.property(
            fc.array(signalRecordArb({ min: -100, max: 100 }), { minLength: 0, maxLength: 20 }),
            fc.integer({ min: 0, max: 10 }),
            (signals, sourceCount) => {
                const score = computeEmployerTrust(signals, sourceCount);
                expect(score).toBeGreaterThanOrEqual(0);
                expect(score).toBeLessThanOrEqual(100);
            },
        ), { numRuns: 100 });
    });

    it('computeEmployerRisk always returns [0, 100]', () => {
        fc.assert(fc.property(
            fc.array(signalRecordArb({ min: -100, max: 100 }), { minLength: 0, maxLength: 20 }),
            (signals) => {
                const score = computeEmployerRisk(signals);
                expect(score).toBeGreaterThanOrEqual(0);
                expect(score).toBeLessThanOrEqual(100);
            },
        ), { numRuns: 100 });
    });
});

describe('Property 9: Recency Is Monotonically Decreasing With Age', () => {
    it('more recent evidence scores higher', () => {
        fc.assert(fc.property(
            fc.date({ min: new Date('2023-01-01'), max: new Date('2025-01-01') }),
            fc.date({ min: new Date('2020-01-01'), max: new Date('2022-12-31') }),
            (recentDate, olderDate) => {
                const now = new Date('2025-05-01');
                const recentEvidence: SkillEvidenceRecord[] = [{
                    id: '1', userId: 'u', skillId: 's', sourceType: 'github',
                    evidenceType: 'demonstrated', evidenceText: '', evidenceUrl: null,
                    occurredAt: recentDate, confidence: 0.8, verifiedByUser: null,
                }];
                const olderEvidence: SkillEvidenceRecord[] = [{
                    id: '2', userId: 'u', skillId: 's', sourceType: 'github',
                    evidenceType: 'demonstrated', evidenceText: '', evidenceUrl: null,
                    occurredAt: olderDate, confidence: 0.8, verifiedByUser: null,
                }];

                const recentScore = computeRecencyDimension(recentEvidence, now);
                const olderScore = computeRecencyDimension(olderEvidence, now);
                expect(recentScore).toBeGreaterThanOrEqual(olderScore);
            },
        ), { numRuns: 100 });
    });
});

describe('Property 14: Trust Capped at 60 When Sources < 3', () => {
    it('trust never exceeds 60 with fewer than 3 sources', () => {
        fc.assert(fc.property(
            fc.array(signalRecordArb({ min: 1, max: 100 }), { minLength: 1, maxLength: 20 }),
            fc.integer({ min: 0, max: 2 }),
            (signals, sourceCount) => {
                const score = computeEmployerTrust(signals, sourceCount);
                expect(score).toBeLessThanOrEqual(60);
            },
        ), { numRuns: 100 });
    });
});

describe('Property 15: Trust and Risk Are Independent', () => {
    it('changing positive signals does not affect risk', () => {
        fc.assert(fc.property(
            fc.array(signalRecordArb({ min: -100, max: -1 }), { minLength: 1, maxLength: 5 }),
            fc.array(signalRecordArb({ min: 1, max: 100 }), { minLength: 0, maxLength: 5 }),
            fc.array(signalRecordArb({ min: 1, max: 100 }), { minLength: 0, maxLength: 5 }),
            (negativeSignals, positiveA, positiveB) => {
                const riskA = computeEmployerRisk([...negativeSignals, ...positiveA]);
                const riskB = computeEmployerRisk([...negativeSignals, ...positiveB]);
                expect(riskA).toBe(riskB);
            },
        ), { numRuns: 100 });
    });
});

describe('Property 17: Action Priority Recommendation Matches Rule Table', () => {
    it('apply_now when jobFit > 70 AND trust > 60 AND risk < 30', () => {
        fc.assert(fc.property(
            fc.integer({ min: 71, max: 100 }),
            fc.integer({ min: 61, max: 100 }),
            fc.integer({ min: 0, max: 29 }),
            fc.integer({ min: 0, max: 100 }),
            fc.integer({ min: 0, max: 100 }),
            (jobFit, trust, risk, market, readiness) => {
                const result = computeActionPriority({ jobFit, employerTrust: trust, employerRisk: risk, marketValue: market, skillReadiness: readiness });
                expect(result.recommendation).toBe('apply_now');
            },
        ), { numRuns: 100 });
    });

    it('reject when jobFit < 40', () => {
        fc.assert(fc.property(
            fc.integer({ min: 0, max: 39 }),
            fc.integer({ min: 0, max: 100 }),
            fc.integer({ min: 0, max: 100 }),
            fc.integer({ min: 0, max: 100 }),
            fc.integer({ min: 0, max: 100 }),
            (jobFit, trust, risk, market, readiness) => {
                const result = computeActionPriority({ jobFit, employerTrust: trust, employerRisk: risk, marketValue: market, skillReadiness: readiness });
                // reject when jobFit < 40 AND not matching verify_employer condition
                if (jobFit <= 50 || (trust >= 50 && risk <= 50)) {
                    expect(result.recommendation).toBe('reject');
                }
            },
        ), { numRuns: 100 });
    });
});
