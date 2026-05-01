#!/usr/bin/env bash
# Szczegółowa lista użytkowników
set -euo pipefail

HOST="root@147.93.86.209"

echo "════════════════════════════════════════════"
echo "  Szczegółowa lista użytkowników"
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

echo "═══ WSZYSCY UŻYTKOWNICY ═══"
mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" -e "
  SELECT 
    u.id,
    u.clerk_id,
    u.email,
    p.full_name,
    p.headline,
    p.location,
    u.created_at,
    u.last_seen_at,
    u.retention_status
  FROM users u
  LEFT JOIN profiles p ON u.id = p.user_id
  ORDER BY u.created_at DESC;
"

echo ""
echo "═══ STATYSTYKI PER UŻYTKOWNIK ═══"
mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" -e "
  SELECT 
    u.email,
    p.full_name,
    (SELECT COUNT(*) FROM skills s WHERE s.profile_id = p.id) as skills_count,
    (SELECT COUNT(*) FROM experiences e WHERE e.profile_id = p.id) as experiences_count,
    (SELECT COUNT(*) FROM educations ed WHERE ed.profile_id = p.id) as educations_count,
    (SELECT COUNT(*) FROM interview_sessions i WHERE i.user_id = u.id) as interviews_count,
    (SELECT COUNT(*) FROM live_interview_sessions l WHERE l.user_id = u.id) as live_interviews_count,
    (SELECT COUNT(*) FROM assistant_conversations ac WHERE ac.user_id = u.id) as conversations_count,
    (SELECT COUNT(*) FROM applications a WHERE a.user_id = u.id) as applications_count
  FROM users u
  LEFT JOIN profiles p ON u.id = p.user_id
  ORDER BY u.created_at DESC;
"

echo ""
echo "═══ SUBSKRYPCJE ═══"
mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" -e "
  SELECT 
    u.email,
    s.plan,
    s.status,
    s.credits,
    s.allowance_limit,
    s.allowance_remaining
  FROM subscriptions s
  JOIN users u ON s.user_id = u.id;
"

echo ""
echo "═══ OSTATNIA AKTYWNOŚĆ ═══"
mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" -e "
  SELECT 
    u.email,
    p.full_name,
    u.last_seen_at,
    DATEDIFF(NOW(), u.last_seen_at) as days_since_last_seen
  FROM users u
  LEFT JOIN profiles p ON u.id = p.user_id
  ORDER BY u.last_seen_at DESC;
"
ENDSSH

echo ""
echo "════════════════════════════════════════════"
echo "✅ Lista zakończona"
echo "════════════════════════════════════════════"
