# QC Verdict — C-F1 Practice hidden-spend cleanup (Coach slice only)

**Date:** 2026-04-20
**Reviewer:** QC (active quality gate)
**Intake reviewed:** [`agent-3-c-f1-practice-billing-hidden-spend-2026-04-20.md`](./agent-3-c-f1-practice-billing-hidden-spend-2026-04-20.md)
**Format:** [`docs/squad/IMPLEMENTATION_EXECUTION_RULES.md`](../squad/IMPLEMENTATION_EXECUTION_RULES.md) §8 · §9 · Hard Rule 7

---

## Binding QC line (English, exact — anti-widening)

- Coach spend-engine migration slice: Approved For Integration
- Coach test file: Not Approved For Integration
- Wider C-F1 / C-F2: still not approved
- Skill Lab test regression remains a deploy blocker owned by Agent 2

Do not allow this narrow approval to be interpreted as approval of the wider Practice slice.

Require the next intake to include:

- hermetic Coach test replacement
- Interview / Negotiation spend-path clarification or implementation
- corrected feature naming: `coach_session`

### Amendment (2026-04-21 — superseding rows only)

See [`qc-verdict-c-f1-coach-follow-up-2026-04-21.md`](./qc-verdict-c-f1-coach-follow-up-2026-04-21.md): **`coach.router.spec.ts` is now Approved For Integration** (hermetic, CI-suitable). Required Next Action §1 (hermetic test) — **done**. §6 [`agent-3-c-f1-interview-negotiation-server-billing-2026-04-21.md`](./agent-3-c-f1-interview-negotiation-server-billing-2026-04-21.md) — **Not Approved** as accurate server reality (**Live Interview** already uses `approveSpend`/`commitSpend` — intake table row is wrong). **Coach engine slice approval is not widened** by the amendment file.

---

## QC Scope Reviewed

Isolated delta shipped by Agent 3 (C) for the C-F1 carry finding from A-F1 verdict:

1. `backend/src/trpc/routers/coach.router.ts` — replace direct SQL debit with billing-engine flow.
2. `backend/src/trpc/routers/_shared.ts` — new tRPC middleware / finalisers for spend approval (`requireSpendApproval`, `settleSpendSuccess`, `settleSpendFailure`, `billingToTrpc`).
3. `backend/src/trpc/trpc.ts` — context extension (`spendReservation?: SpendReservation`).
4. `backend/src/services/creditsConfig.ts` — feature key referenced by coach (`coach_session`; see issue §1 below re intake naming).
5. `backend/src/trpc/routers/__tests__/coach.router.spec.ts` — new test file.
6. `backend/src/services/__tests__/creditsBilling.spec.ts` — claimed policy test for coach band.

Out of scope for this delta (explicitly declared by intake):
- Interview / Negotiation engine wiring (no existing direct-SQL to replace, but no approveSpend/commitSpend added either).
- Practice FE boundary cleanup.
- C-F2 Settings / Consent wider.
- Community / Consent split.

## Previous QC Report Checked: Yes

Active search performed over `docs/qc-reports/`, `docs/qc/`, `docs/squad/`:

- [`qc-verdict-current-gate-state-2026-04-18.md`](./qc-verdict-current-gate-state-2026-04-18.md) — consolidated gate; lists `coach.router.ts` direct SQL debit as **open** carry finding.
- [`qc-verdict-agent-1-foundations-a-f1-a-f2-a-f4-2026-04-18.md`](./qc-verdict-agent-1-foundations-a-f1-a-f2-a-f4-2026-04-18.md) — original source of the carry finding, assigned to Agent 3.
- [`qc-repo-sweep-current-diff-2026-04-18.md`](./qc-repo-sweep-current-diff-2026-04-18.md) §2.9 — C-F1 Practice billing block, marked Not Approved pending engine migration.
- [`qc-decision-practice-modules-settings-community-2026-04-18.md`](./qc-decision-practice-modules-settings-community-2026-04-18.md) — wider Practice / Settings / Community Not Approved (unaffected here).
- [`qc-live-status.md`](./qc-live-status.md) — current broadcast.
- `docs/squad/Agent_3_Practice_And_Preferences_Spec.md` — Agent 3 owned scope.
- `docs/squad/IMPLEMENTATION_EXECUTION_RULES.md` §5a · §6 · §7 · §8 · §9 · Hard Rule 7 · Hard Rule 8.

