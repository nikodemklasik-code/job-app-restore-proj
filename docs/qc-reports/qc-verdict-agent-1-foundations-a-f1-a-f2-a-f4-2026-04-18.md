# QC Verdict — Agent 1 Foundations (A-F1 / A-F2 / A-F4)

**Date:** 2026-04-18  
**QC reviewer:** Quality Control Developer (squad QC role)  
**Owning agent:** Agent 1 (A) — system foundations  
**Intake under review:** [`agent-1-foundations-a-f1-a-f2-a-f4-ready-for-qc-2026-04-18.md`](./agent-1-foundations-a-f1-a-f2-a-f4-ready-for-qc-2026-04-18.md)  
**Spec:** [`../squad/Agent_1_Foundations_Spec.md`](../squad/Agent_1_Foundations_Spec.md)  
**Execution rules (binding):** [`../squad/IMPLEMENTATION_EXECUTION_RULES.md`](../squad/IMPLEMENTATION_EXECUTION_RULES.md) §4 (search) · §6 (delivery) · §7 (QC search) · §8 (review format) · §9 (verdict vocabulary) · §5a + **Hard Rule 8** (post-verdict)  
**Certificate chain policy:** [`../squad/squad-abc-qc-certificate-gated-work-split-v1.0.md`](../squad/squad-abc-qc-certificate-gated-work-split-v1.0.md)

This is a single QC document that records **three distinct verdicts** in the sequence requested by the intake (A-F1 → A-F2 → A-F4). Each sub-verdict is self-contained and satisfies §8: *QC Scope Reviewed → Previous QC Report Checked → Previously Reported Issues Resolved / Still Open → New Issues Found → Functional / Product / Risk Validation → QC Verdict → Integration Status → Escalation → Required Next Action (with Mandatory first line)*.

---

## QC Pre-Flight (common to all three slices)

### Repo search performed (§4 + §7 + Hard Rule 2)

QC searched the three canonical locations **before** writing this verdict:

- `docs/qc-reports/` — every file scanned for prior A-F1 / A-F2 / A-F4 verdicts.
- `docs/qc/` — `phase-1/`, `phase-2/`, `phase-4/`, `modules/` READMEs confirmed as placeholder-only (no prior verdict artifacts for these three slices).
- `docs/squad/` — `Agent_1_Foundations_Spec.md`, `Squad_Workboard.md`, `squad-abc-qc-certificate-gated-work-split-v1.0.md`, `IMPLEMENTATION_EXECUTION_RULES.md` read to determine owned scope and certificate dependencies.

**Result:** No prior **verdict** exists for A-F1 / A-F2 / A-F4. Only the 2026-04-18 intake ("Ready For QC") is present. Agent claim in intake *(“first intake submission”)* is **confirmed**.

### Verification commands executed by QC (re-run evidence, not trust)

```bash
cd /Users/nikodem/job-app-restore/proj/backend && npm test
cd /Users/nikodem/job-app-restore/proj && bash scripts/tests/canonical-deploy-guards.test.sh
```

**Observed results (this session, not self-reported by agent):**

- `npm test` → `Test Files 25 passed (25) · Tests 115 passed (115)` — matches intake §*Tests Added Or Updated*.
- `scripts/tests/canonical-deploy-guards.test.sh` → `passed: 11 · failed: 0` — matches intake.
- `.github/workflows/deploy.yml` — `test` job runs both suites **before** `build` and `deploy` jobs; confirmed by file read. Deploy is mechanically blocked if either suite regresses.

### Cross-cutting open finding recorded against downstream slices (not against A-F1)

Direct debit in `backend/src/trpc/routers/coach.router.ts` (lines 62–63: `db.update(subscriptions).set({ credits: sql\`...\` })`) bypasses the engine. Additional feature keys in `creditsConfig.ts` (`interview_*`, `negotiation_*`, `warmup_*`, `skill_lab_*`, `job_radar_*`, `ai_analysis_*`) exist but are **not yet wired** to `approveSpend` / `commitSpend` — verified by ripgrep (`backend/src/trpc/routers/billing.router.ts`, `backend/src/trpc/routers/legalHub.router.ts`, and `backend/src/services/creditsBilling.ts` are the only files referencing the engine entry points).

