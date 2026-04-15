/**
 * JobRadar v1.1 — Drizzle (MySQL) tables.
 * PostgreSQL reference migrations live under `db/migrations/`; this file is the app-side schema.
 */
import { relations } from 'drizzle-orm';
import {
  boolean,
  decimal,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core';

// --- Shared enum value tuples (keep column definitions consistent) ---

const jobRadarScanTriggerValues = ['saved_job', 'manual_search', 'url_input'] as const;
const jobRadarScanStatusValues = [
  'processing',
  'partial_report',
  'ready',
  'sources_blocked',
  'scan_failed',
] as const;
const jobRadarStageStateValues = [
  'pending',
  'processing',
  'done',
  'partial',
  'failed',
  'skipped',
  'blocked',
] as const;
const jobRadarConfidenceValues = ['low', 'medium', 'high'] as const;
const jobRadarRecommendationValues = [
  'Strong Match',
  'Good Option',
  'Mixed Signals',
  'High Risk',
] as const;
const jobRadarSourceTypeValues = [
  'official_website',
  'careers_page',
  'linkedin',
  'instagram',
  'registry',
  'job_board',
  'salary_aggregator',
  'review_site',
  'forum',
  'other',
] as const;
const jobRadarParseStatusValues = ['pending', 'parsed', 'failed', 'blocked'] as const;
const jobRadarFindingTypeValues = [
  'positive',
  'warning',
  'red_flag',
  'fit_match',
  'fit_mismatch',
  'benchmark',
] as const;
const jobRadarFindingVisibilityValues = ['visible', 'pending_review', 'suppressed'] as const;
const jobRadarDriverTypeValues = ['positive', 'negative', 'neutral'] as const;
const jobRadarFreshnessStatusValues = ['fresh', 'acceptable', 'stale'] as const;
const jobRadarComplaintStatusValues = ['open', 'under_review', 'resolved', 'rejected'] as const;
const jobRadarComplaintTypeValues = [
  'factual_inaccuracy',
  'outdated_information',
  'harmful_content',
  'legal_notice',
] as const;

export const jobRadarScans = mysqlTable(
  'job_radar_scans',
  {
    id: varchar('id', { length: 36 }).primaryKey(),

    userId: varchar('user_id', { length: 36 }).notNull(),
    employerId: varchar('employer_id', { length: 36 }),
    jobPostId: varchar('job_post_id', { length: 36 }),

    scanTrigger: mysqlEnum('scan_trigger', jobRadarScanTriggerValues).notNull(),
    status: mysqlEnum('status', jobRadarScanStatusValues).notNull().default('processing'),

    idempotencyKey: varchar('idempotency_key', { length: 36 }),
    entityFingerprint: varchar('entity_fingerprint', { length: 255 }).notNull(),
    sourceFingerprint: varchar('source_fingerprint', { length: 255 }),

    inputPayload: json('input_payload').notNull(),
    progress: json('progress').notNull(),

    startedAt: timestamp('started_at').notNull().defaultNow(),
    lastUpdatedAt: timestamp('last_updated_at').notNull().defaultNow(),
    completedAt: timestamp('completed_at'),
    failedReason: text('failed_reason'),

    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  },
  (table) => ({
    userIdempotencyIdx: uniqueIndex('ux_job_radar_scans_user_idempotency').on(
      table.userId,
      table.idempotencyKey,
    ),
    statusIdx: index('ix_job_radar_scans_status').on(table.status),
    entityFingerprintIdx: index('ix_job_radar_scans_entity_fingerprint').on(table.entityFingerprint),
    sourceFingerprintIdx: index('ix_job_radar_scans_source_fingerprint').on(table.sourceFingerprint),
    userStartedIdx: index('ix_job_radar_scans_user_started').on(table.userId, table.startedAt),
  }),
);

export const jobRadarReports = mysqlTable(
  'job_radar_reports',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    scanId: varchar('scan_id', { length: 36 }).notNull().unique(),

    status: mysqlEnum('status', jobRadarScanStatusValues).notNull(),

    scoringVersion: varchar('scoring_version', { length: 32 }).notNull(),
    parserVersion: varchar('parser_version', { length: 32 }).notNull(),
    normalizationVersion: varchar('normalization_version', { length: 32 }).notNull(),
    resolverVersion: varchar('resolver_version', { length: 32 }).notNull(),

    freshnessStatus: mysqlEnum('freshness_status', jobRadarFreshnessStatusValues)
      .notNull()
      .default('fresh'),
    freshnessHours: decimal('freshness_hours', { precision: 10, scale: 2 }).notNull().default('0.00'),
    lastScannedAt: timestamp('last_scanned_at').notNull(),
    autoRescanEligible: boolean('auto_rescan_eligible').notNull().default(false),
    rescanRecommended: boolean('rescan_recommended').notNull().default(false),

    confidenceSummary: json('confidence_summary').notNull(),
    missingData: json('missing_data').notNull(),
    keyFindings: json('key_findings').notNull(),
    redFlags: json('red_flags').notNull(),
    nextBestAction: json('next_best_action'),
    benchmarkProvenance: json('benchmark_provenance'),

    overrideApplied: boolean('override_applied').notNull().default(false),
    overrideId: varchar('override_id', { length: 32 }),
    overrideReason: text('override_reason'),
    overrideConfidence: mysqlEnum('override_confidence', jobRadarConfidenceValues),
    overrideCeiling: mysqlEnum('override_ceiling', jobRadarRecommendationValues),

    summaryJson: json('summary_json').notNull(),
    detailsJson: json('details_json').notNull(),
    sourcesJson: json('sources_json').notNull(),

    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  },
  (table) => ({
    statusIdx: index('ix_job_radar_reports_status').on(table.status),
    lastScannedIdx: index('ix_job_radar_reports_last_scanned_at').on(table.lastScannedAt),
  }),
);

