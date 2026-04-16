#!/usr/bin/env bash
# ─── Pre-deploy backups on the VPS (rollback + archive) ───────────────────────
# Called from GitHub Actions deploy and mirrors scripts/deploy.sh + backup.sh:
#   1) Rollback-style: copy frontend/dist → dist-backup-<unix_ts> (rollback.sh)
#   2) Archive: copy frontend/dist + dist/backend → /var/backups/multivohub/<prefix>-<stamp>
#   3) Prune archives: keep 3 newest per prefix (same rule as scripts/backup.sh)
#
# Env:
#   REMOTE_BASE  default /var/www/multivohub-jobapp
#
set -euo pipefail

REMOTE_BASE="${REMOTE_BASE:-/var/www/multivohub-jobapp}"
DIST="${REMOTE_BASE}/frontend/dist"

# ── Rollback-style (next to dist/) ────────────────────────────────────────────
if [ -d "$DIST" ] && [ "$(ls -A "$DIST" 2>/dev/null)" ]; then
  BACKUP="${DIST}-backup-$(date +%s)"
  cp -r "$DIST" "$BACKUP"
  echo "  Rollback-style backup: $BACKUP"
  ls -d "${DIST}-backup-"* 2>/dev/null | sort -r | tail -n +4 | xargs rm -rf 2>/dev/null || true
else
  echo "  No existing frontend dist for rollback-style backup."
fi

# ── Dated archive under /var/backups (matches backup.sh naming) ───────────────
TS=$(date +%Y%m%d_%H%M%S)
BACKUP_ROOT="/var/backups/multivohub"
mkdir -p "$BACKUP_ROOT"

FE_SRC="${REMOTE_BASE}/frontend/dist"
BE_SRC="${REMOTE_BASE}/dist/backend"

if [ -d "$FE_SRC" ] && [ "$(ls -A "$FE_SRC" 2>/dev/null)" ]; then
  cp -r "$FE_SRC" "${BACKUP_ROOT}/frontend-${TS}"
  echo "  Archive backup: ${BACKUP_ROOT}/frontend-${TS}"
else
  echo "  Skipping frontend archive (empty or missing)."
fi

if [ -d "$BE_SRC" ] && [ "$(ls -A "$BE_SRC" 2>/dev/null)" ]; then
  cp -r "$BE_SRC" "${BACKUP_ROOT}/backend-${TS}"
  echo "  Archive backup: ${BACKUP_ROOT}/backend-${TS}"
else
  echo "  Skipping backend archive (empty or missing)."
fi

for PREFIX in frontend backend; do
  OLD=()
  while IFS= read -r -d '' DIR; do
    OLD+=("$DIR")
  done < <(find "${BACKUP_ROOT}" -maxdepth 1 -type d -name "${PREFIX}-*" -print0 2>/dev/null | sort -rz | tail -z -n +4)
  for DIR in "${OLD[@]}"; do
    rm -rf "${DIR}"
    echo "  Removed old backup: ${DIR}"
  done
done

echo "✅ Pre-deploy backup complete"
