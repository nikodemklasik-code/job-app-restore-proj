#!/usr/bin/env bash
# Safe deploy: clean git tree check → ack → remote backup → deploy.sh.
# On deploy failure, attempts frontend rollback on the server (best-effort).
# No secrets in this file; pass deploy token like: bash scripts/deploy-safe.sh YOURTOKEN
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

HOST="${DEPLOY_HOST:-root@147.93.86.209}"
RB="${CANONICAL_REMOTE_BASE}"

if [[ -d "$ROOT/.git" ]]; then
  if [[ -n "$(git -C "$ROOT" status --porcelain 2>/dev/null)" && "${DEPLOY_ALLOW_DIRTY:-0}" != "1" ]]; then
    echo "Blocked: repository has uncommitted changes." >&2
    echo "  Commit or stash, or set DEPLOY_ALLOW_DIRTY=1 (dangerous)." >&2
    exit 1
  fi
fi

bash "${ROOT}/scripts/ack-deploy.sh"
bash "${ROOT}/scripts/backup-safe.sh"

set +e
bash "${ROOT}/scripts/deploy.sh" "$@"
code=$?
set -e

if [[ "$code" -ne 0 ]]; then
  echo "❌  deploy.sh failed (exit ${code}). Attempting frontend rollback on server…" >&2
  ssh -o ConnectTimeout=20 "${HOST}" "export REMOTE_BASE='${RB}'; bash ${RB}/scripts/rollback.sh" || true
  exit "$code"
fi

exit 0
