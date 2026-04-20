# Agent 1 — Foundations slice A-F1 / A-F2 / A-F4 — READY FOR QC

**Date:** 2026-04-18
**Owner:** Agent 1 (A) — system foundations
**Execution rules (binding):** [`docs/squad/IMPLEMENTATION_EXECUTION_RULES.md`](../squad/IMPLEMENTATION_EXECUTION_RULES.md) §6 (Agent Delivery Format)
**Spec:** [`docs/squad/Agent_1_Foundations_Spec.md`](../squad/Agent_1_Foundations_Spec.md)
**Workboard:** [`docs/squad/Squad_Workboard.md`](../squad/Squad_Workboard.md)
**Certificate policy:** [`docs/squad/squad-abc-qc-certificate-gated-work-split-v1.0.md`](../squad/squad-abc-qc-certificate-gated-work-split-v1.0.md)
**QC operating model:** [`docs/qc/qc-reporting-certification-and-po-communication-spec-v1.0.md`](../qc/qc-reporting-certification-and-po-communication-spec-v1.0.md)
**Reporting standard:** [`docs/policies/execution-reporting-standard.md`](../policies/execution-reporting-standard.md)

This submission covers Agent 1's entire owned backend scope — Phase 1 (A-F1 Credits & Billing), Phase 2 (A-F2 Profile as Source of Truth), and Phase 4 (A-F4 Deploy Integrity Guards). It is submitted as a single intake because A-F1 ↔ A-F2 ↔ A-F4 share dependencies per the certificate-gated work-split rules and are all implemented in the same commit window. QC may split the verdict per sub-slice.

Sections below follow the **mandatory delivery format** defined in [`IMPLEMENTATION_EXECUTION_RULES.md`](../squad/IMPLEMENTATION_EXECUTION_RULES.md) §6, in the exact order: *Scope Implemented → Files Changed → Routes/APIs/Schemas/Components Changed → Tests Added Or Updated → Existing Reports Checked → Existing QC Reports Checked → Integration Notes → Ready For QC → Blockers*.

---

## Scope Implemented

### A-F1 — Credits And Billing Engine
- Monthly free allowance (per-plan limit, lazy monthly reset, **no rollover**).
- Paid credit balance persisted on `subscriptions.credits`.
- Credit packs catalog (`CREDIT_PACKS`) + PayPal order/capture flow with idempotent grant.
- Credit spend events (`credit_spend_events`) audit log for every debit and estimate-cycle.
- Fixed-cost actions — debit-on-approve.
- Estimated-cost actions — approve with `approvedMaxCost`, commit with `actualCost ≤ approvedMaxCost`, refund path on reject / cancel.
- Approval-before-spend gate with `INSUFFICIENT_FUNDS` rejection.
- Usage-history read API (paginated, latest first).
- Monthly allowance reset logic (`shouldResetAllowance` + `startOfMonthUTC`, no rollover — reset overwrites).
- Allowance-first debit order (debit allowance, then credits).
- **Credits used this month** — `getAccountState` now returns `usedThisMonth = { fromAllowance, fromCredits, total }` (aggregated over `credit_spend_events` since current `allowancePeriodStart`), plus `allowance.used` convenience field. The frontend can render "Monthly Free Allowance used / Credits Used This Month" without running its own math.

### A-F2 — Profile As Source Of Truth
- Profile fields persisted & exposed: work values, auto-apply threshold, growth plan, roadmap, skills-course relationships, target role, target seniority, target salary range, practice areas, blocked areas, high-impact improvements.
- Pure policy helpers: `meetsAutoApplyThreshold`, `isSeniorityMatch`, `classifySalaryFit`, `scoreWorkValuesAlignment`, `isBlockedJob`, `evaluateAutoApplyEligibility`.
- DB-bound service: `getProfileMatchContextByLocalId` / `getProfileMatchContext` returning a single `ProfileMatchContext` used by all downstream surfaces.
- Downstream wiring (eligibility gate enforced everywhere auto-apply happens):
  - **Jobs search** (`jobs.router`) — every listing is annotated with `{ canAutoApply, reason, thresholdUsed, workValueAlignment, salaryFit }`.
  - **Email auto-apply** (`emailAutoApply.ts`) — replaced the inline `minFitScore` check with the full `evaluateAutoApplyEligibility` gate (blocked areas + threshold + seniority + salary).
  - **Auto-apply queue** (`autoApply.router.addToQueue`) — Playwright-based queue path now uses the same gate. Blocked areas are always vetoed (title + company check); full gate runs when callers pass optional `jobFacts` (`fitScore`, `seniority`, `salaryMin/Max`, `tags`, `description`). Backward-compatible with current frontend callers.
