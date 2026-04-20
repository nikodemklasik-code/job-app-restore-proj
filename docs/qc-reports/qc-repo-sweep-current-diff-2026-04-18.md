# QC Repo Sweep — current working-tree diff (2026-04-18)

**Date:** 2026-04-18  
**Reviewer:** Quality Control Developer (squad QC role)  
**Purpose:** one document that maps **every active block in the working tree** to either an **existing §8 verdict** or an explicit **"no verdict possible yet"** statement per **Hard Rule 7** of [`../squad/IMPLEMENTATION_EXECUTION_RULES.md`](../squad/IMPLEMENTATION_EXECUTION_RULES.md). This is the single QC assessment for the whole current diff that was missing from the record.  
**Binding rule:** Hard Rule 7 — no scope is closed without a paired **§6 agent delivery report** and **§8 QC review**. Where a §6 intake is missing, this sweep records the gap **and does not fabricate approval**.

---

## 1. QC Pre-Flight

### Repo search performed (§4 + §7 + Hard Rule 2)

QC scanned all three canonical locations and mapped each block of the current diff against them.

- `docs/qc-reports/` — 21 files; 4 existing §8 verdict / decision records relevant to the current diff (listed below).
- `docs/qc/phase-1 | phase-2 | phase-3 | phase-4 | modules/` — placeholder READMEs only; no module-level QC artefacts.
- `docs/squad/` — specs / workboard / ABC split read to determine owner per block.

### Existing §8 / decision records (binding references this sweep will map against)

| Ref | Subject | Status | Scope boundary |
|-----|---------|--------|----------------|
| [`qc-verdict-agent-1-foundations-a-f1-a-f2-a-f4-2026-04-18.md`](./qc-verdict-agent-1-foundations-a-f1-a-f2-a-f4-2026-04-18.md) | Credits & Billing Engine + Profile SoT + Deploy Integrity Guards | **Approved For Integration** (all three) | Agent 1's three owned slices only. Carries a cross-agent constraint: *no direct `subscriptions.credits` writes outside the engine*. |
| [`qc-verdict-settings-url-resubmission-2026-04-19.md`](./qc-verdict-settings-url-resubmission-2026-04-19.md) | Settings `?tab=` helper + Vitest wiring | **Approved For Integration** (narrow only) | Only the five files listed in that verdict. Explicitly does **not** cover the 2026-04-18 wider Practice/Settings slice. |
| [`qc-decision-practice-modules-settings-community-2026-04-18.md`](./qc-decision-practice-modules-settings-community-2026-04-18.md) | Practice + Settings + Community + Consent + Job Radar typing | **Not Approved For Integration** | Governs the wider Practice/Settings/Community body of work until a new `READY FOR QC` is filed. |
| [`qc-job-radar-openapi-contract-dev-handoff-2026-04-16.md`](./qc-job-radar-openapi-contract-dev-handoff-2026-04-16.md) | Job Radar OpenAPI v1.1 contract handoff | **Approved For Integration** with 3 explicit `OPENAPI_V1_1_GAPS_VS_REPO` | Contract + contract tests only; does not approve Job Radar product-level changes. |
| [`qc-agent-work-spot-verification-2026-04-19.md`](./qc-agent-work-spot-verification-2026-04-19.md) | OpenAI narrow slice spot-verify | **Approved For Integration** (narrow only) | `lib/openai` + Assistant product meta + **optional** Legal Hub grounded summary from catalogue hits + related backend tests. Everything wider = **Not Approved For Integration**. |
| [`qc-ai-live-smoke-2026-04-16.md`](./qc-ai-live-smoke-2026-04-16.md) | AI live smoke (end-to-end) | **Not Approved For Integration** until `OPENAI_API_KEY` validated on environment | Environmental gate, not a code verdict. |

### Out-of-repo §6 intakes in this diff

