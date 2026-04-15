-- Job Radar: finding visibility for human review / suppression (MySQL).
-- Run against the same database used by Drizzle `job-radar` schema.

ALTER TABLE job_radar_findings
  ADD COLUMN visibility ENUM('visible', 'pending_review', 'suppressed') NOT NULL DEFAULT 'visible' AFTER source_ref,
  ADD COLUMN review_reason TEXT NULL AFTER visibility,
  ADD COLUMN reviewed_by VARCHAR(36) NULL AFTER review_reason,
  ADD COLUMN reviewed_at TIMESTAMP NULL AFTER reviewed_by;
