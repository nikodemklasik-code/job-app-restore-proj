#!/usr/bin/env bash
# Run SQL migrations on VPS
# Called automatically during deployment

set -e

echo "════════════════════════════════════════════"
echo "  Running SQL migrations on VPS"
echo "════════════════════════════════════════════"

cd /root/project

# Load environment variables
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
  echo "❌ Cannot parse DATABASE_URL" >&2
  exit 1
fi

echo "Database: ${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
echo ""

# Run achievements migration if it exists
if [ -f backend/sql/2026-05-08-add-achievements-to-experiences.sql ]; then
  echo "[1/1] Running achievements migration..."
  mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" < backend/sql/2026-05-08-add-achievements-to-experiences.sql
  echo "✅ Achievements migration completed"
else
  echo "ℹ️  No achievements migration file found, skipping"
fi

echo ""
echo "════════════════════════════════════════════"
echo "✅ Migrations completed"
echo "════════════════════════════════════════════"