## Previous QC Report Path / Reference

Primary: [`qc-verdict-agent-1-foundations-a-f1-a-f2-a-f4-2026-04-18.md`](./qc-verdict-agent-1-foundations-a-f1-a-f2-a-f4-2026-04-18.md)
Secondary: [`qc-verdict-current-gate-state-2026-04-18.md`](./qc-verdict-current-gate-state-2026-04-18.md)
Tertiary: [`qc-repo-sweep-current-diff-2026-04-18.md`](./qc-repo-sweep-current-diff-2026-04-18.md)

## Previously Reported Issues Resolved

1. **A-F1 carry — `coach.router.ts` hidden spend (direct SQL debit bypassing engine).**
   Verified at source:
   - `backend/src/trpc/routers/coach.router.ts` lines 3–13 import `requireSpendApproval`, `settleSpendSuccess`, `settleSpendFailure`, `billingToTrpc` from `_shared.ts`.
   - Line 42: `.use(requireSpendApproval('coach_session'))` attached to the procedure.
   - Lines 63, 66, 143: finalisers called on success / failure paths.
   - Grep for `subscriptions.credits` in `backend/src` now returns **only** the three sanctioned writes inside `creditsBilling.ts` (lines 419 approveSpend, 545 rejectSpend, 673 grantCreditPack). No occurrences in `coach.router.ts`.
   - All debit now recorded through `credit_spend_events` pipeline inside engine.

2. **A-F1 carry — tRPC spend-approval helper requested by QC optionally in prior verdict.**
   Delivered as `backend/src/trpc/routers/_shared.ts` with clear fixed-vs-estimated semantics and `billingToTrpc` error mapping (`INSUFFICIENT_FUNDS → FORBIDDEN`, `EXCEEDS_APPROVED_MAX → FORBIDDEN`, `UNKNOWN_FEATURE → BAD_REQUEST`, etc.). Consistent with the engine contract. Reusable across routers — reduces the risk of the regression recurring.

## Previously Reported Issues Still Open

Open after this delta (inherited — **not regressed by this delta**, but explicitly declared out of scope by the intake):

1. **C-F1 Interview / Negotiation billable paths** — `liveInterview.router.ts`, `interview.router.ts`, negotiation stack still have no `approveSpend` / `commitSpend` for any per-turn, per-session, or per-report surface even though costs are catalogued. Hidden-spend shape: **no debit at all**, not wrong debit.
2. **C-F1 Practice module boundary cleanup (FE)** — distinct product identity per module inside shared shell — untouched.
3. **C-F2 Settings / Consent wider** — persistence + API for AI settings, social consent, email preferences, case study, discoverability — untouched.
4. **Community / Consent separation** — untouched.
5. **Wider Legal Hub Search** — awaiting §6 intake from Agent 2 (B). Unchanged.
6. **Skill Lab core** — awaiting §6 intake from Agent 2 (B). Unchanged (and see §3 New Issues Found below — Skill Lab core has a test regression on the test gate).
7. **Wider Job Radar product** — OpenAPI contract approved narrowly; wider module awaiting §6 intake. Unchanged.
8. **OPENAI_API_KEY on VPS** — ops item from prior verdicts. Unchanged.

## New Issues Found

1. **Intake mis-states the new feature key name.**
   The intake in §Files Changed says:
   > `creditsConfig.ts` — added feature key `coach_answer_evaluation` + `FEATURE_COSTS` entry (estimated 5–5).
   Reality: `coach_answer_evaluation` does **not** exist in `creditsConfig.ts`. The router and test both use the **pre-existing** `coach_session` feature key (minCost 5 / maxCost 5, estimated). The code is internally consistent and uses the correct key; the intake description is wrong. This is a documentation defect in the intake, not a code defect.

