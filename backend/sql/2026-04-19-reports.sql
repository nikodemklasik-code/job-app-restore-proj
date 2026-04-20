-- Creates reports table for interview/coach/manual/analysis notes.
-- Idempotent — safe to re-run.

CREATE TABLE IF NOT EXISTS reports (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  source VARCHAR(32) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'open',
  source_reference_id VARCHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX reports_user_id_idx (user_id),
  INDEX reports_status_idx (status),
  INDEX reports_source_idx (source),
  INDEX reports_updated_at_idx (updated_at)
);
