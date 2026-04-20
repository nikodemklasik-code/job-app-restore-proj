#!/usr/bin/env bash
# Quick check: correct checkout + integrity marker (no deploy, no token).
# QC / developers: docs/policies/canonical-repo-deploy-lock-policy-v1.0.md
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=scripts/lib/canonical-deploy-guards.sh
source "${ROOT}/scripts/lib/canonical-deploy-guards.sh"
if [[ -f "$ROOT/.env.local" ]]; then
  # shellcheck disable=SC1091
  set -o allexport; source "$ROOT/.env.local"; set +o allexport
fi
canonical_assert_repo_key_present
canonical_load_remote_targets
canonical_assert_local_repo_path
canonical_assert_deploy_branch
echo "✅  Canonical repo checks OK (see .canonical-repo-key)"