| Intake | Owner | Status in this sweep |
|--------|-------|----------------------|
| [`agent-1-foundations-a-f1-a-f2-a-f4-ready-for-qc-2026-04-18.md`](./agent-1-foundations-a-f1-a-f2-a-f4-ready-for-qc-2026-04-18.md) | Agent 1 | Paired with §8 above → **closed**. |
| [`execution-practice-settings-qc-resubmission-2026-04-19.md`](./execution-practice-settings-qc-resubmission-2026-04-19.md) | Agent 3 | Paired with §8 above → **closed** (narrow only). Wider scope: not re-submitted yet → remains **Not Approved** via the 2026-04-18 decision. |

**No other active §6 intake is present in the working tree.** Every block below that is **not** attached to one of these intakes is therefore, per Hard Rule 7, **ineligible for a fresh §8 verdict in this sweep**; the correct reaction is a new `READY FOR QC` from the owning agent, not a manufactured approval.

---

## 2. Block-by-block map of the current diff

### 2.1 Credits & Billing foundation (Agent 1 / A-F1)

- **Files (engine + schema + config + router + tests):** `backend/src/services/creditsBilling.ts` · `creditsBilling.policy.ts` · `creditsConfig.ts` · `__tests__/creditsBilling.spec.ts` · `backend/src/db/schema.ts` (`credit_spend_events`, `credit_pack_purchases`, `subscriptions.allowance*`) · `backend/src/trpc/routers/billing.router.ts`.
- **Status:** **Approved For Integration** via [`qc-verdict-agent-1-foundations-...-2026-04-18.md`](./qc-verdict-agent-1-foundations-a-f1-a-f2-a-f4-2026-04-18.md).
- **Carry (binds consumers):** any code outside `billing.router.ts` + `creditsBilling.ts` that touches `subscriptions.credits` directly is a defect for **its owning slice**, not for A-F1.

### 2.2 Profile as Source of Truth (Agent 1 / A-F2)

- **Files:** `backend/src/services/profileSourceOfTruth.ts` · `profileSourceOfTruth.policy.ts` · `__tests__/profileSourceOfTruth.spec.ts` · tRPC additions in `profile.router.ts` (`getMatchContext`, `getGrowthRecommendations`, `isEmployerBlocked`) · downstream wiring in `jobs.router.ts`, `emailAutoApply.ts`, `autoApply.router.ts`.
- **Status:** **Approved For Integration** via the same A-F1/A-F2/A-F4 verdict.

### 2.3 Deploy Integrity Guards (Agent 1 / A-F4)

- **Files:** `.canonical-repo-key` · `scripts/lib/canonical-deploy-guards.sh` · `scripts/deploy*.sh` / `ack-deploy.sh` / `backup-safe.sh` / `ci-assert-canonical-deploy.sh` / `verify-canonical-repo.sh` / `rolling-workspace-backup.sh` · `scripts/tests/canonical-deploy-guards.test.sh` · `.github/workflows/deploy.yml` · `infra/deploy-target-key.example` · `.cursor/rules/backup-before-disk-work.mdc`.
- **Status:** **Approved For Integration** via the same A-F1/A-F2/A-F4 verdict.

### 2.4 OpenAI centralisation + Assistant product meta (Agent 2 narrow slice — governed)

- **Files:** `backend/src/config/ai.env.ts` · `backend/src/config/ai.models.ts` · `backend/src/lib/openai/openai.client.ts` · `openai.responses.ts` · `openai.realtime.ts` · `model-registry.ts` · `cost-registry.ts` · `assistant-product-meta.ts` · `__tests__/model-registry.spec.ts` · `__tests__/assistant-product-meta.spec.ts` · `backend/src/services/__tests__/assistant-meta.spec.ts` · `backend/src/services/openai.ts` delta + downstream adapters in `ai/clients/openai-llm.client.ts`, `services/aiPersonalizer.ts`, `services/cvParser.ts`, `services/interviewConversation.ts`, `services/liveInterviewEngine.ts`, `services/negotiationConversation.ts`, `services/vohub.ts`, `services/jobSources/*`.
- **Status:** **Approved For Integration (narrow only)** via [`qc-agent-work-spot-verification-2026-04-19.md`](./qc-agent-work-spot-verification-2026-04-19.md). Any wider claim (UX, live smoke, end-to-end assistant) remains **Not Approved**.
- **Sweep note:** adapter file edits are covered by the narrow slice so long as they only re-route through `lib/openai`. Additional product behaviour (assistant router UX, prompts) is **not** in the narrow approval — lands under Practice/Settings governance if it changes user-visible flow.

