#!/usr/bin/env bash
# Sprawdza błędy w logach backendu
set -euo pipefail

HOST="root@147.93.86.209"

echo "════════════════════════════════════════════"
echo "  Logi backendu - ostatnie błędy"
echo "════════════════════════════════════════════"
echo ""

ssh "${HOST}" "pm2 logs jobapp-server --lines 50 --nostream --err"

echo ""
echo "════════════════════════════════════════════"
