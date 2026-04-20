#!/usr/bin/env bash
# Sourced by deploy.sh — expects ROOT set to repo root (absolute).
# Not a security boundary for credentials; blocks wrong folder / wrong target mistakes.
set -euo pipefail

canonical_kv_get() {
  local key="$1"
  local f="${ROOT}/.canonical-repo-key"
  [[ -f "$f" ]] || { echo "❌  Missing ${f}" >&2; return 1; }
  grep -E "^[[:space:]]*${key}=" "$f" | head -1 | sed "s/^[[:space:]]*${key}=//" | tr -d '\r' | sed 's/[[:space:]]*$//'
}

canonical_realpath_dir() {
  (cd "$1" && pwd -P)
}

canonical_extract_ssh_host() {
  # root@147.93.86.209 -> 147.93.86.209
  local h="$1"
  if [[ "$h" == *@* ]]; then
    echo "${h#*@}"
  else
    echo "$h"
  fi
}

canonical_assert_repo_key_present() {
  local f="${ROOT}/.canonical-repo-key"
  if [[ ! -f "$f" ]]; then
    echo "Blocked: Non-Canonical Working Directory" >&2
    echo "Missing integrity marker: .canonical-repo-key" >&2
    exit 1
  fi
  local pk
  pk="$(canonical_kv_get PROJECT_KEY)"
  if [[ "$pk" != "MULTIVOHUB_JOBAPP_CANONICAL" ]]; then
    echo "❌  PROJECT_KEY mismatch or missing in .canonical-repo-key" >&2
    exit 1
  fi
}

canonical_assert_local_repo_path() {
  if [[ "${GITHUB_ACTIONS:-}" == "true" ]]; then
    return 0
  fi
  if [[ "${DEPLOY_SKIP_LOCAL_REPO_PATH:-}" == "1" ]]; then
    return 0
  fi
  local expected actual
  expected="$(canonical_kv_get CANONICAL_REPO_PATH)"
  if [[ -z "$expected" ]]; then
    echo "❌  CANONICAL_REPO_PATH missing in .canonical-repo-key" >&2
    exit 1
  fi
  actual="$(canonical_realpath_dir "$ROOT")"
  expected="$(canonical_realpath_dir "$expected" 2>/dev/null || true)"
  if [[ "$actual" != "$expected" ]]; then
    echo "Blocked: Non-Canonical Working Directory" >&2
    echo "This folder is not approved for push or deploy." >&2
    echo "Allowed Path: $(canonical_kv_get CANONICAL_REPO_PATH)" >&2
    echo "Actual Path:  ${actual}" >&2
    echo "Override (dangerous): DEPLOY_SKIP_LOCAL_REPO_PATH=1" >&2
    exit 1
  fi
}

canonical_assert_deploy_branch() {
  if [[ "${GITHUB_ACTIONS:-}" == "true" ]]; then
    return 0
  fi
  if [[ "${DEPLOY_SKIP_BRANCH_GUARD:-}" == "1" ]]; then
    return 0
  fi
  if [[ ! -d "${ROOT}/.git" ]]; then
    return 0
  fi
  local allowed cur
  allowed="$(canonical_kv_get ALLOWED_DEPLOY_BRANCH)"
  cur="$(git -C "$ROOT" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")"
  if [[ -z "$allowed" || -z "$cur" ]]; then
    return 0
  fi
  if [[ "$cur" != "$allowed" ]]; then
    echo "Blocked: Deploy Branch Mismatch" >&2
    echo "Allowed branch: ${allowed}" >&2
    echo "Current branch: ${cur}" >&2
    echo "Override (dangerous): DEPLOY_SKIP_BRANCH_GUARD=1" >&2
    exit 1
  fi
}

canonical_load_remote_targets() {
  CANONICAL_REMOTE_BASE="$(canonical_kv_get CANONICAL_REMOTE_BASE)"
  CANONICAL_REMOTE_FRONTEND_DIST="$(canonical_kv_get CANONICAL_REMOTE_FRONTEND_DIST)"
  CANONICAL_DEPLOY_TARGET="$(canonical_kv_get CANONICAL_DEPLOY_TARGET)"
  CANONICAL_DEPLOY_HOST="$(canonical_kv_get CANONICAL_DEPLOY_HOST)"
  if [[ -z "$CANONICAL_REMOTE_BASE" || -z "$CANONICAL_DEPLOY_TARGET" || -z "$CANONICAL_DEPLOY_HOST" ]]; then
    echo "❌  Incomplete canonical remote settings in .canonical-repo-key" >&2
    exit 1
  fi
}

