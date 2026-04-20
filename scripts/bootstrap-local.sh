#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "🚀 Starting local development setup..."

if [ ! -f ".env" ]; then
  cp .env.example .env
  echo "📄 Created .env from .env.example"
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "❌ Docker CLI is not installed."
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "❌ Docker daemon is not running. Start Docker Desktop and re-run."
  exit 1
fi

echo "🐳 Starting MySQL via Docker Compose..."
docker compose up -d mysql

echo "⏳ Waiting for MySQL healthcheck..."
for i in $(seq 1 60); do
  if [ "$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}unknown{{end}}' multivohub-jobapp-mysql 2>/dev/null || true)" = "healthy" ]; then
    echo "✅ MySQL is healthy."
    break
  fi
  sleep 2
  if [ "$i" -eq 60 ]; then
    echo "❌ MySQL did not become healthy in time."
    exit 1
  fi
done

echo "📦 Installing dependencies..."
if command -v pnpm >/dev/null 2>&1; then
  pnpm install
else
  npm install
fi

echo "🔍 Checking local environment variables..."
bash scripts/check-local-env.sh

echo "🗄️ Pushing database schema..."
npm run db:push || {
  echo "⚠️ db:push failed. Check DATABASE_URL and backend Drizzle config."
  exit 1
}

echo "✅ Local bootstrap complete."
echo "Next step: npm run dev"
