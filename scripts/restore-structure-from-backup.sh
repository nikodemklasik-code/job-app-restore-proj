#!/usr/bin/env bash
# Przywraca TYLKO strukturę tabel (bez danych) z backupu
set -euo pipefail

HOST="root@147.93.86.209"

echo "════════════════════════════════════════════"
echo "  Przywracanie struktury tabel z backupu"
echo "════════════════════════════════════════════"
echo ""

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

# Znajdź najnowszy backup
LATEST_BACKUP=$(ls -t /root/backups/${DB_NAME}_backup_*.sql | head -1)

if [ -z "$LATEST_BACKUP" ]; then
  echo "❌ Nie znaleziono backupu!"
  exit 1
fi

echo "Backup: ${LATEST_BACKUP}"
echo ""

echo "1. Wyciągam tylko CREATE TABLE z backupu..."
grep -E "^CREATE TABLE|^  \`|^  PRIMARY KEY|^  UNIQUE KEY|^  KEY|^  CONSTRAINT|^\) ENGINE" "${LATEST_BACKUP}" > /tmp/structure_only.sql || true

echo ""
echo "2. Przywracam strukturę tabel..."
mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" < "${LATEST_BACKUP}"

echo ""
echo "3. Weryfikuję tabele..."
mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" -e "SHOW TABLES;"

echo ""
echo "4. Sprawdzam strukturę kluczowych tabel..."
mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" -e "
  DESCRIBE users;
  DESCRIBE profiles;
  DESCRIBE user_job_preferences;
  DESCRIBE career_goals;
"

echo ""
echo "✅ Struktura przywrócona!"
ENDSSH

echo ""
echo "════════════════════════════════════════════"
echo "✅ Gotowe!"
echo "════════════════════════════════════════════"
