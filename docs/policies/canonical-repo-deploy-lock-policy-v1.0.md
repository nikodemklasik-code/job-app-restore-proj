# Canonical Repo, Server, And Deploy Lock Policy (v1.0)

## Purpose

This policy reduces **accidental** push, sync, or deploy from the wrong local folder, wrong remote path, or wrong target. It is **not** secret management and **must not** store API keys, SSH private keys, or third-party tokens.

**Disambiguation:** internal **repo/deploy integrity markers** (this policy, `.canonical-repo-key`) are **not** `OPENAI_API_KEY` and **not** the Job Radar OpenAPI contract file. See [`docs/job-radar/CONTRACT-KEYS-AND-SECRETS.md`](../job-radar/CONTRACT-KEYS-AND-SECRETS.md).

It is an **internal deployment integrity** layer. It stops common mistakes:

- deploying from a backup or copied repo folder
- syncing to an unintended path on the VPS
- using a wrong branch by habit
- trusting DNS without a quick sanity check against the approved IP

If a check fails, **deploy stops**. Overrides exist only as explicit, scary env flags (see `scripts/lib/canonical-deploy-guards.sh` and `scripts/deploy.sh`).

---

## 1. Internal canonical key (committed)

**File (repo root):** `.canonical-repo-key`

**Example fields (actual values are in that file):**

- `PROJECT_KEY` — non-secret integrity marker (e.g. `MULTIVOHUB_JOBAPP_CANONICAL`)
- `CANONICAL_REPO_PATH` — **one** approved absolute path for **local** `scripts/deploy.sh` (other machines: `DEPLOY_SKIP_LOCAL_REPO_PATH=1` or update the file in a deliberate PR)
- `CANONICAL_REMOTE_BASE` — app root on VPS (currently **`/root/project`**, aligned with `scripts/deploy.sh`, `.github/workflows/deploy.yml`, and `infra/ecosystem.config.cjs`)
- `CANONICAL_REMOTE_FRONTEND_DIST` — static frontend path under that base
- `CANONICAL_DEPLOY_TARGET` — public hostname (e.g. `jobs.multivohub.com`)
- `CANONICAL_DEPLOY_HOST` — expected **A record** for that hostname (e.g. `147.93.86.209`)
- `ALLOWED_DEPLOY_BRANCH` — branch allowed for **local** deploy script (CI uses workflow `on.push` filters)

**Note:** Legacy paths under `/var/www/multivohub-jobapp` are **retired** for this product; production PM2 + deploy + nginx configs in repo assume **`/root/project`**.

This file **may** be committed to GitHub. QC and scripts treat it as the **single visible source of truth** for allowed targets.

---

## 2. Local folder lock

`scripts/deploy.sh` (after setting `ROOT`) loads `scripts/lib/canonical-deploy-guards.sh` and:

- requires `.canonical-repo-key` to exist and `PROJECT_KEY` to match
- unless `GITHUB_ACTIONS=true` or `DEPLOY_SKIP_LOCAL_REPO_PATH=1`, requires `pwd -P` of the repo root to equal `CANONICAL_REPO_PATH`

Other machines: put `DEPLOY_SKIP_LOCAL_REPO_PATH=1` in **`.env.local`** (never commit), or update `CANONICAL_REPO_PATH` in a deliberate PR so the whole team shares one truth.

**Failure title:** `Blocked: Non-Canonical Working Directory`

---

## 3. Remote server path lock

**On the VPS**, beside the deployed app tree, maintain:

**File:** `${CANONICAL_REMOTE_BASE}/.deploy-target-key`

**Template in repo:** `infra/deploy-target-key.example` (copy to the server; adjust only if the canonical base changes in a coordinated way).

`scripts/deploy.sh` uses SSH to read that file and verifies:

- `PROJECT_KEY` matches
- `REMOTE_PATH` matches `CANONICAL_REMOTE_BASE`
- `REMOTE_HOST` matches `CANONICAL_DEPLOY_HOST`
- `DEPLOY_TARGET` matches `CANONICAL_DEPLOY_TARGET`

**Failure title:** `Blocked: Remote Target Mismatch` or marker missing.

---

## 4. DNS and host checks

Before a long build, `deploy.sh` runs a lightweight check that **`CANONICAL_DEPLOY_TARGET` resolves in DNS to `CANONICAL_DEPLOY_HOST`** (`host` / `dig`). SSH target must resolve to the same IP (hostname-only SSH targets are not supported by this guard).

**Failure title:** `Blocked: DNS Target Mismatch` or `Blocked: DNS Resolution Failed`

Skip only with explicit `DEPLOY_SKIP_DNS_GUARD=1` (documented as dangerous).

---

## 5. Branch lock (local deploy only)

If `.git` exists and `DEPLOY_SKIP_BRANCH_GUARD` is unset, the current branch must equal `ALLOWED_DEPLOY_BRANCH` from `.canonical-repo-key`.

GitHub Actions is exempt (`GITHUB_ACTIONS=true`).

---

## 6. GitHub Actions

The deploy job runs `scripts/ci-assert-canonical-deploy.sh` so `env.REMOTE_BASE` in the workflow cannot drift from `.canonical-repo-key` without a deliberate edit to both.

**Local / QC (no deploy):** `cd /Users/nikodem/job-app-restore/proj && bash scripts/verify-canonical-repo.sh` — checks marker file, machine path (unless skips), and branch.

### Safe deploy chain (local operator)

1. **`scripts/ack-deploy.sh`** — explicit human acknowledgement (`I_DEPLOY_TO_PRODUCTION` or env `DEPLOY_ACK=I_DEPLOY_TO_PRODUCTION`).
2. **`scripts/backup-safe.sh`** — runs `vps-predeploy-backup.sh` on the VPS over SSH (uses `CANONICAL_REMOTE_BASE`).
3. **`scripts/deploy-safe.sh`** — refuses dirty git tree unless `DEPLOY_ALLOW_DIRTY=1`, runs steps 1–2, then **`scripts/deploy.sh`**; on failure runs **`scripts/rollback.sh`** on the server (best-effort).

No secrets belong in these scripts; deploy tokens stay in `.env.local` / interactive prompt as today.

---

## 7. QC enforcement

QC should verify:

- `.canonical-repo-key` exists and fields are coherent with `scripts/deploy.sh` and `.github/workflows/deploy.yml`
- `infra/deploy-target-key.example` matches the documented production layout
- deploy guards are not bypassed in default paths (overrides only for documented emergencies)
- copied / backup trees (e.g. under `Downloads/KOPIA/`) do not satisfy the local path check unless explicitly aligned (they should **not**)

---

## 8. Short internal rule

The internal canonical key is allowed in the repo because it is **not** a credential. Its job is to prove that deploy is aimed at the **intended** repo checkout, **intended** VPS path, **intended** host IP, and **intended** public hostname. If checks fail, deploy stops.
