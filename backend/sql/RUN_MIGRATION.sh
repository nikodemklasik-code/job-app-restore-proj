#!/usr/bin/env bash
# Skrypt do uruchomienia migracji bezpośrednio na serwerze
# Użycie: ssh root@147.93.86.209 'bash -s' < backend/sql/RUN_MIGRATION.sh

set -e

echo "════════════════════════════════════════════"
echo "  Migracja: Naprawa user_job_preferences"
echo "════════════════════════════════════════════"

cd /root/project

# Załaduj zmienne środowiskowe
if [ -f .env ]; then
  export $(grep -v '^#' .env | grep -v '^$' | xargs)
fi

# Parse DATABASE_URL
DB_URL="${DATABASE_URL}"

if [[ "$DB_URL" =~ mysql://([^:]+):([^@]+)@([^:]+):([^/]+)/(.+) ]]; then
  DB_USER="${BASH_REMATCH[1]}"
  DB_PASS="${BASH_REMATCH[2]}"
  DB_HOST="${BASH_REMATCH[3]}"
  DB_PORT="${BASH_REMATCH[4]}"
  DB_NAME="${BASH_REMATCH[5]}"
else
  echo "❌ Nie można sparsować DATABASE_URL" >&2
  exit 1
fi

echo "Połączenie z bazą: ${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
echo ""

# Utwórz plik migracji tymczasowo
cat > /tmp/migration.sql <<'EOSQL'
-- FAZA 1: Naprawa krytycznych kolumn w tabelach user_job_preferences i career_goals

-- ============================================================================
-- 1. Tabela user_job_preferences
-- ============================================================================

CREATE TABLE IF NOT EXISTS `user_job_preferences` (
  `user_id` VARCHAR(36) PRIMARY KEY,
  `last_query` VARCHAR(255) NOT NULL DEFAULT '',
  `last_location` VARCHAR(255) NOT NULL DEFAULT 'United Kingdom',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_user_job_preferences_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dodaj kolumny jeśli nie istnieją
SET @query_col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'user_job_preferences' 
    AND COLUMN_NAME = 'last_query'
);

SET @add_query_col = IF(@query_col_exists = 0, 
  'ALTER TABLE `user_job_preferences` ADD COLUMN `last_query` VARCHAR(255) NOT NULL DEFAULT ''''',
  'SELECT "Column last_query already exists" AS info'
);

PREPARE stmt FROM @add_query_col;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @location_col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'user_job_preferences' 
    AND COLUMN_NAME = 'last_location'
);

SET @add_location_col = IF(@location_col_exists = 0, 
  'ALTER TABLE `user_job_preferences` ADD COLUMN `last_location` VARCHAR(255) NOT NULL DEFAULT ''United Kingdom''',
  'SELECT "Column last_location already exists" AS info'
);

PREPARE stmt FROM @add_location_col;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Upewnij się, że kolumny mają właściwe wartości domyślne
ALTER TABLE `user_job_preferences` 
  MODIFY COLUMN `last_query` VARCHAR(255) NOT NULL DEFAULT '',
  MODIFY COLUMN `last_location` VARCHAR(255) NOT NULL DEFAULT 'United Kingdom';

-- ============================================================================
-- 2. Tabela career_goals
-- ============================================================================

SET @target_job_col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'career_goals' 
    AND COLUMN_NAME = 'target_job_title'
);

SET @add_target_job_col = IF(@target_job_col_exists = 0, 
  'ALTER TABLE `career_goals` ADD COLUMN `target_job_title` VARCHAR(255) NULL',
  'SELECT "Column target_job_title already exists" AS info'
);

PREPARE stmt FROM @add_target_job_col;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE `career_goals` 
  MODIFY COLUMN `target_job_title` VARCHAR(255) NULL;

EOSQL

echo "[1/2] Uruchamianie migracji SQL..."
mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" < /tmp/migration.sql

echo "✅ Migracja zakończona pomyślnie"
echo ""

echo "[2/2] Weryfikacja struktury tabel..."
echo ""
echo "═══ Struktura tabeli user_job_preferences ═══"
mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" -e "
  SELECT 
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = '${DB_NAME}' 
    AND TABLE_NAME = 'user_job_preferences'
  ORDER BY ORDINAL_POSITION;
"

echo ""
echo "═══ Struktura tabeli career_goals (wybrane kolumny) ═══"
mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" -e "
  SELECT 
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = '${DB_NAME}' 
    AND TABLE_NAME = 'career_goals'
    AND COLUMN_NAME IN ('target_job_title', 'current_job_title', 'target_salary', 'target_salary_min', 'target_salary_max')
  ORDER BY ORDINAL_POSITION;
"

echo ""
echo "═══ Liczba rekordów ═══"
mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" -e "
  SELECT 
    'user_job_preferences' AS table_name,
    COUNT(*) AS record_count,
    COUNT(CASE WHEN last_query != '' THEN 1 END) AS non_empty_queries,
    COUNT(CASE WHEN last_location != '' THEN 1 END) AS non_empty_locations
  FROM user_job_preferences;
"

mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" -e "
  SELECT 
    'career_goals' AS table_name,
    COUNT(*) AS record_count,
    COUNT(CASE WHEN target_job_title IS NOT NULL THEN 1 END) AS with_target_job
  FROM career_goals;
"

rm -f /tmp/migration.sql

echo ""
echo "════════════════════════════════════════════"
echo "✅ Migracja zakończona pomyślnie!"
echo "════════════════════════════════════════════"
