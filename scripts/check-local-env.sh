#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [ ! -f ".env" ]; then
  echo "❌ Missing .env file. Copy .env.example to .env first."
  exit 1
fi

required_vars=(
  DATABASE_URL
  CLERK_SECRET_KEY
  CLERK_PUBLISHABLE_KEY
  VITE_CLERK_PUBLISHABLE_KEY
  OPENAI_API_KEY
  STRIPE_SECRET_KEY
  STRIPE_WEBHOOK_SECRET
  ENCRYPTION_KEY
)

missing=()
while IFS='=' read -r key value; do
  case "$key" in
    ""|"#"*) continue ;;
  esac
done < .env

for key in "${required_vars[@]}"; do
  value="$(grep -E "^${key}=" .env 2>/dev/null | sed "s/^${key}=//" | tail -n 1 || true)"
  if [ -z "$value" ]; then
    missing+=("$key")
    continue
  fi
  case "$key" in
    CLERK_SECRET_KEY)
      [[ "$value" =~ ^sk_(test|live)_ ]] || missing+=("$key")
      ;;
    CLERK_PUBLISHABLE_KEY|VITE_CLERK_PUBLISHABLE_KEY)
      [[ "$value" =~ ^pk_(test|live)_ ]] || missing+=("$key")
      ;;
    OPENAI_API_KEY)
      [[ "$value" =~ ^sk- ]] || missing+=("$key")
      ;;
    STRIPE_SECRET_KEY)
      [[ "$value" =~ ^sk_(test|live)_ ]] || missing+=("$key")
      ;;
    STRIPE_WEBHOOK_SECRET)
      [[ "$value" =~ ^whsec_ ]] || missing+=("$key")
      ;;
    ENCRYPTION_KEY)
      if [ "${#value}" -lt 32 ]; then
        missing+=("$key")
      fi
      ;;
  esac
done

if [ "${#missing[@]}" -gt 0 ]; then
  echo "❌ Missing or placeholder values for required variables:"
  printf '   - %s
' "${missing[@]}"
  echo "Please update your .env file with real values."
  exit 1
fi

echo "✅ Local environment looks valid."
