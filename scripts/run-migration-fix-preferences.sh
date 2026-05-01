#!/usr/bin/env bash
# Uruchamia migrację naprawiającą tabele user_job_preferences i career_goals
# Data: 2026-05-01

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MIGRATION_FILE="backend/sql/2026-05-01-fix-job-preferences-career-goals.sql"

# Załaduj konfigurację serwera
source "$ROOT/scripts/lib/canonical-deploy-guards.sh"
canonical_load_remote_targets

HOST="${CANONICAL_DEPLOY_HOST}"
REMOTE_BASE="${CANONICAL_REMOTE_BASE}"

echo "════════════════════════════════════════════"
echo "  Migracja: Naprawa user_job_preferences"
echo "════════════════════════════════════════════"
echo "Serwer:    ${HOST}"
echo "Ścieżka:   ${REMOTE_BASE}"
echo "Migracja:  ${MIGRATION_FILE}"
echo ""

# 1. Skopiuj plik migracji na serwer
echo "[1/3] Kopiowanie pliku migracji na serwer..."
rsync -avz "$ROOT/$MIGRATION_FILE" "${HOST}:${REMOTE_BASE}/${MIGRATION_FILE}"

# 2. Uruchom migrację
echo "[2/3] Uruchamianie migracji SQL..."
ssh "${HOST}" bash <<'ENDSSH'
set -e

# Załaduj zmienne środowiskowe z .env
cd /root/project
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Wyciągnij dane połączenia z DATABASE_URL
# Format: mysql://user:pass@host:port/database
DB_URL="${DATABASE_URL}"

# Parse DATABASE_URL
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

# Uruchom migrację
mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" < /root/project/backend/sql/2026-05-01-fix-job-preferences-career-goals.sql

echo "✅ Migracja zakończona pomyślnie"
ENDSSH

# 3. Weryfikacja
echo "[3/3] Weryfikacja struktury tabel..."
ssh "${HOST}" bash <<'ENDSSH'
set -e

cd /root/project
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

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
ENDSSH

echo ""
echo "════════════════════════════════════════════"
echo "✅ Migracja zakończona pomyślnie!"
echo "════════════════════════════════════════════"
echo ""
echo "Następne kroki:"
echo "1. Przetestuj zapisywanie preferencji w Jobs"
echo "2. Przetestuj zapisywanie wymarzonych zawodów w Profile"
echo "3. Sprawdź logi backendu: ssh root@${HOST} 'pm2 logs jobapp-server'"
echo ""