### 2.5 Job Radar OpenAPI v1.1 contract (Agent 2 — governed)

- **Files:** `docs/job-radar/job-radar-openapi-v1.1.yaml` · `backend/src/modules/job-radar/__tests__/job-radar-openapi-v1.1.contract.spec.ts` · `__tests__/job-radar.http.mapper.spec.ts` · `__tests__/integration/scan-progress-openapi.integration.spec.ts` · `api/job-radar.http.mapper.ts` · `api/job-radar.dto.ts` · `docs/job-radar/README.md` · `docs/job-radar/CONTRACT-KEYS-AND-SECRETS.md`.
- **Status:** **Approved For Integration** with the 3 `OPENAPI_V1_1_GAPS_VS_REPO` gaps carried forward (tRPC-vs-REST divergence, missing `from-saved-job`, missing employer history) via [`qc-job-radar-openapi-contract-dev-handoff-2026-04-16.md`](./qc-job-radar-openapi-contract-dev-handoff-2026-04-16.md).
- **Sweep note:** mapper + DTO edits match the contract tests. Other Job Radar internals (`infrastructure/repositories`, `services/input-normalizer.service.ts`, `domain/repositories`) are **not** contract changes — see §2.13.

### 2.6 Legal Hub Search backend module — **NEW, no dedicated §6 intake**

- **Files:** `backend/src/modules/legal-hub-search/index.ts` · `legal-hub-search.catalog.ts` · `legal-hub-search.service.ts` · `legal-hub-search.ai-synthesis.ts` · `legal-hub-search.pdf.ts` · `legal-hub-search.types.ts` · `legal-hub-search.ai-synthesis.ts` · `README.md` · `__tests__/legal-hub-search.service.spec.ts` · `__tests__/legal-hub-search.pdf.spec.ts` · `backend/src/trpc/routers/legalHub.router.ts` · `backend/src/trpc/routers/index.ts` (registration) · `docs/legal-sources/*` · `docs/features/legal-hub-search-full-implementation-spec-v1.0.md` · `docs/features/legal-hub-search-repo-and-pdf-export-addendum-v1.0.md`.
- **What QC observed (spot evidence, not a verdict):**
  - Catalogue-only retrieval via `searchLegalHubSources` — no open-web fallback.
  - Grounded synthesis (`trySynthesizeLegalCatalogHits`) restricted to catalogue hits; deviation from spec noted: synthesis path uses inline snippets in Responses-style chat, not OpenAI `file_search` / vector store (catalogue `OPENAI_LEGAL_VECTOR_STORE_ID` TODO left in code).
  - PDF export (`legalHub.exportSearchPdf`) correctly routes a fixed-cost debit through `approveSpend(feature='legal_hub_search_pdf')` — no direct debit.
  - 2 passing tests (service + PDF render).
- **Previous QC report checked:** only the OpenAI narrow-slice verdict ([`qc-agent-work-spot-verification-2026-04-19.md`](./qc-agent-work-spot-verification-2026-04-19.md)) approves *optional Legal Hub grounded summary from catalogue hits* as part of the narrow slice. It **does not** approve: the full catalogue, the PDF export, the tRPC router registration, or the source-registry YAML.
- **Status:** **No dedicated §8 verdict; cannot be issued without a §6 intake (Hard Rule 7).**  
  Integration Status remains **Not Approved For Integration** for the parts beyond the OpenAI narrow-slice mention.
- **Required Next Action (owner):** Agent 2 (B) must file a `READY FOR QC` §6 intake covering the Legal Hub Search module as its own slice (catalogue, service, synthesis, PDF export, router, tests). Until that intake lands, QC cannot certify this module — per §5a / Hard Rule 8, this is **code work**, not chat negotiation.

### 2.7 Skill Lab signals + tRPC router — **NEW, no dedicated §6 intake**

