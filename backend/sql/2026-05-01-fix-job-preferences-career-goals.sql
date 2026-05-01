-- FAZA 1: Naprawa krytycznych kolumn w tabelach user_job_preferences i career_goals
-- Data: 2026-05-01
-- Cel: Naprawienie problemu z zapisywaniem preferencji użytkownika i wymarzonych zawodów

-- ============================================================================
-- 1. Tabela user_job_preferences
-- ============================================================================

-- Sprawdź czy tabela istnieje, jeśli nie - utwórz ją
CREATE TABLE IF NOT EXISTS `user_job_preferences` (
  `user_id` VARCHAR(36) PRIMARY KEY,
  `last_query` VARCHAR(255) NOT NULL DEFAULT '',
  `last_location` VARCHAR(255) NOT NULL DEFAULT 'United Kingdom',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_user_job_preferences_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Jeśli tabela istnieje, upewnij się że kolumny mają właściwe typy i wartości domyślne
-- Dodaj kolumnę last_query jeśli nie istnieje
SET @query_col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'user_job_preferences' 
    AND COLUMN_NAME = 'last_query'
);

SET @add_query_col = IF(@query_col_exists = 0, 
  'ALTER TABLE `user_job_preferences` ADD COLUMN `last_query` VARCHAR(255) NOT NULL DEFAULT ''''',
  'SELECT "Column last_query already exists"'
);

PREPARE stmt FROM @add_query_col;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Dodaj kolumnę last_location jeśli nie istnieje
SET @location_col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'user_job_preferences' 
    AND COLUMN_NAME = 'last_location'
);

SET @add_location_col = IF(@location_col_exists = 0, 
  'ALTER TABLE `user_job_preferences` ADD COLUMN `last_location` VARCHAR(255) NOT NULL DEFAULT ''United Kingdom''',
  'SELECT "Column last_location already exists"'
);

PREPARE stmt FROM @add_location_col;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Upewnij się, że istniejące kolumny mają właściwe wartości domyślne
ALTER TABLE `user_job_preferences` 
  MODIFY COLUMN `last_query` VARCHAR(255) NOT NULL DEFAULT '',
  MODIFY COLUMN `last_location` VARCHAR(255) NOT NULL DEFAULT 'United Kingdom';

-- ============================================================================
-- 2. Tabela career_goals
-- ============================================================================

-- Sprawdź czy kolumna target_job_title istnieje
SET @target_job_col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'career_goals' 
    AND COLUMN_NAME = 'target_job_title'
);

-- Dodaj kolumnę target_job_title jeśli nie istnieje
SET @add_target_job_col = IF(@target_job_col_exists = 0, 
  'ALTER TABLE `career_goals` ADD COLUMN `target_job_title` VARCHAR(255) NULL',
  'SELECT "Column target_job_title already exists"'
);

PREPARE stmt FROM @add_target_job_col;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Upewnij się, że kolumna ma właściwy typ
ALTER TABLE `career_goals` 
  MODIFY COLUMN `target_job_title` VARCHAR(255) NULL;

-- ============================================================================
-- 3. Weryfikacja
-- ============================================================================

-- Pokaż strukturę tabel po migracji
SELECT 
  'user_job_preferences' AS table_name,
  COLUMN_NAME,
  COLUMN_TYPE,
  IS_NULLABLE,
  COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'user_job_preferences'
ORDER BY ORDINAL_POSITION;

SELECT 
  'career_goals' AS table_name,
  COLUMN_NAME,
  COLUMN_TYPE,
  IS_NULLABLE,
  COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'career_goals'
  AND COLUMN_NAME IN ('target_job_title', 'current_job_title', 'target_salary', 'target_salary_min', 'target_salary_max')
ORDER BY ORDINAL_POSITION;

-- Pokaż liczbę rekordów w tabelach
SELECT 
  'user_job_preferences' AS table_name,
  COUNT(*) AS record_count,
  COUNT(CASE WHEN last_query != '' THEN 1 END) AS non_empty_queries,
  COUNT(CASE WHEN last_location != '' THEN 1 END) AS non_empty_locations
FROM user_job_preferences;

SELECT 
  'career_goals' AS table_name,
  COUNT(*) AS record_count,
  COUNT(CASE WHEN target_job_title IS NOT NULL THEN 1 END) AS with_target_job
FROM career_goals;
