# Agent 2 — Delivery report (Legal Hub narrow slice + Skill Lab core + Job Radar wider)

**Date:** 2026-04-19  
**Branch context:** working tree on `claude/improvements` (or equivalent) — not merged to `main` by this report alone.

## Integration status (canonical — do not broaden)

- **Ready For QC:** Yes (submitted 2026-04-19).  
- **QC verdict (§8):** [`qc-verdict-agent-2-delivery-intelligence-legal-skill-jobradar-2026-04-19.md`](./qc-verdict-agent-2-delivery-intelligence-legal-skill-jobradar-2026-04-19.md) (dated **2026-04-20**) — **Approved For Integration (bounded)** for: Legal Hub **narrow** slice, Skill Lab **core signals** tranche, Job Radar **wider tRPC + UI + gap honesty**; **Not Approved For Integration** for **literal REST** `/job-radar/*` parity (single tracked gap — unchanged by design). **No widening** to full Agent 2 / full `file_search` / full Skill Lab spec.  
- **Approved For Integration (entire Agent 2 surface):** No — verdict is **per-slice only**, as in the linked §8 table.

**Exact product lines for this submission (do not rephrase upward):**

- Legal Hub **grounded catalogue summary** implemented (optional LLM text **only** over catalogue hits — **not** full `file_search` / vector-store retrieval as a product capability).  
- **Vector retrieval mode** is **honest and conditional** (`none` | `configured` in API scope; `configured` does **not** assert live `file_search`).  
- **Skill Lab core** implemented (backend `skillLab.coreSignals` + UI hook).  
- **Job Radar wider** implementation **advanced** (stable employer id, saved-job scan entrypoint, employer history query, list + landing UX; OpenAPI gap list updated).  
- **One OpenAPI gap remains:** REST path **literal** mismatch vs **tRPC** exposure (operations exist on `jobRadar` router; not byte-identical Express routes from YAML).

## Scope Implemented

1. **Legal Hub (narrow slice — catalogue grounding only)**  
   - Grounded catalogue summary path unchanged in nature: **`trySynthesizeLegalCatalogHits`** uses **only** hit titles/snippets/URLs.  
   - Scope payload: **`vectorRetrievalMode`** + **`scopeLabel`** text that does **not** describe full Legal Hub **file_search** retrieval.  
   - Unit tests for synthesis with **mocked** OpenAI client.

2. **Skill Lab core (backend-first)**  
   - New **`skillLabCore.service`**: skill value bands, qualitative salary-impact tier (no currency amounts), CV value signals, verification hints (reuses existing evidence helper), **course→skill** mapping from training titles vs profile skills, growth hooks.  
   - New protected tRPC procedure **`skillLab.coreSignals`** loading profile slice + `skill_claims`.  
   - **Skills Lab** UI section reads `coreSignals` when signed in.

3. **Job Radar wider**  
   - **Stable `employerId`** on new scans via hash of employer name / URL host / saved-job id (`deriveStableEmployerIdFromScanPayload`).  
   - **`jobRadar.startScanFromSavedJob`**: maps `applications` row → `startScanDto` (`saved_job` trigger).  
   - **`jobRadar.getEmployerHistory`**: user-scoped history wire-shaped to OpenAPI field names.  
   - **Report list** enriched with scores + freshness + employer id (left join scores).  
   - **Landing UI**: opportunity-style cards, **Why this match** heuristic, **Employer track** deep-link `?employerId=`, history panel when filtered.  
   - **`OPENAPI_V1_1_GAPS_VS_REPO`**: **one** item — literal REST paths vs tRPC (see exact line above).

## Next action (executor)

**QC verdict received** — see §8 file linked above. **Done in this resync (Required Next Action):** refreshed *Blockers* / test notes below so they match current repo: `coach.router.spec.ts` is **hermetic** (no `appRouter`, mocked `db`); `cd /Users/nikodem/job-app-restore/proj/backend && npm test -- --run` → **29/29 files, 125/125 tests** passed on verification. **Further work:** only new **separate** §6 intakes (e.g. Legal billing for non-PDF AI, Skill Lab AI cost keys, REST adapter if PO mandates) — **not** implied by this bounded verdict; implement **only** exact findings from those future §8 documents.

## Files Changed

