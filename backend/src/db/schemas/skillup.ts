/**
 * SkillUp v1.0 — Drizzle (MySQL) tables.
 * Claims, evidence, assessments, language assessments, gaps, market value snapshots,
 * milestones, and verification sessions. Aligns with docs/ai/skillup/skillup-data-model-verification-v1.0.md.
 */
import {
  boolean,
  decimal,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core';

// --- Enum value tuples (MySQL ENUM columns; keep in sync with product spec) ---

const skillupSkillCategoryValues = ['hard', 'soft', 'language', 'domain', 'tool'] as const;
const skillupSkillLevelValues = ['basic', 'intermediate', 'advanced', 'expert'] as const;
const skillupClaimSourceValues = ['cv', 'linkedin', 'profile_form', 'manual_edit'] as const;
const skillupEvidenceSourceTypeValues = [
  'cv',
  'linkedin',
  'portfolio',
  'github',
  'reference',
  'mock_interview',
  'assistant_conversation',
  'coding_task',
  'writing_sample',
  'certificate',
  'job_history',
] as const;
const skillupEvidenceDirectionValues = ['supports', 'weakens', 'neutral'] as const;
const skillupConfidenceValues = ['low', 'medium', 'high'] as const;
const skillupVerificationStatusValues = [
  'self_declared',
  'lightly_evidenced',
  'partially_verified',
  'strongly_verified',
  'inconsistent',
] as const;
const skillupGapSeverityValues = ['missing', 'weak', 'needs_proof', 'stretch'] as const;
const skillupGapImportanceValues = ['must_have', 'important', 'optional'] as const;
const skillupTargetTypeValues = ['job', 'role_family', 'career_goal'] as const;
const skillupValueSnapshotTypeValues = ['current', 'projected'] as const;
const skillupMilestoneTypeValues = [
  'skill',
  'experience',
  'portfolio',
  'language',
  'certificate',
  'interview',
  'proof',
] as const;
const skillupMilestoneStatusValues = ['suggested', 'planned', 'in_progress', 'done', 'skipped'] as const;
const skillupVerificationSessionTypeValues = [
  'mock_interview',
  'language_check',
  'coding_challenge',
  'portfolio_review',
  'case_study_review',
  'writing_assessment',
] as const;
const skillupVerificationSessionStatusValues = ['started', 'completed', 'abandoned'] as const;

export const skillProfiles = mysqlTable(
  'skill_profiles',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 36 }).notNull().unique(),

    targetRole: varchar('target_role', { length: 128 }),
    targetSeniority: varchar('target_seniority', { length: 32 }),
    targetLocation: varchar('target_location', { length: 128 }),
    targetSalaryMin: decimal('target_salary_min', { precision: 12, scale: 2 }),
    targetSalaryMax: decimal('target_salary_max', { precision: 12, scale: 2 }),
    targetCurrency: varchar('target_currency', { length: 3 }),

    currentMarketValueMin: decimal('current_market_value_min', { precision: 12, scale: 2 }),
    currentMarketValueMax: decimal('current_market_value_max', { precision: 12, scale: 2 }),
    currentMarketValueConfidence: mysqlEnum('current_market_value_confidence', skillupConfidenceValues)
      .notNull()
      .default('low'),

    profileConfidence: mysqlEnum('profile_confidence', skillupConfidenceValues).notNull().default('low'),
    readinessScore: int('readiness_score'),

    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  },
  (table) => ({
    userIdx: uniqueIndex('ux_skill_profiles_user').on(table.userId),
  }),
);

export const skillClaims = mysqlTable(
  'skill_claims',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 36 }).notNull(),

    skillKey: varchar('skill_key', { length: 128 }).notNull(),
    skillCategory: mysqlEnum('skill_category', skillupSkillCategoryValues).notNull(),
    claimedLevel: mysqlEnum('claimed_level', skillupSkillLevelValues).notNull(),

    claimSource: mysqlEnum('claim_source', skillupClaimSourceValues).notNull(),
    claimText: text('claim_text'),
    isActive: boolean('is_active').notNull().default(true),

    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  },
  (table) => ({
    userSkillIdx: index('ix_skill_claims_user_skill').on(table.userId, table.skillKey),
    activeIdx: index('ix_skill_claims_active').on(table.userId, table.isActive),
  }),
);

