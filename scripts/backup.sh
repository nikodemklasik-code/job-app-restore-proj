#!/usr/bin/env bash
# ─── Pre-deploy backup — multivohub-jobapp ────────────────────────────────────
# Copies the currently deployed frontend dist and backend build output into
# /var/backups/multivohub with timestamps. Keeps the 3 most recent backups per type.
#
# Paths (must match scripts/deploy.sh and .github/workflows/deploy.yml):
#   REMOTE_BASE=/var/www/multivohub-jobapp
#   Frontend : ${REMOTE_BASE}/frontend/dist/
#   Backend  : ${REMOTE_BASE}/dist/backend/
#
# Usage (on the VPS or from CI over SSH):
#   bash scripts/backup.sh
#
set -euo pipefail

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_ROOT="/var/backups/multivohub"

REMOTE_BASE="${REMOTE_BASE:-/var/www/multivohub-jobapp}"
FRONTEND_SRC="${REMOTE_BASE}/frontend/dist"
BACKEND_SRC="${REMOTE_BASE}/dist/backend"

FRONTEND_BACKUP="${BACKUP_ROOT}/frontend-${TIMESTAMP}"
BACKEND_BACKUP="${BACKUP_ROOT}/backend-${TIMESTAMP}"

mkdir -p "${BACKUP_ROOT}"

# ── Frontend ──────────────────────────────────────────────────────────────────
if [ -d "${FRONTEND_SRC}" ] && [ "$(ls -A "${FRONTEND_SRC}" 2>/dev/null)" ]; then
  cp -r "${FRONTEND_SRC}" "${FRONTEND_BACKUP}"
  echo "✔ Frontend backup: ${FRONTEND_BACKUP}"
else
  echo "⚠ Frontend source empty or missing — skipping backup."
fi

# ── Backend ───────────────────────────────────────────────────────────────────
if [ -d "${BACKEND_SRC}" ] && [ "$(ls -A "${BACKEND_SRC}" 2>/dev/null)" ]; then
  cp -r "${BACKEND_SRC}" "${BACKEND_BACKUP}"
  echo "✔ Backend backup:  ${BACKEND_BACKUP}"
else
  echo "⚠ Backend source empty or missing — skipping backup."
fi

# ── Retention: keep only the 3 most recent backups of each type ───────────────
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

echo "✅ Backup complete — ${TIMESTAMP}"
