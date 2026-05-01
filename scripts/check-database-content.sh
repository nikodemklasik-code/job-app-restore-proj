#!/usr/bin/env bash
# Sprawdza zawartość bazy danych
set -euo pipefail

HOST="root@147.93.86.209"

echo "════════════════════════════════════════════"
echo "  Zawartość bazy danych multivohub_jobapp"
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

echo "Baza danych: ${DB_NAME}"
echo ""

echo "═══ UŻYTKOWNICY ═══"
mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" -e "
  SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as last_7_days,
    COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as last_30_days
  FROM users;
"

echo ""
echo "Lista użytkowników:"
mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" -e "
  SELECT id, email, created_at, last_seen_at 
  FROM users 
  ORDER BY created_at DESC 
  LIMIT 10;
"

echo ""
echo "═══ PROFILE ═══"
mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" -e "
  SELECT COUNT(*) as total_profiles FROM profiles;
"

mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" -e "
  SELECT 
    p.full_name,
    p.headline,
    p.location,
    u.email,
    p.created_at
  FROM profiles p
  JOIN users u ON p.user_id = u.id
  ORDER BY p.created_at DESC
  LIMIT 5;
"

echo ""
echo "═══ SKILLS ═══"
mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" -e "
  SELECT COUNT(*) as total_skills FROM skills;
"

echo ""
echo "═══ EXPERIENCES ═══"
mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" -e "
  SELECT COUNT(*) as total_experiences FROM experiences;
"

mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" -e "
  SELECT 
    employer_name,
    job_title,
    start_date,
    end_date
  FROM experiences
  ORDER BY created_at DESC
  LIMIT 5;
"

echo ""
echo "═══ EDUCATIONS ═══"
mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" -e "
  SELECT COUNT(*) as total_educations FROM educations;
"

echo ""
echo "═══ APPLICATIONS ═══"
mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" -e "
  SELECT 
    COUNT(*) as total_applications,
    COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft,
    COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent,
    COUNT(CASE WHEN status = 'viewed' THEN 1 END) as viewed,
    COUNT(CASE WHEN status = 'interview' THEN 1 END) as interview,
    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected
  FROM applications;
"

echo ""
echo "═══ INTERVIEW SESSIONS ═══"
mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" -e "
  SELECT 
    COUNT(*) as total_sessions,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
    AVG(score) as avg_score
  FROM interview_sessions;
"

echo ""
echo "═══ SUBSCRIPTIONS ═══"
mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" -e "
  SELECT 
    plan,
    status,
    credits,
    COUNT(*) as count
  FROM subscriptions
  GROUP BY plan, status, credits;
"

echo ""
echo "═══ JOBS ═══"
mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" -e "
  SELECT 
    COUNT(*) as total_jobs,
    COUNT(CASE WHEN source = 'manual' THEN 1 END) as manual,
    COUNT(CASE WHEN source = 'reed' THEN 1 END) as reed,
    COUNT(CASE WHEN source = 'adzuna' THEN 1 END) as adzuna,
    COUNT(CASE WHEN is_active = 1 THEN 1 END) as active
  FROM jobs;
"

echo ""
echo "═══ SAVED JOBS ═══"
mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" -e "
  SELECT COUNT(*) as total_saved_jobs FROM saved_jobs;
"

echo ""
echo "═══ DOCUMENTS ═══"
mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" -e "
  SELECT 
    type,
    COUNT(*) as count
  FROM documents
  GROUP BY type;
"

echo ""
echo "═══ CAREER GOALS ═══"
mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" -e "
  SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN target_job_title IS NOT NULL THEN 1 END) as with_target_job,
    COUNT(CASE WHEN current_job_title IS NOT NULL THEN 1 END) as with_current_job
  FROM career_goals;
"

echo ""
echo "═══ BILLING LEDGER ═══"
mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" -e "
  SELECT 
    COUNT(*) as total_transactions,
    SUM(CASE WHEN direction = 'debit' THEN amount_cents ELSE 0 END) as total_debits,
    SUM(CASE WHEN direction = 'credit' THEN amount_cents ELSE 0 END) as total_credits
  FROM billing_ledger;
"

echo ""
echo "═══ ASSISTANT CONVERSATIONS ═══"
mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" -e "
  SELECT 
    COUNT(*) as total_conversations,
    SUM(message_count) as total_messages
  FROM assistant_conversations;
"

echo ""
echo "═══ LIVE INTERVIEW SESSIONS ═══"
mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" -e "
  SELECT 
    status,
    COUNT(*) as count
  FROM live_interview_sessions
  GROUP BY status;
"

echo ""
echo "═══ ROZMIAR BAZY DANYCH ═══"
mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" -e "
  SELECT 
    table_name,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb,
    table_rows
  FROM information_schema.TABLES
  WHERE table_schema = '${DB_NAME}'
  ORDER BY (data_length + index_length) DESC
  LIMIT 15;
"
ENDSSH

echo ""
echo "════════════════════════════════════════════"
echo "✅ Weryfikacja zakończona"
echo "════════════════════════════════════════════"