export const skillEvidence = mysqlTable(
  'skill_evidence',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 36 }).notNull(),

    skillKey: varchar('skill_key', { length: 128 }).notNull(),
    sourceType: mysqlEnum('source_type', skillupEvidenceSourceTypeValues).notNull(),
    sourceRefId: varchar('source_ref_id', { length: 36 }),

    evidenceDirection: mysqlEnum('evidence_direction', skillupEvidenceDirectionValues).notNull(),
    evidenceStrength: mysqlEnum('evidence_strength', skillupConfidenceValues).notNull(),
    observedLevel: mysqlEnum('observed_level', skillupSkillLevelValues),

    evidenceText: text('evidence_text').notNull(),
    structuredPayload: json('structured_payload'),

    freshnessScore: int('freshness_score'),
    confidence: mysqlEnum('confidence', skillupConfidenceValues).notNull(),

    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    userSkillIdx: index('ix_skill_evidence_user_skill').on(table.userId, table.skillKey),
    sourceIdx: index('ix_skill_evidence_source').on(table.sourceType, table.sourceRefId),
    createdIdx: index('ix_skill_evidence_created').on(table.userId, table.createdAt),
  }),
);

export const skillAssessments = mysqlTable(
  'skill_assessments',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 36 }).notNull(),

    skillKey: varchar('skill_key', { length: 128 }).notNull(),
    skillCategory: mysqlEnum('skill_category', skillupSkillCategoryValues).notNull(),

    claimedLevel: mysqlEnum('claimed_level', skillupSkillLevelValues),
    observedLevel: mysqlEnum('observed_level', skillupSkillLevelValues),

    verificationStatus: mysqlEnum('verification_status', skillupVerificationStatusValues).notNull(),
    evidenceCount: int('evidence_count').notNull().default(0),
    supportCount: int('support_count').notNull().default(0),
    weakenCount: int('weaken_count').notNull().default(0),

    confidence: mysqlEnum('confidence', skillupConfidenceValues).notNull().default('low'),
    consistencyScore: int('consistency_score').notNull().default(0),
    marketRelevanceScore: int('market_relevance_score'),

    summary: text('summary').notNull(),
    improvementNote: text('improvement_note'),

    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  },
  (table) => ({
    userSkillUnique: uniqueIndex('ux_skill_assessments_user_skill').on(table.userId, table.skillKey),
    verificationIdx: index('ix_skill_assessments_verification').on(table.userId, table.verificationStatus),
  }),
);

export const languageAssessments = mysqlTable(
  'language_assessments',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 36 }).notNull(),

    languageKey: varchar('language_key', { length: 64 }).notNull(),

    declaredLevel: varchar('declared_level', { length: 16 }),
    observedGeneralLevel: varchar('observed_general_level', { length: 16 }),

    confidence: mysqlEnum('confidence', skillupConfidenceValues).notNull().default('low'),

    speakingLevel: varchar('speaking_level', { length: 16 }),
    writingLevel: varchar('writing_level', { length: 16 }),
    comprehensionLevel: varchar('comprehension_level', { length: 16 }),

    verificationStatus: mysqlEnum('verification_status', skillupVerificationStatusValues).notNull(),
    summary: text('summary').notNull(),
    improvementNote: text('improvement_note'),

    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  },
  (table) => ({
    userLanguageUnique: uniqueIndex('ux_language_assessments_user_language').on(table.userId, table.languageKey),
  }),
);

export const skillGaps = mysqlTable(
  'skill_gaps',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 36 }).notNull(),

    targetType: mysqlEnum('target_type', skillupTargetTypeValues).notNull(),
    targetRefId: varchar('target_ref_id', { length: 36 }),
    targetLabel: varchar('target_label', { length: 255 }).notNull(),

    skillKey: varchar('skill_key', { length: 128 }).notNull(),
    gapSeverity: mysqlEnum('gap_severity', skillupGapSeverityValues).notNull(),
    importance: mysqlEnum('importance', skillupGapImportanceValues).notNull(),

    currentObservedLevel: mysqlEnum('current_observed_level', skillupSkillLevelValues),
    targetExpectedLevel: mysqlEnum('target_expected_level', skillupSkillLevelValues),

    summary: text('summary').notNull(),
    recommendedAction: text('recommended_action'),

    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  },
  (table) => ({
    userTargetIdx: index('ix_skill_gaps_user_target').on(table.userId, table.targetType, table.targetRefId),
    severityIdx: index('ix_skill_gaps_severity').on(table.userId, table.gapSeverity),
  }),
);

export const careerValueSnapshots = mysqlTable(
  'career_value_snapshots',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 36 }).notNull(),

    snapshotType: mysqlEnum('snapshot_type', skillupValueSnapshotTypeValues).notNull(),
    projectionHorizonMonths: int('projection_horizon_months'),

    roleFamily: varchar('role_family', { length: 128 }).notNull(),
    seniorityBand: varchar('seniority_band', { length: 64 }),
    marketRegion: varchar('market_region', { length: 128 }).notNull(),
    currency: varchar('currency', { length: 3 }).notNull(),

    valueMin: decimal('value_min', { precision: 12, scale: 2 }).notNull(),
    valueMax: decimal('value_max', { precision: 12, scale: 2 }).notNull(),
    confidence: mysqlEnum('confidence', skillupConfidenceValues).notNull(),

    assumptions: json('assumptions').notNull(),
    driverSkillKeys: json('driver_skill_keys').notNull(),

    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    userSnapshotIdx: index('ix_career_value_snapshots_user_type').on(table.userId, table.snapshotType),
    createdIdx: index('ix_career_value_snapshots_created').on(table.userId, table.createdAt),
  }),
);

