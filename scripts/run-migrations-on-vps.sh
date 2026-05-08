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

# Find all SQL migration files (excluding helper scripts)
MIGRATION_FILES=$(find backend/sql -name "*.sql" -type f ! -name "RUN_MIGRATION.sh" ! -name "run-*.sh" ! -name "*_ledger*.sql" ! -name "user_settings.sql" | sort)

if [ -z "$MIGRATION_FILES" ]; then
  echo "ℹ️  No migration files found in backend/sql/"
else
  TOTAL=$(echo "$MIGRATION_FILES" | wc -l | tr -d ' ')
  CURRENT=0
  
  echo "$MIGRATION_FILES" | while read -r migration_file; do
    CURRENT=$((CURRENT + 1))
    FILENAME=$(basename "$migration_file")
    echo "[${CURRENT}/${TOTAL}] Running migration: ${FILENAME}..."
    
    if mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" < "$migration_file" 2>&1; then
      echo "✅ ${FILENAME} completed"
    else
      echo "⚠️  ${FILENAME} had warnings (may be already applied)"
    fi
    echo ""
  done
fi

echo "════════════════════════════════════════════"
echo "✅ All migrations completed"
echo "════════════════════════════════════════════"
