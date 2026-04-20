# QC verdict — three bounded slices (fresh pass)

**Date:** 2026-04-19  
**Intake (mandatory):**

- [`agent-1-runtime-hardening-ready-for-qc.md`](./agent-1-runtime-hardening-ready-for-qc.md)
- [`agent-2-job-radar-bounded-parity-ready-for-qc.md`](./agent-2-job-radar-bounded-parity-ready-for-qc.md)
- [`agent-3-legacy-interview-billing-ready-for-qc.md`](./agent-3-legacy-interview-billing-ready-for-qc.md)

**Supersedes:** Intake-only note in [`qc-verdict-today-execution-board-scopes-2026-04-19.md`](./qc-verdict-today-execution-board-scopes-2026-04-19.md) (missing files — no longer applicable).

**Rules:** `docs/today-reset/qc/COMMAND.txt`, `docs/qc/qc-reporting-certification-and-po-communication-spec-v1.0.md` §2–§3 (previous-report check).

---

## Previous-report check (verdict chain)

| Prior artefact | Relevance to this pass |
|----------------|-------------------------|
| [`qc-verdict-live-interview-billing-slice-2026-04-21.md`](./qc-verdict-live-interview-billing-slice-2026-04-21.md) | **Live** `liveInterviewRouter` only; explicitly **did not** approve legacy `interview.router`. Sets **mode → feature** and **commit at minCost for estimated** expectations used to sanity-check Agent 3’s legacy alignment. |
| [`qc-verdict-agent-2-delivery-intelligence-legal-skill-jobradar-2026-04-19.md`](./qc-verdict-agent-2-delivery-intelligence-legal-skill-jobradar-2026-04-19.md) | Earlier Job Radar / intelligence tranche — **not** the same slice as REST literal-path parity; read for naming only, no contradiction with REST manifest approach. |
| [`qc-verdict-today-execution-board-scopes-2026-04-19.md`](./qc-verdict-today-execution-board-scopes-2026-04-19.md) | Obsolete intake gate; replaced by this document. |

No prior QC verdict exists **for** “runtime trust proxy + mysql guard” or **for** “OpenAPI v1.1 literal REST under `/job-radar`” as named intakes — delta is greenfield within those titles.

---

## QC verification performed

1. **Read** all three delivery reports end-to-end.  
2. **Read** implementation: `backend/src/runtime/express-trust-proxy.ts`, `mysql-closed-state-guard.ts`, `db/index.ts`, `server.ts` (trust proxy + `/job-radar` + CORS), `job-radar.express.router.ts`, `job-radar-openapi-v1.1.rest-operations.ts`, `interview.router.ts`, `interview.router.spec.ts`.  
3. **Ran (QC host):**

```bash
cd /Users/nikodem/job-app-restore/proj/backend && npx vitest run src/runtime/__tests__/express-trust-proxy.spec.ts src/runtime/__tests__/mysql-closed-state-guard.spec.ts src/modules/job-radar src/trpc/routers/__tests__/interview.router.spec.ts
```

**Result:** 21 test files, **62** tests, **all passed** (Vitest v3.2.4).

4. **`npm run build`** (`tsc`) **fails** on `liveInterview.router.ts` and `profile.router.ts` only — **no errors** in Agent 1 `runtime/*`, Agent 2 Job Radar REST files, or Agent 3 `interview.router.ts` / spec. Matches agents’ stated blocker; **not** introduced by these three bounded diffs.

---

## Agent 1 — Backend runtime hardening only

**Report vs code:** Matches. `resolveExpressTrustProxy()` behaviour and defaults align with report and unit tests. `attachMysqlClosedStateGuard` on shared mysql2 connection after `createConnection`; `process.exit(1)` suppressed in `NODE_ENV=test` as claimed.

**Bounded scope:** Trust proxy + MySQL closed-state guard + wiring only — **honoured** (no billing/UI changes in this slice’s claimed files).

**Verdict:** **Approved For Integration**

---

## Agent 2 — Job Radar bounded REST parity only

**Report vs code:** `createJobRadarOpenApiRouter()` implements literal OpenAPI paths under `/job-radar`; `server.ts` mounts `app.use('/job-radar', …)` and CORS allows `Idempotency-Key`. Handlers delegate to existing module `getJobRadarModule()` paths; employer history uses snake_case wire keys per report.

**Contract tests:** `JOB_RADAR_OPENAPI_V1_1_REST_OPERATIONS` matches the six operations listed; full `src/modules/job-radar` Vitest tree passes in QC run.

**Bounded scope:** REST parity + minimal wiring/tests — **honoured** (no Legal Hub / Skill Lab / unrelated AI in touched paths per report).

**Verdict:** **Approved For Integration**

---

## Agent 3 — Legacy `interview.router` billing parity only

**Report vs code:** `startSession` inserts session, `approveSpend` with mode→feature mapping (aligned with Live Interview catalogue keys), rollback delete on approval failure, `rejectSpend` + delete on post-approval `buildInterviewQuestions` failure. `completeSession` idempotent return when already `completed`; `findApprovedLegacyInterviewSpend` + `commitSpend` with catalogue **`minCost`** for estimated features matches the documented Live Interview completion semantics from the prior Live slice verdict.

**Tests:** Hermetic `interview.router.spec.ts` exercises approve, rollback, reject-after-approve, commit with `actualCost: 8` for `interview_standard` — consistent with report.

**Residual risks (documented; outside declared slice or pre-existing):**

1. **`finishAnswer` (`publicProcedure`)** unchanged per report; **`isLastQuestion` is not sent** by current frontend callers (repo grep). Latent API could theoretically complete without `commitSpend` if a client sent `isLastQuestion: true` after a billed `startSession` — **follow-up** if that path must be supported.  
2. **`downloadCredential`** profile join uses `eq(users.clerkId, userId)` with `userId = ctx.user.id` — **incorrect** join (internal id vs Clerk id). **Not** part of Agent 3 diff (`git diff` shows billing-only hunks); treat as **separate defect** on integration backlog, not a regression from this billing slice.

**Verdict:** **Approved For Integration**

---

## Branch merge / CI note (all three)

**Approved For Integration** here certifies **these bounded implementations and tests**. The workspace still fails **`cd /Users/nikodem/job-app-restore/proj/backend && npm run build`** until unrelated `liveInterview.router.ts` / `profile.router.ts` type issues are resolved on the integration branch. PO / release process should treat full `tsc` green as the **merge gate** unless explicitly waived.

---

## Summary table

| Agent | Scope | Verdict |
|-------|--------|---------|
| Agent 1 | Runtime hardening | **Approved For Integration** |
| Agent 2 | Job Radar REST parity | **Approved For Integration** |
| Agent 3 | Legacy interview billing parity | **Approved For Integration** |
