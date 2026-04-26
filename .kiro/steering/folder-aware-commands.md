---
inclusion: always
---

# Folder-Aware Command And Error Routing Policy

## Core rule

Every command shown to the user must include the **exact directory** using one of:

- Preferred: `cd /absolute/path && command ...`
- Alternative: **Run In:** `/absolute/path` on its own line, then **Command:** `...`

Never output bare `npm run build`, `npm install`, or `pm2 restart ...` without the target folder.

## Error responses

When something fails, include: what failed, likely cause, **Run In:** path, **Correct command:** (full `cd ... && ...`), optional **Check first:** (e.g. `cat package.json`).

## Repository layout

This monorepo uses distinct packages:

- Root: `npm ci`, workspace orchestration; not all scripts live here.
- **Frontend:** `/Users/nikodem/job-app-restore/proj/frontend` — `npm run build` → `dist/`
- **Backend:** `/Users/nikodem/job-app-restore/proj/backend` — `npm run build` → `dist/`

Deployment paths on VPS (see `scripts/deploy.sh` and `.canonical-repo-key`): app root `/root/project`, frontend static `${REMOTE_BASE}/frontend/dist/`, backend `${REMOTE_BASE}/dist/backend/`, PM2 `infra/ecosystem.config.cjs`.

## Verification

If unsure where a script lives:

```bash
cd /Users/nikodem/job-app-restore/proj && find . -maxdepth 3 -name package.json -print
```

Short version: **never give a command without the exact folder; folder visibility at command creation time, not only after failure.**