- tRPC API: `profile.getMatchContext` exposes the full context to the frontend (Agent 3 can render profile-driven hints; Agent 2 can import the helper directly in Skill Lab / Job Radar).
- **New tRPC**: `profile.getGrowthRecommendations` — returns `{ growthPlan, highImpactImprovements, roadmap, skillCourseLinks, practiceAreas, workValues, autoApplyMinScore, targetJobTitle, targetSeniority, targetSalaryMin, targetSalaryMax }`. Single point of read for Profile page / Dashboard / Skill Lab growth surfaces.
- **New tRPC**: `profile.isEmployerBlocked` — pure policy call returning `{ blocked, blockedAreas, reason }` for a `{ jobTitle, company, tags }` input. Used by Job Radar + employer validation + manual-review surfaces so they all call the same blocked-areas rule instead of re-implementing it.

### A-F4 — Deploy Integrity Guards
- `.canonical-repo-key` marker committed at repo root + canonical key & remote base.
- Remote deploy marker checked against local marker.
- Local canonical path validation (refuses non-canonical cwd unless `DEPLOY_SKIP_LOCAL_REPO_PATH=1`).
- Remote canonical path validation (fails when `REMOTE_BASE` ≠ canonical unless `DEPLOY_ALLOW_NONCANONICAL_REMOTE=1`).
- Deploy target SSH host & domain match validation.
- DNS mismatch guard.
- Wrong-folder deploy block.
- **New:** shell test harness `scripts/tests/canonical-deploy-guards.test.sh` — 11 unit-level tests on the pure helper functions (no network, no ssh), runnable locally and in CI.
- **CI wiring:** `.github/workflows/deploy.yml` `test` job now runs `bash scripts/tests/canonical-deploy-guards.test.sh` on every push to `claude/improvements` / every manual deploy — deploy is blocked if the guard helpers regress.

---

## Files Changed

### A-F1 — Credits & Billing
- `backend/src/db/schema.ts` — extended `subscriptions` (`allowanceLimit`, `allowanceRemaining`, `allowancePeriodStart`); new tables `credit_spend_events`, `credit_pack_purchases`.
- `backend/src/services/creditsConfig.ts` — `FEATURE_KEYS`, `FEATURE_COSTS`, `MONTHLY_ALLOWANCE_BY_PLAN`, `CREDIT_PACKS` + `getCreditPack`.
- `backend/src/services/creditsBilling.policy.ts` (new) — pure policy helpers (`BillingError`, `planDebit`, `resolveApprovalCosts`, `assertWithinApprovedMax`, `shouldResetAllowance`, `startOfMonthUTC`, `estimateCostFor`).
- `backend/src/services/creditsBilling.ts` — DB-bound store: `getAccountState`, `approveSpend`, `commitSpend`, `rejectSpend`, `getUsageHistory`, `grantCreditPack`, `listCreditPacks`, `ensureSubscriptionWithFreshAllowance`.
- `backend/src/trpc/routers/billing.router.ts` — tRPC endpoints (`getAccountState`, `estimateCost`, `approveSpend`, `commitSpend`, `rejectSpend`, `getUsageHistory`, `listCreditPacks`, `createCreditPackPaypalOrder`, `captureCreditPackPaypalOrder`).

### A-F2 — Profile as SoT
- `backend/src/services/profileSourceOfTruth.policy.ts` (new) — pure helpers + `ProfileMatchContext` / `AutoApplyEligibility` types.
- `backend/src/services/profileSourceOfTruth.ts` (new) — DB-bound `getProfileMatchContextByLocalId` / `getProfileMatchContext`.
- `backend/src/trpc/routers/profile.router.ts` — new `getMatchContext`, `getGrowthRecommendations`, `isEmployerBlocked` procedures.
- `backend/src/trpc/routers/jobs.router.ts` — per-listing eligibility annotation in `search`.
- `backend/src/services/emailAutoApply.ts` — replaced inline threshold check with unified gate.
- `backend/src/trpc/routers/autoApply.router.ts` — queue path enforces the same gate; `jobFacts` optional input added (backward-compatible).

