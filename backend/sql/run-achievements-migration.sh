#!/usr/bin/env bash
# Script to run achievements migration on VPS
# Usage: bash backend/sql/run-achievements-migration.sh

set -e

echo "════════════════════════════════════════════"
echo "  Migration: Add achievements to experiences"
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

echo "Connecting to database: ${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
echo ""

echo "[1/2] Running migration SQL..."
mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" < backend/sql/2026-05-08-add-achievements-to-experiences.sql

echo "✅ Migration completed successfully"
echo ""

echo "[2/2] Verifying experiences table structure..."
mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" -e "
  SELECT 
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = '${DB_NAME}' 
    AND TABLE_NAME = 'experiences'
  ORDER BY ORDINAL_POSITION;
"

echo ""
echo "════════════════════════════════════════════"
echo "✅ Migration completed successfully!"
echo "════════════════════════════════════════════"
