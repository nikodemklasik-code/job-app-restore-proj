# JobRadar — implementation bundle (v1.1)

| Artifact | Description |
| --- | --- |
| `job-radar-openapi-v1.1.yaml` | REST API contract |
| `job-radar-event-flow-v1.1.md` | Pipeline + state machine + internal events |
| `job-radar-event-examples-v1.1.json` | Example outbox / domain event payloads |
| `job-radar-orchestrator-pseudocode-v1.1.md` | Orchestrator + scoring + maintenance pseudocode |
| `job-radar-backend-structure-v1.1.md` | Backend module layout, layers, service contracts, queues, review rules |
| `job-radar-sql-schema-v1.sql` | Single-file logical schema (reference; see `db/migrations/` for split PG migrations) |
| `job-radar-legal-trust-policy-v1.0.md` | Legal & trust policy pack (UK/EU-oriented editorial, tiers, notice-and-action, launch checklist) — **not legal advice** |
| `job-radar-legal-safety-policy-v1.0.md` | **Legal Safety Policy** (sources, output rules, confidence, PII, review, complaints, audit, freshness, kill switch, launch checklist) — Trust & Safety / Product — **not legal advice** |
| `job-radar-product-interaction-spec-v1.0.md` | **Product Interaction Spec** — IA, legal-safe content rules, dynamic UI states; decision-support / evidence-first model |
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

Product PRD and scoring rules live in your product docs. Engineering contracts live here; the legal/trust pack is **policy guidance** for product and ops (see disclaimer inside).
