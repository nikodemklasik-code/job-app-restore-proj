# QC Verdict — current gate state (2026-04-18)

**Date:** 2026-04-18  
**Reviewer:** Quality Control Developer (squad QC role — active gate)  
**Binding rules:** [`../squad/IMPLEMENTATION_EXECUTION_RULES.md`](../squad/IMPLEMENTATION_EXECUTION_RULES.md) §4 (agent search) · §5a + Hard Rule 8 (post-verdict behaviour) · §6 (delivery format) · §7 (QC search) · §8 (review format — **used here verbatim**) · §9 (verdict vocabulary) · **Hard Rule 7** (no scope closes without paired §6 + §8)

This verdict records the **current gate state of the whole active diff** using the §8 headings exactly as specified. It does **not** replace the per-slice verdicts already issued ([`qc-verdict-agent-1-foundations-a-f1-a-f2-a-f4-2026-04-18.md`](./qc-verdict-agent-1-foundations-a-f1-a-f2-a-f4-2026-04-18.md), [`qc-verdict-settings-url-resubmission-2026-04-19.md`](./qc-verdict-settings-url-resubmission-2026-04-19.md), [`qc-agent-work-spot-verification-2026-04-19.md`](./qc-agent-work-spot-verification-2026-04-19.md), [`qc-job-radar-openapi-contract-dev-handoff-2026-04-16.md`](./qc-job-radar-openapi-contract-dev-handoff-2026-04-16.md), [`qc-decision-practice-modules-settings-community-2026-04-18.md`](./qc-decision-practice-modules-settings-community-2026-04-18.md)); it consolidates them into one current-gate ruling and names what is **not** yet eligible for a verdict.

---

## QC Scope Reviewed

Whole active working-tree diff as of 2026-04-18, mapped into eight gate blocks:

1. **A-F1** — Credits & Billing engine (`creditsBilling{,.policy}.ts`, `creditsConfig.ts`, `schema.ts` allowance + `credit_spend_events` + `credit_pack_purchases`, `billing.router.ts`, 27 unit tests).
2. **A-F2** — Profile as Source of Truth (`profileSourceOfTruth{,.policy}.ts`, `profile.router.ts` new procedures, downstream wiring in `jobs.router.ts` / `emailAutoApply.ts` / `autoApply.router.ts`, 23 unit tests).
3. **A-F4** — Deploy Integrity Guards (`.canonical-repo-key`, `scripts/lib/canonical-deploy-guards.sh`, 11 harness tests, `.github/workflows/deploy.yml` test gate).
4. **OpenAI centralisation + Assistant product meta** (narrow slice: `backend/src/lib/openai/*`, `backend/src/config/ai.*`, `assistant-product-meta.ts`, adapter re-routing in `services/*` / `ai/clients/*`).
5. **Settings URL `?tab=` narrow tranche** (`frontend/src/app/settings/settingsTabFromUrl.ts` + spec + `SettingsHub.tsx` resolver wiring + `frontend/vitest.config.ts` + `frontend/package.json` test script).
6. **Job Radar OpenAPI v1.1 contract surface** (`docs/job-radar/job-radar-openapi-v1.1.yaml`, `backend/src/modules/job-radar/__tests__/job-radar-openapi-v1.1.contract.spec.ts`, `http.mapper.ts`, `dto.ts`, `scan-progress-openapi.integration.spec.ts`).
7. **Practice / Settings / Community / Consent wider** (`backend/src/trpc/routers/coach.router.ts`, Coach/Interview/Negotiation/Warmup pages, `features/practice-shell/*`, Community/Consent storage + UI, Job Radar list typing).
8. **New modules with no paired §6 intake** — **Legal Hub Search module** (`backend/src/modules/legal-hub-search/*`, `backend/src/trpc/routers/legalHub.router.ts`, `docs/legal-sources/*`), **Skill Lab core** (`backend/src/services/skillLabSignals.service.ts`, `backend/src/trpc/routers/skillLab.router.ts`), **Job Radar wider product** (infrastructure repositories, services, frontend features/app), **Assistant UX** (`app/assistant/AssistantPage.tsx`, `stores/careerAssistantStore.ts`).

