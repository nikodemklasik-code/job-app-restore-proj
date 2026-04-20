#!/usr/bin/env bash
# Interaktywny zapis OPENAI_API_KEY do .env w katalogu głównym projektu.
# Wpis/wklejka są ukryte (read -s). Enter = zapis. Ctrl+C = przerwij.
set -euo pipefail

# Na VPS: bash /path/scripts/setup-openai-key.sh  |  z Maca: ssh … 'bash -s' < skrypt (wtedy BASH_SOURCE[0] == "-")
if [[ "${BASH_SOURCE[0]:-}" == "-" ]]; then
  ROOT="${MULTIVOHUB_ROOT:-/root/project}"
else
  ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
fi
cd "$ROOT"
ENV_FILE="$ROOT/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  if [[ -f "$ROOT/.env.example" ]]; then
    cp "$ROOT/.env.example" "$ENV_FILE"
    echo "==> Utworzono .env z .env.example"
  else
    : >"$ENV_FILE"
    echo "==> Utworzono pusty .env"
  fi
fi

echo ""
echo "OpenAI API key — wklej klucz (sk-…), nic nie będzie widoczne na ekranie."
echo "Enter zapisuje do .env, Ctrl+C anuluje."
echo ""

if [[ -r /dev/tty ]]; then
  read -r -s -p "OPENAI_API_KEY: " OPENAI_KEY < /dev/tty
else
  read -r -s -p "OPENAI_API_KEY: " OPENAI_KEY
fi
echo ""

if [[ -z "${OPENAI_KEY//[[:space:]]/}" ]]; then
  echo "Anulowano — pusty klucz."
  exit 1
fi

OPENAI_KEY="${OPENAI_KEY//$'\r'/}"
OPENAI_KEY="${OPENAI_KEY//$'\n'/}"

TMP="${ENV_FILE}.tmp.$$"
grep -v '^OPENAI_API_KEY=' "$ENV_FILE" >"$TMP" || true
printf 'OPENAI_API_KEY=%s\n' "$OPENAI_KEY" >>"$TMP"
mv "$TMP" "$ENV_FILE"
chmod 600 "$ENV_FILE" 2>/dev/null || true

tail="${OPENAI_KEY: -4}"
echo "==> Zapisano OPENAI_API_KEY w: $ENV_FILE"
echo "    Podgląd (tylko końcówka): …${tail}"
echo "    Nie commituj .env."

PM2_APP="${PM2_APP_NAME:-jobapp-backend}"
if command -v pm2 >/dev/null 2>&1; then
  export OPENAI_API_KEY="$OPENAI_KEY"
  pm2 restart "$PM2_APP" --update-env
  echo "==> PM2: $PM2_APP zrestartowany z nowym OPENAI_API_KEY."
else
  echo "    (Brak pm2 — zrestartuj backend ręcznie.)"
fi
echo ""