Per [`Agent_1_Foundations_Spec.md`](../squad/Agent_1_Foundations_Spec.md) *Must Not Touch*: practice-module routes (`coach`, `interview`, `negotiation`, `warmup`) are **Agent 3** ownership; Skill Lab + Job Radar AI cost surfaces are **Agent 2** ownership. This finding is therefore **not a defect of A-F1** and **does not block** its integration status. It is captured here so that:

- **Agent 3's C-F1** (Practice billing wiring) cannot reach *Approved For Integration* until `coach.router` is migrated to `approveSpend` / `commitSpend` and all four practice routes issue `credit_spend_events` via the engine.
- **Agent 2's B-F2 / B-F3** cannot reach *Approved For Integration* for their AI-cost paths until Skill Lab deep analysis and Job Radar deep search debit through the engine.

This paragraph is the authoritative cross-agent carry for the next QC pass on B/C slices.

---

## Sub-Verdict 1 — A-F1 Credits And Billing Engine

### QC Scope Reviewed

- Backend billing engine (`backend/src/services/creditsBilling.ts` + `creditsBilling.policy.ts`).
- Feature catalog and pricing configuration (`backend/src/services/creditsConfig.ts` — `FEATURE_KEYS`, `FEATURE_COSTS`, `MONTHLY_ALLOWANCE_BY_PLAN`, `CREDIT_PACKS`).
- Drizzle schema: `subscriptions.allowanceLimit` / `allowanceRemaining` / `allowancePeriodStart`; tables `credit_spend_events`, `credit_pack_purchases` (`backend/src/db/schema.ts` lines 128–175).
- tRPC surface: `billing.router.ts` — `getAccountState`, `estimateCost`, `approveSpend`, `commitSpend`, `rejectSpend`, `getUsageHistory`, `listCreditPacks`, `createCreditPackPaypalOrder`, `captureCreditPackPaypalOrder`.
- Tests: `backend/src/services/__tests__/creditsBilling.spec.ts` (27 tests).

### Previous QC Report Checked: No

### Previous QC Report Path / Reference

None. First intake. `docs/qc/phase-1/README.md` is a placeholder; no prior verdict.

### Previously Reported Issues Resolved

None (no prior report).

### Previously Reported Issues Still Open

None (no prior report).

### New Issues Found

Scoped strictly to Agent 1's owned surface (engine + schema + billing router):

- **None that block A-F1.** The engine is self-consistent, idempotent on PayPal capture (`providerRef` unique constraint in `credit_pack_purchases`), enforces `actualCost ≤ approvedMaxCost`, debits allowance-first, resets lazily via `shouldResetAllowance` + `startOfMonthUTC`, and records every debit/refund in `credit_spend_events`. `billing.getAccountState` returns `usedThisMonth { fromAllowance, fromCredits, total }` + `allowance.used` as required for frontend rendering of *Credits Used This Month*.
- **Carry (not a defect of A-F1):** the cross-cutting "hidden spend" finding in the QC Pre-Flight section above. Engine is ready; consumer routes in B/C ownership must migrate.

### Functional Validation

- **Monthly Free Allowance** — `allowanceLimit` / `allowanceRemaining` / `allowancePeriodStart` persisted; lazy reset via `ensureSubscriptionWithFreshAllowance` + `shouldResetAllowance`; `startOfMonthUTC` is pure and tested. *No rollover* invariant holds — reset overwrites.
- **Credit Balance** — `subscriptions.credits` updated only through the engine (engine-side writes traceable; see cross-cutting note for external writes).
- **Credit Packs** — `CREDIT_PACKS` catalog present; `listCreditPacks` tRPC procedure; `createCreditPackPaypalOrder` → `captureCreditPackPaypalOrder` with idempotent grant.
- **Credit Spend Events** — `credit_spend_events` written on approve, commit, reject, refund, allowance reset, and pack grant (per `creditsBilling.ts` call sites).
- **Fixed-Cost Actions** — debit-on-approve covered by policy test matrix.
- **Estimated-Cost Actions** — `approvedMaxCost` enforced by `assertWithinApprovedMax`; `commitSpend` rejects if `actualCost > approvedMaxCost`; `rejectSpend` refunds back to the original bucket (allowance or paid credits) per `planDebit` symmetry.
- **Approval Before Spend** — `approveSpend` throws `BillingError("INSUFFICIENT_FUNDS")` when no plan fits; reflected in tests.
- **Usage History** — `getUsageHistory` returns paginated events (latest first).
- **UI support surface** — `getAccountState` contract satisfies all UI rendering needs listed in spec (*Current Credit Balance, Monthly Free Allowance, Credits Used This Month, Buy Credits, Usage History, Estimated Cost Rules*).

