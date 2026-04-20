-- Server-backed user product settings (Agent 2 slice).
-- Run once on MySQL before using `settings.getSettings` / `settings.updateSettings`.

CREATE TABLE IF NOT EXISTS `user_settings` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `email_notifications` TINYINT(1) NOT NULL DEFAULT 1,
  `push_notifications` TINYINT(1) NOT NULL DEFAULT 1,
  `weekly_digest` TINYINT(1) NOT NULL DEFAULT 1,
  `marketing_emails` TINYINT(1) NOT NULL DEFAULT 0,
  `auto_save_documents` TINYINT(1) NOT NULL DEFAULT 1,
  `dark_mode` TINYINT(1) NOT NULL DEFAULT 0,
  `theme_mode` VARCHAR(16) NOT NULL DEFAULT 'system',
  `assistant_tone` VARCHAR(16) NOT NULL DEFAULT 'balanced',
  `timezone` VARCHAR(64) NOT NULL DEFAULT 'UTC',
  `language` VARCHAR(10) NOT NULL DEFAULT 'en',
  `privacy_mode` TINYINT(1) NOT NULL DEFAULT 0,
  `share_profile_analytics` TINYINT(1) NOT NULL DEFAULT 0,
  `blocked_company_domains` JSON NOT NULL DEFAULT (JSON_ARRAY()),
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_settings_user_id_unique` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