canonical_assert_dns_target() {
  if [[ "${DEPLOY_SKIP_DNS_GUARD:-}" == "1" ]]; then
    return 0
  fi
  local domain expected ip resolved
  domain="$CANONICAL_DEPLOY_TARGET"
  expected="$CANONICAL_DEPLOY_HOST"
  resolved=""
  if command -v host >/dev/null 2>&1; then
    resolved="$(host -t A "$domain" 2>/dev/null | awk '/has address/ {print $4; exit}')"
  fi
  if [[ -z "$resolved" ]] && command -v dig >/dev/null 2>&1; then
    resolved="$(dig +short A "$domain" 2>/dev/null | head -1 | tr -d '\r')"
  fi
  if [[ -z "$resolved" ]]; then
    echo "Blocked: DNS Resolution Failed" >&2
    echo "Could not resolve A record for: ${domain}" >&2
    echo "Override (dangerous): DEPLOY_SKIP_DNS_GUARD=1" >&2
    exit 1
  fi
  if [[ "$resolved" != "$expected" ]]; then
    echo "Blocked: DNS Target Mismatch" >&2
    echo "Expected Domain: ${domain}" >&2
    echo "Expected Host:   ${expected}" >&2
    echo "Resolved A:      ${resolved}" >&2
    echo "Override (dangerous): DEPLOY_SKIP_DNS_GUARD=1" >&2
    exit 1
  fi
}

canonical_assert_ssh_host_matches() {
  local host_arg="$1"
  local ip
  ip="$(canonical_extract_ssh_host "$host_arg")"
  if [[ "$ip" != "$CANONICAL_DEPLOY_HOST" ]]; then
    echo "Blocked: SSH Target Mismatch" >&2
    echo "Expected deploy host IP: ${CANONICAL_DEPLOY_HOST}" >&2
    echo "Resolved from DEPLOY_HOST: ${ip}" >&2
    echo "Fix DEPLOY_HOST or use canonical root@147.93.86.209" >&2
    exit 1
  fi
}

canonical_assert_remote_deploy_marker() {
  local host_arg="$1"
  local remote_base="$2"
  local tmp rk rpath rhost rtarget
  tmp="$(mktemp)"
  if ! ssh -o BatchMode=yes -o ConnectTimeout=15 "${host_arg}" "cat ${remote_base}/.deploy-target-key 2>/dev/null" >"$tmp"; then
    rm -f "$tmp"
    echo "Blocked: Remote Target Marker Missing Or Unreadable" >&2
    echo "On the server, create ${remote_base}/.deploy-target-key from infra/deploy-target-key.example" >&2
    exit 1
  fi
  rk="$(grep -E '^PROJECT_KEY=' "$tmp" | head -1 | cut -d= -f2- | tr -d '\r')"
  rpath="$(grep -E '^REMOTE_PATH=' "$tmp" | head -1 | cut -d= -f2- | tr -d '\r')"
  rhost="$(grep -E '^REMOTE_HOST=' "$tmp" | head -1 | cut -d= -f2- | tr -d '\r')"
  rtarget="$(grep -E '^DEPLOY_TARGET=' "$tmp" | head -1 | cut -d= -f2- | tr -d '\r')"
  rm -f "$tmp"
  if [[ "$rk" != "MULTIVOHUB_JOBAPP_CANONICAL" ]]; then
    echo "Blocked: Remote Target Mismatch" >&2
    echo "REMOTE .deploy-target-key PROJECT_KEY invalid or missing" >&2
    exit 1
  fi
  if [[ "$rpath" != "$remote_base" ]]; then
    echo "Blocked: Remote Target Mismatch" >&2
    echo "Expected Remote Path: ${remote_base}" >&2
    echo "Marker REMOTE_PATH:   ${rpath}" >&2
    exit 1
  fi
  if [[ "$rhost" != "$CANONICAL_DEPLOY_HOST" ]]; then
    echo "Blocked: Remote Target Mismatch" >&2
    echo "Expected REMOTE_HOST: ${CANONICAL_DEPLOY_HOST}" >&2
    echo "Marker REMOTE_HOST:   ${rhost}" >&2
    exit 1
  fi
  if [[ "$rtarget" != "$CANONICAL_DEPLOY_TARGET" ]]; then
    echo "Blocked: Remote Target Mismatch" >&2
    echo "Expected DEPLOY_TARGET: ${CANONICAL_DEPLOY_TARGET}" >&2
    echo "Marker DEPLOY_TARGET:   ${rtarget}" >&2
    exit 1
  fi
}