### A-F4 — Deploy integrity
- `.canonical-repo-key` — canonical marker.
- `scripts/lib/canonical-deploy-guards.sh` — pure guard helpers (already in repo).
- `scripts/deploy.sh`, `scripts/deploy-safe.sh`, `scripts/ack-deploy.sh`, `scripts/backup-safe.sh`, `scripts/ci-assert-canonical-deploy.sh`, `scripts/verify-canonical-repo.sh`, `scripts/rolling-workspace-backup.sh` — integrated the guard library.
- `infra/deploy-target-key.example` — remote marker template.
- `.cursor/rules/backup-before-disk-work.mdc` — tool-time backup rule (complements deploy guards locally).
- **New:** `scripts/tests/canonical-deploy-guards.test.sh` — 11-test bash harness.
- `.github/workflows/deploy.yml` — added test step that runs the guard harness before build/deploy.

---

## Routes / APIs / Schemas / Components Changed

### tRPC
- `billing.getAccountState` — `{ plan, credits, allowance { limit, remaining, used, periodStart, periodEnd }, spendableTotal, usedThisMonth { fromAllowance, fromCredits, total } }`.
- `billing.estimateCost` — `{ feature }` → `{ kind, estimatedCost, minCost, maxCost }`.
- `billing.approveSpend` — `{ feature, approvedMaxCost?, referenceId?, notes? }` → `{ spendEventId, approvedMaxCost, estimatedCost, balances }`.
- `billing.commitSpend` — `{ spendEventId, actualCost }` → `{ balances }`.
- `billing.rejectSpend` — `{ spendEventId, reason? }` → `{ balances }`.
- `billing.getUsageHistory` — paginated events feed.
- `billing.listCreditPacks` — static catalog (`id, credits, priceUSD, label`).
- `billing.createCreditPackPaypalOrder` — `{ packId }` → `{ orderId, approveUrl, amountUSD, credits }`.
- `billing.captureCreditPackPaypalOrder` — `{ orderId }` → `{ credited, newBalance, purchaseId, alreadyApplied }` (idempotent via `providerRef`).
- `profile.getMatchContext` — returns full `ProfileMatchContext`.
- `profile.getGrowthRecommendations` — returns `{ growthPlan, highImpactImprovements, roadmap, skillCourseLinks, practiceAreas, workValues, autoApplyMinScore, targetJobTitle, targetSeniority, targetSalaryMin, targetSalaryMax }`.
- `profile.isEmployerBlocked` — input `{ jobTitle?, company?, tags? }`, returns `{ blocked, blockedAreas, reason }`.
- `jobs.search` — result listings now include `eligibility`.
- `autoApply.addToQueue` — accepts optional `jobFacts` for full-gate enforcement.

### Schemas (MySQL / Drizzle)
- `subscriptions.allowanceLimit INT NOT NULL DEFAULT 50`
- `subscriptions.allowanceRemaining INT NOT NULL DEFAULT 50`
- `subscriptions.allowancePeriodStart DATETIME NULL`
- `credit_spend_events` — full audit log table.
- `credit_pack_purchases` — PayPal order tracking with idempotency via `providerRef`.

### Deploy
- New: `.canonical-repo-key`, `infra/deploy-target-key.example`, `scripts/tests/canonical-deploy-guards.test.sh`.

---

## Tests Added Or Updated

| File | Tests | Scope |
|------|-------|-------|
| `backend/src/services/__tests__/creditsBilling.spec.ts` | 27 | Planning/debit order, approval max-cost invariants, allowance reset, insufficient-funds path, refund invariants, credit-pack catalog invariants. |
| `backend/src/services/__tests__/profileSourceOfTruth.spec.ts` | 23 | Threshold meets/fails, seniority permissive match, salary bucketing, work-values alignment, blocked-area veto, end-to-end `evaluateAutoApplyEligibility` ordering. |
| `scripts/tests/canonical-deploy-guards.test.sh` | 11 | `canonical_kv_get`, `canonical_extract_ssh_host`, `canonical_assert_repo_key_present`, `canonical_load_remote_targets`, `canonical_assert_ssh_host_matches` (success + failure fixtures). |

