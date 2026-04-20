# Production-ready modules bundle (Spokkn)

**Source:** `production_ready_modules_bundle.zip` (imported 2026-04-19)

**Promoted into repo (no `mnt/data/` mirror kept):**

- **Index:** [`../../features/8-modules-production-ready-pack-v1.md`](../../features/8-modules-production-ready-pack-v1.md) — osiem modułów (Legal, Skill Lab, Case Practice, Interview, Coach, Warmup, Negotiation, Job Search)
- **Per-module specs:** `docs/features/*-production-ready-v1.md` (same names as in the pack index)
- **Planning TSV + templates:** `docs/squad/8-MODULES_FIRST_PRODUCTION_SLICES.tsv`, `8-MODULES_RFQ_TEMPLATE.md`, `8-MODULES_READY_FOR_QC_TEMPLATE.md`

**Rules:** Same as 19-screen execution — create physical `REPORT_PATH` before adding any row to `AUTO_TASK_CHAIN.tsv`; run `po-automation-health.sh`. RFQ paths in the TSV are **targets** until files exist under `docs/agent-work/`.

**Relation to 19-screen pack:** Complements [`../../features/19-screens-production-readiness-and-cross-flows-v1.md`](../../features/19-screens-production-readiness-and-cross-flows-v1.md) and [`../../features/19-screens-canonical-implementation-and-gap-map-v1.md`](../../features/19-screens-canonical-implementation-and-gap-map-v1.md); do not merge two different TSVs into one chain file without PO review.

**Other production-ready pack (remaining product screens):** [`../remaining-screens-production-ready-bundle/README.md`](../remaining-screens-production-ready-bundle/README.md) — Dashboard, Profile, Applications, Billing, Settings, etc.