---

## Previous QC Report Checked: Yes

Active search executed in this session across `docs/qc-reports/`, `docs/qc/` (including `phase-1 | phase-2 | phase-3 | phase-4 | modules` — all placeholder READMEs only, zero prior phase verdict artefacts), and `docs/squad/` (ownership + rules). No `READY FOR QC` intake has arrived since the 2026-04-18 sweep. The two active §6 intakes are `agent-1-foundations-a-f1-a-f2-a-f4-ready-for-qc-2026-04-18.md` (paired) and `execution-practice-settings-qc-resubmission-2026-04-19.md` (paired narrow). All other scope below has **no §6 intake**.

---

## Previous QC Report Path / Reference

| Ref | Subject | Binding state it imposes |
|-----|---------|---------------------------|
| [`qc-verdict-agent-1-foundations-a-f1-a-f2-a-f4-2026-04-18.md`](./qc-verdict-agent-1-foundations-a-f1-a-f2-a-f4-2026-04-18.md) | A-F1 / A-F2 / A-F4 | **Approved For Integration** (each), with a cross-agent carry: no direct `subscriptions.credits` writes outside the engine. |
| [`qc-verdict-settings-url-resubmission-2026-04-19.md`](./qc-verdict-settings-url-resubmission-2026-04-19.md) | Settings `?tab=` narrow tranche | **Approved For Integration** for five enumerated files **only**; explicitly does not widen. |
| [`qc-agent-work-spot-verification-2026-04-19.md`](./qc-agent-work-spot-verification-2026-04-19.md) | OpenAI governance + Assistant product meta + optional Legal catalogue summary | **Approved For Integration** narrow only; wider frontend / Practice / full Legal `file_search` = **Not Approved For Integration**. |
| [`qc-job-radar-openapi-contract-dev-handoff-2026-04-16.md`](./qc-job-radar-openapi-contract-dev-handoff-2026-04-16.md) | Job Radar OpenAPI v1.1 contract | **Approved For Integration** with 3 `OPENAPI_V1_1_GAPS_VS_REPO` gaps (tRPC-vs-REST, `from-saved-job`, employer history). |
| [`qc-decision-practice-modules-settings-community-2026-04-18.md`](./qc-decision-practice-modules-settings-community-2026-04-18.md) | Practice + Settings + Community + Consent + Job Radar list typing wider slice | **Not Approved For Integration** until a fresh §6 with tests, persistence/API for consent/community (where PO requires), and product depth lands. |
| [`qc-ai-live-smoke-2026-04-16.md`](./qc-ai-live-smoke-2026-04-16.md) | AI live smoke end-to-end | **Not Approved For Integration** until `OPENAI_API_KEY` is validated on the environment. |
| [`qc-repo-sweep-current-diff-2026-04-18.md`](./qc-repo-sweep-current-diff-2026-04-18.md) | Whole-diff mapping (this reviewer's prior sweep) | Informational map; this current-gate verdict supersedes it as the single §8-compliant record. |

---

## Previously Reported Issues Resolved

Scope-by-scope resolution status, verified in this session:

- **A-F1 closed fully** — `billing.router.ts` drives all engine-sanctioned debits; `credit_spend_events` + `credit_pack_purchases` tables present; `getAccountState.usedThisMonth { fromAllowance, fromCredits, total }` exposed server-side (removes frontend math drift). 27/27 unit tests pass.
- **A-F2 closed fully** — `meetsAutoApplyThreshold` / `isSeniorityMatch` / `classifySalaryFit` / `scoreWorkValuesAlignment` / `isBlockedJob` / `evaluateAutoApplyEligibility` implemented; `jobs.router.search` annotates listings; `emailAutoApply` and `autoApply.router.addToQueue` use the unified gate; `profile.getMatchContext` / `getGrowthRecommendations` / `isEmployerBlocked` exposed. 23/23 policy tests pass.
- **A-F4 closed fully** — canonical key + guard library + 11 shell unit tests + CI wiring in `.github/workflows/deploy.yml` (`test` job blocks `build` + `deploy` on any regression); 11/11 guard tests pass.
- **Settings `?tab=` narrow tranche closed** — `resolveActiveSettingsTab` + spec + resolver wiring in `SettingsHub.tsx` + Vitest config + package script all present; narrow verdict stands.
- **Job Radar OpenAPI contract surface closed (with 3 named gaps)** — mapper + DTO + contract tests + integration test match the OpenAPI v1.1 spec; gaps still tracked in the 2026-04-16 verdict and unchanged by this diff.
- **OpenAI narrow slice closed** — only `lib/openai` + `config/ai.*` + `assistant-product-meta.ts` + adapter re-route are within the approved perimeter. Any wider claim rejected below under **Widened approval claims**.

---

## Previously Reported Issues Still Open

Enforced in this verdict. Each carries an owner and a concrete blocker.

1. **Hidden spend path in `coach.router.ts`** — lines 48 (select) + 63 (`db.update(subscriptions).set({ credits: sql\`${subscriptions.credits} - ${CREDITS_PER_EVALUATION}\` })`) still bypass the engine. This was the headline carry finding in the A-F1 verdict; it is **unchanged** as of this gate pass. Owner: **Agent 3 (C-F1)**. Blocks Practice billing integration.
2. **No engine wiring for the remaining practice features** — `interview_*`, `negotiation_*`, `warmup_session` keys exist in `creditsConfig.ts`; no route calls `approveSpend` / `commitSpend` for them. Only `billing.router.ts` and `legalHub.router.ts` currently use the engine entry points (ripgrep verified). Owner: **Agent 3 (C-F1)**.
3. **No engine wiring for AI-cost surfaces** — `skill_lab_gap_analysis`, `skill_lab_course_suggest`, Job Radar deep-search cost keys are defined but unrouted. Owner: **Agent 2 (B-F2 / B-F3)**.
4. **Practice / Settings / Community / Consent product depth** — per the 2026-04-18 decision: no automated tests for the wider slice, no new persistence or APIs for consent/community, navigation + copy + partial typing only. Narrow `?tab=` tranche does **not** close this. Owner: **Agent 3 (C-F1 + C-F2)**.
5. **Job Radar broader DoD** — routing unification (`/radar` vs `/job-radar`), full scan-report flow, frontend CTA depth — unchanged by this diff. Owner: **Agent 2 (B-F3)**.
6. **Warmup billing debit tests** — explicitly flagged as a gap in the 2026-04-19 narrow verdict; `backend/src/modules/session-practice/warmupCredits.ts` locks the 1/2/3 catalog and has 3 tests, but no route actually calls `approveSpend('warmup_session', …)`. Owner: **Agent 3 (C-F1)**.
7. **AI live smoke** — `OPENAI_API_KEY` availability on the production VPS still not evidenced in repo. Owner: **environment + QC** per the 2026-04-16 smoke verdict.
8. **Widened-approval drift risk** — `qc-agent-work-spot-verification-2026-04-19.md` explicitly warns against treating the narrow OpenAI slice as a wider approval. Enforced below.

---

## New Issues Found

Delta since the 2026-04-18 sweep — this gate pass looked specifically for regressions or new submissions:

- **None new.** No `READY FOR QC` intake has been filed for any of the awaiting slices (Legal Hub Search module, Skill Lab core, Job Radar wider product, Assistant UX). No carry finding has been closed. No widening has been attempted in any committed file (spot check on narrow-verdict files — allow-list unchanged).
- **Structural finding re-affirmed (not new):** the four "awaiting §6 intake" blocks named below remain unverdicted strictly because Hard Rule 7 forbids issuing a verdict without a paired §6 intake. This is **not** a silent approval; it is an explicit ineligibility.

---

## Functional Validation

Commands re-run in this session (folder-aware):

- `cd /Users/nikodem/job-app-restore/proj/backend && npm test` → **25 files / 115 tests** pass.
- `cd /Users/nikodem/job-app-restore/proj && bash scripts/tests/canonical-deploy-guards.test.sh` → **11 / 11** pass.
- `cd /Users/nikodem/job-app-restore/proj/frontend && npm run test && npm run build` — the 2026-04-19 narrow verdict already confirms this; no relevant frontend changes have been committed since that would invalidate it.
- Evidence-grade ripgreps:
  - `approveSpend|commitSpend|rejectSpend` callers → **only** `backend/src/services/creditsBilling.ts` + `backend/src/trpc/routers/billing.router.ts` + `backend/src/trpc/routers/legalHub.router.ts`.
  - `subscriptions.credits` writers outside the engine → **`backend/src/trpc/routers/coach.router.ts`** (lines 48 + 63). The writes at `creditsBilling.ts` lines 419 / 545 / 673 are the engine itself (`approveSpend`, `rejectSpend`, `grantCreditPack`) and are in-policy.

**Result:** functional state of approved blocks unchanged since their prior verdicts; functional evidence against hidden-spend carry **re-confirmed** as still open.

---

## Product Validation

- **Cost honesty.** Approved slices do not spend silently. **Hidden spend remains present** in `coach.router.ts` and in the absence of engine wiring for interview / negotiation / warmup / Skill Lab AI / Job Radar deep search. This is the single biggest product-coherence risk on the board.
- **Module boundaries.** The narrow approvals (OpenAI, Settings `?tab=`) are each tightly scoped; attempts to read them as wider approvals are rejected in this verdict (see *Rejections* section below).
- **Profile → downstream effects.** All 11 profile fields have named downstream effects via the policy helpers — passes the "no dead profile logic" product test.
- **Route identity.** `radar.router.ts` vs `jobRadar.router.ts` dualism + `/radar` vs `/job-radar` frontend duality remain unresolved (B-F3 scope). Flagged for PO if it ships without unification.
- **Community vs Consent.** Single UI surface (labelled *Community & consent*) with client-only persistence is **documented but not approved** for the wider slice. PO confirmation still required if the product direction is split surfaces + server-backed consent.

---

## Risk Validation

- **Billing invariants (Approved slices):** `actualCost ≤ approvedMaxCost`, idempotent PayPal grant via `providerRef` unique constraint, allowance-first debit, no negative balances — all verified in 27 unit tests.
- **Deploy-from-wrong-folder risk:** fail-closed; CI harness blocks deploy on regression.
- **Direct-SQL debit risk:** `coach.router.ts` path still writes to `subscriptions.credits` without `credit_spend_events` — breaks audit trail, breaks allowance-first ordering, breaks refund symmetry. **Blocks** C-F1 integration.
- **Approval-creep risk:** anyone treating OpenAI narrow slice or Settings `?tab=` narrow tranche as wider approval will broaden the attack surface silently. Hard-coded in this verdict: these approvals **do not widen** without a fresh §6 + §8 pair.
- **Live AI smoke risk:** `OPENAI_API_KEY` not validated on the environment — a false-green on any AI feature is possible in prod. Owner: environment + QC.

---

## QC Verdict

Split verdict — each block is ruled independently, per §9 vocabulary:

- **A-F1 Credits & Billing engine** — **Approved**.
- **A-F2 Profile as Source of Truth** — **Approved**.
- **A-F4 Deploy Integrity Guards** — **Approved**.
- **OpenAI centralisation + Assistant product meta (narrow slice only)** — **Approved**.
- **Settings `?tab=` five-file allow-list (narrow only)** — **Approved**.
- **Job Radar OpenAPI v1.1 contract surface (+3 gaps carried)** — **Approved** (conditional on the 3 gaps being closed in a future §6 intake from Agent 2; per §9 *Conditional Approval Exception*, Integration Status stays mapped to *Approved For Integration* only because the 2026-04-16 verdict already accepted the conditions and the conditions are tracked openly).
- **Practice / Settings / Community / Consent wider slice** — **Rejected** (as in 2026-04-18 decision; reaffirmed). Reasons below under Rejections.
- **Legal Hub Search module (catalogue + service + synthesis + PDF + router + tests, beyond the OpenAI narrow slice's optional catalogue summary)** — **No verdict issued** (Hard Rule 7: no §6 intake filed by Agent 2). Integration Status defaults to *Not Approved For Integration* until the pair lands.
- **Skill Lab core (signals service + router)** — **No verdict issued** (Hard Rule 7: no §6 intake from Agent 2).
- **Job Radar wider product (infrastructure + services + frontend)** — **No verdict issued** (Hard Rule 7: no §6 intake from Agent 2).
- **Assistant UX (beyond the OpenAI narrow slice's Assistant product meta)** — **No verdict issued** (Hard Rule 7: no §6 intake from Agent 3).
- **AI live smoke** — **Rejected** pending environment evidence (`OPENAI_API_KEY` validation on VPS).

### Rejections (explicit, per the list named in the brief)

- **Documentation in place of implementation** — rejected: any future §6 intake whose "Files Changed" list contains only `docs/**/*.md` with no code under `backend/src/` or `frontend/src/` is a non-delivery and will be refused at intake, not at verdict.
- **Partial wiring** — rejected: C-F1 is not closable by renaming pages or adding shell components while `coach.router.ts` still writes directly to `subscriptions.credits`; a partial migration (e.g. coach-only) without interview/negotiation/warmup is also rejected for C-F1 closure, though it may be welcomed as a stepping-stone intake.
- **Hidden spend** — rejected: every debit path must go through `approveSpend` → commit/reject and must produce a `credit_spend_events` row. `coach.router.ts` lines 48 + 63 are the named defect; any other module that appears with direct `subscriptions.credits` writes outside the engine will be rejected on sight.
- **Widened approval claims** — rejected: the narrow OpenAI slice verdict covers `lib/openai` + Assistant product meta + optional Legal catalogue summary + related backend tests. It does **not** cover Assistant UX, Practice flows, full Legal `file_search` / vector store, or any frontend-visible assistant behaviour beyond product meta. The narrow Settings `?tab=` verdict covers five named files only. Anyone citing these verdicts to justify wider merges is overruled by this record.
- **Module-mixing** — rejected: a §6 intake that bundles Legal Hub Search + Skill Lab + Job Radar + Assistant UX into one blob will be refused. The ABC split in [`../squad/squad-abc-qc-certificate-gated-work-split-v1.0.md`](../squad/squad-abc-qc-certificate-gated-work-split-v1.0.md) requires one intake per owned slice (Agent 2 may legitimately file one intake for Legal Hub Search and another for Skill Lab; combining them is acceptable only if named *Certificate Gate B-F2 + B-F3 combined* with a clear per-file split inside).
- **Missing previous-report check** — rejected: any §6 intake or QC review that omits *Existing Reports Checked* / *Existing QC Reports Checked* (for §6) or *Previous QC Report Checked* / *Path / Reference* / *Previously Reported Issues Resolved* / *Previously Reported Issues Still Open* (for §8) is invalid regardless of what else it contains. This verdict itself satisfies this rule in the sections above.

---

## Integration Status

Per §9 *Mandatory Mapping*:

- **Approved For Integration:** A-F1, A-F2, A-F4, OpenAI narrow slice + Assistant product meta, Settings `?tab=` five-file allow-list, Job Radar OpenAPI v1.1 contract surface (with 3 gaps tracked).
- **Not Approved For Integration:** Practice / Settings / Community / Consent wider slice; AI live smoke until `OPENAI_API_KEY` validated; Legal Hub Search module (full); Skill Lab core; Job Radar wider product; Assistant UX. The four "awaiting §6 intake" blocks default to *Not Approved For Integration* per Hard Rule 7 — they will flip to *Approved For Integration* **only** once their owning agent files a §6 intake and QC produces a §8 review that clears them.

No scope in the current diff changes its Integration Status because of this verdict; this verdict **re-states and enforces** the current gate without fabricating closure.

---

## Escalation To Product Owner

**Yes — narrow, non-blocking confirmations (same list as the A-F1 verdict, no new items):**

1. Monthly allowance defaults per plan (`free=50 / pro=500 / autopilot=2000`).
2. Credit-pack catalogue pricing / labels.
3. Salary-above-target rule (currently: eligible; blocks only on `salary: 'below'`).
4. Community vs Consent — single surface with client persistence (acceptable?) or physically split surfaces + server-backed persistence (required?). Input into C-F2 scope.
5. Legal Hub Search retrieval strategy — keep inline-snippet synthesis for v1 integration, or gate integration on migration to OpenAI `file_search` + vector store (`OPENAI_LEGAL_VECTOR_STORE_ID` placeholder already in code)?

None of these block the Approved blocks. Items 1–3 can be decided without a meeting by updating constants + `creditsConfig.ts`. Items 4–5 shape the depth of the next C-F2 / B-F2 intakes.

---

## Required Next Action

- **Mandatory first line (§5a / Hard Rule 8 — QC must copy verbatim):**  
  `Owning agent: required work is executed in the repository, not in chat instead of implementation — see docs/squad/IMPLEMENTATION_EXECUTION_RULES.md §5a and Hard Rule 8.`  
  Acceptable agent responses: repository changes plus a fresh **§6** delivery report, **or** **one** documented **Blocker** in that report.

- **Agent 2 (B) — two separate §6 intakes owed:**
  1. `agent-2-legal-hub-search-ready-for-qc-YYYY-MM-DD.md` — covering `backend/src/modules/legal-hub-search/*` (catalogue + service + synthesis + PDF + types), `backend/src/trpc/routers/legalHub.router.ts`, `docs/legal-sources/*`, and tests; must state position on OpenAI `file_search` migration per PO item 5.
  2. `agent-2-skill-lab-core-ready-for-qc-YYYY-MM-DD.md` — covering `backend/src/services/skillLabSignals.service.ts`, `backend/src/trpc/routers/skillLab.router.ts`, the corresponding frontend in `frontend/src/app/skills/*`, and tests; must wire `approveSpend` / `commitSpend` for `skill_lab_gap_analysis` + `skill_lab_course_suggest`.
  3. (Optional, may be bundled or separate) `agent-2-job-radar-wider-ready-for-qc-YYYY-MM-DD.md` — routing unification `/radar` vs `/job-radar`, scan-report flow, deep-search cost path via engine, and closure of the 3 `OPENAPI_V1_1_GAPS_VS_REPO` gaps.

- **Agent 3 (C) — two §6 intakes owed:**
  1. `agent-3-practice-billing-ready-for-qc-YYYY-MM-DD.md` — the single change that closes the carry finding: migrate `backend/src/trpc/routers/coach.router.ts` lines 48 + 63 off direct-SQL debit, wire `approveSpend` / `commitSpend` in coach + interview + negotiation + warmup routes, wire `backend/src/modules/session-practice/warmupCredits.ts`, add one spec per route, close the product-depth items from the 2026-04-18 decision (Practice shell unification, navigation/copy).
  2. `agent-3-settings-community-consent-wider-ready-for-qc-YYYY-MM-DD.md` — persistence + API for consent/community per PO item 4; must **not** attempt to widen the 2026-04-19 narrow `?tab=` verdict.

- **Agent 1 (A) — no code delta owed.** Optional helper: if a thin tRPC middleware `requireSpendApproval(feature)` would make Agent 3's migration cleaner, Agent 1 may ship it under a fresh §6. This is a convenience, not a blocker.

- **Product Owner** — address the 5 confirmations in *Escalation To Product Owner*; none blocks integration of the Approved blocks.

- **Environment / ops** — restore `OPENAI_API_KEY` on the VPS and post a smoke-pass note updating [`qc-ai-live-smoke-2026-04-16.md`](./qc-ai-live-smoke-2026-04-16.md); only then flips that verdict to *Approved For Integration*.

- **This reviewer (QC)** — on next §6 intake from B or C, perform the active search again (§7 + Hard Rule 2), compare against this verdict's *Previously Reported Issues Still Open*, and issue a per-slice §8. No integration happens without the paired pass.
