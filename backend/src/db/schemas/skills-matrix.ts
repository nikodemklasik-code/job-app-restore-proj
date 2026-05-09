/**
 * Skills & Employer Verification Matrix — Drizzle schema.
 *
 * New tables for skill taxonomy, employer intelligence, scoring audit,
 * job source tracking, telemetry, and application events.
 *
 * NOTE: The existing `skill_evidence` table in `skillup.ts` is extended
 * separately (via ALTER migration). This file adds net-new tables only.
 */

import {
    boolean,
    decimal,
    index,
    int,
    json,
    mysqlTable,
    text,
    timestamp,
    uniqueIndex,
    varchar,
} from 'drizzle-orm/mysql-core';

import type { TrustMetadata } from '../../services/skillMatrix/types.js';

// ── Skill Taxonomy ────────────────────────────────────────────────────────────

export const skillTaxonomy = mysqlTable(
    'skill_taxonomy',
    {
        id: varchar('id', { length: 36 }).primaryKey(),
        canonicalName: varchar('canonical_name', { length: 255 }).notNull().unique(),
        category: varchar('category', { length: 50 }).notNull(),
        aliases: json('aliases').$type<string[]>().default([]),
        parentId: varchar('parent_id', { length: 36 }),
        status: varchar('status', { length: 20 }).notNull().default('active'),
        metadata: json('metadata').$type<Record<string, unknown>>(),
        createdAt: timestamp('created_at').defaultNow().notNull(),
        updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
    },
    (table) => ({
        categoryIdx: index('ix_skill_taxonomy_category').on(table.category),
        statusIdx: index('ix_skill_taxonomy_status').on(table.status),
        parentIdx: index('ix_skill_taxonomy_parent').on(table.parentId),
    }),
);

export const skillRelationships = mysqlTable(
    'skill_relationships',
    {
        id: varchar('id', { length: 36 }).primaryKey(),
        fromSkillId: varchar('from_skill_id', { length: 36 }).notNull(),
        toSkillId: varchar('to_skill_id', { length: 36 }).notNull(),
        relationType: varchar('relation_type', { length: 30 }).notNull(),
        strength: decimal('strength', { precision: 3, scale: 2 }).notNull().default('0.50'),
        createdAt: timestamp('created_at').defaultNow().notNull(),
    },
    (table) => ({
        fromIdx: index('ix_skill_relationships_from').on(table.fromSkillId),
        toIdx: index('ix_skill_relationships_to').on(table.toSkillId),
        pairIdx: uniqueIndex('ux_skill_relationships_pair').on(
            table.fromSkillId,
            table.toSkillId,
            table.relationType,
        ),
    }),
);

// ── Skill Signals (new — distinct from SkillUp evidence) ─────────────────────

export const matrixSkillSignals = mysqlTable(
    'matrix_skill_signals',
    {
        id: varchar('id', { length: 36 }).primaryKey(),
        userId: varchar('user_id', { length: 36 }).notNull(),
        skillId: varchar('skill_id', { length: 36 }).notNull(),
        signalType: varchar('signal_type', { length: 50 }).notNull(),
        title: varchar('title', { length: 255 }).notNull(),
        explanation: text('explanation').notNull(),
        severity: varchar('severity', { length: 20 }).notNull().default('info'),
        metadata: json('metadata').$type<Record<string, unknown>>(),
        trustMetadata: json('trust_metadata').$type<TrustMetadata>().notNull(),
        createdAt: timestamp('created_at').defaultNow().notNull(),
        expiresAt: timestamp('expires_at'),
    },
    (table) => ({
        userIdx: index('ix_matrix_skill_signals_user').on(table.userId),
        userSkillIdx: index('ix_matrix_skill_signals_user_skill').on(table.userId, table.skillId),
        typeIdx: index('ix_matrix_skill_signals_type').on(table.signalType),
    }),
);

// ── Employers ─────────────────────────────────────────────────────────────────

