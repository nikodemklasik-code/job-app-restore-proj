/**
 * Skills & Employer Verification Matrix — Constants.
 *
 * Scoring weights, thresholds, and configuration values referenced by the
 * scoring algorithms. Centralised here for easy tuning and testing.
 */

import type { EvidenceLevel, SignalCategory } from './types.js';

// ── Skill Readiness Dimension Weights ────────────────────────────────────────

export const SKILL_READINESS_WEIGHTS = {
    levelMatch: 0.25,
    evidenceStrength: 0.20,
    recency: 0.15,
    marketDemand: 0.15,
    roleRelevance: 0.15,
    transferability: 0.10,
} as const;

// ── Evidence Level Scores ────────────────────────────────────────────────────

export const EVIDENCE_LEVEL_SCORES: Record<EvidenceLevel, number> = {
    declared: 20,
    observed: 40,
    demonstrated: 60,
    verified: 80,
    recent: 90,
};

// ── Evidence Bonuses for Job Fit ─────────────────────────────────────────────

export const EVIDENCE_FIT_MULTIPLIERS: Record<EvidenceLevel, number> = {
    declared: 0.6,
    observed: 0.8,
    demonstrated: 1.0,
    verified: 1.15,
    recent: 1.2,
};

// ── Employer Trust Category Weights ──────────────────────────────────────────

export const EMPLOYER_TRUST_WEIGHTS: Record<SignalCategory, number> = {
    identity_credibility: 0.20,
    offer_transparency: 0.15,
    compensation_benefits: 0.12,
    business_stability: 0.12,
    culture_management: 0.10,
    recruitment_process: 0.10,
    technology_maturity: 0.08,
    uk_local_risks: 0.08,
    scam_fraud: 0.05,
};

// ── Employer Risk Category Weights ───────────────────────────────────────────

export const EMPLOYER_RISK_WEIGHTS: Record<SignalCategory, number> = {
    scam_fraud: 0.30,
    identity_credibility: 0.15,
    offer_transparency: 0.12,
    compensation_benefits: 0.10,
    business_stability: 0.10,
    culture_management: 0.08,
    recruitment_process: 0.08,
    uk_local_risks: 0.05,
    technology_maturity: 0.02,
};

// ── Action Priority Weights ──────────────────────────────────────────────────

export const ACTION_PRIORITY_WEIGHTS = {
    jobFit: 0.35,
    employerTrust: 0.20,
    employerRiskInverse: 0.20, // uses (100 - employerRisk)
    marketValue: 0.15,
    skillReadiness: 0.10,
} as const;

// ── Thresholds ───────────────────────────────────────────────────────────────

/** Employer trust score cap when fewer than this many verified sources exist. */
export const MIN_SOURCES_FOR_FULL_TRUST = 3;
export const TRUST_CAP_LOW_SOURCES = 60;

/** Employer risk score threshold for "high risk" flag. */
export const HIGH_RISK_THRESHOLD = 70;

/** Employer trust level thresholds for badge display. */
export const TRUST_LEVEL_THRESHOLDS = {
    verified: 75,
    likely_legit: 55,
    review: 35,
    // Below 35 = risky
} as const;

/** Action Priority recommendation thresholds. */
export const ACTION_THRESHOLDS = {
    applyNow: { jobFitMin: 70, trustMin: 60, riskMax: 30 },
    verifyEmployer: { jobFitMin: 50, trustMax: 50, riskMin: 50 },
    reject: { jobFitMax: 40 },
} as const;

/** Recency decay boundaries (months). */
export const RECENCY_BOUNDARIES = {
    fresh: 6,
    moderate: 12,
    stale: 24,
} as const;

/** Stale evidence threshold in months. */
export const STALE_EVIDENCE_MONTHS = 24;

/** Market value: minimum listings for full-confidence score. */
export const MIN_LISTINGS_FULL_CONFIDENCE = 50;

/** Coverage bonus thresholds for market value. */
export const COVERAGE_BONUS = {
    high: { threshold: 0.8, bonus: 15 },
    medium: { threshold: 0.6, bonus: 8 },
} as const;

/** Corroboration bonus per additional source (max 10). */
export const CORROBORATION_BONUS_PER_SOURCE = 5;
export const CORROBORATION_BONUS_MAX = 10;

/** Confidence multiplier range for evidence strength. */
export const CONFIDENCE_MULTIPLIER_RANGE = { min: 0.7, max: 1.0 } as const;

/** Recommendation accuracy alert threshold. */
export const ACCURACY_ALERT_THRESHOLD = 0.60;

/** Feedback retention: raw feedback days, aggregated indefinite. */
export const FEEDBACK_RETENTION_DAYS = 90;

/** Data deletion SLA in days. */
export const DATA_DELETION_SLA_DAYS = 30;
