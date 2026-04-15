-- JobRadar: complaints + trust workflow (MySQL)
-- Apply manually or via migration runner; Drizzle source: backend/src/db/schemas/job-radar.ts

CREATE TABLE IF NOT EXISTS `job_radar_complaints` (
  `id` varchar(36) NOT NULL,
  `report_id` varchar(36) NOT NULL,
  `scan_id` varchar(36) NOT NULL,
  `finding_id` varchar(36) NULL,
  `user_id` varchar(36) NULL,
  `employer_id` varchar(36) NULL,
  `complaint_type` enum('factual_inaccuracy','outdated_information','harmful_content','legal_notice') NOT NULL,
  `status` enum('open','under_review','resolved','rejected') NOT NULL DEFAULT 'open',
  `message` text NOT NULL,
  `source_snapshot` json NULL,
  `resolution_note` text NULL,
  `reviewed_by` varchar(36) NULL,
  `reviewed_at` timestamp NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ix_job_radar_complaints_report` (`report_id`),
  KEY `ix_job_radar_complaints_scan` (`scan_id`),
  KEY `ix_job_radar_complaints_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