- `backend/src/modules/job-radar/infrastructure/services/stable-employer-id.service.ts` (new)  
- `backend/src/modules/job-radar/__tests__/stable-employer-id.service.spec.ts` (new)  
- `backend/src/modules/job-radar/application/handlers/start-scan.handler.ts`  
- `backend/src/modules/job-radar/domain/repositories/radar-report.repository.ts`  
- `backend/src/modules/job-radar/infrastructure/repositories/drizzle-radar-report.repository.ts`  
- `backend/src/trpc/routers/jobRadar.router.ts`  
- `backend/src/modules/job-radar/__tests__/job-radar-openapi-v1.1.contract.spec.ts`  
- `backend/src/services/skillLabCore.service.ts` (new)  
- `backend/src/services/__tests__/skillLabCore.service.spec.ts` (new)  
- `backend/src/trpc/routers/skillLab.router.ts`  
- `backend/src/modules/legal-hub-search/legal-hub-search.types.ts`  
- `backend/src/modules/legal-hub-search/legal-hub-search.service.ts`  
- `backend/src/modules/legal-hub-search/__tests__/legal-hub-search.service.spec.ts`  
- `backend/src/modules/legal-hub-search/__tests__/legal-hub-search.ai-synthesis.spec.ts` (new)  
- `frontend/src/app/job-radar/JobRadarLandingPage.tsx`  
- `frontend/src/app/skills/SkillsLab.tsx`  
- `frontend/src/app/legal/LegalHub.tsx`  
- `docs/qc-reports/agent-2-delivery-intelligence-legal-skill-jobradar-2026-04-19.md` (this file)

## Routes / APIs / Schemas / Components Changed

| Area | Change |
|------|--------|
| tRPC `jobRadar` | **`startScanFromSavedJob`**, **`getEmployerHistory`** |
| tRPC `jobRadar.listMyReports` | Row shape extended (scores, `employerId`, `freshnessStatus`) |
| tRPC `skillLab` | **`coreSignals`** |
| Legal search scope | `LegalSearchScopeSummary.vectorRetrievalMode` + extended `scopeLabel` |
| UI | `JobRadarLandingPage`, `SkillsLab`, `LegalHub` (scope line under official sources) |

## Tests Added Or Updated

- `stable-employer-id.service.spec.ts`  
- `skillLabCore.service.spec.ts`  
- `legal-hub-search.ai-synthesis.spec.ts`  
- `legal-hub-search.service.spec.ts` (assert `vectorRetrievalMode`)  
- `job-radar-openapi-v1.1.contract.spec.ts` (`OPENAPI_V1_1_GAPS_VS_REPO` length **1**)

## Existing Reports Checked

- `docs/qc-reports/qc-live-status.md` (binding narrow OpenAI / Legal slice; Job Radar OpenAPI handoff)  
- `docs/qc-reports/qc-job-radar-openapi-contract-dev-handoff-2026-04-16.md`  
- `docs/qc-reports/agent-b-report.md` (Job Radar contract notes)

## Existing QC Reports Checked

- `docs/qc-reports/qc-job-radar-openapi-contract-dev-handoff-2026-04-16.md` (QC Verdict + explicit gaps policy)  
- `docs/qc-reports/qc-live-status.md` (current binding status block)

## Previously Reported Issues Resolved

- OpenAPI gap list: **dedicated `from-saved-job` flow** and **employer history** are now implemented at **tRPC** layer; remaining documented gap is **REST path parity** only.  
- Skill Lab: backend-backed **value / course / growth** signals beyond static copy.

## Previously Reported Issues Still Open

- **Literal Express routes** matching `/job-radar/*` from YAML — not added (single gap retained on purpose; **NAFI** per QC).  
- **Legal `file_search` / vector retrieval execution path** — not implemented; env flag only prepares honest scope text (`vectorRetrievalMode` / `scopeLabel`).  
- **Full Skill Lab product spec** / AI-cost debiting for Skill Lab keys — **out of scope** for this intake (per QC §Previously Reported Issues Still Open).

## New Gaps Or Limitations

- **`employerId`** for rows created **before** this change may be **null** — Employer track link appears only when present.  
- **`whyThisMatch`** on landing is a **light heuristic** over scores, not the full report narrative.  
- **`startScanFromSavedJob`** uses **`applications.id`** as the saved-job key (product naming vs OpenAPI `saved_job_id` — semantically aligned).

## Ready For QC: Yes (superseded by §8 verdict — see Integration status)

## Blockers

- **None** for the default backend Vitest gate: `coach.router.spec.ts` is hermetic (QC 2026-04-20); full `npm test` from `backend/` passes **29/29 files, 125/125 tests** without MySQL. Other suites or CI jobs that spin a real DB remain environment-dependent and are **not** claimed fixed by this intake.