export const growthMilestones = mysqlTable(
  'growth_milestones',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 36 }).notNull(),

    milestoneType: mysqlEnum('milestone_type', skillupMilestoneTypeValues).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    summary: text('summary').notNull(),

    relatedSkillKeys: json('related_skill_keys').notNull(),

    estimatedDurationWeeks: int('estimated_duration_weeks'),
    /** Reuses low | medium | high as coarse difficulty (same ENUM as confidence). */
    difficulty: mysqlEnum('difficulty', skillupConfidenceValues).notNull(),

    impactMatchRate: int('impact_match_rate'),
    impactMarketValueMin: decimal('impact_market_value_min', { precision: 12, scale: 2 }),
    impactMarketValueMax: decimal('impact_market_value_max', { precision: 12, scale: 2 }),

    unlocks: json('unlocks'),
    status: mysqlEnum('status', skillupMilestoneStatusValues).notNull().default('suggested'),

    dueDate: timestamp('due_date'),
    completedAt: timestamp('completed_at'),

    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  },
  (table) => ({
    userStatusIdx: index('ix_growth_milestones_user_status').on(table.userId, table.status),
    createdIdx: index('ix_growth_milestones_created').on(table.userId, table.createdAt),
  }),
);

export const verificationSessions = mysqlTable(
  'verification_sessions',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 36 }).notNull(),

    sessionType: mysqlEnum('session_type', skillupVerificationSessionTypeValues).notNull(),
    targetSkills: json('target_skills').notNull(),

    status: mysqlEnum('status', skillupVerificationSessionStatusValues).notNull().default('started'),

    transcriptRef: varchar('transcript_ref', { length: 255 }),
    resultSummary: text('result_summary'),
    confidence: mysqlEnum('confidence', skillupConfidenceValues).notNull().default('low'),

    startedAt: timestamp('started_at').notNull().defaultNow(),
    completedAt: timestamp('completed_at'),
  },
  (table) => ({
    userStatusIdx: index('ix_verification_sessions_user_status').on(table.userId, table.status),
    typeIdx: index('ix_verification_sessions_type').on(table.userId, table.sessionType),
  }),
);

export const verificationSessionResults = mysqlTable(
  'verification_session_results',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    sessionId: varchar('session_id', { length: 36 }).notNull(),
    userId: varchar('user_id', { length: 36 }).notNull(),

    skillKey: varchar('skill_key', { length: 128 }).notNull(),
    observedLevel: mysqlEnum('observed_level', skillupSkillLevelValues),
    confidence: mysqlEnum('confidence', skillupConfidenceValues).notNull(),

    summary: text('summary').notNull(),
    structuredPayload: json('structured_payload'),

    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    sessionIdx: index('ix_verification_session_results_session').on(table.sessionId),
    userSkillIdx: index('ix_verification_session_results_user_skill').on(table.userId, table.skillKey),
  }),
);

// --- Inferred row types ---

export type SkillProfile = typeof skillProfiles.$inferSelect;
export type NewSkillProfile = typeof skillProfiles.$inferInsert;

export type SkillClaim = typeof skillClaims.$inferSelect;
export type NewSkillClaim = typeof skillClaims.$inferInsert;

export type SkillEvidence = typeof skillEvidence.$inferSelect;
export type NewSkillEvidence = typeof skillEvidence.$inferInsert;

export type SkillAssessment = typeof skillAssessments.$inferSelect;
export type NewSkillAssessment = typeof skillAssessments.$inferInsert;

export type LanguageAssessment = typeof languageAssessments.$inferSelect;
export type NewLanguageAssessment = typeof languageAssessments.$inferInsert;

export type SkillGap = typeof skillGaps.$inferSelect;
export type NewSkillGap = typeof skillGaps.$inferInsert;

export type CareerValueSnapshot = typeof careerValueSnapshots.$inferSelect;
export type NewCareerValueSnapshot = typeof careerValueSnapshots.$inferInsert;

export type GrowthMilestone = typeof growthMilestones.$inferSelect;
export type NewGrowthMilestone = typeof growthMilestones.$inferInsert;

export type VerificationSession = typeof verificationSessions.$inferSelect;
export type NewVerificationSession = typeof verificationSessions.$inferInsert;

export type VerificationSessionResult = typeof verificationSessionResults.$inferSelect;
export type NewVerificationSessionResult = typeof verificationSessionResults.$inferInsert;