export const jobRadarScores = mysqlTable('job_radar_scores', {
  id: varchar('id', { length: 36 }).primaryKey(),
  scanId: varchar('scan_id', { length: 36 }).notNull().unique(),

  employerScore: smallint('employer_score').notNull(),
  offerScore: smallint('offer_score').notNull(),
  marketPayScore: smallint('market_pay_score').notNull(),
  benefitsScore: smallint('benefits_score').notNull(),
  cultureFitScore: smallint('culture_fit_score').notNull(),
  riskScore: smallint('risk_score').notNull(),

  recommendation: mysqlEnum('recommendation', jobRadarRecommendationValues).notNull(),
  confidenceOverall: mysqlEnum('confidence_overall', jobRadarConfidenceValues).notNull(),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

export const jobRadarSources = mysqlTable(
  'job_radar_sources',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    scanId: varchar('scan_id', { length: 36 }).notNull(),
    employerId: varchar('employer_id', { length: 36 }),
    jobPostId: varchar('job_post_id', { length: 36 }),

    sourceType: mysqlEnum('source_type', jobRadarSourceTypeValues).notNull(),
    sourceQualityTier: smallint('source_quality_tier').notNull(),
    sourceUrl: text('source_url').notNull(),
    normalizedUrl: text('normalized_url'),
    canonicalUrl: text('canonical_url'),

    title: text('title'),
    sourceClusterId: varchar('source_cluster_id', { length: 64 }),
    contentHash: varchar('content_hash', { length: 255 }),

    publishedAt: timestamp('published_at'),
    collectedAt: timestamp('collected_at').notNull().defaultNow(),
    rawContent: text('raw_content'),
    rawContentExpiresAt: timestamp('raw_content_expires_at'),
    parseStatus: mysqlEnum('parse_status', jobRadarParseStatusValues).notNull().default('pending'),
    blockReason: text('block_reason'),

    metadata: json('metadata').notNull(),

    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  },
  (table) => ({
    scanIdx: index('ix_job_radar_sources_scan').on(table.scanId),
    clusterIdx: index('ix_job_radar_sources_cluster').on(table.sourceClusterId),
    contentHashIdx: index('ix_job_radar_sources_content_hash').on(table.contentHash),
    parseStatusIdx: index('ix_job_radar_sources_parse_status').on(table.parseStatus),
  }),
);

export const jobRadarSignals = mysqlTable(
  'job_radar_signals',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    scanId: varchar('scan_id', { length: 36 }).notNull(),
    sourceId: varchar('source_id', { length: 36 }),
    employerId: varchar('employer_id', { length: 36 }),
    jobPostId: varchar('job_post_id', { length: 36 }),

    signalScope: varchar('signal_scope', { length: 32 }).notNull(),
    category: varchar('category', { length: 64 }).notNull(),
    signalKey: varchar('signal_key', { length: 128 }).notNull(),

    signalValueText: text('signal_value_text'),
    signalValueNumber: decimal('signal_value_number', { precision: 14, scale: 4 }),
    signalValueJson: json('signal_value_json'),

    confidence: mysqlEnum('confidence', jobRadarConfidenceValues).notNull(),
    sourceQualityTier: smallint('source_quality_tier'),
    sourceClusterId: varchar('source_cluster_id', { length: 64 }),

    isMissingData: boolean('is_missing_data').notNull().default(false),
    isConflicted: boolean('is_conflicted').notNull().default(false),
    conflictReason: text('conflict_reason'),

    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  },
  (table) => ({
    scanScopeCategoryIdx: index('ix_job_radar_signals_scan_scope_category').on(
      table.scanId,
      table.signalScope,
      table.category,
    ),
    signalKeyIdx: index('ix_job_radar_signals_signal_key').on(table.signalKey),
  }),
);

