#!/usr/bin/env bash
# GitHub Actions: verify .canonical-repo-key matches workflow REMOTE_BASE (no local path lock).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=scripts/lib/canonical-deploy-guards.sh
source "${ROOT}/scripts/lib/canonical-deploy-guards.sh"

canonical_assert_repo_key_present
canonical_load_remote_targets

# In GitHub Actions the workflow sets REMOTE_BASE. Locally it may be unset — then assume canonical.
REMOTE_BASE="${REMOTE_BASE:-$CANONICAL_REMOTE_BASE}"
if [[ "$REMOTE_BASE" != "$CANONICAL_REMOTE_BASE" ]]; then
  echo "::error::REMOTE_BASE must equal CANONICAL_REMOTE_BASE from .canonical-repo-key"
  echo "REMOTE_BASE=${REMOTE_BASE}"
  echo "Canonical:     ${CANONICAL_REMOTE_BASE}"
  exit 1
fi

echo "✅  Canonical deploy markers OK for CI (REMOTE_BASE matches .canonical-repo-key)"
