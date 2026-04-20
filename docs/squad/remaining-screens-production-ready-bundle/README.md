# Remaining screens — production-ready bundle (Spokkn)

**Source:** `remaining_screens_production_ready_bundle.zip` (imported 2026-04-19)

**Promoted into repo:**

- **Index:** [`../../features/remaining-screens-production-ready-pack-v1.md`](../../features/remaining-screens-production-ready-pack-v1.md)
- **Per-screen specs:** `docs/features/*-production-ready-v1.md` for Dashboard, Profile, Applications, Applications Review, Document Lab, Style Studio, AI Assistant, AI Analysis, Job Radar, Community Centre, Settings, Billing
- **Planning + templates:** `docs/squad/REMAINING-SCREENS_FIRST_PRODUCTION_SLICES.tsv`, `REMAINING-SCREENS_RFQ_TEMPLATE.md`, `REMAINING-SCREENS_READY_FOR_QC_TEMPLATE.md`

**Cross-pack:** Practice/intelligence modules (Legal, Skill Lab, Case Practice, Interview, Coach, Warmup, Negotiation, Job Search) live in [`../production-ready-modules-bundle/README.md`](../production-ready-modules-bundle/README.md) / [`8-modules-production-ready-pack-v1.md`](../../features/8-modules-production-ready-pack-v1.md).

**Execution rules:** Same as 19-screen workflow — physical `REPORT_PATH` before any `AUTO_TASK_CHAIN.tsv` row; run `scripts/automation/po-automation-health.sh`. RFQ paths under `docs/agent-work/` are **targets** until PO creates them.