export const jobRadarScoreDrivers = mysqlTable(
  'job_radar_score_drivers',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    scanId: varchar('scan_id', { length: 36 }).notNull(),
    scoreName: varchar('score_name', { length: 64 }).notNull(),
    driverType: mysqlEnum('driver_type', jobRadarDriverTypeValues).notNull(),
    label: text('label').notNull(),
    impact: int('impact').notNull(),
    confidence: mysqlEnum('confidence', jobRadarConfidenceValues).notNull(),
    sourceId: varchar('source_id', { length: 36 }),
    sourceRef: varchar('source_ref', { length: 255 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    scanScoreIdx: index('ix_job_radar_score_drivers_scan_score').on(table.scanId, table.scoreName),
  }),
);

export const jobRadarFindings = mysqlTable(
  'job_radar_findings',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    scanId: varchar('scan_id', { length: 36 }).notNull(),
    findingType: mysqlEnum('finding_type', jobRadarFindingTypeValues).notNull(),
    code: varchar('code', { length: 64 }),
    title: text('title').notNull(),
    summary: text('summary').notNull(),
    severity: varchar('severity', { length: 16 }).notNull(),
    confidence: mysqlEnum('confidence', jobRadarConfidenceValues).notNull(),
    sourceId: varchar('source_id', { length: 36 }),
    sourceRef: varchar('source_ref', { length: 255 }),
    visibility: mysqlEnum('visibility', jobRadarFindingVisibilityValues).notNull().default('visible'),
    reviewReason: text('review_reason'),
    reviewedBy: varchar('reviewed_by', { length: 36 }),
    reviewedAt: timestamp('reviewed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    scanTypeIdx: index('ix_job_radar_findings_scan_type').on(table.scanId, table.findingType),
  }),
);

export const jobRadarBenchmarks = mysqlTable('job_radar_benchmarks', {
  id: varchar('id', { length: 36 }).primaryKey(),
  scanId: varchar('scan_id', { length: 36 }).notNull(),

  roleFamily: varchar('role_family', { length: 128 }).notNull(),
  seniority: varchar('seniority', { length: 64 }),
  location: varchar('location', { length: 128 }).notNull(),
  country: varchar('country', { length: 64 }),
  currency: varchar('currency', { length: 3 }).notNull(),

  benchmarkRegion: varchar('benchmark_region', { length: 128 }).notNull(),
  benchmarkPeriod: varchar('benchmark_period', { length: 64 }).notNull(),
  sampleSize: int('sample_size').notNull(),
  sourceMix: json('source_mix').notNull(),
  normalizationVersion: varchar('normalization_version', { length: 32 }).notNull(),

  salaryP25: decimal('salary_p25', { precision: 12, scale: 2 }),
  salaryMedian: decimal('salary_median', { precision: 12, scale: 2 }),
  salaryP75: decimal('salary_p75', { precision: 12, scale: 2 }),

  confidence: mysqlEnum('confidence', jobRadarConfidenceValues).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const jobRadarComplaints = mysqlTable(
  'job_radar_complaints',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    reportId: varchar('report_id', { length: 36 }).notNull(),
    scanId: varchar('scan_id', { length: 36 }).notNull(),
    findingId: varchar('finding_id', { length: 36 }),
    userId: varchar('user_id', { length: 36 }),
    employerId: varchar('employer_id', { length: 36 }),

    complaintType: mysqlEnum('complaint_type', jobRadarComplaintTypeValues).notNull(),
    status: mysqlEnum('status', jobRadarComplaintStatusValues).notNull().default('open'),

    message: text('message').notNull(),
    sourceSnapshot: json('source_snapshot'),
    resolutionNote: text('resolution_note'),

    reviewedBy: varchar('reviewed_by', { length: 36 }),
    reviewedAt: timestamp('reviewed_at'),

    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  },
  (table) => ({
    reportIdx: index('ix_job_radar_complaints_report').on(table.reportId),
    scanIdx: index('ix_job_radar_complaints_scan').on(table.scanId),
    statusIdx: index('ix_job_radar_complaints_status').on(table.status),
  }),
);

export const jobRadarOutbox = mysqlTable(
  'job_radar_outbox',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    aggregateType: varchar('aggregate_type', { length: 64 }).notNull(),
    aggregateId: varchar('aggregate_id', { length: 36 }).notNull(),
    eventName: varchar('event_name', { length: 128 }).notNull(),
    eventVersion: varchar('event_version', { length: 16 }).notNull().default('1.0'),
    payload: json('payload').notNull(),
    occurredAt: timestamp('occurred_at').notNull().defaultNow(),
    publishedAt: timestamp('published_at'),
    deliveryAttempts: int('delivery_attempts').notNull().default(0),
    lastError: text('last_error'),
  },
  (table) => ({
    unpublishedIdx: index('ix_job_radar_outbox_unpublished').on(table.publishedAt, table.occurredAt),
    aggregateIdx: index('ix_job_radar_outbox_aggregate').on(table.aggregateType, table.aggregateId),
  }),
);