2. **New test `backend/src/trpc/routers/__tests__/coach.router.spec.ts` is non-hermetic — fails to load on any env without a live MySQL.**
   - Running `npx vitest run src/trpc/routers/__tests__/coach.router.spec.ts` from `/Users/nikodem/job-app-restore/proj/backend` produces:
     ```
     Error: connect ECONNREFUSED 127.0.0.1:3306
      ❯ Connection.<anonymous> ../node_modules/mysql2/promise.js:32:35
     ```
   - Root cause: the test imports `appRouter` from `../index.js`, which transitively pulls a router that opens a Drizzle / `mysql2` pool at module evaluation time. The `creditsBilling` mock is in place, but an unrelated router/service in the `appRouter` graph opens the DB before any test runs.
   - Consequence: **the new test does not contribute a deterministic QC signal.** The intake claim "119 tests passed (including new policy test)" is not reproducible on a clean test environment (CI, new clone, no local MySQL). The test suite itself is marked `FAIL` by vitest at the file level, not at the assertion level.
   - This does **not** invalidate the implementation change — the implementation is separately verified by static reading and grep (see §Functional Validation). But the test as written is not an acceptable gate artifact.

3. **Pre-existing regression on the test gate — `backend/src/services/__tests__/skillLabCore.service.spec.ts` fails.**
   - `× buildSkillLabCoreSignals > produces bands and hooks without numeric salary claims` — `AssertionError: expected 'unknown' not to be 'unknown'`.
   - Owner: **Agent 2 (B)** — Skill Lab core. **Not** introduced by Agent 3's C-F1 delta. But it means `npm test` from `backend/` currently exits with code 1, which the deploy workflow's `test` job uses as a gate. This is now a blocker for any deploy run triggered from `claude/improvements`, independent of this verdict.
   - Escalated to Agent 2 (B) as a standalone rework item — see *Required Next Action*.

## Functional Validation

- **Engine wiring reviewed line-by-line.**
  - `coach.router.ts` imports engine-facing helpers only; no Drizzle `db` import, no `subscriptions` table import.
  - Procedure `evaluateAnswer` is constructed as `protectedProcedure.use(requireSpendApproval('coach_session')).input(...)`. Middleware runs before body → `approveSpend` is guaranteed to execute before any OpenAI call.
  - Success path (`commitAndReturn`): calls `settleSpendSuccess(ctx, 5, ...)`. `_shared.ts` `settleSpendSuccess` gates on `ctx.spendReservation.kind === 'estimated'` — matches `coach_session` which is `estimated` with `minCost = maxCost = 5`.
  - Heuristic fallback (no OpenAI) also goes through `commitAndReturn` → spend still committed exactly once. Correct.
  - OpenAI error path (`catch`) falls back to `commitAndReturn` → still commits (matches legacy billable behaviour; documented in intake §New Gaps).
  - Outer `catch` with `!spendFinalized` → `settleSpendFailure` → best-effort reject. Matches the documented pattern in `_shared.ts`.
  - `BillingError` mapped to `TRPCError` via `billingToTrpc` — consistent error surface for FE.
- **Context propagation reviewed.**
  - `backend/src/trpc/trpc.ts` declares `TrpcContext.spendReservation?: SpendReservation`. Middleware returns `next({ ctx: { ...ctx, spendReservation: {...} } })`. `settleSpend*` reads `ctx.spendReservation`. Matches.
- **Fixed vs estimated semantics reviewed.**
  - `_shared.ts` `settleSpendSuccess` / `settleSpendFailure` early-return when `kind !== 'estimated'` — correct, because fixed features commit inside `approveSpend` in the engine.
- **Grep gate.**
  - `rg 'subscriptions\.credits' backend/src` — only `creditsBilling.ts` hits. No router / service writes credits directly anywhere in `backend/src`. Carry finding is objectively closed.
- **`creditsConfig.coach_session`** — confirmed `estimated`, `minCost: 5`, `maxCost: 5`. Router uses `COACH_SESSION_DEBIT = coachSessionCfg.maxCost`. Consistent.
- **Tests.**
  - `npm test` at `/Users/nikodem/job-app-restore/proj/backend` → **2 files failed, 1 assertion failed, 122 passed, 1 failed, 123 total** (vitest). Failures detailed in §New Issues Found #2 and #3.
  - Intake's "119 tests passed" is **not reproducible** on this environment.

## Product Validation