export const employers = mysqlTable(
    'employers',
    {
        id: varchar('id', { length: 36 }).primaryKey(),
        name: varchar('name', { length: 255 }).notNull(),
        normalizedName: varchar('normalized_name', { length: 255 }).notNull(),
        website: varchar('website', { length: 500 }),
        market: varchar('market', { length: 50 }).notNull().default('uk'),
        registryId: varchar('registry_id', { length: 100 }),
        createdAt: timestamp('created_at').defaultNow().notNull(),
        updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
    },
    (table) => ({
        normalizedIdx: index('ix_employers_normalized').on(table.normalizedName),
        marketIdx: index('ix_employers_market').on(table.market),
        registryIdx: index('ix_employers_registry').on(table.registryId),
    }),
);

export const employerSources = mysqlTable(
    'employer_sources',
    {
        id: varchar('id', { length: 36 }).primaryKey(),
        employerId: varchar('employer_id', { length: 36 }).notNull(),
        sourceType: varchar('source_type', { length: 50 }).notNull(),
        sourceName: varchar('source_name', { length: 255 }).notNull(),
        sourceUrl: varchar('source_url', { length: 500 }),
        observedAt: timestamp('observed_at').notNull(),
        confidence: decimal('confidence', { precision: 3, scale: 2 }).notNull().default('0.50'),
        rawData: json('raw_data').$type<Record<string, unknown>>(),
        createdAt: timestamp('created_at').defaultNow().notNull(),
    },
    (table) => ({
        employerIdx: index('ix_employer_sources_employer').on(table.employerId),
        typeIdx: index('ix_employer_sources_type').on(table.sourceType),
    }),
);

export const employerSignals = mysqlTable(
    'employer_signals',
    {
        id: varchar('id', { length: 36 }).primaryKey(),
        employerId: varchar('employer_id', { length: 36 }).notNull(),
        category: varchar('category', { length: 50 }).notNull(),
        signalType: varchar('signal_type', { length: 100 }).notNull(),
        score: int('score').notNull(),
        severity: varchar('severity', { length: 20 }).notNull(),
        title: varchar('title', { length: 255 }).notNull(),
        explanation: text('explanation').notNull(),
        sourceId: varchar('source_id', { length: 36 }),
        trustMetadata: json('trust_metadata').$type<TrustMetadata>().notNull(),
        createdAt: timestamp('created_at').defaultNow().notNull(),
        expiresAt: timestamp('expires_at'),
    },
    (table) => ({
        employerIdx: index('ix_employer_signals_employer').on(table.employerId),
        categoryIdx: index('ix_employer_signals_category').on(table.employerId, table.category),
        severityIdx: index('ix_employer_signals_severity').on(table.severity),
    }),
);

// ── Job Source Snapshots ──────────────────────────────────────────────────────

export const jobSourceSnapshots = mysqlTable(
    'job_source_snapshots',
    {
        id: varchar('id', { length: 36 }).primaryKey(),
        jobId: varchar('job_id', { length: 36 }).notNull(),
        source: varchar('source', { length: 50 }).notNull(),
        firstSeenAt: timestamp('first_seen_at').notNull(),
        lastSeenAt: timestamp('last_seen_at').notNull(),
        contentHash: varchar('content_hash', { length: 64 }).notNull(),
        rawPayloadRef: varchar('raw_payload_ref', { length: 255 }),
        sourceConfidence: decimal('source_confidence', { precision: 3, scale: 2 }).notNull().default('0.70'),
        createdAt: timestamp('created_at').defaultNow().notNull(),
    },
    (table) => ({
        jobIdx: index('ix_job_source_snapshots_job').on(table.jobId),
        hashIdx: index('ix_job_source_snapshots_hash').on(table.contentHash),
        sourceIdx: index('ix_job_source_snapshots_source').on(table.source),
    }),
);

// ── Score Audit Log ───────────────────────────────────────────────────────────

