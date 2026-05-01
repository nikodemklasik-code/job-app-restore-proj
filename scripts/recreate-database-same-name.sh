#!/usr/bin/env bash
# Tworzy nową, czystą bazę danych z tą samą nazwą (po backupie starej)
set -euo pipefail

HOST="root@147.93.86.209"

echo "════════════════════════════════════════════"
echo "  Odtworzenie bazy danych (ta sama nazwa)"
echo "════════════════════════════════════════════"
echo ""
echo "⚠️  UWAGA: Stara baza zostanie usunięta!"
echo "   Backup zostanie zapisany w /root/backups/"
echo ""
read -p "Kontynuować? (tak/nie): " confirm

if [[ "$confirm" != "tak" ]]; then
  echo "Anulowano."
  exit 0
fi

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

echo "Baza danych: ${DB_NAME}"
echo ""

# 1. Backup
echo "1. Tworzę backup starej bazy..."
mkdir -p /root/backups
BACKUP_FILE="/root/backups/${DB_NAME}_backup_$(date +%Y%m%d_%H%M%S).sql"

mysqldump -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" > "${BACKUP_FILE}"
echo "   ✅ Backup zapisany: ${BACKUP_FILE}"
echo "   Rozmiar: $(du -h ${BACKUP_FILE} | cut -f1)"

# 2. Drop i Create
echo ""
echo "2. Usuwam starą bazę i tworzę nową..."
mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" -e "
  DROP DATABASE IF EXISTS ${DB_NAME};
  CREATE DATABASE ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
"
echo "   ✅ Baza ${DB_NAME} odtworzona (pusta)"

# 3. Weryfikacja
echo ""
echo "3. Weryfikuję nową bazę..."
mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" -e "
  USE ${DB_NAME};
  SHOW TABLES;
"
echo "   ✅ Baza jest pusta (gotowa na migracje)"

echo ""
echo "════════════════════════════════════════════"
echo "✅ Baza odtworzona!"
echo "════════════════════════════════════════════"
echo ""
echo "Backup: ${BACKUP_FILE}"
echo ""
echo "Następny krok:"
echo "  Uruchom migracje Drizzle, aby stworzyć tabele"
ENDSSH

echo ""
echo "════════════════════════════════════════════"
echo "✅ Gotowe!"
echo "════════════════════════════════════════════"
