#!/usr/bin/env bash
# Restartuje backend na serwerze
set -euo pipefail

HOST="root@147.93.86.209"

echo "════════════════════════════════════════════"
echo "  Restart backendu"
echo "════════════════════════════════════════════"
echo ""

ssh "${HOST}" bash <<'ENDSSH'
set -e
cd /root/project

echo "1. Sprawdzam status PM2..."
pm2 list

echo ""
echo "2. Restartuję jobapp-server..."
pm2 restart jobapp-server

echo ""
echo "3. Sprawdzam logi (ostatnie 20 linii)..."
pm2 logs jobapp-server --lines 20 --nostream

echo ""
echo "✅ Backend zrestartowany!"
ENDSSH

echo ""
echo "════════════════════════════════════════════"
echo "✅ Gotowe!"
echo "════════════════════════════════════════════"
echo ""
echo "Sprawdź aplikację: https://jobs.multivohub.com"
echo "Logi: ssh root@147.93.86.209 'pm2 logs jobapp-server'"
