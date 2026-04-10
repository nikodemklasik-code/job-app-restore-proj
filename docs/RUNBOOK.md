# Runbook — multivohub-jobapp

> Single source of truth for deploy, rollback, smoke-test, ENV setup, and PM2 operations.

---

## Quick reference

| Task | Command |
|------|---------|
| Deploy (local) | `bash scripts/deploy.sh` |
| Rollback frontend | `bash scripts/rollback.sh` (on VPS) |
| Smoke test | `bash scripts/smoke-test.sh` (on VPS) |
| Validate ENV | `node lib/envSchema.mjs` |
| PM2 status | `pm2 list` |
| PM2 logs | `pm2 logs jobapp-server` / `pm2 logs jobapp-worker` |
| PM2 reload | `pm2 reload infra/ecosystem.config.cjs --update-env` |
| DB migration | `npm run db:push` (from repo root) |

---

## 1. Deploy

### Automated (GitHub Actions)

Every push to `main` triggers `.github/workflows/deploy.yml`:
1. Validates ENV schema
2. Builds frontend + backend
3. `rsync` dist to VPS
4. Reloads PM2 (`jobapp-server` + `jobapp-worker`)
5. Runs smoke test

**Required GitHub secrets:**

| Secret | Description |
|--------|-------------|
| `VPS_SSH_KEY` | Private SSH key for the VPS |
| `VPS_HOST` | VPS IP or hostname |
| `VPS_USER` | SSH user (e.g. `root`) |
| `VPS_FRONTEND_DIST_PATH` | e.g. `/var/www/multivohub-jobapp/frontend/dist` |
| `DATABASE_URL` | MySQL connection string |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `OPENAI_API_KEY` | OpenAI key |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `ENCRYPTION_KEY` | Min 32-char key for SMTP password encryption |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `VITE_API_URL` | Backend API URL (e.g. `https://jobapp.multivohub.com`) |
| `VITE_STRIPE_PRO_PRICE_ID` | Stripe Price ID for Pro plan |
| `VITE_STRIPE_AUTOPILOT_PRICE_ID` | Stripe Price ID for Autopilot plan |

### Manual deploy

```bash
# From repo root, with .env loaded
bash scripts/deploy.sh
```

ENV overrides:
```bash
DEPLOY_HOST=root@147.93.86.209 bash scripts/deploy.sh
```

---

## 2. Rollback

Frontend rollback (restores previous dist backup):

```bash
# SSH into VPS
bash /var/www/multivohub-jobapp/scripts/rollback.sh
```

`deploy.sh` keeps the **3 most recent** backups at:
```
/var/www/multivohub-jobapp/frontend/dist-backup-<timestamp>
```

Backend rollback: re-run the previous deploy or checkout the previous commit and deploy again.

---

## 3. Smoke test

```bash
# On VPS
bash /var/www/multivohub-jobapp/scripts/smoke-test.sh

# With custom API base (e.g. test against staging)
API_BASE=http://127.0.0.1:3001 bash scripts/smoke-test.sh
```

Checks:
- `GET /health` → `{"status":"ok"}`
- `GET /api/health` → `{"status":"ok"}`
- Frontend `index.html` → `<div id="root"`

---

## 4. Environment variables

### Validate

```bash
# Local
node lib/envSchema.mjs

# On VPS
cd /var/www/multivohub-jobapp && node lib/envSchema.mjs
```

### Full ENV reference

See `.env.example` in the repo root. Required variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | `mysql://user:pass@host:3306/db` |
| `CLERK_SECRET_KEY` | ✅ | `sk_test_…` or `sk_live_…` |
| `OPENAI_API_KEY` | ✅ | `sk-…` |
| `STRIPE_SECRET_KEY` | ✅ | `sk_test_…` or `sk_live_…` |
| `STRIPE_WEBHOOK_SECRET` | ✅ | `whsec_…` |
| `ENCRYPTION_KEY` | ✅ | Minimum 32 characters |
| `PORT` | ❌ | Default `3001` |
| `NODE_ENV` | ❌ | `production` / `development` |
| `FRONTEND_URL` | ❌ | Default `http://localhost:5173` |

---

## 5. PM2

### Processes

| Name | Script | Port |
|------|--------|------|
| `jobapp-server` | `dist/backend/src/server.js` | 3001 |
| `jobapp-worker` | `dist/backend/src/worker.js` | — (polls DB) |

### Commands

```bash
# Start (first time)
pm2 start /var/www/multivohub-jobapp/infra/ecosystem.config.cjs

# Reload after deploy (zero-downtime)
pm2 reload /var/www/multivohub-jobapp/infra/ecosystem.config.cjs --update-env

# Status
pm2 list
pm2 show jobapp-server

# Logs
pm2 logs jobapp-server --lines 100
pm2 logs jobapp-worker --lines 100

# Flush logs
pm2 flush

# Save current process list (survives reboot)
pm2 save
pm2 startup   # follow the printed command to register PM2 as a system service
```

---

## 6. Nginx

Config: `infra/nginx/multivohub-jobapp.conf`

```bash
# Install (on VPS)
ln -s /var/www/multivohub-jobapp/infra/nginx/multivohub-jobapp.conf \
      /etc/nginx/sites-enabled/multivohub-jobapp

# Test + reload
nginx -t && systemctl reload nginx

# SSL (first time)
certbot --nginx -d jobapp.multivohub.com
```

---

## 7. Database

```bash
# Push schema changes (Drizzle)
npm run db:push

# On VPS
bash scripts/db-push-on-vps.sh
```

---

## 8. Auto-apply worker

The `jobapp-worker` PM2 process polls `auto_apply_queue` every 30 seconds.

**Weekly caps per plan:**

| Plan | Auto-applies/week |
|------|-------------------|
| Free | 3 |
| Pro | 15 |
| Autopilot | 50 |

Caps reset every **Monday at 00:00 UTC**.

If the worker crashes, PM2 restarts it automatically. Jobs stuck in `processing` state are reset to `pending` on worker startup (crash recovery).

---

## 9. Troubleshooting

### Backend won't start
```bash
pm2 logs jobapp-server --lines 50
# Check for missing ENV vars — server exits immediately if validation fails
node /var/www/multivohub-jobapp/lib/envSchema.mjs
```

### Frontend shows blank page
```bash
# Check Nginx is serving index.html
curl -I https://jobapp.multivohub.com
# Check dist exists
ls /var/www/multivohub-jobapp/frontend/dist/
```

### Auto-apply jobs stuck in "processing"
```bash
# Worker does crash recovery automatically at startup — restart it
pm2 restart jobapp-worker
pm2 logs jobapp-worker --lines 30
```

### Credits showing wrong value
Credits are loaded live from `billing.getCurrentPlan` — check the subscription row in the database:
```sql
SELECT u.clerk_id, s.plan, s.credits, s.status
FROM subscriptions s
JOIN users u ON u.id = s.user_id
WHERE u.clerk_id = 'user_xxx';
```