- **Files:** `backend/src/services/skillLabSignals.service.ts` · `backend/src/trpc/routers/skillLab.router.ts` · `backend/src/trpc/routers/index.ts` (registration) · consumer changes in Skill Lab frontend (`frontend/src/app/skills/SkillsLab.tsx`).
- **What QC observed:**
  - Router exposes `listSkillStates`, `promoteStateDemo`, `suggestedAction`, `listClaims`, `upsertClaim`, `syncFromProfileSkills`.
  - Skill state machine hooked via `promoteSkillState`; suggested-action helper is pure.
  - **No tests** present for either the service or the router.
  - **No billing wiring** for `skill_lab_gap_analysis` / `skill_lab_course_suggest` feature keys defined in `creditsConfig.ts` — consistent with the carry finding under A-F1.
- **Status:** **No §8 verdict possible — no §6 intake.** Falls under Agent 2's **B-F2 Skill Lab core** ownership.
- **Required Next Action (owner):** Agent 2 to file §6 intake for B-F2 (core Skill Lab backend + frontend). Without it, any claim that Skill Lab is "implemented" is documentation state, not implementation state — rejected at the gate.

### 2.8 Session-practice module (Daily Warmup pricing helper) — **NEW, partial coverage**

- **Files:** `backend/src/modules/session-practice/types.ts` · `backend/src/modules/session-practice/warmupCredits.ts` · `__tests__/warmupCredits.spec.ts` · frontend twin in `frontend/src/app/warmup/warmupTierCatalog.ts` + `warmupTierCatalog.spec.ts`.
- **What QC observed:**
  - Backend `warmupCredits.ts` + 3 tests lock the paid-tier amounts (1 / 2 / 3 credits) — small, well-tested policy helper.
  - Frontend `warmupTierCatalog.ts` + spec lock the same amounts; this is explicitly called out as an **annex** in [`agent-c-report.md`](./agent-c-report.md) and footnoted in [`execution-practice-settings-qc-resubmission-2026-04-19.md`](./execution-practice-settings-qc-resubmission-2026-04-19.md) (line 44).
  - No route actually calls `approveSpend('warmup_session', amount)` yet — the helper just validates permissible amounts.
- **Status:** the helpers themselves are low-risk and covered by their own unit tests, but **the enclosing Daily Warmup billing path is part of Agent 3's C-F1** slice which is **Not Approved** per the 2026-04-18 decision. The 2026-04-19 narrow tranche explicitly did **not** claim warmup debit coverage.
- **QC decision in this sweep:** keep under **Not Approved For Integration** with the wider C-F1 slice. The pricing helper is ready to be picked up **inside** a future C-F1 §6 resubmission that actually wires the debit; it is not a separately-certifiable slice.
- **Required Next Action (Agent 3):** include `backend/src/modules/session-practice/*` + `frontend/src/app/warmup/warmupTierCatalog*` inside the next §6 C-F1 intake that also wires `approveSpend('warmup_session', …)` into the warmup route, so the slice has product effect, not just type-safety.

### 2.9 Practice modules — Coach / Interview / Negotiation / Warmup (Agent 3 / C-F1)

- **Files:** `backend/src/trpc/routers/coach.router.ts` · `backend/src/api/routes/coach-analysis.route.ts` · `interview-report.route.ts` · `interview-summary.route.ts` · frontend `app/coach/CoachPage.tsx`, `app/interview/InterviewPractice.tsx`, `app/negotiation/NegotiationPage.tsx` (renamed from `NegotiationCoach.tsx`), `app/warmup/DailyWarmupPage.tsx` (renamed from `InterviewWarmup.tsx`), `features/practice-shell/*`.
- **Status:** **Not Approved For Integration** via [`qc-decision-practice-modules-settings-community-2026-04-18.md`](./qc-decision-practice-modules-settings-community-2026-04-18.md).
- **Fresh finding in this sweep (strengthens Not Approved):** `backend/src/trpc/routers/coach.router.ts` still contains a direct-SQL debit (lines 62–63: `db.update(subscriptions).set({ credits: sql\`…\` })`) that bypasses the engine. This is the **carry finding from A-F1's verdict**. Per Agent 1's DoD ("no hidden spend … remains"), this specific pattern keeps practice billing at **Not Approved** regardless of other progress.
- **Required Next Action (Agent 3):** file a fresh §6 intake that:
  1. Migrates `coach.router.ts`, `interview`, `negotiation`, `warmup` to `approveSpend` / `commitSpend` per `FEATURE_COSTS`.
  2. Wires the session-practice helpers from §2.8.
  3. Adds tests for each debit path.
  4. Addresses the product depth that the 2026-04-18 decision listed as missing (navigation, copy, shell unification, persistence where PO requires).

