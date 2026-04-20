-- Adds location, headline, linkedin_url, cv_url to profiles table.
-- Idempotent — safe to re-run.

SET @has_location := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'profiles' AND COLUMN_NAME = 'location');
SET @sql := IF(@has_location = 0, 'ALTER TABLE profiles ADD COLUMN location VARCHAR(255) NULL AFTER phone', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_headline := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'profiles' AND COLUMN_NAME = 'headline');
SET @sql := IF(@has_headline = 0, 'ALTER TABLE profiles ADD COLUMN headline VARCHAR(255) NULL AFTER location', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_linkedin := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'profiles' AND COLUMN_NAME = 'linkedin_url');
SET @sql := IF(@has_linkedin = 0, 'ALTER TABLE profiles ADD COLUMN linkedin_url VARCHAR(500) NULL AFTER summary', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_cv := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'profiles' AND COLUMN_NAME = 'cv_url');
SET @sql := IF(@has_cv = 0, 'ALTER TABLE profiles ADD COLUMN cv_url VARCHAR(500) NULL AFTER linkedin_url', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