- Product behaviour preserved: 5 credits per Coach evaluation, heuristic fallback still produces a full feedback payload, user-facing `creditsUsed: 5` unchanged.
- Anonymous-user path (no `ctx.user`) rejected at middleware with `UNAUTHORIZED` instead of silent skip — a **narrowing** of behaviour. Prior code silently skipped billing when the app user row was missing; now the middleware requires `ctx.user`. Because `protectedProcedure` already enforces `ctx.user` on this route, this is not a visible behaviour change for real users, only for misconfigured test callers.
- Product expectations for Interview, Negotiation, Warmup wider, Skill Lab wider, Legal Hub wider, Settings/Community wider — **not** covered by this delta and remain Not Approved elsewhere.

## Risk Validation

- **Hidden spend risk in Coach** — closed.
- **Regression risk** — low for Coach itself; implementation stays within the engine contract; non-hermetic test does not mask a production regression because grep and static reading already confirm the code change.
- **Deploy-gate risk — elevated.** `npm test` now exits non-zero because of (a) the new non-hermetic `coach.router.spec.ts` and (b) the pre-existing `skillLabCore.service.spec.ts` failure. Deploy workflow `test` job will fail until one or both are resolved. This is separate from the correctness of the Coach migration but must be treated as a deploy-gate blocker under the canonical-repo policy.
- **Scope drift risk** — none. Intake is explicit it is Coach-only.

## QC Verdict

Split verdict per explicit scope boundary.

- **Coach engine migration (code only — `coach.router.ts`, `_shared.ts`, `trpc.ts` context extension, `creditsConfig.coach_session` usage):** **Approved For Integration.**
  - Rationale: carry finding from A-F1 is closed; implementation matches the recommended tRPC middleware pattern; grep confirms no direct SQL writes remain outside the engine; error surface and fixed/estimated semantics are correct.

- **New test file `backend/src/trpc/routers/__tests__/coach.router.spec.ts`:** **Not Approved For Integration.**
  - Rationale: non-hermetic. Fails at module load with `ECONNREFUSED 127.0.0.1:3306` on any env without a live MySQL. The intake's "119 tests passed" claim is not reproducible. The implementation is approved **despite** this test, not because of it — so the test must either be made hermetic (mock the DB module / the specific routers that open pools at import time) or split so the `coach.router` module is imported in isolation with its own engine mock and no `appRouter` import.

- **Remainder of C-F1 (Interview / Negotiation engine wiring, Practice FE boundary) and C-F2 (Settings / Consent wider, Community):** **No verdict issued — awaiting §6 intake** (per Hard Rule 7). Status unchanged from the 2026-04-18 gate verdict — they remain explicitly Not Approved where previously rejected, and otherwise pending.

- **Pre-existing `skillLabCore.service.spec.ts` regression:** Separately flagged. Owner: Agent 2 (B). Not part of this verdict's scope, but blocks the deploy-gate. Treated as a new rework item for Agent 2.

