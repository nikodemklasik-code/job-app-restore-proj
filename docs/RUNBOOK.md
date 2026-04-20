# Runbook — multivohub-jobapp

> Single source of truth for deploy, rollback, smoke-test, ENV setup, PM2 operations, and local development.

---

## 0. Local Development

```bash
cp .env.example .env
bash scripts/bootstrap-local.sh
npm run dev
```

Requirements:
- Docker Desktop or Docker Engine running locally
- valid `.env` values for Clerk, OpenAI, Stripe, and encryption
- local MySQL comes from `docker-compose.yml`

Local URLs:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`
- API health: `http://localhost:3001/api/health`

---

## Quick reference

| Task | Command |
|------|---------|
| **Local bootstrap** | `bash scripts/bootstrap-local.sh` |
| **Fresh VPS setup** | `bash scripts/setup-vps.sh` |
| Deploy (local, guarded) | `bash scripts/deploy-safe.sh` (ack → remote backup → `deploy.sh`) |
| Deploy (local, direct) | `bash scripts/deploy.sh` |
| Smoke test | `bash scripts/smoke-test.sh` (on VPS) |
| Validate ENV | `node lib/envSchema.mjs` |
| PM2 reload | `pm2 reload infra/ecosystem.config.cjs --update-env` |
| DB migration | `npm run db:push` (from repo root) |

---

## Deploy workflow note

The current GitHub workflow file should match the branch policy you actually want to deploy from.
If production deploys are intended from `main`, align `.github/workflows/deploy.yml` accordingly before relying on CI/CD.