**Verification commands (QC):**

```bash
cd /Users/nikodem/job-app-restore/proj/backend && npm ci && npm run build && npm test
```

```bash
cd /Users/nikodem/job-app-restore/proj && bash scripts/tests/canonical-deploy-guards.test.sh
```

**Current results (rerun 2026-04-18 04:54 UTC):**

- `npm run build` — OK.
- `npm test` — **25 files / 115 tests passing.**
- `canonical-deploy-guards.test.sh` — **11 / 11 passing.**
- ReadLints on touched files — clean.

---

## Existing Reports Checked

Per [`IMPLEMENTATION_EXECUTION_RULES.md`](../squad/IMPLEMENTATION_EXECUTION_RULES.md) §4 the three canonical locations were scanned before handoff.

### `docs/qc-reports/` (broadcast, intake decisions, agent reports)

| File | Relevance to A-F1 / A-F2 / A-F4 | What I took from it |
|------|--------------------------------|---------------------|
| `qc-live-status.md` | Broadcast; names A/B/C; references pin order B → C → A for the previous (Assistant/practice) cycle; lists Phase 2 Skill Lab as gated by `Approved A-F2` and C-F1 settings as gated by `Approved A-F2`. | Confirms A-F1 / A-F2 / A-F4 are the unblocking path for B-F2 and C-F2. No conflicting live decisions. |
| `qc-fu-followup-pack-intake-2026-04-16.md` | FU-1..3 on Assistant / Case Practice slice — unrelated scope. | None. |
| `qc-to-po-assistant-integration-2026-04-16.md` | Assistant slice integration — unrelated scope. | None. |
| `qc-decision-practice-modules-settings-community-2026-04-18.md` | C-F1/C-F2 decision — `Not Approved For Integration` pending frontend rework. Unrelated to A-F1/A-F2/A-F4 backend. | Confirms C will re-submit; my delivery doesn't depend on C's verdict. |
| `qc-delivery-implementation-slices-2026-04-18.md` | A/B/C implementation slices overview — mentions billing / profile at a summary level. | No prior QC verdict; just cross-agent status. |
| `execution-practice-settings-qc-resubmission-2026-04-19.md` | C-F1 / C-F2 resubmission — frontend settings tab scope. Unrelated to A-F1/A-F2/A-F4. | None. |
| `qc-ai-live-smoke-2026-04-16.md` | AI smoke suite, `Not Approved` pending `OPENAI_API_KEY`. Unrelated. | None. |
| `qc-job-radar-openapi-contract-dev-handoff-2026-04-16.md` | Job Radar contract — Agent 2 (B-F3) territory. | None. |
| `qc-19-screens-and-smoke-gate-2026-04-16.md`, `qc-19-screens-visual-parity-checklist.md` | Visual parity across 19 screens. | None (backend scope). |
| `qc-developer-to-qc-sync-2026-04-17.md`, `qc-fu-followup-pack-intake-2026-04-16.md` | Process notes. | None. |
| `agent-a-report.md`, `agent-a-task-card.md`, `agent-b-report.md`, `agent-b-task-card.md`, `agent-c-report.md`, `agent-c-task-card.md` | Earlier FU-1..3 cycle Task-Card / Report artifacts (Assistant / practice). | None — different scope/cycle. |

**No earlier delivery, rejection, rework, or conditional approval for A-F1 / A-F2 / A-F4 was found in `docs/qc-reports/`.** This is a first-intake submission.

### `docs/qc/` (QC workspace)

