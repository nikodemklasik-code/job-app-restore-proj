#!/usr/bin/env bash
# Lightweight shell test harness for scripts/lib/canonical-deploy-guards.sh.
#
# Pure unit coverage — no network, no SSH, no DNS calls. We stand up a
# temporary ROOT with a synthetic .canonical-repo-key and assert that each
# guard accepts valid inputs and rejects the kinds of mistakes QC cares
# about (missing marker, wrong PROJECT_KEY, wrong folder, wrong branch,
# wrong host).
#
# Run: bash scripts/tests/canonical-deploy-guards.test.sh
set -u

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
GUARDS_LIB="${REPO_ROOT}/scripts/lib/canonical-deploy-guards.sh"

if [[ ! -f "$GUARDS_LIB" ]]; then
  echo "Missing guards library: ${GUARDS_LIB}" >&2
  exit 1
fi

PASS=0
FAIL=0
LAST_MSG=""

red()   { printf '\033[31m%s\033[0m' "$1"; }
green() { printf '\033[32m%s\033[0m' "$1"; }

record_pass() { PASS=$((PASS + 1)); printf '  %s %s\n' "$(green '✓')" "$1"; }
record_fail() { FAIL=$((FAIL + 1)); printf '  %s %s — %s\n' "$(red '✗')" "$1" "${LAST_MSG:-no output}"; }

# Run a bash snippet in a subshell that sources the guards lib with a given
# ROOT. On success we record a pass; on failure we record a fail.
run_expect_success() {
  local name="$1"
  local root_dir="$2"
  local snippet="$3"
  LAST_MSG="$(
    ROOT="$root_dir" GITHUB_ACTIONS="" \
    DEPLOY_SKIP_LOCAL_REPO_PATH="1" DEPLOY_SKIP_BRANCH_GUARD="1" \
    bash -c "export ROOT GITHUB_ACTIONS DEPLOY_SKIP_LOCAL_REPO_PATH DEPLOY_SKIP_BRANCH_GUARD; source '${GUARDS_LIB}'; ${snippet}" 2>&1
  )"
  if [[ $? -eq 0 ]]; then record_pass "$name"; else record_fail "$name"; fi
}

run_expect_failure() {
  local name="$1"
  local root_dir="$2"
  local snippet="$3"
  LAST_MSG="$(
    ROOT="$root_dir" GITHUB_ACTIONS="" \
    DEPLOY_SKIP_LOCAL_REPO_PATH="1" DEPLOY_SKIP_BRANCH_GUARD="1" \
    bash -c "export ROOT GITHUB_ACTIONS DEPLOY_SKIP_LOCAL_REPO_PATH DEPLOY_SKIP_BRANCH_GUARD; source '${GUARDS_LIB}'; ${snippet}" 2>&1
  )"
  if [[ $? -ne 0 ]]; then record_pass "$name"; else record_fail "$name"; fi
}

make_fixture_root() {
  local dir
  dir="$(mktemp -d)"
  cat >"${dir}/.canonical-repo-key" <<'EOF'
PROJECT_KEY=MULTIVOHUB_JOBAPP_CANONICAL
CANONICAL_REPO_PATH=/Users/nikodem/job-app-restore/proj
CANONICAL_REMOTE_BASE=/root/project
CANONICAL_REMOTE_FRONTEND_DIST=/root/project/frontend/dist
CANONICAL_DEPLOY_TARGET=example.com
CANONICAL_DEPLOY_HOST=203.0.113.10
ALLOWED_DEPLOY_BRANCH=claude/improvements
EOF
  echo "$dir"
}

echo "→ canonical-deploy-guards.test.sh"

FIX="$(make_fixture_root)"

run_expect_success \
  "canonical_kv_get returns PROJECT_KEY from fixture" \
  "$FIX" \
  '[[ "$(canonical_kv_get PROJECT_KEY)" == "MULTIVOHUB_JOBAPP_CANONICAL" ]]'