export const scoreAuditLog = mysqlTable(
    'score_audit_log',
    {
        id: varchar('id', { length: 36 }).primaryKey(),
        entityType: varchar('entity_type', { length: 50 }).notNull(),
        entityId: varchar('entity_id', { length: 36 }).notNull(),
        scoreType: varchar('score_type', { length: 50 }).notNull(),
        inputHash: varchar('input_hash', { length: 64 }).notNull(),
        output: json('output').$type<Record<string, unknown>>().notNull(),
        modelVersion: varchar('model_version', { length: 50 }).notNull(),
        generatedAt: timestamp('generated_at').defaultNow().notNull(),
    },
    (table) => ({
        entityIdx: index('ix_score_audit_log_entity').on(table.entityType, table.entityId),
        scoreTypeIdx: index('ix_score_audit_log_type').on(table.scoreType),
        generatedIdx: index('ix_score_audit_log_generated').on(table.generatedAt),
    }),
);

// ── Product Events (Telemetry) ────────────────────────────────────────────────

export const productEvents = mysqlTable(
    'product_events',
    {
        id: varchar('id', { length: 36 }).primaryKey(),
        userId: varchar('user_id', { length: 36 }).notNull(),
        eventName: varchar('event_name', { length: 100 }).notNull(),
        entityType: varchar('entity_type', { length: 50 }).notNull(),
        entityId: varchar('entity_id', { length: 36 }).notNull(),
        metadata: json('metadata').$type<Record<string, unknown>>(),
        occurredAt: timestamp('occurred_at').defaultNow().notNull(),
    },
    (table) => ({
        userIdx: index('ix_product_events_user').on(table.userId),
        eventIdx: index('ix_product_events_event').on(table.eventName),
        entityIdx: index('ix_product_events_entity').on(table.entityType, table.entityId),
        occurredIdx: index('ix_product_events_occurred').on(table.occurredAt),
    }),
);

// ── Application Events ────────────────────────────────────────────────────────

export const applicationEvents = mysqlTable(
    'application_events',
    {
        id: varchar('id', { length: 36 }).primaryKey(),
        applicationId: varchar('application_id', { length: 36 }).notNull(),
        userId: varchar('user_id', { length: 36 }).notNull(),
        eventType: varchar('event_type', { length: 50 }).notNull(),
        metadata: json('metadata').$type<Record<string, unknown>>(),
        snapshotScores: json('snapshot_scores').$type<{
            jobFit: number;
            employerTrust: number;
            employerRisk: number;
            actionPriority: number;
        }>(),
        occurredAt: timestamp('occurred_at').defaultNow().notNull(),
    },
    (table) => ({
        applicationIdx: index('ix_application_events_app').on(table.applicationId),
        userIdx: index('ix_application_events_user').on(table.userId),
        typeIdx: index('ix_application_events_type').on(table.eventType),
    }),
);

// ── Inferred Row Types ────────────────────────────────────────────────────────

export type SkillTaxonomyRow = typeof skillTaxonomy.$inferSelect;
export type NewSkillTaxonomyRow = typeof skillTaxonomy.$inferInsert;

export type SkillRelationshipRow = typeof skillRelationships.$inferSelect;
export type NewSkillRelationshipRow = typeof skillRelationships.$inferInsert;

export type MatrixSkillSignalRow = typeof matrixSkillSignals.$inferSelect;
export type NewMatrixSkillSignalRow = typeof matrixSkillSignals.$inferInsert;

export type EmployerRow = typeof employers.$inferSelect;
export type NewEmployerRow = typeof employers.$inferInsert;

export type EmployerSourceRow = typeof employerSources.$inferSelect;
export type NewEmployerSourceRow = typeof employerSources.$inferInsert;

export type EmployerSignalRow = typeof employerSignals.$inferSelect;
export type NewEmployerSignalRow = typeof employerSignals.$inferInsert;

export type JobSourceSnapshotRow = typeof jobSourceSnapshots.$inferSelect;
export type NewJobSourceSnapshotRow = typeof jobSourceSnapshots.$inferInsert;

export type ScoreAuditLogRow = typeof scoreAuditLog.$inferSelect;
export type NewScoreAuditLogRow = typeof scoreAuditLog.$inferInsert;

export type ProductEventRow = typeof productEvents.$inferSelect;
export type NewProductEventRow = typeof productEvents.$inferInsert;

export type ApplicationEventRow = typeof applicationEvents.$inferSelect;
export type NewApplicationEventRow = typeof applicationEvents.$inferInsert;
