-- FAZA 1: Naprawa krytyczna - odblokowanie zapisów
-- Data: 2026-05-01
-- Cel: Naprawienie kolumn blokujących zapisywanie targetJobTitle i job preferences

-- ============================================================================
-- 1. Naprawa tabeli career_goals
-- ============================================================================

-- Sprawdź czy kolumny istnieją i napraw ich typy
ALTER TABLE career_goals 
  MODIFY COLUMN current_job_title VARCHAR(255) NULL,
  MODIFY COLUMN current_salary INT NULL,
  MODIFY COLUMN target_job_title VARCHAR(255) NULL,
  MODIFY COLUMN target_salary INT NULL,
  MODIFY COLUMN target_salary_min INT NULL,
  MODIFY COLUMN target_salary_max INT NULL,
  MODIFY COLUMN target_seniority VARCHAR(80) NULL,
  MODIFY COLUMN work_values TEXT NULL,
  MODIFY COLUMN auto_apply_min_score INT NOT NULL DEFAULT 75;

-- Dodaj strategy_json jeśli nie istnieje
ALTER TABLE career_goals 
  ADD COLUMN IF NOT EXISTS strategy_json JSON NULL;

-- ============================================================================
-- 2. Naprawa tabeli user_job_preferences
-- ============================================================================

-- Napraw kolumny aby były NOT NULL z domyślnymi wartościami
ALTER TABLE user_job_preferences
  MODIFY COLUMN last_query VARCHAR(255) NOT NULL DEFAULT '',
  MODIFY COLUMN last_location VARCHAR(255) NOT NULL DEFAULT 'United Kingdom';

-- ============================================================================
-- 3. Weryfikacja
-- ============================================================================

-- Pokaż strukturę naprawionych tabel
DESCRIBE career_goals;
DESCRIBE user_job_preferences;

-- Pokaż przykładowe dane
SELECT id, user_id, target_job_title, target_seniority, auto_apply_min_score 
FROM career_goals 
LIMIT 5;

SELECT user_id, last_query, last_location, updated_at 
FROM user_job_preferences 
LIMIT 5;
