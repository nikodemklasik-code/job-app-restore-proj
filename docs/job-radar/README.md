# JobRadar — implementation bundle (v1.1)

### Contract vs secrets vs deploy markers (keep separate)

| Topic | What it is | Where it lives |
| --- | --- | --- |
| **REST contract (source of truth)** | The Job Radar OpenAPI **v1.1** spec: paths, schemas, behaviour under test. | This folder: **`job-radar-openapi-v1.1.yaml`** (also copied on deploy under `${REMOTE_BASE}/docs/job-radar/` per `scripts/deploy.sh`). |
| **OpenAI uploaded contract file** | A **non-secret** OpenAI Files API **`file_id`** for an uploaded copy of the same YAML (tooling / assistants). Example id documented in the YAML `info` extension `x-openaiUploadedContractFileId`. | OpenAI platform; **not** git credentials. |
| **`OPENAI_API_KEY`** | The **real** OpenAI API credential. Used only for **live model calls** (e.g. QC AI smoke, production AI). | Environment / secrets store only — **never** commit to the repo. |
| **Internal canonical repo / deploy key** | **Not** an API key. An internal **integrity marker** (paths, remote base, host, deploy target) used so humans and automation verify the correct tree and server. | May appear in repo scripts, GitHub config, or QC checklists — must **not** contain passwords, API keys, or SSH secrets. |

Do **not** treat `file-…` ids, deploy path markers, or contract filenames as substitutes for `OPENAI_API_KEY`.

| Artifact | Description |
| --- | --- |
| `job-radar-openapi-v1.1.yaml` | REST API contract (**canonical**; see table above) |
| `job-radar-event-flow-v1.1.md` | Pipeline + state machine + internal events |
| `job-radar-event-examples-v1.1.json` | Example outbox / domain event payloads |
| `job-radar-orchestrator-pseudocode-v1.1.md` | Orchestrator + scoring + maintenance pseudocode |
| `job-radar-backend-structure-v1.1.md` | Backend module layout, layers, service contracts, queues, review rules |
| `job-radar-sql-schema-v1.sql` | Single-file logical schema (reference; see `db/migrations/` for split PG migrations) |
| `job-radar-legal-trust-policy-v1.0.md` | Legal & trust policy pack (UK/EU-oriented editorial, tiers, notice-and-action, launch checklist) — **not legal advice** |
| `job-radar-legal-safety-policy-v1.0.md` | **Legal Safety Policy** (sources, output rules, confidence, PII, review, complaints, audit, freshness, kill switch, launch checklist) — Trust & Safety / Product — **not legal advice** |
| `job-radar-product-interaction-spec-v1.0.md` | **Product Interaction Spec** — IA, legal-safe content rules, dynamic UI states; decision-support / evidence-first model |
| `job-radar-frontend-trust-ui-spec-v1.0.md` | **Frontend + Trust UI Spec** — screens, visibility, complaint flow, admin panel, tRPC mapping, acceptance criteria |
| `job-radar-mysql-006-complaints.sql` | MySQL DDL for `job_radar_complaints` (apply before complaint APIs in prod) |
| `../../db/migrations/001–005_job_radar_*.sql` | PostgreSQL migrations (enums → core → indexes → outbox → maintenance) |
| `../../backend/src/db/schemas/job-radar.ts` | **Drizzle (MySQL) tables** — source of truth for the app schema (generate/match SQL migrations separately) |
| `../../backend/src/modules/job-radar/` | **Runtime module (skeleton)** — handlers, Drizzle repos, outbox processor, worker hook |

### Backend runtime (tRPC)

Procedures are mounted under **`jobRadar`** (distinct from `radar`, which is the skills-trend feature):

| Procedure | Type | Notes |
| --- | --- | --- |
| `jobRadar.startScan` | mutation | Body matches `startScanDtoSchema` (camelCase). Optional header: `Idempotency-Key`. |
| `jobRadar.getScanStatus` | query | Input: `{ scanId }` |
| `jobRadar.getReport` | query | Input: `{ reportId }` |

The PM2 **worker** (`backend/src/worker.ts`) polls the JobRadar outbox every 10s unless `JOB_RADAR_WORKER_ENABLED=false`. Events are dispatched to `scan_requested` → `source_fetch_requested` → `parse_source_requested` (in-process), then scoring + report composition.

**Trust admin tRPC:** set `JOB_RADAR_TRUST_REVIEWER_USER_IDS` (comma-separated **app** `users.id` values) for `jobRadar.admin*` procedures. Optional kill-switch env: `JOB_RADAR_KILL_SWITCH_ALL`, `JOB_RADAR_KILL_SWITCH_REPUTATION`, `JOB_RADAR_KILL_SWITCH_REGISTRY_SEVERE` (`1` / `true`).

**Tests:** from `backend/`, run `npm test` (Vitest) — `src/modules/job-radar/__tests__/**/*.spec.ts`.

**Production (VPS):** deploy syncs this whole folder to `${REMOTE_BASE}/docs/job-radar/` (see `scripts/deploy.sh` and `.github/workflows/deploy.yml`), e.g. `/var/www/multivohub-jobapp/docs/job-radar/job-radar-openapi-v1.1.yaml` — same contract as in git; not necessarily served over HTTP unless Nginx maps it.

Product PRD and scoring rules live in your product docs. Engineering contracts live here; the legal/trust pack is **policy guidance** for product and ops (see disclaimer inside).
