/**
 * Skills & Employer Verification Matrix — Shared Types
 *
 * Core type definitions used across the Skill Matrix, Employer Intelligence,
 * and Scoring services. Every insight carries TrustMetadata for transparency.
 */

// ── Evidence & Taxonomy ──────────────────────────────────────────────────────

export type EvidenceLevel = 'declared' | 'observed' | 'demonstrated' | 'verified' | 'recent';

export type EvidenceSourceType =
    | 'cv'
    | 'github'
    | 'portfolio'
    | 'certificate'
    | 'interview'
    | 'profile'
    | 'job_listing';

export type SkillCategory =
    | 'programming_language'
    | 'framework'
    | 'tool'
    | 'methodology'
    | 'soft_skill'
    | 'domain_knowledge'
    | 'certification';

export type SkillRelationType = 'parent' | 'child' | 'related' | 'prerequisite';

// ── Skill Signals ────────────────────────────────────────────────────────────

export type SkillSignalType =
    | 'strength'
    | 'gap'
    | 'market_trend'
    | 'salary_leverage'
    | 'cv_value'
    | 'verification_needed'
    | 'learning_recommendation'
    | 'interview_risk';

export type SignalSeverity = 'info' | 'warning' | 'critical';

// ── Employer Intelligence ────────────────────────────────────────────────────

export type EmployerSourceType =
    | 'companies_house'
    | 'job_listing'
    | 'glassdoor'
    | 'linkedin'
    | 'news'
    | 'crunchbase'
    | 'website_analysis'
    | 'social_media';

export type SignalCategory =
    | 'identity_credibility'
    | 'offer_transparency'
    | 'compensation_benefits'
    | 'business_stability'
    | 'culture_management'
    | 'recruitment_process'
    | 'technology_maturity'
    | 'uk_local_risks'
    | 'scam_fraud';

export type EmployerSignalSeverity = 'positive' | 'neutral' | 'warning' | 'critical';

// ── Trust Metadata ───────────────────────────────────────────────────────────

export type Freshness = 'fresh' | 'recent' | 'aging' | 'stale';

export type ExplanationType = 'deterministic' | 'ai_generated' | 'heuristic' | 'user_reported';

export interface TrustMetadata {
    sourceName: string;
    sourceUrl: string | null;
    sourceType: string;
    observedAt: Date;
    freshness: Freshness;
    confidence: number; // 0.0–1.0
    explanationType: ExplanationType;
    modelVersion: string;
    riskLanguage: boolean;
    userVisibleReason: string;
}

// ── Scoring Results ──────────────────────────────────────────────────────────

export interface ScoredResult {
    score: number; // 0–100
    breakdown: Record<string, number>;
    trustMetadata: TrustMetadata;
    auditLogId: string;
}

export interface JobFitResult extends ScoredResult {
    perSkillContribution: Array<{
        skillId: string;
        skillName: string;
        evidenceLevel: EvidenceLevel | null;
        contribution: number;
        matched: boolean;
        transferredFrom?: string;
    }>;
}

export type ActionRecommendation = 'apply_now' | 'save' | 'reject' | 'verify_employer';

export interface ActionPriorityResult extends ScoredResult {
    recommendation: ActionRecommendation;
    explanation: string;
    inputScores: {
        jobFit: number;
        employerTrust: number;
        employerRisk: number;
        marketValue: number;
        skillReadiness: number;
    };
}

// ── Skill Taxonomy ───────────────────────────────────────────────────────────

export interface ResolvedSkill {
    canonicalId: string;
    canonicalName: string;
    matchType: 'exact' | 'alias' | 'fuzzy' | 'pending';
    confidence: number;
}

export interface CanonicalSkill {
    id: string;
    canonicalName: string;
    category: SkillCategory;
    aliases: string[];
    parentId: string | null;
    status: 'active' | 'pending_review';
    createdAt: Date;
}

export interface SkillRelationship {
    fromSkillId: string;
    toSkillId: string;
    relationType: SkillRelationType;
    strength: number; // 0.0–1.0
}

// ── Employer Profile ─────────────────────────────────────────────────────────

export interface EmployerProfile {
    id: string;
    name: string;
    normalizedName: string;
    website: string | null;
    market: string;
    registryId: string | null;
    sources: EmployerSourceRecord[];
    signals: EmployerSignalRecord[];
    trustScore: number | null;
    riskScore: number | null;
}

export interface EmployerSourceRecord {
    id: string;
    employerId: string;
    sourceType: EmployerSourceType;
    sourceName: string;
    sourceUrl: string | null;
    observedAt: Date;
    confidence: number;
}

export interface EmployerSignalRecord {
    id: string;
    employerId: string;
    signalType: string;
    category: SignalCategory;
    score: number; // -100 to +100
    severity: EmployerSignalSeverity;
    title: string;
    explanation: string;
    sourceId: string | null;
    trustMetadata: TrustMetadata;
    createdAt: Date;
}

// ── Scoring Inputs ───────────────────────────────────────────────────────────

export interface SkillReadinessInput {
    claimedLevel: number;
    requiredLevel: number;
    evidence: SkillEvidenceRecord[];
    relationships: SkillRelationship[];
    marketDemandScore: number;
    roleRelevanceScore: number;
}

export interface SkillEvidenceRecord {
    id: string;
    userId: string;
    skillId: string;
    sourceType: EvidenceSourceType;
    evidenceType: EvidenceLevel;
    evidenceText: string | null;
    evidenceUrl: string | null;
    occurredAt: Date | null;
    confidence: number;
    verifiedByUser: boolean | null;
}

export interface MarketValueInput {
    userSkills: Array<{ canonicalId: string; canonicalName: string }>;
    targetRoleListings: Array<{
        requiredSkills: string[];
        salaryMin?: number;
        salaryMax?: number;
    }>;
    targetMarket: string;
}

export interface JobFitInput {
    userSkills: Array<{ canonicalId: string; canonicalName: string }>;
    jobRequirements: Array<{ skillId: string; skillName: string; weight: number }>;
    userEvidence: SkillEvidenceRecord[];
    skillRelationships: SkillRelationship[];
}

export interface ActionPriorityInput {
    jobFit: number;
    employerTrust: number;
    employerRisk: number;
    marketValue: number;
    skillReadiness: number;
}

// ── Score Audit ──────────────────────────────────────────────────────────────

export type ScoreEntityType =
    | 'user_skill'
    | 'employer'
    | 'job_fit'
    | 'market_value'
    | 'action_priority';

export type ScoreType =
    | 'skill_readiness'
    | 'evidence_strength'
    | 'market_value'
    | 'job_fit'
    | 'employer_trust'
    | 'employer_risk'
    | 'action_priority';

// ── Telemetry ────────────────────────────────────────────────────────────────

export interface ProductEventInput {
    userId: string;
    eventName: string;
    entityType: string;
    entityId: string;
    metadata?: Record<string, unknown>;
}
