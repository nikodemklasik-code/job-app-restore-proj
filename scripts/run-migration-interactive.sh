#!/usr/bin/env bash
# Interaktywna migracja - wymaga hasła SSH
set -euo pipefail

HOST="root@147.93.86.209"
REMOTE_BASE="/root/project"
MIGRATION_FILE="backend/sql/2026-05-01-fix-job-preferences-career-goals.sql"

echo "════════════════════════════════════════════"
echo "  Migracja: Naprawa user_job_preferences"
echo "════════════════════════════════════════════"
echo "Serwer:    ${HOST}"
echo "Hasło:     mama12345"
echo ""

# 1. Skopiuj plik migracji
echo "[1/3] Kopiowanie pliku migracji..."
scp "${MIGRATION_FILE}" "${HOST}:${REMOTE_BASE}/${MIGRATION_FILE}"

# 2. Uruchom migrację
echo ""
echo "[2/3] Uruchamianie migracji SQL..."
ssh "${HOST}" bash <<'ENDSSH'
set -e
cd /root/project

# Załaduj zmienne środowiskowe
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
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

# Uruchom migrację
mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" < /root/project/backend/sql/2026-05-01-fix-job-preferences-career-goals.sql

echo ""
echo "✅ Migracja zakończona pomyślnie"
ENDSSH

# 3. Weryfikacja
echo ""
echo "[3/3] Weryfikacja..."
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
fi

echo ""
echo "═══ Tabela user_job_preferences ═══"
mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" -e "
  DESCRIBE user_job_preferences;
"

echo ""
echo "═══ Tabela career_goals (wybrane kolumny) ═══"
mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" -e "
  SELECT 
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = '${DB_NAME}' 
    AND TABLE_NAME = 'career_goals'
    AND COLUMN_NAME LIKE '%job%'
  ORDER BY ORDINAL_POSITION;
"

echo ""
echo "═══ Dane w tabelach ═══"
mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" -e "
  SELECT COUNT(*) as user_job_preferences_count FROM user_job_preferences;
  SELECT COUNT(*) as career_goals_count FROM career_goals;
"
ENDSSH

echo ""
echo "════════════════════════════════════════════"
echo "✅ Gotowe!"
echo "════════════════════════════════════════════"