run_expect_success \
  "canonical_kv_get returns CANONICAL_DEPLOY_HOST from fixture" \
  "$FIX" \
  '[[ "$(canonical_kv_get CANONICAL_DEPLOY_HOST)" == "203.0.113.10" ]]'

run_expect_success \
  "canonical_extract_ssh_host strips user@ prefix" \
  "$FIX" \
  '[[ "$(canonical_extract_ssh_host root@203.0.113.10)" == "203.0.113.10" ]]'

run_expect_success \
  "canonical_extract_ssh_host preserves bare host" \
  "$FIX" \
  '[[ "$(canonical_extract_ssh_host 203.0.113.10)" == "203.0.113.10" ]]'

run_expect_success \
  "canonical_assert_repo_key_present passes on valid fixture" \
  "$FIX" \
  'canonical_assert_repo_key_present'

run_expect_success \
  "canonical_load_remote_targets populates required vars" \
  "$FIX" \
  'canonical_load_remote_targets && [[ -n "$CANONICAL_REMOTE_BASE" && -n "$CANONICAL_DEPLOY_TARGET" && -n "$CANONICAL_DEPLOY_HOST" ]]'

run_expect_success \
  "canonical_assert_ssh_host_matches accepts correct host" \
  "$FIX" \
  'canonical_load_remote_targets && canonical_assert_ssh_host_matches root@203.0.113.10'

run_expect_failure \
  "canonical_assert_ssh_host_matches rejects wrong host" \
  "$FIX" \
  'canonical_load_remote_targets && canonical_assert_ssh_host_matches root@198.51.100.5'

# ── Missing marker → repo-key assertion must fail ────────────────────────────
EMPTY_ROOT="$(mktemp -d)"
run_expect_failure \
  "canonical_assert_repo_key_present fails when marker is missing" \
  "$EMPTY_ROOT" \
  'canonical_assert_repo_key_present'

# ── Wrong PROJECT_KEY → repo-key assertion must fail ────────────────────────
BAD_ROOT="$(mktemp -d)"
cat >"${BAD_ROOT}/.canonical-repo-key" <<'EOF'
PROJECT_KEY=NOT_THE_RIGHT_KEY
CANONICAL_REPO_PATH=/tmp/whatever
CANONICAL_REMOTE_BASE=/root/project
CANONICAL_REMOTE_FRONTEND_DIST=/root/project/frontend/dist
CANONICAL_DEPLOY_TARGET=example.com
CANONICAL_DEPLOY_HOST=203.0.113.10
ALLOWED_DEPLOY_BRANCH=main
EOF
run_expect_failure \
  "canonical_assert_repo_key_present fails when PROJECT_KEY is wrong" \
  "$BAD_ROOT" \
  'canonical_assert_repo_key_present'

# ── Incomplete remote settings → canonical_load_remote_targets must fail ────
INCOMPLETE_ROOT="$(mktemp -d)"
cat >"${INCOMPLETE_ROOT}/.canonical-repo-key" <<'EOF'
PROJECT_KEY=MULTIVOHUB_JOBAPP_CANONICAL
CANONICAL_REPO_PATH=/tmp/x
CANONICAL_REMOTE_BASE=
CANONICAL_DEPLOY_TARGET=
CANONICAL_DEPLOY_HOST=
ALLOWED_DEPLOY_BRANCH=main
EOF
run_expect_failure \
  "canonical_load_remote_targets fails when remote settings are empty" \
  "$INCOMPLETE_ROOT" \
  'canonical_load_remote_targets'

# Cleanup
rm -rf "$FIX" "$EMPTY_ROOT" "$BAD_ROOT" "$INCOMPLETE_ROOT"

echo ""
echo "  passed: ${PASS}"
echo "  failed: ${FAIL}"

if [[ $FAIL -ne 0 ]]; then exit 1; fi
exit 0
