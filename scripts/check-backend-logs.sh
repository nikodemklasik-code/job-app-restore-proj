#!/usr/bin/env bash
# Sprawdza logi backendu na serwerze
set -euo pipefail

HOST="root@147.93.86.209"

echo "════════════════════════════════════════════"
echo "  Logi backendu (ostatnie 100 linii)"
echo "════════════════════════════════════════════"
echo ""

ssh "${HOST}" "pm2 logs jobapp-server --lines 100 --nostream"

echo ""
echo "════════════════════════════════════════════"
