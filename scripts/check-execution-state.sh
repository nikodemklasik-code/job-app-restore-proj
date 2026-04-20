#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"
STATUS_DIR="$ROOT/docs/status"
source "$ROOT/scripts/automation/status-lib.sh"

echo "=== EXECUTION STATE CHECK ==="
echo "Root: $ROOT"
echo
echo "--- STATUS FILES ---"

for f in "$STATUS_DIR"/*.status; do
  [ -f "$f" ] || continue
  role="$(basename "$f" .status | tr '[:lower:]-' '[:upper:]_')"
  state="$(normalize_empty "$(status_state "$f")")"
  task="$(status_task "$f")"
  verdict="$(normalize_empty "$(status_verdict "$f")")"
  updated="$(normalize_empty "$(status_updated "$f")")"
  report="$(status_report "$f")"

  printf "%-16s | %-26s | %-38s | verdict=%-28s | updated=%s\n" \
    "$role" "$state" "${task:-}" "$verdict" "$updated"

  if [ -n "${report:-}" ]; then
    if [ -f "$ROOT/$report" ]; then
      echo "  report: OK -> $report"
    else
      echo "  report: MISSING -> $report"
    fi
  fi
done

echo
echo "--- WHO IS BLOCKING NOW ---"
qc_file="$STATUS_DIR/qc.status"
po_file="$STATUS_DIR/product-owner.status"
echo "QC state: $(status_state "$qc_file" 2>/dev/null || true)"
echo "PO state: $(status_state "$po_file" 2>/dev/null || true)"
echo "Use status files + latest status block + report existence + verdict existence as source of truth."