export const jobRadarMaintenanceRuns = mysqlTable('job_radar_maintenance_runs', {
  id: varchar('id', { length: 36 }).primaryKey(),
  jobName: varchar('job_name', { length: 128 }).notNull(),
  startedAt: timestamp('started_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
  status: varchar('status', { length: 16 }).notNull(),
  details: json('details').notNull(),
});

// --- Optional relations (use sparingly in hot paths) ---

export const jobRadarScansRelations = relations(jobRadarScans, ({ one, many }) => ({
  report: one(jobRadarReports, {
    fields: [jobRadarScans.id],
    references: [jobRadarReports.scanId],
  }),
  scores: one(jobRadarScores, {
    fields: [jobRadarScans.id],
    references: [jobRadarScores.scanId],
  }),
  sources: many(jobRadarSources),
  signals: many(jobRadarSignals),
  findings: many(jobRadarFindings),
}));

export const jobRadarReportsRelations = relations(jobRadarReports, ({ one }) => ({
  scan: one(jobRadarScans, {
    fields: [jobRadarReports.scanId],
    references: [jobRadarScans.id],
  }),
}));

// --- Inferred row types ---

export type JobRadarScan = typeof jobRadarScans.$inferSelect;
export type NewJobRadarScan = typeof jobRadarScans.$inferInsert;

export type JobRadarReport = typeof jobRadarReports.$inferSelect;
export type NewJobRadarReport = typeof jobRadarReports.$inferInsert;

export type JobRadarScore = typeof jobRadarScores.$inferSelect;
export type NewJobRadarScore = typeof jobRadarScores.$inferInsert;

export type JobRadarSource = typeof jobRadarSources.$inferSelect;
export type NewJobRadarSource = typeof jobRadarSources.$inferInsert;

export type JobRadarSignal = typeof jobRadarSignals.$inferSelect;
export type NewJobRadarSignal = typeof jobRadarSignals.$inferInsert;

export type JobRadarFinding = typeof jobRadarFindings.$inferSelect;
export type NewJobRadarFinding = typeof jobRadarFindings.$inferInsert;

export type JobRadarBenchmark = typeof jobRadarBenchmarks.$inferSelect;
export type NewJobRadarBenchmark = typeof jobRadarBenchmarks.$inferInsert;

export type JobRadarComplaint = typeof jobRadarComplaints.$inferSelect;
export type NewJobRadarComplaint = typeof jobRadarComplaints.$inferInsert;

export type JobRadarOutboxEvent = typeof jobRadarOutbox.$inferSelect;
export type NewJobRadarOutboxEvent = typeof jobRadarOutbox.$inferInsert;

export type JobRadarMaintenanceRun = typeof jobRadarMaintenanceRuns.$inferSelect;
export type NewJobRadarMaintenanceRun = typeof jobRadarMaintenanceRuns.$inferInsert;

/** Exported for application typing; DB columns use the same value sets via mysqlEnum. */
export type JobRadarStageState = (typeof jobRadarStageStateValues)[number];
