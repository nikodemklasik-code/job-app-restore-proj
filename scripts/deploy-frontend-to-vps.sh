#!/usr/bin/env bash
# Wgrywa build Vite tam, gdzie Nginx serwuje jobapp.multivohub.com
# (NIE /var/www/JobAppApplication/dist — to inna, stara ścieżka.)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOST="${DEPLOY_HOST:-root@147.93.86.209}"
REMOTE="${REMOTE_JOBAPP_DIST:-/var/www/multivohub-jobapp/frontend/dist}"

if [[ ! -f "$ROOT/frontend/dist/index.html" ]]; then
  echo "Brak buildu. Uruchom z katalogu projektu: npm run build:frontend" >&2
  exit 1
fi

echo "Sync $ROOT/frontend/dist/ -> $HOST:$REMOTE/"
rsync -avz --delete "$ROOT/frontend/dist/" "$HOST:$REMOTE/"
echo "Gotowe. Twarde odświeżenie / okno incognito na https://jobapp.multivohub.com"