| File | Relevance | What I took from it |
|------|-----------|---------------------|
| `docs/qc/README.md` | Workspace index — confirms obligation to cross-scan `docs/qc-reports/` + `docs/qc/` together. | Applied: both locations scanned. |
| `docs/qc/qc-reporting-certification-and-po-communication-spec-v1.0.md` | Canonical QC operating model — verdict vocabulary, prior-report discovery rule, PO escalation. | Applied: structured delivery per §6; QC may map verdict using §6–§10 of that spec. |
| `docs/qc/phase-1/README.md` | Phase 1 QC folder — empty (placeholder). | Confirms **no prior Phase 1 QC report** for billing / practice shell exists here. |
| `docs/qc/phase-2/README.md` | Phase 2 QC folder — empty. | Confirms **no prior Phase 2 QC report** for profile SoT / Skill Lab. |
| `docs/qc/phase-3/README.md` | Phase 3 QC folder — empty. | N/A to this submission. |
| `docs/qc/phase-4/README.md` | Phase 4 QC folder — empty. | Confirms **no prior Phase 4 QC report** for deploy integrity. |
| `docs/qc/modules/README.md` | Optional per-module folder. Empty. | N/A. |

**No prior QC artifacts under `docs/qc/phase-1 | phase-2 | phase-4` cover A-F1 / A-F2 / A-F4.**

### `docs/squad/` (ownership, phase structure, execution rules)

| File | Relevance | What I took from it |
|------|-----------|---------------------|
| `IMPLEMENTATION_EXECUTION_RULES.md` | Binding execution model. | Applied: delivery format §6, mandatory search §4, phase flow §12, hard rules §13. |
| `Agent_1_Foundations_Spec.md` | Agent 1 owned scope. | Implementation checklist cross-referenced — all listed outcomes present in code. |
| `Squad_Workboard.md` | Phase ownership. | Confirms A owns Phase 1 billing, Phase 2 profile, Phase 4 deploy. |
| `squad-abc-qc-certificate-gated-work-split-v1.0.md` | Certificate chain rules. | A-F1 → A-F2 → A-F4 sequence respected in this intake. |
| `Quality_Control_Developer_Spec.md` | QC role. | Used to shape handoff sections. |
| `Product_Owner_Spec.md` | PO gate. | PO coordination items listed in *Blockers* below. |
| `Agent_2_Intelligence_Modules_Spec.md`, `Agent_3_Practice_And_Preferences_Spec.md` | Neighbour agents' scope. | Consumer-side hooks respected — see *Integration Notes*. |
| `README.md` | Squad index. | Cross-linked. |

**No prior review, rejection, rework, or conditional approval for A-F1 / A-F2 / A-F4 was found in `docs/squad/`** — these files define ownership and rules, not verdicts.

### Related scope history beyond QC folders (cross-module notes)

- `docs/features/backend-completion-spec/` — billing engine and profile SoT specs (implementation target for this submission).
- `docs/policies/quality-control-developer-role-spec.md` — integration verdict vocabulary; applied.
- `docs/policies/execution-reporting-standard.md` — report structure; applied.
- `docs/policies/canonical-repo-deploy-lock-policy-v1.0.md` — deploy guards policy; implementation covers the full rule set.

---

## Existing QC Reports Checked

Narrow, explicit answer for the same three scopes:

| Slice | Prior QC verdict exists? | Path / reference | Status carried into this intake |
|-------|---------------------------|------------------|---------------------------------|
| **A-F1** Credits & Billing engine | **No** | `docs/qc-reports/` scanned, `docs/qc/phase-1/` empty. | First intake — no open findings to resolve. |
| **A-F2** Profile as Source of Truth | **No** | `docs/qc-reports/` scanned, `docs/qc/phase-2/` empty. | First intake — no open findings to resolve. |
| **A-F4** Deploy integrity guards | **No** | `docs/qc-reports/` scanned, `docs/qc/phase-4/` empty. | First intake — no open findings to resolve. |

### Certificate chain check (per `squad-abc-qc-certificate-gated-work-split-v1.0.md` §A-table)

| Slice | Prior-cert dependency | Status |
|-------|-----------------------|--------|
| A-F1 | None (own merit) | Ready to certify independently. |
| A-F2 | Requires **`Approved for A-F1`** before A closes A-F2 | Requested in sequence in this same intake. |
| A-F4 | Requires **`Approved for A-F1 + A-F2`** before A closes A-F4 | Requested last. |

**Previously reported issues still open:** none (no prior reports).
**Previously reported issues resolved in this delivery:** none (no prior reports).
**New issues surfaced by self-audit and fixed before handoff:**