All 27 unit tests re-run by QC pass in this session.

### Product Validation

- Pricing table (`FEATURE_COSTS`) aligns with the module map in `docs/features/backend-completion-spec/credits-billing-engine-v1.0.md`.
- Plan allowance defaults (`free=50 / pro=500 / autopilot=2000`) are parameterised via `MONTHLY_ALLOWANCE_BY_PLAN`, so PO adjustment is a one-constant change.
- PayPal flow exposes `approveUrl` + `orderId` (frontend-safe); no secret leakage in the response shape.
- Cost honesty for features *owned by Agent 1* (nothing in the billing router spends silently) — **pass**.
- Cost honesty system-wide — **open** pending B/C migrations (carry finding).

### Risk Validation

- **Double-grant risk** on PayPal capture — mitigated by `providerRef` unique constraint + early-return via `alreadyApplied`.
- **Negative-balance risk** — `planDebit` refuses to over-debit; engine rejects instead of going negative.
- **Timezone drift on monthly reset** — `startOfMonthUTC` fixed to UTC; tested.
- **Frontend math drift** — removed by moving aggregation server-side into `getAccountState.usedThisMonth`.
- **Silent debit paths in consumers** — still present (see carry). Does not affect A-F1's own surface.

### QC Verdict

**Approved**

### Integration Status

**Approved For Integration**

### Escalation To Product Owner: Yes / No

**Yes — narrow confirmation ask, not a block.**

PO to confirm (intake item 1): `free=50 / pro=500 / autopilot=2000`, credit-pack pricing/labels, and the "salary above target = still eligible" rule. These are constant-level decisions; not a blocker because engine is parameterised.

### Required Next Action

- **Mandatory first line (§5a / Hard Rule 8):**  
  `Owning agent: required work is executed in the repository, not in chat instead of implementation — see docs/squad/IMPLEMENTATION_EXECUTION_RULES.md §5a and Hard Rule 8.`  
  Acceptable agent responses: repository changes plus a fresh **§6** delivery report, **or** **one** documented **Blocker** in that report.
- **Agent 1 next steps:** none required to integrate A-F1. Proceed to enable Agent 3 / Agent 2 consumption. If Agent 3's C-F1 resubmission needs a helper to streamline migration (e.g. a thin `requireSpendApproval(feature)` tRPC middleware), Agent 1 may ship it under a fresh §6 report; otherwise no code delta is owed here.
- **Agent 3 (C-F1, Practice billing wiring) — downstream condition:** migrate `backend/src/trpc/routers/coach.router.ts` (lines 62–63), plus `interview` / `negotiation` / `warmup` route families, to call `approveSpend` / `commitSpend` per `FEATURE_COSTS`. No C-F1 approval without this.
- **Agent 2 (B-F2 / B-F3, AI cost surfaces) — downstream condition:** route Skill Lab `gap_analysis` / `course_suggest` and Job Radar deep-search cost paths through the engine. No B-F2 / B-F3 approval on AI cost surfaces without this.
- **PO confirmation items:** plan allowances + credit-pack pricing/labels + salary-above eligibility rule. Ship as a PO note in `docs/qc-reports/` or as a `docs/squad/Product_Owner_Spec.md`-linked decision.

---

## Sub-Verdict 2 — A-F2 Profile As Source Of Truth

### QC Scope Reviewed

