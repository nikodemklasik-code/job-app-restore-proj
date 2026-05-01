#!/usr/bin/env bash
# Sprawdza co użytkownik zapisał w Jobs i Profile
set -euo pipefail

HOST="root@147.93.86.209"

echo "════════════════════════════════════════════"
echo "  Co użytkownik zapisał?"
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

echo "═══ UŻYTKOWNICY W BAZIE ═══"
mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" -e "
  SELECT 
    u.email,
    u.created_at as 'Zarejestrowany',
    u.last_seen_at as 'Ostatnia aktywność'
  FROM users u
  ORDER BY u.created_at DESC
  LIMIT 5;
"

echo ""
echo "═══ JOBS - Co wpisałeś w wyszukiwarkę? ═══"
mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" -e "
  SELECT 
    u.email as 'Email użytkownika',
    p.last_query as 'Pozycja (Jobs)',
    p.last_location as 'Miasto (Jobs)',
    p.updated_at as 'Kiedy zapisano'
  FROM user_job_preferences p
  JOIN users u ON p.user_id = u.id
  ORDER BY p.updated_at DESC;
"

echo ""
echo "═══ PROFILE - Wymarzony zawód ═══"
mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" -e "
  SELECT 
    u.email as 'Email użytkownika',
    cg.target_job_title as 'Wymarzony zawód (Profile)',
    cg.current_job_title as 'Obecny zawód',
    cg.updated_at as 'Kiedy zapisano'
  FROM career_goals cg
  JOIN users u ON cg.user_id = u.id
  ORDER BY cg.updated_at DESC;
"

echo ""
echo "═══ PODSUMOWANIE ═══"
JOBS_COUNT=$(mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" -sN -e "SELECT COUNT(*) FROM user_job_preferences WHERE last_query != '';")
PROFILE_COUNT=$(mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" -sN -e "SELECT COUNT(*) FROM career_goals WHERE target_job_title IS NOT NULL;")

echo "Zapisanych wyszukiwań w Jobs: ${JOBS_COUNT}"
echo "Zapisanych wymarzonych zawodów w Profile: ${PROFILE_COUNT}"

if [ "$JOBS_COUNT" -gt 0 ] || [ "$PROFILE_COUNT" -gt 0 ]; then
  echo ""
  echo "✅ DZIAŁA! Dane są zapisane w bazie!"
else
  echo ""
  echo "❌ Brak zapisanych danych. Spróbuj jeszcze raz:"
  echo "   1. Wejdź w Jobs, wpisz pozycję i miasto, kliknij Search"
  echo "   2. Lub wejdź w Profile, wpisz wymarzony zawód, kliknij Save"
fi
ENDSSH

echo ""
echo "════════════════════════════════════════════"
