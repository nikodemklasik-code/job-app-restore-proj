#!/usr/bin/env bash
# Sprawdza zgody użytkownika do scrapingu Indeed/Gumtree
set -euo pipefail

HOST="root@147.93.86.209"

echo "════════════════════════════════════════════"
echo "  Zgody do scrapingu (Indeed/Gumtree)"
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

echo "═══ SESJE SCRAPINGU (Indeed/Gumtree) ═══"
mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" -e "
  SELECT 
    u.email,
    s.provider,
    s.is_active,
    s.last_tested_at,
    s.created_at
  FROM user_job_sessions s
  JOIN users u ON s.user_id = u.id
  ORDER BY s.created_at DESC;
"

echo ""
echo "═══ USTAWIENIA ŹRÓDEŁ OFERT ═══"
mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" -e "
  SELECT 
    u.email,
    js.provider_name,
    js.is_enabled
  FROM job_source_settings js
  JOIN users u ON js.user_id = u.id
  ORDER BY js.updated_at DESC;
"

echo ""
echo "═══ LOGI SCRAPINGU ═══"
mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" -e "
  SELECT 
    provider_name,
    query,
    job_count,
    error_message,
    created_at
  FROM job_scrape_logs
  ORDER BY created_at DESC
  LIMIT 10;
"

echo ""
echo "═══ PODSUMOWANIE ═══"
SESSION_COUNT=$(mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" -sN -e "SELECT COUNT(*) FROM user_job_sessions WHERE is_active = 1;")

echo "Aktywnych sesji scrapingu: ${SESSION_COUNT}"

if [ "$SESSION_COUNT" -eq 0 ]; then
  echo ""
  echo "❌ BRAK ZGÓD DO SCRAPINGU!"
  echo "   Użytkownik musi dodać cookies Indeed/Gumtree w Settings"
else
  echo ""
  echo "✅ Zgody są aktywne"
fi
ENDSSH

echo ""
echo "════════════════════════════════════════════"