### 2.10 Settings / Community / Consent (Agent 3 / C-F2)

- **Files:** `frontend/src/app/settings/SettingsHub.tsx` · `SecurityPage.tsx` · `JobSourcesSettingsTab.tsx` · `settingsTabFromUrl.ts` + spec · `stores/settingsStore.ts` · `stores/securityStore.ts` · `frontend/src/components/SupportingMaterialsDisclaimer.tsx`.
- **Status:** **Split status (do not merge statements):**
  - **Approved For Integration (narrow, five-file allow-list):** the `?tab=` helper + wiring + Vitest + execution report + this verdict — via [`qc-verdict-settings-url-resubmission-2026-04-19.md`](./qc-verdict-settings-url-resubmission-2026-04-19.md).
  - **Not Approved For Integration (everything else in this area):** the wider Community & consent backend persistence, separate Community vs Consent surfaces if PO requires them, and any Security/JobSources settings store changes not covered by the narrow verdict — remain under the 2026-04-18 decision until a new `READY FOR QC` explicitly addresses them.
- **Required Next Action (Agent 3):** per §5a / Hard Rule 8, file a new §6 intake for the remaining product depth; do not broaden the narrow approval by prose.

### 2.11 Job Radar frontend + services (Agent 2 / B-F3 wider)

- **Files:** `frontend/src/app/job-radar/JobRadarLandingPage.tsx` · `features/job-radar/**` · `backend/src/modules/job-radar/infrastructure/*` · `backend/src/modules/job-radar/domain/repositories/radar-report.repository.ts` · `backend/src/trpc/routers/jobRadar.router.ts`, `radar.router.ts` · `backend/src/services/jobSources/*`.
- **Status:** the OpenAPI v1.1 contract surface (mapper + DTO + contract tests) is **Approved For Integration** via the 2026-04-16 handoff. The **wider product** (UI flow `/radar` vs `/job-radar`, landing-page logic, frontend start-scan CTA card, rescan report button, job-radar scan mapper, service layer changes) does **not** have a §6 intake or §8 verdict.
- **Required Next Action (Agent 2):** file a §6 intake for B-F3 product slice (routing unification, full scan-report flow, deep-search cost path via engine). Until filed, no verdict will be issued.

### 2.12 Assistant / tRPC assistant router

- **Files:** `backend/src/trpc/routers/assistant.router.ts` · `frontend/src/app/assistant/AssistantPage.tsx` · `frontend/src/stores/careerAssistantStore.ts` · `shared/assistant.ts` · `shared/assistant.js`.
- **Status:** `lib/openai/assistant-product-meta.ts` + server-meta endpoint are within the **OpenAI narrow slice** Approved via [`qc-agent-work-spot-verification-2026-04-19.md`](./qc-agent-work-spot-verification-2026-04-19.md). The **Assistant page UX** (frontend) is explicitly **Not** in that narrow approval.
- **Required Next Action (Agent 3 — UX side):** any user-visible Assistant UX change needs a §6 intake; otherwise it sits under the 2026-04-18 Not Approved umbrella.

### 2.13 Other backend service / prompt edits

- **Files:** `backend/src/server.ts` · `backend/src/worker.ts` · `backend/src/prompts/shared/ai-boundary-rule-core.ts` · `backend/src/prompts/shared/universal-behavior-layer.ts` · `backend/src/services/aiPersonalizer.ts` · `services/cvParser.ts` · `services/vohub.ts` · `services/openai.ts` · `services/interviewConversation.ts` · `services/liveInterviewEngine.ts` · `services/negotiationConversation.ts` · `services/emailAutoApply.ts` · `services/jobSources/*`.
- **Status:** mostly covered where the edit is either (a) re-routing to `lib/openai` (narrow OpenAI slice) or (b) wiring the profile SoT gate (A-F2). Any new prompt content or new AI-driven behaviour beyond those two scopes is **not** governed by an existing §8 verdict and will need a §6 intake from the owning agent (Agent 2 for intelligence modules, Agent 3 for user-facing copy).

