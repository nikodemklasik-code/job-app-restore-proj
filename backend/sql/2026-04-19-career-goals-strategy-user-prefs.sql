-- Align MySQL with Drizzle schema for profile router + merge gate (apply before relying on new columns).
-- Safe to run once; use IF NOT EXISTS / information_schema guards on managed hosts if required.

ALTER TABLE `career_goals`
  ADD COLUMN `target_salary_min` INT NULL AFTER `target_salary`,
  ADD COLUMN `target_salary_max` INT NULL AFTER `target_salary_min`,
  ADD COLUMN `target_seniority` VARCHAR(80) NULL AFTER `target_salary_max`,
  ADD COLUMN `strategy_json` JSON NULL AFTER `auto_apply_min_score`;

CREATE TABLE IF NOT EXISTS `user_preference_flags` (
  `user_id` VARCHAR(36) NOT NULL,
  `case_study_opt_in` TINYINT(1) NOT NULL DEFAULT 0,
  `community_visibility` TINYINT(1) NOT NULL DEFAULT 0,
  `referral_participation` TINYINT(1) NOT NULL DEFAULT 1,
  `shared_sessions_discoverable` TINYINT(1) NOT NULL DEFAULT 0,
  `ai_personalization_enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`)
);