- Policy module: `backend/src/services/profileSourceOfTruth.policy.ts` — `meetsAutoApplyThreshold`, `isSeniorityMatch`, `classifySalaryFit`, `scoreWorkValuesAlignment`, `isBlockedJob`, `evaluateAutoApplyEligibility`.
- DB-bound service: `backend/src/services/profileSourceOfTruth.ts` — `getProfileMatchContextByLocalId`, `getProfileMatchContext`.
- tRPC: `backend/src/trpc/routers/profile.router.ts` — procedures `getMatchContext` (line 290), `getGrowthRecommendations` (line 301), `isEmployerBlocked` (line 333). All three confirmed present in this session.
- Downstream wiring: `backend/src/trpc/routers/jobs.router.ts` (per-listing eligibility annotation), `backend/src/services/emailAutoApply.ts` (full gate), `backend/src/trpc/routers/autoApply.router.ts` `addToQueue` (full gate with optional `jobFacts`).
- Tests: `backend/src/services/__tests__/profileSourceOfTruth.spec.ts` (23 tests).

### Previous QC Report Checked: No

### Previous QC Report Path / Reference

None. First intake. `docs/qc/phase-2/README.md` is a placeholder.

### Previously Reported Issues Resolved

None.

### Previously Reported Issues Still Open

None.

### New Issues Found

- **None that block A-F2.** All eleven profile outcomes required by the spec are persisted and exposed; all seven downstream effects are wired. The autoApply queue path now shares the same gate as email auto-apply and jobs search (one implementation, one behaviour).

### Functional Validation

- **Profile fields** — work values, auto-apply threshold, growth plan, roadmap, skills-course relationships, target role, target seniority, target salary range, practice areas, blocked areas, high-impact improvements — all eleven persisted and exposed via `getMatchContext` / `getGrowthRecommendations`.
- **Pure policy** — six helper functions, deterministic, tested across 23 cases covering: threshold met/not-met, seniority permissive match, salary bucketing (`below / within / above`), work-values alignment scoring, blocked-area veto on title OR company OR tag, end-to-end `evaluateAutoApplyEligibility` priority order (blocked > threshold > seniority > salary).
- **Downstream effects:**
  - *Jobs search* — listings enriched with `{ canAutoApply, reason, thresholdUsed, workValueAlignment, salaryFit }`.
  - *Email auto-apply* — inline `minFitScore` replaced with `evaluateAutoApplyEligibility`.
  - *Auto-apply queue* (Playwright path) — same gate; optional `jobFacts` input is backward-compatible.
  - *Employer validation / manual review* — `profile.isEmployerBlocked` consolidates blocked-areas logic; no per-surface re-implementation.
  - *Skill Lab / Growth* — `profile.getGrowthRecommendations` provides the single source of truth for Profile page / Dashboard / Skill Lab growth surfaces.
- **Definition Of Done, spec line 176** ("no hidden spend or **dead profile logic** remains") — profile side passes: every stored field drives a downstream effect.

### Product Validation

- Salary rule semantics (intake §Blockers item 1): current implementation treats `salary: 'above'` as eligible. This is the correct product default but PO must confirm — carried forward with A-F1 escalation, not a block.
- Blocked-areas rule is symmetric across all surfaces (email / queue / radar / manual review), preventing the common "profile says block but feature ignores" product bug.
- `evaluateAutoApplyEligibility` returns a human-readable `reason` code — supports frontend "why not auto-apply" hints without extra round-trips.

### Risk Validation

- **Partial consumer migration risk** — mitigated by keeping `jobFacts` optional in `addToQueue`; legacy callers still get blocked-area veto at minimum.
- **Profile schema churn** — new fields are additive; no destructive migration.
- **False positives on blocked-areas** — helpers use word-boundary + case-insensitive match; covered by spec tests.

### QC Verdict

**Approved**

### Integration Status

**Approved For Integration**

### Escalation To Product Owner: Yes / No

**Yes — bundled with A-F1** (salary-above eligibility rule). Not a block.

### Required Next Action

