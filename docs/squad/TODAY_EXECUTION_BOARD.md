# Today Execution Board

## Source Of Truth
- docs/squad/TODAY_EXECUTION_BOARD.md
- docs/squad/AUTOMATION_PO_RUNBOOK.md — predictable failure classes, exit codes, single health command (`po-automation-health.sh`)
- docs/squad/19-SCREENS_AUTO_TASK_BOOTSTRAP.md — jak spiąć canonical gap map (19 ekranów) z `AUTO_TASK_CHAIN` + `po-automation-health.sh`
- docs/features/19-screens-canonical-implementation-and-gap-map-v1.md — pełna mapa luk / tier / szablon taska (Spokkn baseline)
- docs/features/19-screens-production-readiness-and-cross-flows-v1.md — definicja produkcyjności, przepływy między ekranami, billing/reports spine
- docs/squad/po-repo-ready-bundle/README.md — notatka importu `po_repo_ready_bundle.zip` (bez zduplikowanego drzewa `unpacked/`)
- docs/squad/po-bootstrap/README.md — redirect (duplikaty szablonów usunięte)
- docs/squad/po-examples/README.md — przykłady RFQ/QC poza `docs/qc-reports/`
- docs/squad/PO_BOOTSTRAP_CHECKLIST.md · docs/squad/19-SCREENS_RFQ_TEMPLATE.md · docs/squad/19-SCREENS_FIRST_PRODUCTION_SLICES.tsv — kanoniczne szablony slice
- docs/features/8-modules-production-ready-pack-v1.md · docs/squad/8-MODULES_* — pakiet Spokkn „8 modułów” production-ready (import `production_ready_modules_bundle.zip`)
- docs/squad/production-ready-modules-bundle/README.md — notatka importu `production_ready_modules_bundle.zip`
- docs/features/remaining-screens-production-ready-pack-v1.md · docs/squad/REMAINING-SCREENS_* — pozostałe screeny (import `remaining_screens_production_ready_bundle.zip`)
- docs/squad/remaining-screens-production-ready-bundle/README.md — notatka importu tego ZIP
- docs/squad/PO_PRODUCTION_GAPS_AND_AGENT_SCOPED_ACTIONS.md — **lista braków vs produkcja** + co agent AI może zrobić w repo (bounded)
- docs/squad/PO_PRODUCTION_VERDICT_AND_EXECUTION_ORDER-v1.md — **werdykt PO:** P0 A1–A4, pierwszy slice Dashboard aggregate, potem Billing lub Settings; rozkaz dla Auto (C1+C2)
- docs/squad/PROJECT_CHECKPOINTS_DASHBOARD.md
- docs/squad/LIVE_EXECUTION_DASHBOARD.md
- docs/squad/AUTO_TASK_CHAIN.tsv (only rows whose `REPORT_PATH` files exist in repo)
- docs/status/
- docs/task-chain/
- docs/qc-reports/

## Tranche 1 — agents (QC + reports in repo)

### Agent 1
- Current status: **Approved For Integration** — [`qc-verdict-tranche1-board-review-2026-04-19.md`](../qc-reports/qc-verdict-tranche1-board-review-2026-04-19.md)
- Current bounded scope: Backend runtime hardening
- Active delivery report: `docs/qc-reports/agent-1-runtime-hardening-ready-for-qc.md`
- **Next task after QC verdict:** `PO_PENDING_ASSIGNMENT` until PO adds a new `docs/qc-reports/*.md` path **and** a matching row in `AUTO_TASK_CHAIN.tsv` (chain validator requires the file to exist).
- **Blocker (resolved for chain):** `docs/qc-reports/agent-1-mysql-ddl-evidence-ready-for-qc.md` is in repo for optional T2; further tasks beyond T2 are not in `AUTO_TASK_CHAIN.tsv` until those RFQs exist.

### Agent 2
- Current status: **Approved For Integration** (same tranche1 board review, unless QC posts newer verdict)
- Current bounded scope: Job Radar bounded parity
- Active delivery report: `docs/qc-reports/agent-2-job-radar-bounded-parity-ready-for-qc.md`
- **Next task after QC verdict:** `PO_PENDING_ASSIGNMENT` (same rule as Agent 1). Optional follow-up file in repo: `docs/qc-reports/agent-2-job-radar-post-ddl-smoke-ready-for-qc.md` — only becomes the next auto-advance target when PO extends `AUTO_TASK_CHAIN.tsv` intentionally.

### Agent 3
- Current status: **Approved For Integration** (same tranche1 board review)
- Current bounded scope: Legacy interview billing parity
- Active delivery report: `docs/qc-reports/agent-3-legacy-interview-billing-ready-for-qc.md`
- **Next task after QC verdict:** `PO_PENDING_ASSIGNMENT`. Optional follow-up in repo: `docs/qc-reports/agent-3-legacy-interview-followups-ack-ready-for-qc.md` — same rule as above.

## QC
- Intake only on files that exist and are marked **Ready For QC** in their RFQ body.
- Required next action: bounded verdicts; no widening.

## Product Owner
- Extend `AUTO_TASK_CHAIN.tsv` **only** when the corresponding `docs/qc-reports/...` file already exists (or is created in the same commit), so `validate-task-chain.sh` and `run-task-engine-loop.sh` stay green.

## Bottleneck
- **Ops / PO:** MySQL DDL on target DB when deploying schema-dependent slices — evidence paths live under `docs/qc-reports/` when filed.
