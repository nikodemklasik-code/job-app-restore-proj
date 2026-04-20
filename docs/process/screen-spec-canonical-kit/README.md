# Screen spec canonical kit

Documentation kit to write **per-screen** requirements so that **product “maximum” specs always include explicit full-stack delivery** — **no implicit backend, no implicit frontend**.

## Non-negotiables

1. **Explicit file paths** for every changed `backend/` and `frontend/` file (or `N/A` + reason + approver).  
2. **Explicit build commands** for backend and frontend when that layer has changes — record **exit code** and **commit**.  
3. **Explicit test commands** for BE and FE when that layer has changes — or **signed written justification** why not.  
4. **Empty cells forbidden** at “Ready for QC”: use `N/A` + short reason instead.

## MultivoHub — binding (this monorepo)

**Where this kit must live for links to work:** `docs/process/screen-spec-canonical-kit/` (paths below are relative from `screens/*.md` here). A **Marketing / Downloads** snapshot may exist for sharing templates; open canonical docs from your clone root there.

Use these **canonical** links from any screen spec living under `docs/process/screen-spec-canonical-kit/screens/`:

| Topic | Repo path |
|-------|-----------|
| 19 screens (users + agents) | [`docs/features/19-screens-for-users-and-agents.md`](../../features/19-screens-for-users-and-agents.md) |
| Canonical gap / implementation map | [`docs/features/19-screens-canonical-implementation-and-gap-map-v1.md`](../../features/19-screens-canonical-implementation-and-gap-map-v1.md) |
| Production readiness + cross-flows | [`docs/features/19-screens-production-readiness-and-cross-flows-v1.md`](../../features/19-screens-production-readiness-and-cross-flows-v1.md) |
| Product screens spec | [`docs/features/product-screens-spec-v1.0.md`](../../features/product-screens-spec-v1.0.md) |
| Unified layout + theme | [`docs/policies/unified-app-layout-and-theme-standard-v1.0.md`](../../policies/unified-app-layout-and-theme-standard-v1.0.md) |
| PO gaps + what agents may do | [`docs/squad/PO_PRODUCTION_GAPS_AND_AGENT_SCOPED_ACTIONS.md`](../../squad/PO_PRODUCTION_GAPS_AND_AGENT_SCOPED_ACTIONS.md) |
| Today board | [`docs/squad/TODAY_EXECUTION_BOARD.md`](../../squad/TODAY_EXECUTION_BOARD.md) |
| RFQ templates | [`docs/squad/19-SCREENS_RFQ_TEMPLATE.md`](../../squad/19-SCREENS_RFQ_TEMPLATE.md), [`REMAINING-SCREENS_RFQ_TEMPLATE.md`](../../squad/REMAINING-SCREENS_RFQ_TEMPLATE.md), [`8-MODULES_RFQ_TEMPLATE.md`](../../squad/8-MODULES_RFQ_TEMPLATE.md) |
| QC reports | `docs/qc-reports/` (artefacts per squad process) |

**Folder-aware build proof (local):**

```bash
cd /Users/nikodem/job-app-restore/proj/backend && npm run build
cd /Users/nikodem/job-app-restore/proj/frontend && npm run build
```

---

## How to use

1. Copy `templates/SCREEN_TEMPLATE.md` → `screens/<SCREEN_ID>.md`.  
2. Apply `checklist/TOTAL_SCREEN_REQUIREMENTS.md` (sections A–I).  
3. Mirror the screen row in `matrix/TRACEABILITY_TEMPLATE.md` for the release.  
4. Paste the **MultivoHub binding** table (above) into each screen spec **once**, then link only row-specific extras (billing slice, SQL path, etc.).

## Folder layout

| Path | Purpose |
|------|---------|
| `checklist/TOTAL_SCREEN_REQUIREMENTS.md` | Master checklist A–I (includes explicit code + builds) |
| `templates/SCREEN_TEMPLATE.md` | Per-screen spec with BE/FE path tables |
| `matrix/TRACEABILITY_TEMPLATE.md` | Wide matrix: paths + tests + builds |
| `examples/SCR-EXAMPLE-REVIEW-QUEUE.md` | Example (update paths to your monorepo) |
| `.github/pull_request_template.md` | PR reminder |

## Principles

- Parent screen **Done** only when all **owned child rows** (DATA / API / FE / TEST) are Done.  
- **§ I** in the master checklist is the anti-“we assumed FE/BE” guardrail.

## License

Internal / org process kit — adapt freely.
