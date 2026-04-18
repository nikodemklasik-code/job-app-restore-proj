-- Live Interview: persist billing reservation between create and complete/abandon.
-- Apply on MySQL before relying on new server code (nullable column, safe for existing rows).
ALTER TABLE `live_interview_sessions`
  ADD COLUMN `pending_credit_spend_event_id` VARCHAR(36) NULL
  AFTER `ended_at`;