### 2.14 Frontend layout / navigation / theme

- **Files:** `frontend/src/components/layout/Header.tsx` · `Sidebar.tsx` · `frontend/src/lib/navigationCopy.ts` · `frontend/src/router.tsx` · `frontend/tailwind.config.js` · `frontend/src/lib/clerk.tsx` · `frontend/src/lib/trpc-auth-redirect.ts` · various `app/*/Page.tsx` files.
- **Status:** the 2026-04-18 decision covers navigation/copy in the practice-modules area as **Not Approved**. Global layout/theme changes fall under the [`unified-app-layout-and-theme-standard-v1.0.md`](../policies/unified-app-layout-and-theme-standard-v1.0.md) — those require Visual Consistency Owner sign-off per [`visual-consistency-owner-role-spec.md`](../policies/visual-consistency-owner-role-spec.md), not a QC verdict.
- **Required Next Action:** any claim of layout/theme completion goes through the Visual Consistency Owner track first, then QC for Integration Status.

### 2.15 Documentation-only changes

- **Files:** `docs/**/*.md`, `docs/legal-sources/**`, `CLAUDE.md`, `docs/RUNBOOK.md`, policy and spec markdown updates.
- **Status:** QC does not gate documentation state in the same way as code. However, `docs/squad/IMPLEMENTATION_EXECUTION_RULES.md` + `Quality_Control_Developer_Spec.md` + `qc-reporting-certification-and-po-communication-spec-v1.0.md` are **process-binding** — this sweep references them as the ruleset, not as deliverables under review.

---

## 3. Consolidated QC verdict table

| # | Block | Owner | Existing §8 | Integration Status | What moves it forward |
|---|-------|-------|-------------|--------------------|------------------------|
| 2.1 | Credits & Billing engine + schema | A | ✓ A-F1 | **Approved For Integration** | (closed) |
| 2.2 | Profile as SoT + downstream wiring | A | ✓ A-F2 | **Approved For Integration** | (closed) |
| 2.3 | Deploy integrity guards + CI | A | ✓ A-F4 | **Approved For Integration** | (closed) |
| 2.4 | OpenAI centralisation + Assistant meta (narrow) | B | ✓ spot verification | **Approved For Integration** (narrow) | wider Assistant UX → Agent 3 §6 intake |
| 2.5 | Job Radar OpenAPI v1.1 contract | B | ✓ handoff verdict | **Approved For Integration** + 3 gaps | Agent 2 closes the 3 gaps in a fresh §6 |
| 2.6 | Legal Hub Search module | B | **missing** | **Not Approved For Integration** | Agent 2 files §6 intake for this slice |
| 2.7 | Skill Lab signals + router | B | **missing** | **Not Approved For Integration** | Agent 2 files §6 intake for B-F2 |
| 2.8 | Session-practice warmup helpers | A (infra) → C (consumer) | — | part of Not Approved C-F1 | bundled into next C-F1 §6 intake |
| 2.9 | Practice modules (Coach / Interview / Negotiation / Warmup) | C | 2026-04-18 decision | **Not Approved For Integration** | Agent 3 files fresh §6; migrates coach debit to engine; adds tests |
| 2.10 | Settings / Community / Consent | C | split (narrow Approved + wider Not Approved) | **Not Approved** for wider; **Approved** for narrow 5-file allow-list | Agent 3 fresh §6 for wider scope |
| 2.11 | Job Radar UI + services (wider) | B | — | **Not Approved For Integration** | Agent 2 files B-F3 product §6 intake |
| 2.12 | Assistant UX + stores | C | — | **Not Approved For Integration** (outside narrow slice) | Agent 3 fresh §6 for Assistant UX |
| 2.13 | Backend prompts / adapters | A/B (split) | partially covered via §2.4 and A-F2 | **Approved where narrow** / **Not Approved** for any new product behaviour | per-edit attribution inside owner's next §6 |
| 2.14 | Frontend layout / theme | C | — | Governed by **Visual Consistency Owner** track, then QC | Visual Consistency sign-off → C §6 |
| 2.15 | Documentation | (all) | not a code gate | — | — |

