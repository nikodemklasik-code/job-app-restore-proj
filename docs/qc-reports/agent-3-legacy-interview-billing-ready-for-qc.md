# Agent 3 — Legacy `interview.router` billing parity

**Date:** 2026-04-19  
**Agent:** Agent 3  
**Bounded scope:** Legacy tRPC `interview` — **billing parity only** (`approveSpend` before chargeable effect, `commitSpend` only on successful completion path, `rejectSpend` on applicable failures). No Coach, Negotiation, wider Practice, Live Interview (except compile).

**QC — raport gotowy:** **Approved For Integration** — potwierdzenie board / build / Vitest: [`qc-verdict-tranche1-board-review-2026-04-19.md`](./qc-verdict-tranche1-board-review-2026-04-19.md) (wiersz Agent 3). Wcześniejszy werdykt trzech slice’ów: [`qc-verdict-three-bounded-slices-runtime-jobradar-legacy-interview-2026-04-19.md`](./qc-verdict-three-bounded-slices-runtime-jobradar-legacy-interview-2026-04-19.md).

---

## Approve → Commit → Reject (verified vs `interview.router.ts`)

| Requirement | Implementation |
|-------------|-----------------|
| **`approveSpend` before effect** | `startSession`: DB **insert** `interview_sessions` (file `interview.router.ts` ~L82–91), then **`approveSpend`** (~L94–101). `{ sessionId, questions }` only after both succeed. |
| **`commitSpend` only after success** | `completeSession`: **`commitSpend`** only after owner check, not `completed`, answers loaded, score computed (~L225–244). Session **`UPDATE`** to `completed` (~L246–249) runs **after** successful `commitSpend`; if `commitSpend` throws, update is skipped. |
| **`rejectSpend` on failure / abandon** | **`approveSpend` failure:** delete session (~L103–105); no `rejectSpend`. **Post-approve** build failure: **`rejectSpend`** (~L114–118) + delete. **Abandon:** not implemented — blockers. |

Ten raport = **intake + ślad kodu** przy ewentualnym ponownym przeglądzie po zmianie ścieżki billingu.

---

## Scope Implemented

- **`interview.startSession`:** `approveSpend` with mode → `interview_lite` | `interview_standard` | `interview_deep`, `referenceId` = session id, `clerkId` from context. Rollback + `billingToTrpc` on approval failure. `rejectSpend` + delete session if question build fails after approval.
- **`interview.completeSession`:** Idempotent if already `completed`. Lookup approved estimated spend by `reference_id` + user; **`commitSpend`** with catalogue **`minCost`**; then mark session completed. Grandfather: no row → complete without debit.
- **Out of slice:** `finishAnswer` (public) without billing; no `abandon` mutation.

---

## Files Changed

| Path | Role |
|------|------|
| `backend/src/trpc/routers/interview.router.ts` | Billing: helpers + `startSession` / `completeSession`. *(Same file, non-billing: `downloadCredential` profile join uses `eq(users.id, userId)` — internal user id.)* |
| `backend/src/trpc/routers/__tests__/interview.router.spec.ts` | Hermetic Vitest for billing paths. |

---

## Routes / APIs / Components / Schemas Changed

| Layer | Change |
|-------|--------|
| **tRPC** | `interview.startSession`, `interview.completeSession` — billing. |
| **REST / FE** | None. |
| **DB schema** | None — uses `credit_spend_events.reference_id` = session UUID. |

---

## Existing Reports Checked

- `docs/squad/TODAY_EXECUTION_BOARD.md`
- `docs/qc-reports/execution-live-interview-billing-slice-2026-04-20.md` (mode / minCost reference)
- `docs/qc-handoffs/agent-3-next-action.md`

---

## Existing QC Reports Checked

- [`qc-verdict-tranche1-board-review-2026-04-19.md`](./qc-verdict-tranche1-board-review-2026-04-19.md) — **najnowsze potwierdzenie AFI** Agent 3 + build/Vitest.
- [`qc-verdict-three-bounded-slices-runtime-jobradar-legacy-interview-2026-04-19.md`](./qc-verdict-three-bounded-slices-runtime-jobradar-legacy-interview-2026-04-19.md) — pierwszy werdykt trzech slice’ów (Agent 3).
- [`qc-verdict-live-interview-billing-slice-2026-04-21.md`](./qc-verdict-live-interview-billing-slice-2026-04-21.md) — tylko Live Interview; katalog / minCost.
- [`qc-verdict-today-execution-board-scopes-2026-04-19.md`](./qc-verdict-today-execution-board-scopes-2026-04-19.md) — przestarzały gate intake-only.

---

## Test Command Run

**Run In:** `/Users/nikodem/job-app-restore/proj/backend`

```bash
cd /Users/nikodem/job-app-restore/proj/backend && npx vitest run src/trpc/routers/__tests__/interview.router.spec.ts
```

---

## Test Result

**Last run:** 2026-04-19T01:42:34Z UTC — Vitest v3.2.4 — `Test Files  1 passed (1)`, `Tests  6 passed (6)`, exit code **0**.

---

## Coverage / Justification

- Mocked `db` + `creditsBilling`; no MySQL.
- Covers: `approveSpend` mapping (behavioral → `interview_standard`, case-study → `interview_deep`); `INSUFFICIENT_FUNDS` rollback; post-approve `rejectSpend` + delete; `completeSession` → `commitSpend` (`actualCost: 8` for `interview_standard` minCost) + update; Drizzle table symbols for mocks.
- **Not in Vitest:** real DB integration; `finishAnswer` by design.

---

## Known Remaining Blockers

- **No legacy `abandon`:** stranded `approved` rows if user never calls `completeSession`.
- **`commitSpend` then session `UPDATE`:** rare partial failure if update errors after commit.
- **`finishAnswer` (public):** no billing; product follow-up if that path must align with credits.
- **Full-repo `tsc`:** other routers may still fail; this slice = Vitest above.

---

## Ready For QC

**Tak (intake)** — ścieżka billingu opisana, pliki ograniczone, raport = kod, Vitest OK. **QC zakończone:** **Approved For Integration** — [`qc-verdict-tranche1-board-review-2026-04-19.md`](./qc-verdict-tranche1-board-review-2026-04-19.md) (ponowne potwierdzenie + `npm run build` / Vitest w werdykcie). Nowy cykl QC tylko przy realnej zmianie kodu billingu.

---

## Out of scope

Coach, Negotiation, wider Practice, Live Interview engine/router, new migrations on `interview_sessions`.