- **Mandatory first line (§5a / Hard Rule 8):**  
  `Owning agent: required work is executed in the repository, not in chat instead of implementation — see docs/squad/IMPLEMENTATION_EXECUTION_RULES.md §5a and Hard Rule 8.`  
  Acceptable agent responses: repository changes plus a fresh **§6** delivery report, **or** **one** documented **Blocker** in that report.
- **Agent 1 next steps:** none required. If PO decides salary-above is *not* eligible, flip the `classifySalaryFit → eligibility` mapping in `profileSourceOfTruth.policy.ts` (one-line change) and resubmit a §6 delta report.
- **Agent 2 (B-F2 Skill Lab core):** certificate chain unblocked — may import `getProfileMatchContextByLocalId` + `evaluateAutoApplyEligibility` directly. No further A-F2 backend work needed.
- **Agent 3 (C-F1 / C-F2 frontend):** may consume `profile.getMatchContext` + `profile.getGrowthRecommendations` + `profile.isEmployerBlocked` + `jobs.search.eligibility` without additional A-F2 changes.

---

## Sub-Verdict 3 — A-F4 Deploy Integrity Guards

### QC Scope Reviewed

- `.canonical-repo-key` at repo root (contents: `PROJECT_KEY`, `CANONICAL_REPO_PATH`, `CANONICAL_DEPLOY_TARGET`, `CANONICAL_DEPLOY_HOST`, `ALLOWED_DEPLOY_BRANCH`).
- `scripts/lib/canonical-deploy-guards.sh` — pure guard library.
- Integrated callers: `scripts/deploy.sh`, `scripts/deploy-safe.sh`, `scripts/ack-deploy.sh`, `scripts/backup-safe.sh`, `scripts/ci-assert-canonical-deploy.sh`, `scripts/verify-canonical-repo.sh`, `scripts/rolling-workspace-backup.sh`.
- `infra/deploy-target-key.example` — remote marker template.
- Test harness: `scripts/tests/canonical-deploy-guards.test.sh` — 11 tests.
- CI wiring: `.github/workflows/deploy.yml` — `test` job runs both `npm test -w multivohub-jobapp-backend` and `bash scripts/tests/canonical-deploy-guards.test.sh`; `build` job depends on `test`; `deploy` job depends on `build` + runs `scripts/ci-assert-canonical-deploy.sh` on the runner before SSH.

### Previous QC Report Checked: No

### Previous QC Report Path / Reference

None. First intake. `docs/qc/phase-4/README.md` is a placeholder.

### Previously Reported Issues Resolved

None.

### Previously Reported Issues Still Open

None.

### New Issues Found

- **None.** Coverage matches the spec's "Required Outcomes" and "Required Rules" lists completely, and the harness exercises both success and failure paths of the guard helpers.

### Functional Validation

Spec *Required Outcomes* × repo state:

- `.canonical-repo-key` → present, committed.
- Remote deploy marker → `infra/deploy-target-key.example` + `canonical_load_remote_targets` asserts presence + non-empty values.
- Local canonical path validation → `canonical_assert_local_repo_path_matches` (escape hatch `DEPLOY_SKIP_LOCAL_REPO_PATH=1` for intentional copies).
- Remote canonical path validation → `canonical_assert_remote_base_matches` (escape hatch `DEPLOY_ALLOW_NONCANONICAL_REMOTE=1`).
- Deploy target SSH host validation → `canonical_assert_ssh_host_matches` (exercised by two test cases: accept correct, reject wrong).
- Deploy target domain validation → `canonical_assert_domain_matches` (DNS-resolving guard; parallel to host assert).
- DNS mismatch guard → `canonical_assert_dns_resolves_to_host` (present in library; integrated in `deploy-safe.sh`).
- Wrong-folder deploy block → covered by local + remote path asserts + `canonical_assert_repo_key_present` which fails when `PROJECT_KEY` is wrong (tested in harness).

Spec *Required Rules* (fail-closed conditions):

- Non-canonical cwd → fail (tested by "`canonical_assert_repo_key_present` fails when marker is missing" + local-path assert in script).
- Repo marker missing → fail (tested directly).
- Remote target path wrong → fail (escape hatch must be explicit env var).
- Remote marker missing → fail (tested by "`canonical_load_remote_targets` fails when remote settings are empty").
- Host / domain mismatch → fail (host mismatch tested directly).
- Copied folder tries to deploy → fail (covered by combined local-path + `PROJECT_KEY` assert).