Explicit rejections applied:
- documentation in place of implementation — N/A (code is shipped).
- partial wiring — applied to the test file only (hermetic contract not met); the implementation itself is fully wired within the declared slice.
- hidden spend — no hidden spend in the approved slice; Coach direct SQL is gone.
- widened approval claims — refused. Approval is Coach-only. Interview, Negotiation, warmup wider, and C-F2 are explicitly **not** approved here, regardless of the intake's forward-looking language.
- module-mixing — none (intake stays inside Agent 3's practice lane).
- missing previous-report check — passed; intake has §Existing Reports Checked and §Existing QC Reports Checked, and this verdict independently cross-references prior verdicts.

## Integration Status

| Block | Status | Notes |
|-------|--------|-------|
| Coach engine migration (`coach.router.ts` + `_shared.ts` + `trpc.ts` context + `creditsConfig.coach_session` usage) | **Approved For Integration** | Carry from A-F1 closed. |
| New test `coach.router.spec.ts` | **Approved For Integration** (from 2026-04-21 follow-up) | Hermetic `router({ coach })` + mocks; see [`qc-verdict-c-f1-coach-follow-up-2026-04-21.md`](./qc-verdict-c-f1-coach-follow-up-2026-04-21.md). Row above superseded 2026-04-20 NAFI. |
| C-F1 Interview / Negotiation billable paths | **Not Approved For Integration** — awaiting §6 | No engine wiring yet. |
| C-F1 Practice FE boundary cleanup | **Not Approved For Integration** — awaiting §6 | Unchanged. |
| C-F2 Settings / Consent wider | **Not Approved For Integration** — awaiting §6 | Unchanged from 2026-04-18 decision. |
| Community / Consent separation | **Not Approved For Integration** — awaiting §6 | Unchanged. |
| Skill Lab core (test regression) | **Superseded (2026-04-21)** — see [`qc-live-status.md`](./qc-live-status.md) / Agent 2 verdict | At time of 2026-04-20 verdict, `skillLabCore.service.spec` failed; current tree passes full `npm test`. |
| Everything else (A-F1 / A-F2 / A-F4 / narrow OpenAI / Job Radar OpenAPI / settings `?tab=`) | **Approved For Integration** (unchanged) | See prior verdicts. |

## Escalation To Product Owner

No new PO decisions required from this slice. The five open PO items from [`qc-verdict-current-gate-state-2026-04-18.md`](./qc-verdict-current-gate-state-2026-04-18.md) still stand (plan allowances, credit-pack pricing/labels, salary-above rule, Community vs Consent surface split, Legal Hub retrieval strategy). No new escalation is added here.

## Required Next Action

**Mandatory first line applies to every agent response (§5a · Hard Rule 8):** required work is executed in the repository, not in chat — see [`docs/squad/IMPLEMENTATION_EXECUTION_RULES.md`](../squad/IMPLEMENTATION_EXECUTION_RULES.md).

- **Agent 3 (C) — required before next §6:**
  1. Make `coach.router.spec.ts` hermetic. Options:
     - Mock `../../../db/index.js` (or whatever module transitively opens the `mysql2` pool) before `vi.mock('../../../services/creditsBilling.js', ...)`, OR
     - Don't import `appRouter` — construct a minimal router exposing only `coachRouter` for the test, OR
     - Gate DB-opening modules behind lazy initialisers so `appRouter` import is side-effect-free.
     Success criterion: `npx vitest run src/trpc/routers/__tests__/coach.router.spec.ts` passes without a live MySQL on a clean clone.
  2. In the next C-F1 §6 intake, add engine wiring for Interview and Negotiation billable surfaces (or explicitly justify, with catalogue evidence, that no server-side debit belongs there).
  3. Correct the next intake's §Files Changed section: the feature key is `coach_session`, not `coach_answer_evaluation`.
  4. Follow the existing Not Approved decision for the wider Practice / Settings / Community slice — re-submit a §6 with the depth items from [`qc-decision-practice-modules-settings-community-2026-04-18.md`](./qc-decision-practice-modules-settings-community-2026-04-18.md).

- **Agent 2 (B) — new rework item:**
  1. Fix `backend/src/services/__tests__/skillLabCore.service.spec.ts` — the `salaryImpact.tier` branch is producing `'unknown'` for an input the test expects to yield a concrete band. Either adjust the Skill Lab core heuristic or correct the fixture. Deploy-gate cannot be green while this fails.
  2. Previously required §6 intakes (Legal Hub Search, Skill Lab core) still owed.

- **Agent 1 (A):** No code delta owed by this verdict. Optional: extend `_shared.ts` with a helper shape for fixed-feature paths if any router needs a different error envelope (not currently required).

- **This reviewer (QC):** On the next §6 intake from Agent 3 (Interview/Negotiation engine wiring, or Practice/Settings/Consent wider), perform the active search again (§7 · Hard Rule 2), compare against this verdict's *Previously Reported Issues Still Open*, and issue a per-slice §8. Until then, no integration of the non-hermetic test file happens.

---

**Canonical verdict line (2026-04-20 issuance; rows amended 2026-04-21):**
Coach slice of C-F1 — **Approved For Integration** (code). `coach.router.spec.ts` — **Approved For Integration** as of follow-up [`qc-verdict-c-f1-coach-follow-up-2026-04-21.md`](./qc-verdict-c-f1-coach-follow-up-2026-04-21.md) (hermetic). Rest of Practice / Settings / Community stack — **still Not Approved / awaiting §6**. Full backend test matrix — see current [`qc-live-status.md`](./qc-live-status.md) (Skill Lab unit test no longer a gate red in verified runs).

The **Binding QC line (English, exact — anti-widening)** section above is authoritative for how this verdict may be cited; widening to the full Practice slice is explicitly forbidden.
