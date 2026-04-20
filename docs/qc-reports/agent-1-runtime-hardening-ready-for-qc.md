# Agent 1 — Backend runtime hardening — delivery / QC intake

**Date:** 2026-04-19  
**Agent:** Agent 1  
**Bounded slice:** Trust proxy + MySQL closed/unavailable handling (startup + connection `error`) + targeted unit tests only.

---

## Definition of done (this task)

| Criterion | Evidence |
|-----------|----------|
| Runtime starts more predictably | Initial MySQL connect wrapped in `try/catch` → single log line + `process.exit(1)` (non-test) instead of opaque top-level rejection; supervisor can restart. |
| Proxy issue closed or clearly described | **Closed in code:** `TRUST_PROXY` parsing unchanged; **new:** `BEHIND_REVERSE_PROXY=1\|true\|yes` when `TRUST_PROXY` unset → **1** hop even if `NODE_ENV !== 'production'` (staging / PM2 without `NODE_ENV=production`). **Described:** bogus `TRUST_PROXY` still fail-closed → `false`. |
| MySQL closed/unavailable has guard | **Runtime:** `attachMysqlClosedStateGuard` extended for `ECONNREFUSED`, `ETIMEDOUT`, message hints (`econnrefused`, `connect timeout`, `getaddrinfo`). **Startup:** `createConnection` failure handled before guard attach. |
| Report + real tests / results / blockers | This file + commands below (Vitest **11** passed, `tsc` **0**). |
| Bounded slice for QC | Only files listed under *Files Changed*; no billing/profile/frontend. |

---

## Scope Implemented

- **Trust proxy:** `resolveExpressTrustProxy()` in `backend/src/runtime/express-trust-proxy.ts` — `TRUST_PROXY` explicit values; when unset: `BEHIND_REVERSE_PROXY` opt-in → `1` hop; else `production` → `1`, else `false`. `server.ts`: `app.set('trust proxy', resolveExpressTrustProxy())` immediately after `express()`.
- **MySQL guard (runtime):** `attachMysqlClosedStateGuard` — broader closed/unavailable classification; same exit policy (`NODE_ENV=test` skips `process.exit`).
- **MySQL guard (startup):** `backend/src/db/index.ts` — `createConnection` in `try/catch`; log + `process.exit(1)` on failure outside `test` (rethrow in test).
- **Tests:** `backend/src/runtime/__tests__/*.spec.ts` — trust defaults + `BEHIND_REVERSE_PROXY` + precedence; guard paths including `ECONNREFUSED`.

---

## Files Changed

| Path | Change |
|------|--------|
| `backend/src/runtime/express-trust-proxy.ts` | `BEHIND_REVERSE_PROXY` default branch; `envFlagTrue` helper |
| `backend/src/runtime/mysql-closed-state-guard.ts` | Extra codes + message heuristics for unavailable network errors |
| `backend/src/runtime/__tests__/express-trust-proxy.spec.ts` | Tests for `BEHIND_REVERSE_PROXY` and `TRUST_PROXY=0` precedence |
| `backend/src/runtime/__tests__/mysql-closed-state-guard.spec.ts` | Test for `ECONNREFUSED` exit path |
| `backend/src/server.ts` | *(unchanged in this delta if already wired)* `resolveExpressTrustProxy` + `app.set('trust proxy', …)` |
| `backend/src/db/index.ts` | `try/catch` around `createConnection` + existing `attachMysqlClosedStateGuard` |

---

## Routes / APIs / Components / Schemas Changed

| Category | Change |
|----------|--------|
| **HTTP routes / APIs** | **None** added or removed. Trust proxy is global Express config for `req.ip` / forwarded headers on all routes. |
| **tRPC** | **None** (this slice). |
| **Frontend** | **None** (forbidden). |
| **DB schemas / migrations** | **None** (forbidden for this slice). |

---

## Existing Reports Checked

- `docs/squad/TODAY_EXECUTION_BOARD.md` — merge gate / Agent rows (context only).
- `docs/today-reset/agent-1/COMMAND.txt` — bounded Agent 1 scope.

---

## Existing QC Reports Checked

- [`qc-verdict-three-bounded-slices-runtime-jobradar-legacy-interview-2026-04-19.md`](./qc-verdict-three-bounded-slices-runtime-jobradar-legacy-interview-2026-04-19.md) — prior **Approved** on earlier runtime-hardening baseline; **this delivery adds delta** (proxy opt-in + MySQL startup/unavailable coverage) for QC to re-ack if required by process.

---

## Test Command Run

**Run In:** `/Users/nikodem/job-app-restore/proj/backend`

```bash
cd /Users/nikodem/job-app-restore/proj/backend && npx vitest run src/runtime/__tests__/express-trust-proxy.spec.ts src/runtime/__tests__/mysql-closed-state-guard.spec.ts
```

```bash
cd /Users/nikodem/job-app-restore/proj/backend && npm run build
```

---

## Test Result

- **Vitest:** 2 files, **11** tests, **all passed** (Vitest v3.2.4; run **2026-04-19** start **02:43:19** local). Expected **stderr** from guard tests (logged errors).
- **`npm run build`:** **exit code 0** (`tsc` clean) in this session.

---

## Coverage / Justification

- **Trust proxy:** Unit tests cover prod default, non-prod default, integer hops, `false`/`0`, garbage `TRUST_PROXY`, **`BEHIND_REVERSE_PROXY=1` under `development`**, and **`TRUST_PROXY=0` overrides `BEHIND_REVERSE_PROXY`**. No live Nginx E2E in slice.
- **MySQL:** Unit tests cover exit / no-exit / `ECONNREFUSED`. Startup path is integration-tested indirectly when DB exists; failure path is code-reviewed + log contract; **no** live MySQL failure injected in CI here.
- **Scope limit:** No connection pooling, no query retry middleware, no schema changes.

---

## Known Remaining Blockers

- **Multi-hop / complex LB topologies:** operator must set numeric `TRUST_PROXY` explicitly; auto-detection is out of scope.
- **DB process in `test`:** initial connect failure still **rethrows** (Vitest/hermetic DB expected); no `exit` in test.

---

## Ready For QC

**No** — **QC closed this intake:** **Approved For Integration** in [`qc-verdict-tranche1-board-review-2026-04-19.md`](./qc-verdict-tranche1-board-review-2026-04-19.md) (confirmatory `npm run build` + Vitest batch including runtime specs, **2026-04-19**). Earlier baseline: [`qc-verdict-three-bounded-slices-runtime-jobradar-legacy-interview-2026-04-19.md`](./qc-verdict-three-bounded-slices-runtime-jobradar-legacy-interview-2026-04-19.md).

---

## Polling (process)

On **new** bounded delivery or QC **rework**: poll `docs/squad/TODAY_EXECUTION_BOARD.md` and `docs/qc-reports/` every 30–40s; **no self-approval**.
