# QC Verdict — Agent 2 delivery (Legal Hub narrow + Skill Lab core + Job Radar wider tranche)

**Date:** 2026-04-20  
**Reviewer:** QC (active quality gate)  
**Intake (§6):** [`agent-2-delivery-intelligence-legal-skill-jobradar-2026-04-19.md`](./agent-2-delivery-intelligence-legal-skill-jobradar-2026-04-19.md)  
**Format:** [`docs/squad/IMPLEMENTATION_EXECUTION_RULES.md`](../squad/IMPLEMENTATION_EXECUTION_RULES.md) §8 · §9 · Hard Rule 7  

**Anti-widening (binding):** This verdict certifies **only** the three named tranches in the intake and the test-suite note below. It does **not** certify the full Agent 2 product surface (e.g. full Legal Hub `file_search`, full Skill Lab spec vs `docs/skill-lab/skill-lab-final-spec-v1.0.md`, or REST byte-parity for Job Radar).

---

## QC Scope Reviewed

Implementation and tests named in the Agent 2 intake, cross-checked in repo:

| Tranche | Primary evidence read / executed |
|---------|----------------------------------|
| Legal Hub narrow | `legal-hub-search.types.ts`, `legal-hub-search.service.ts` (`getLegalSearchScopeSummary`), `legal-hub-search.ai-synthesis.ts` (`trySynthesizeLegalCatalogHits`), `legalHub.router.ts`, `legal-hub-search.service.spec.ts`, `legal-hub-search.ai-synthesis.spec.ts`, `frontend/src/app/legal/LegalHub.tsx` (scope + grounded summary UX) |
| Skill Lab core | `skillLabCore.service.ts`, `skillLab.router.ts` (`coreSignals`), `skillLabCore.service.spec.ts`, `frontend/src/app/skills/SkillsLab.tsx` |
| Job Radar wider | `stable-employer-id.service.ts`, `jobRadar.router.ts` (`startScanFromSavedJob`, `getEmployerHistory`), `job-radar-openapi-v1.1.contract.spec.ts` (`OPENAPI_V1_1_GAPS_VS_REPO`), `frontend/src/app/job-radar/JobRadarLandingPage.tsx` |
| Test matrix | `cd /Users/nikodem/job-app-restore/proj/backend && npm test` (full Vitest run) |

---

## Previous QC Report Checked: Yes

Searched and cross-read:

- [`qc-job-radar-openapi-contract-dev-handoff-2026-04-16.md`](./qc-job-radar-openapi-contract-dev-handoff-2026-04-16.md) — QC Verdict + gap policy  
- [`qc-agent-work-spot-verification-2026-04-19.md`](./qc-agent-work-spot-verification-2026-04-19.md) — narrow OpenAI / Legal / Assistant binding slice  
- [`qc-live-status.md`](./qc-live-status.md) — broadcast + binding lines  
- [`qc-verdict-current-gate-state-2026-04-18.md`](./qc-verdict-current-gate-state-2026-04-18.md) — prior gate (Legal Hub module awaited §6; Skill Lab core awaited §6)  
- [`docs/squad/Agent_2_Intelligence_Modules_Spec.md`](../squad/Agent_2_Intelligence_Modules_Spec.md) — owner scope (not used to widen this verdict beyond the intake)

---

## Previous QC Report Path / Reference

- Job Radar OpenAPI handoff: [`qc-job-radar-openapi-contract-dev-handoff-2026-04-16.md`](./qc-job-radar-openapi-contract-dev-handoff-2026-04-16.md)  
- Consolidated gate (context only): [`qc-verdict-current-gate-state-2026-04-18.md`](./qc-verdict-current-gate-state-2026-04-18.md)  

---

## Previously Reported Issues Resolved (within this intake’s declared slices)

1. **Job Radar OpenAPI gap list — `from-saved-job` and employer history**  
   - tRPC `jobRadar.startScanFromSavedJob` and `jobRadar.getEmployerHistory` exist and map to the OpenAPI *intent* described in the intake.  
   - `OPENAPI_V1_1_GAPS_VS_REPO` in `job-radar-openapi-v1.1.contract.spec.ts` is reduced to **one** string: REST literal paths under `/job-radar/*` vs tRPC exposure — matches intake.

2. **Skill Lab — static copy only**  
   - Backend `buildSkillLabCoreSignals` + `skillLab.coreSignals` + UI consumption addresses the “beyond static copy” gap **for this core-signals tranche only**.

3. **Legal Hub — honest scope for vector vs catalogue**  
   - `vectorRetrievalMode` + `scopeLabel` implemented; `trySynthesizeLegalCatalogHits` uses **only** catalogue hit fields; no `file_search` execution path wired.

---

## Previously Reported Issues Still Open (not claimed fixed by this intake)

1. **Job Radar — literal Express REST routes** matching OpenAPI paths — intentionally **not** implemented; remains the single documented gap.  
2. **Full Legal Hub vector / `file_search` execution** — not in repo; env id only affects **labeling**, not retrieval behaviour.  
3. **Full Skill Lab product spec** — salary impact modelling, deeper verification product, billing for AI-heavy Skill Lab keys, etc., are **out of scope** for this §6 unless separately filed and reviewed.

---

## New Issues Found