**CI evidence:** deploy.yml `test` job blocks `build` and `deploy` if harness regresses — verified by reading the workflow file in this session.

### Product Validation

- The guards are parameterised via `.canonical-repo-key`, so swapping the production VPS or domain is a marker-only change — no code edit needed. This aligns with the canonical-repo policy under `docs/policies/canonical-repo-deploy-lock-policy-v1.0.md`.
- Escape hatches (`DEPLOY_SKIP_LOCAL_REPO_PATH`, `DEPLOY_ALLOW_NONCANONICAL_REMOTE`, `DEPLOY_SKIP_BRANCH_GUARD`) are explicit env-var opt-ins — cannot be silently enabled by bad config.
- Fail-closed default aligned with "Mandatory Working Mode" of Agent 1's spec.

### Risk Validation

- **Deploy of a stale fork / Downloads copy** → blocked by local-path + `PROJECT_KEY` asserts (two asserts must both be bypassed to deploy from a copy).
- **Deploy to wrong VPS** → blocked by SSH host + domain + DNS asserts (three asserts).
- **Deploy from the wrong branch** → guarded by `ALLOWED_DEPLOY_BRANCH=claude/improvements` + workflow `on.push.branches` restriction.
- **CI regression of the guard library** → caught by harness before `build` job starts; deploy cannot reach SSH.

### QC Verdict

**Approved**

### Integration Status

**Approved For Integration**

### Escalation To Product Owner: Yes / No

**No.**

### Required Next Action

- **Mandatory first line (§5a / Hard Rule 8):**  
  `Owning agent: required work is executed in the repository, not in chat instead of implementation — see docs/squad/IMPLEMENTATION_EXECUTION_RULES.md §5a and Hard Rule 8.`  
  Acceptable agent responses: repository changes plus a fresh **§6** delivery report, **or** **one** documented **Blocker** in that report.
- **Agent 1 next steps:** none. A-F4 is integration-ready.
- **Operational reminder (not a defect):** the first VPS deploy after this verdict must confirm that `${CANONICAL_REMOTE_BASE}/.deploy-target-key` is populated on the VPS per `infra/deploy-target-key.example`. If it is not, `canonical_load_remote_targets` will fail — which is the intended fail-closed behaviour. This is a one-time server setup step recorded in `CLAUDE.md`.

---

## Summary Table (for workboard echo)

| Slice | QC Verdict | Integration Status | PO Escalation | Certificate chain ready for consumers |
|-------|------------|--------------------|---------------|---------------------------------------|
| **A-F1** Credits & Billing Engine | **Approved** | **Approved For Integration** | Yes (narrow: plan allowances + pack pricing + salary-above) | Unblocks **B-F1 AI-cost wiring** and **C-F1 Practice billing wiring** — both carry a downstream condition: *all product debits must flow through `approveSpend` / `commitSpend`; no direct `subscriptions.credits` writes outside `billing.router` + engine*. |
| **A-F2** Profile As Source Of Truth | **Approved** | **Approved For Integration** | Bundled with A-F1 | Unblocks **B-F2 Skill Lab core**, **C-F2 Settings consent wiring**, and profile-driven hints on job cards. |
| **A-F4** Deploy Integrity Guards | **Approved** | **Approved For Integration** | No | Unblocks phase-4 polish work (B/C) and authorises deploys through the self-hosted pipeline. |

## Hard Rule cross-check

- **Hard Rule 7** (scope closed only by a paired §6 agent report + §8 QC review): satisfied — the agent's 2026-04-18 §6 intake plus this §8 review close A-F1, A-F2, A-F4.
- **Hard Rule 2** (QC must actively search all three canonical repo locations): satisfied — scan log above.
- **Hard Rule 8 / §5a** (post-verdict behaviour): recorded in Required Next Action mandatory first line for every sub-verdict. Agent 1's next move, if any, is code + a fresh §6 report, not chat.
