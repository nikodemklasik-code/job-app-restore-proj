-- Agent B — profile source-of-truth extensions + community preference flags
-- Run once on existing DBs (after migrate-v2-new-tables.sql), e.g.:
--   mysql -u root -p multivohub < scripts/migrate-agent-b-profile-community-v1.sql
--
-- If a column already exists, skip that line or run equivalent ALTER manually.

ALTER TABLE career_goals
  ADD COLUMN target_salary_min INT NULL AFTER target_salary,
  ADD COLUMN target_salary_max INT NULL AFTER target_salary_min,
  ADD COLUMN target_seniority VARCHAR(80) NULL AFTER target_salary_max,
  ADD COLUMN strategy_json JSON NULL AFTER auto_apply_min_score;

CREATE TABLE IF NOT EXISTS user_preference_flags (
  user_id                        VARCHAR(36)  NOT NULL PRIMARY KEY,
  case_study_opt_in              BOOLEAN        NOT NULL DEFAULT FALSE,
  community_visibility           BOOLEAN        NOT NULL DEFAULT FALSE,
  referral_participation         BOOLEAN        NOT NULL DEFAULT TRUE,
  shared_sessions_discoverable   BOOLEAN        NOT NULL DEFAULT FALSE,
  ai_personalization_enabled     BOOLEAN        NOT NULL DEFAULT TRUE,
  created_at                     TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                     TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
