#!/usr/bin/env bash
# Tworzy nową, czystą bazę danych
set -euo pipefail

HOST="root@147.93.86.209"
NEW_DB_NAME="multivohub_jobapp_v2"

echo "════════════════════════════════════════════"
echo "  Tworzenie nowej bazy danych"
echo "════════════════════════════════════════════"
echo "Nowa baza: ${NEW_DB_NAME}"
echo ""

ssh "${HOST}" bash <<ENDSSH
set -e
cd /root/project

if [ -f .env ]; then
  export \$(grep -v '^#' .env | xargs)
fi

DB_URL="\${DATABASE_URL}"
if [[ "\$DB_URL" =~ mysql://([^:]+):([^@]+)@([^:]+):([^/]+)/(.+) ]]; then
  DB_USER="\${BASH_REMATCH[1]}"
  DB_PASS="\${BASH_REMATCH[2]}"
  DB_HOST="\${BASH_REMATCH[3]}"
  DB_PORT="\${BASH_REMATCH[4]}"
  OLD_DB_NAME="\${BASH_REMATCH[5]}"
fi

echo "Stara baza: \${OLD_DB_NAME}"
echo "Nowa baza: ${NEW_DB_NAME}"
echo ""

echo "1. Tworzę nową bazę danych..."
mysql -h"\${DB_HOST}" -P"\${DB_PORT}" -u"\${DB_USER}" -p"\${DB_PASS}" -e "
  DROP DATABASE IF EXISTS ${NEW_DB_NAME};
  CREATE DATABASE ${NEW_DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
"
echo "   ✅ Baza ${NEW_DB_NAME} utworzona"

echo ""
echo "2. Tworzę backup starego .env..."
cp .env .env.backup-\$(date +%Y%m%d-%H%M%S)

echo ""
echo "3. Aktualizuję DATABASE_URL w .env..."
# Zamień nazwę bazy w DATABASE_URL
sed -i "s|/\${OLD_DB_NAME}|/${NEW_DB_NAME}|g" .env

echo ""
echo "4. Weryfikuję nowy DATABASE_URL..."
grep "DATABASE_URL" .env

echo ""
echo "✅ Nowa baza gotowa!"
echo ""
echo "Następny krok: uruchom migracje Drizzle"
ENDSSH

echo ""
echo "════════════════════════════════════════════"
echo "✅ Baza ${NEW_DB_NAME} utworzona"
echo "════════════════════════════════════════════"
