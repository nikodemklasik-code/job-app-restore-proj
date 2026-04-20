#!/usr/bin/env bash
# Uruchom NA SERWERZE z katalogu projektu (np. /root/project).
# Wyrównuje tabele/kolumny do schema Drizzle (m.in. users.clerk_id, jobs, cv_uploads).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
set -a
# shellcheck disable=SC1091
source .env
set +a
cd "$ROOT/backend"
exec npx drizzle-kit push
