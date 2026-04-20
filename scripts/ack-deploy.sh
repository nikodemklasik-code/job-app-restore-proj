#!/usr/bin/env bash
# Human acknowledgement before production deploy (no secrets).
# Exit 0 only after explicit confirmation or DEPLOY_ACK=I_DEPLOY_TO_PRODUCTION.
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

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Deploy acknowledgement required"
echo "  SSH target:    ${HOST}"
echo "  Remote app:    ${CANONICAL_REMOTE_BASE}"
echo "  Public site:   https://${CANONICAL_DEPLOY_TARGET}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [[ "${DEPLOY_ACK:-}" == "I_DEPLOY_TO_PRODUCTION" ]]; then
  echo "DEPLOY_ACK=I_DEPLOY_TO_PRODUCTION — continuing."
  exit 0
fi

read -r -p "Type I_DEPLOY_TO_PRODUCTION and press Enter: " line
if [[ "${line}" != "I_DEPLOY_TO_PRODUCTION" ]]; then
  echo "Aborted (no acknowledgement)." >&2
  exit 1
fi