None in the reviewed files that contradict the intake’s **exact product lines** (§Integration status).  

**Note on intake “Blockers”:** The intake states MySQL is required for a green matrix because of `coach.router.spec`. In the current tree, `backend/src/trpc/routers/__tests__/coach.router.spec.ts` is **hermetic** (no `appRouter`, `vi.mock` on `db`) and the full backend `npm test` run completed **29/29 files, 125/125 tests passed** on verification. The MySQL warning is **stale relative to current repo**; it does not negate this delivery but should be corrected in the next Agent 2 §6 resync.

---

## Functional Validation

- **Legal Hub `vectorRetrievalMode` + `scopeLabel`:** `getLegalSearchScopeSummary()` sets `none` | `configured` from `OPENAI_LEGAL_VECTOR_STORE_ID` trim only. Labels explicitly state catalogue + optional grounded summary when `none`, and when `configured` that retrieval is product-dependent and catalogue remains primary — **no false claim of live `file_search`.**  
- **Grounded summary:** `legalHub.search` only calls `trySynthesizeLegalCatalogHits` when `includeGroundedSummary` and `hits.length > 0`. Synthesis builds context from hit title/url/snippet only; system prompt forbids outside knowledge.  
- **Skill Lab core:** `buildSkillLabCoreSignals` returns bands, qualitative `salaryImpact` tier, CV signals, verification hints, course→skill mappings, growth hooks; rationale strings avoid currency regex (asserted in test). `coreSignals` loads profile slice + claims from DB when profile exists.  
- **Job Radar:** `deriveStableEmployerIdFromScanPayload` implemented; router procedures match intake; contract spec asserts single gap.  
- **Frontend:** `LegalHub.tsx` renders `scopeLabel` and “catalogue only, no open web” for summary; `SkillsLab.tsx` uses `coreSignals` with explicit “Qualitative tiers only”; `JobRadarLandingPage.tsx` uses `employerId` query param + `getEmployerHistory`.

---

## Product Validation

- Legal: UX and API align with “official catalogue index + optional LLM summary over hits only”; disclaimers present.  
- Skill Lab: Signals are **coaching-shaped** (bands, hooks, hints), not salary guarantees — appropriate for declared scope.  
- Job Radar: Employer track and saved-job scan improve **discoverability** of existing tRPC flows; heuristic `whyThisMatch` is explicitly light (intake §New Gaps).

---

## Risk Validation

- **Misrepresentation of vector / file_search:** Low — types + `scopeLabel` + synthesis implementation are aligned.  
- **Over-claiming OpenAPI compliance:** Mitigated — single explicit gap retained in contract test.  
- **REST clients expecting YAML paths:** Operational risk remains until REST adapter or gateway exists; documented, not hidden.

---

## QC Verdict

| Slice | Verdict |
|-------|---------|
| **Legal Hub — narrow implementation** (catalogue search, `vectorRetrievalMode` / `scopeLabel`, catalogue-only grounded summary, PDF path unchanged in this review) | **Approved For Integration** — for the **narrow** capability described in the intake and prior QC “catalogue + grounded summary” binding; **not** approval of full vector-store retrieval. |
| **Skill Lab — core signals tranche** (`skillLabCore.service`, `skillLab.coreSignals`, Skills Lab UI section) | **Approved For Integration** — for **this** backend-first core layer only; **not** approval of the entire Skill Lab module against the full product spec. |
| **Job Radar — wider tranche** (stable employer id, saved-job scan, employer history, list/landing UX, gap list = 1) | **Approved For Integration** — for the **implemented tRPC product flows** and contract-test honesty; **Not Approved For Integration** for **literal REST `/job-radar/*` parity** (explicit remaining gap — unchanged by design). |
| **Entire Agent 2 scope (automatic)** | **No verdict** — **rejected as a widening**; use per-slice lines above only. |

---

## Integration Status (§9 mapping)

- Legal Hub narrow (this delivery): **Approved For Integration**  
- Skill Lab core (this delivery): **Approved For Integration**  
- Job Radar wider implementation (tRPC + UI + gap documentation): **Approved For Integration**  
- Job Radar OpenAPI REST path parity: **Not Approved For Integration** (single tracked gap)  
- Full Agent 2 module bundle: **not certified** by this document  

---

## Escalation To Product Owner

Optional only: if an external integrator **requires** literal REST paths, PO must decide between (a) Express adapter layer, (b) documented tRPC-only integration, or (c) OpenAPI revision — not blocking this tranche’s **internal** consistency.

---

## Required Next Action

- **Agent 2 (B):** On next §6, refresh *Blockers* / test notes to match current `coach.router.spec` hermeticity; continue any **separate** slices (e.g. Legal billing for non-PDF AI, Skill Lab AI costs) with their own intake + §8.  
- **Agent 3 / infra:** If REST parity becomes mandatory, file a scoped §6 (adapter or routes), not implied by this verdict.  
- **QC:** Next Agent 2 delivery — repeat §7 search and delta against *Previously Reported Issues Still Open* in this file.

---

**One-line summary:** Legal narrow + Skill Lab core + Job Radar tRPC wider tranche — **Approved For Integration** as bounded; REST literal gap — **NAFI**; no widening to full Agent 2; full backend test run **green** on verification (125/125).
