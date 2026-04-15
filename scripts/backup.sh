#!/usr/bin/env bash
# ─── Pre-deploy backup — multivohub-jobapp ────────────────────────────────────
# Creates timestamped backups of the currently deployed frontend and backend
# before a new deploy overwrites them. Keeps the 3 most recent backups.
#
# Paths (must match deploy.yml / deploy.sh):
#   Frontend : /var/www/multivohub/
#   Backend  : /root/project/backend/dist/
#
# Usage (on the VPS or self-hosted runner):
#   bash scripts/backup.sh
#
set -euo pipefail

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_ROOT="/var/backups/multivohub"

FRONTEND_SRC="/var/www/multivohub"
BACKEND_SRC="/root/project/backend/dist"

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
  # Build list safely — shopt nullglob prevents errors when no matches exist
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
