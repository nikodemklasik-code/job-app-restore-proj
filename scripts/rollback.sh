#!/usr/bin/env bash
# ─── Frontend rollback — multivohub-jobapp ────────────────────────────────────
# Restores the previous frontend dist from a timestamped backup.
#
# Usage (on the VPS or via SSH):
#   bash scripts/rollback.sh
#
# How it works:
#   Before each deploy, deploy.sh creates a backup of the current dist at:
#     /var/www/multivohub-jobapp/frontend/dist-backup-<timestamp>
#   This script lists available backups and restores the most recent one.
#
set -euo pipefail

DIST_DIR="/var/www/multivohub-jobapp/frontend/dist"
BACKUP_GLOB="/var/www/multivohub-jobapp/frontend/dist-backup-*"

# Find available backups
mapfile -t backups < <(ls -d $BACKUP_GLOB 2>/dev/null | sort -r)

if [[ ${#backups[@]} -eq 0 ]]; then
  echo "❌ No backups found at ${BACKUP_GLOB}"
  echo "   Backups are created automatically by deploy.sh before each deploy."
  exit 1
fi

echo "Available backups (newest first):"
for i in "${!backups[@]}"; do
  echo "  [$i] ${backups[$i]}"
done

# Auto-select most recent backup (index 0) unless overridden
TARGET="${backups[0]}"
echo ""
echo "Restoring: ${TARGET} → ${DIST_DIR}"

# Swap: rename current dist to a temp name, rename backup to dist
TIMESTAMP=$(date +%s)
if [[ -d "$DIST_DIR" ]]; then
  mv "$DIST_DIR" "/var/www/multivohub-jobapp/frontend/dist-pre-rollback-${TIMESTAMP}"
fi
mv "$TARGET" "$DIST_DIR"

echo "✅ Rollback complete — previous dist restored."
echo "   Verify: bash /var/www/multivohub-jobapp/scripts/smoke-test.sh"
