#!/usr/bin/env bash
# Remote pre-deploy backup: runs vps-predeploy-backup.sh logic on the VPS via SSH.
# No secrets; uses .canonical-repo-key for REMOTE_BASE and DEPLOY_HOST.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=scripts/lib/canonical-deploy-guards.sh
source "${ROOT}/scripts/lib/canonical-deploy-guards.sh"

canonical_assert_repo_key_present
if [[ -f "$ROOT/.env.local" ]]; then
  # shellcheck disable=SC1091
  set -o allexport; source "$ROOT/.env.local"; set +o allexport
fi
canonical_load_remote_targets
canonical_assert_ssh_host_matches "${DEPLOY_HOST:-root@147.93.86.209}"

HOST="${DEPLOY_HOST:-root@147.93.86.209}"

echo "[backup-safe] Running vps-predeploy-backup on ${HOST} (REMOTE_BASE=${CANONICAL_REMOTE_BASE})…"
ssh -o ConnectTimeout=20 "${HOST}" "export REMOTE_BASE='${CANONICAL_REMOTE_BASE}'; bash -s" <"${ROOT}/scripts/vps-predeploy-backup.sh"
echo "[backup-safe] Done."