---

## 4. QC Verdict

**Mixed.** This sweep is a mapping document, not a single verdict. Per §9:

- **Approved For Integration:** blocks 2.1, 2.2, 2.3, 2.4 (narrow), 2.5 (with 3 gaps), 2.10 (narrow five-file allow-list).
- **Not Approved For Integration:** blocks 2.6, 2.7, 2.8 (as part of 2.9), 2.9, 2.10 (wider), 2.11, 2.12, 2.14 (wider, governed outside QC).
- **No verdict possible yet (Hard Rule 7 — missing §6 intake):** 2.6 (Legal Hub Search), 2.7 (Skill Lab), 2.11 (Job Radar product), 2.12 (Assistant UX). These are **not** silently approved; they are explicitly awaiting `READY FOR QC` from their owner.

## 5. Integration Status

Per §9 mapping, the only integration-ready artefacts of the current diff are those listed in §3 under **Approved For Integration**. Everything else holds its prior Not Approved state or is pending §6 intake. **This sweep does not change any Not Approved state into Approved.**

## 6. Escalation To Product Owner: Yes / No

**Yes — narrow list of confirmation items (same as the A-F1 verdict):**

1. Monthly allowance defaults by plan (`free=50 / pro=500 / autopilot=2000`).
2. Credit-pack catalogue pricing/labels.
3. Salary-above-target rule (currently eligible).
4. Whether Community & Consent must ship as **physically separate** surfaces and with **server-backed** persistence (input into C-F2 resubmission scope).
5. Whether the Legal Hub Search module should migrate from inline-snippet synthesis to OpenAI `file_search` + vector store (`OPENAI_LEGAL_VECTOR_STORE_ID`) before or after integration.

None of these are blockers for the *Approved* blocks above. They shape the depth of the *Not Approved* blocks when they resubmit.

## 7. Required Next Action

- **Mandatory first line (§5a / Hard Rule 8):**  
  `Owning agent: required work is executed in the repository, not in chat instead of implementation — see docs/squad/IMPLEMENTATION_EXECUTION_RULES.md §5a and Hard Rule 8.`  
  Acceptable agent responses: repository changes plus a fresh **§6** delivery report, **or** **one** documented **Blocker** in that report.

- **Agent 2 (B):** two fresh §6 intakes owed — one for **Legal Hub Search module** (§2.6) and one for **Skill Lab core** (§2.7). A third for **Job Radar wider product** (§2.11) and the three OpenAPI gaps (§2.5) can be bundled or separate. No chat re-litigation of this sweep substitutes for those intakes.
- **Agent 3 (C):** two fresh §6 intakes owed — one **C-F1 Practice** covering the four practice modules with engine-routed debits (migrating `coach.router.ts` lines 62–63 off direct SQL, wiring warmup helpers from §2.8, adding tests), and one **C-F2 Settings / Community / Consent wider** covering the persistence / split-surface items from the 2026-04-18 decision. Include Assistant UX (§2.12) inside C-F1 or as a third §6 at your discretion.
- **Agent 1 (A):** no code delta owed for the Approved slices. Optional helper to streamline the consumer migration (e.g. a `requireSpendApproval(feature)` tRPC middleware) may ship under a fresh §6 if Agent 3 requests it; otherwise idle.
- **PO:** address the five confirmation items in §6 of this sweep at any time; none blocks the Approved blocks.

---

## 8. Hard Rule cross-check for this sweep

- **Hard Rule 2** (QC actively searches all three canonical locations): satisfied — §1 pre-flight.
- **Hard Rule 7** (scope closes only by paired §6 + §8): satisfied — no verdict manufactured for §2.6, §2.7, §2.11, §2.12. Each is explicitly left as "awaiting §6 intake" instead of being forced into an Approved/Rejected bucket.
- **Hard Rule 8 / §5a** (post-verdict behaviour = code, not chat): embedded in §7 as the mandatory first line. Any agent reading this sweep responds in the repo, not in prose.
