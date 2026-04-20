#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

for role in AGENT_1 AGENT_2 AGENT_3 PRODUCT_OWNER QC; do
  "$ROOT/scripts/automation/advance-role-if-eligible.sh" "$role" || true
done
