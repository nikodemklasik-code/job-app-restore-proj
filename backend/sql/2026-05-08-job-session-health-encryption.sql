ALTER TABLE user_job_sessions
  ADD COLUMN session_status VARCHAR(30) NOT NULL DEFAULT 'active' AFTER is_active,
  ADD COLUMN last_health_reason VARCHAR(500) NULL AFTER last_tested_at;
