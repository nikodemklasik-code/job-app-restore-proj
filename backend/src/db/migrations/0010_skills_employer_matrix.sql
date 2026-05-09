-- Skills & Employer Verification Matrix — Migration
-- Creates all new tables for skill taxonomy, employer intelligence, scoring audit,
-- job source tracking, telemetry, and application events.

CREATE TABLE IF NOT EXISTS `skill_taxonomy` (
  `id` varchar(36) NOT NULL,
  `canonical_name` varchar(255) NOT NULL,
  `category` varchar(50) NOT NULL,
  `aliases` json DEFAULT ('[]'),
  `parent_id` varchar(36),
  `status` varchar(20) NOT NULL DEFAULT 'active',
  `metadata` json,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `skill_taxonomy_canonical_name_unique` (`canonical_name`),
  KEY `ix_skill_taxonomy_category` (`category`),
  KEY `ix_skill_taxonomy_status` (`status`),
  KEY `ix_skill_taxonomy_parent` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `skill_relationships` (
  `id` varchar(36) NOT NULL,
  `from_skill_id` varchar(36) NOT NULL,
  `to_skill_id` varchar(36) NOT NULL,
  `relation_type` varchar(30) NOT NULL,
  `strength` decimal(3,2) NOT NULL DEFAULT '0.50',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_skill_relationships_from` (`from_skill_id`),
  KEY `ix_skill_relationships_to` (`to_skill_id`),
  UNIQUE KEY `ux_skill_relationships_pair` (`from_skill_id`, `to_skill_id`, `relation_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `matrix_skill_signals` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `skill_id` varchar(36) NOT NULL,
  `signal_type` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `explanation` text NOT NULL,
  `severity` varchar(20) NOT NULL DEFAULT 'info',
  `metadata` json,
  `trust_metadata` json NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` timestamp NULL,
  PRIMARY KEY (`id`),
  KEY `ix_matrix_skill_signals_user` (`user_id`),
  KEY `ix_matrix_skill_signals_user_skill` (`user_id`, `skill_id`),
  KEY `ix_matrix_skill_signals_type` (`signal_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `employers` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `normalized_name` varchar(255) NOT NULL,
  `website` varchar(500),
  `market` varchar(50) NOT NULL DEFAULT 'uk',
  `registry_id` varchar(100),
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_employers_normalized` (`normalized_name`),
  KEY `ix_employers_market` (`market`),
  KEY `ix_employers_registry` (`registry_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `employer_sources` (
  `id` varchar(36) NOT NULL,
  `employer_id` varchar(36) NOT NULL,
  `source_type` varchar(50) NOT NULL,
  `source_name` varchar(255) NOT NULL,
  `source_url` varchar(500),
  `observed_at` timestamp NOT NULL,
  `confidence` decimal(3,2) NOT NULL DEFAULT '0.50',
  `raw_data` json,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_employer_sources_employer` (`employer_id`),
  KEY `ix_employer_sources_type` (`source_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `employer_signals` (
  `id` varchar(36) NOT NULL,
  `employer_id` varchar(36) NOT NULL,
  `category` varchar(50) NOT NULL,
  `signal_type` varchar(100) NOT NULL,
  `score` int NOT NULL,
  `severity` varchar(20) NOT NULL,
  `title` varchar(255) NOT NULL,
  `explanation` text NOT NULL,
  `source_id` varchar(36),
  `trust_metadata` json NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` timestamp NULL,
  PRIMARY KEY (`id`),
  KEY `ix_employer_signals_employer` (`employer_id`),
  KEY `ix_employer_signals_category` (`employer_id`, `category`),
  KEY `ix_employer_signals_severity` (`severity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `job_source_snapshots` (
  `id` varchar(36) NOT NULL,
  `job_id` varchar(36) NOT NULL,
  `source` varchar(50) NOT NULL,
  `first_seen_at` timestamp NOT NULL,
  `last_seen_at` timestamp NOT NULL,
  `content_hash` varchar(64) NOT NULL,
  `raw_payload_ref` varchar(255),
  `source_confidence` decimal(3,2) NOT NULL DEFAULT '0.70',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_job_source_snapshots_job` (`job_id`),
  KEY `ix_job_source_snapshots_hash` (`content_hash`),
  KEY `ix_job_source_snapshots_source` (`source`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `score_audit_log` (
  `id` varchar(36) NOT NULL,
  `entity_type` varchar(50) NOT NULL,
  `entity_id` varchar(36) NOT NULL,
  `score_type` varchar(50) NOT NULL,
  `input_hash` varchar(64) NOT NULL,
  `output` json NOT NULL,
  `model_version` varchar(50) NOT NULL,
  `generated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_score_audit_log_entity` (`entity_type`, `entity_id`),
  KEY `ix_score_audit_log_type` (`score_type`),
  KEY `ix_score_audit_log_generated` (`generated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `product_events` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `event_name` varchar(100) NOT NULL,
  `entity_type` varchar(50) NOT NULL,
  `entity_id` varchar(36) NOT NULL,
  `metadata` json,
  `occurred_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_product_events_user` (`user_id`),
  KEY `ix_product_events_event` (`event_name`),
  KEY `ix_product_events_entity` (`entity_type`, `entity_id`),
  KEY `ix_product_events_occurred` (`occurred_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `application_events` (
  `id` varchar(36) NOT NULL,
  `application_id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `event_type` varchar(50) NOT NULL,
  `metadata` json,
  `snapshot_scores` json,
  `occurred_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_application_events_app` (`application_id`),
  KEY `ix_application_events_user` (`user_id`),
  KEY `ix_application_events_type` (`event_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
