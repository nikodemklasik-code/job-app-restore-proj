#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_LOG="${ROOT_DIR}/.smoke-backend.log"
FRONTEND_LOG="${ROOT_DIR}/.smoke-frontend.log"
MOCK_BACKEND_LOG="${ROOT_DIR}/.smoke-mock-backend.log"

cleanup() {
  if [[ -n "${BACKEND_PID:-}" ]] && kill -0 "${BACKEND_PID}" 2>/dev/null; then
    kill "${BACKEND_PID}" 2>/dev/null || true
  fi
  if [[ -n "${FRONTEND_PID:-}" ]] && kill -0 "${FRONTEND_PID}" 2>/dev/null; then
    kill "${FRONTEND_PID}" 2>/dev/null || true
  fi
}
trap cleanup EXIT

cd "${ROOT_DIR}"

if [[ -n "${DATABASE_URL:-}" ]]; then
  echo "▶ Starting backend (local smoke)..."
  npm run dev:backend >"${BACKEND_LOG}" 2>&1 &
  BACKEND_PID=$!
else
  echo "▶ DATABASE_URL not set — starting mock backend health server on :3001"
  node -e "const http=require('http');const body=JSON.stringify({status:'ok'});http.createServer((req,res)=>{if(req.url==='/health'||req.url==='/api/health'){res.writeHead(200,{'content-type':'application/json'});res.end(body);return;}res.writeHead(404);res.end('not found');}).listen(3001,'127.0.0.1');" >"${MOCK_BACKEND_LOG}" 2>&1 &
  BACKEND_PID=$!
fi

echo "▶ Starting frontend (local smoke)..."
npm run dev:frontend >"${FRONTEND_LOG}" 2>&1 &
FRONTEND_PID=$!

echo "▶ Waiting for local services..."
for _ in $(seq 1 30); do
  backend_ok=0
  frontend_ok=0
  curl -fsS "http://127.0.0.1:3001/health" >/dev/null 2>&1 && backend_ok=1 || true
  curl -fsS "http://localhost:5173" >/dev/null 2>&1 && frontend_ok=1 || true
  if [[ "${backend_ok}" -eq 1 && "${frontend_ok}" -eq 1 ]]; then
    break
  fi
  sleep 1
done

if ! curl -fsS "http://127.0.0.1:3001/health" >/dev/null 2>&1; then
  echo "❌ Backend did not become healthy. See ${BACKEND_LOG}"
  exit 1
fi

if ! curl -fsS "http://localhost:5173" >/dev/null 2>&1; then
  echo "❌ Frontend did not become healthy. See ${FRONTEND_LOG}"
  exit 1
fi

API_BASE="http://127.0.0.1:3001" FRONTEND_URL="http://localhost:5173" bash "${ROOT_DIR}/scripts/smoke-test.sh"