- `autoApply.router.addToQueue` (Playwright queue path) previously enforced only a weekly cap, not the profile-driven eligibility gate. Fixed in this intake — same `evaluateAutoApplyEligibility` gate used by `jobs.router.search` and `emailAutoApply.ts` now runs here too (blocked-areas always enforced; full gate when caller supplies `jobFacts`). This closes a gap in the "profile must influence Auto-Apply Eligibility" requirement from [`Agent_1_Foundations_Spec.md`](../squad/Agent_1_Foundations_Spec.md).
- `billing.getAccountState` previously did not expose *Credits Used This Month* as a first-class field (frontend would have had to sum `getUsageHistory` entries). Fixed — `getAccountState` now aggregates `credit_spend_events` since `allowancePeriodStart` and returns `usedThisMonth { fromAllowance, fromCredits, total }` + `allowance.used`.
- Job Radar / employer validation / manual-review surfaces had no single profile-driven entry point for blocked-areas. Fixed — `profile.isEmployerBlocked` exposes the same `isBlockedJob` rule used inside `evaluateAutoApplyEligibility`.
- Growth-plan / roadmap / high-impact-improvements / skill-course-links were persisted but not exposed on a dedicated read endpoint. Fixed — `profile.getGrowthRecommendations` returns them together with the threshold + target-role context so Profile page / Skill Lab render the same source.
- Deploy-guard unit tests ran only locally. Fixed — `.github/workflows/deploy.yml` now runs `canonical-deploy-guards.test.sh` in the `test` job before build/deploy.

---

## Integration Notes

### For Agent 3 (C) — frontend wiring
- Billing: wire `useCreditsStore` to `billing.getAccountState` / `estimateCost` / `approveSpend` / `commitSpend` / `rejectSpend`. Pack purchase: `listCreditPacks` + `createCreditPackPaypalOrder` (redirect to `approveUrl`) + `captureCreditPackPaypalOrder` on return.
- Profile: `profile.getMatchContext` can drive the "why not auto-apply" hints on job cards — consume `eligibility.reason` already supplied by `jobs.search`.

### For Agent 2 (B) — intelligence modules
- Skill Lab / Job Radar scoring: import `getProfileMatchContextByLocalId` + `evaluateAutoApplyEligibility` from `backend/src/services/profileSourceOfTruth.js`. No further backend profile work needed on my side — the helper returns all 11 SoT fields.
- Any new billable feature must be added to `FEATURE_COSTS` + flow through `approveSpend` / `commitSpend`; no private debit paths.

### Cross-cutting
- `autoApply.addToQueue` optional `jobFacts` is backward-compatible: existing callers keep working (blocked-area veto still applies). Agent 3 should pass `jobFacts` where available for full-gate enforcement.
- Deploy guards fail-closed: if any caller writes a new deploy script, they must `source scripts/lib/canonical-deploy-guards.sh` and run the asserts — covered by `canonical-deploy-guards.test.sh` regression suite.

---

## Ready For QC

**Yes** — for all three slices (A-F1, A-F2, A-F4).

Request to QC: per [`squad-abc-qc-certificate-gated-work-split-v1.0.md`](../squad/squad-abc-qc-certificate-gated-work-split-v1.0.md), please issue the certificates in sequence (A-F1 → A-F2 → A-F4). If A-F1 receives `Not Approved`, I will hold A-F2 / A-F4 until A-F1 is re-approved.

## Blockers

**None for implementation.** Open coordination items (not blockers for this intake):

1. **PO confirmation** — monthly allowance per plan (`free=50 / pro=500 / autopilot=2000`), credit pack pricing/labels, and whether a job with `salary: 'above'` target range should remain auto-apply-eligible (current rule: **yes**, only `below` vetoes). Implementation is feature-flag-ready via `creditsConfig.ts` constants.
2. **Agent 3 frontend wiring** is the consumer of this backend; it is out of Agent 1 scope per [`Agent_1_Foundations_Spec.md`](../squad/Agent_1_Foundations_Spec.md) ("Must Not Touch" list). Endpoints ready for consumption: `billing.*`, `profile.getMatchContext`, `profile.getGrowthRecommendations`, `profile.isEmployerBlocked`.
3. ~~CI integration of the deploy-guard test harness~~ — **Done in this intake.** `.github/workflows/deploy.yml` now runs the harness in the `test` job before build/deploy.
