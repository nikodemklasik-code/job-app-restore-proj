# Screen: `SCR-DASHBOARD` — Dashboard (home snapshot)

**MoSCoW:** Must unless marked  
**Owner (product):** PO  
**Owner (engineering):** Agent 1 (foundations / shell) unless board assigns otherwise  
**Status:** As-built inventory + gaps (see § Known gaps)  
**Last reviewed (repo scan):** 2026-04-19

**Canonical product refs:** [`docs/features/19-screens-for-users-and-agents.md`](../../../features/19-screens-for-users-and-agents.md) §1 · [`docs/features/19-screens-canonical-implementation-and-gap-map-v1.md`](../../../features/19-screens-canonical-implementation-and-gap-map-v1.md) SCREEN 1 · [`docs/features/19-screens-route-contracts-v1.md`](../../../features/19-screens-route-contracts-v1.md)

---

## A. Identity and scope

| # | Item | MoSCoW | Notes |
|---|------|--------|-------|
| 1 | **ID + goal** | Must | `SCR-DASHBOARD` — signed-in user sees one **snapshot** (profile, applications, billing summary, practice summary, next action). |
| 2 | **Roles** | Must | Authenticated user (`Clerk`); data scoped to `ctx.user.id`. |
| 3 | **Entry** | Should | `/` redirects to `/dashboard` · sidebar · post-auth fallback · onboarding CTA. |
| 4 | **Exit** | Must | `nextAction.href` → `/profile`, `/review`, or `/jobs` (computed server-side). |
| 5 | **Related** | Must | Profile completeness · Applications / Review queue · Jobs discovery · Billing credits (read-only summary). |

---

## B. Functional (as implemented)

| # | Item | MoSCoW | Notes |
|---|------|--------|-------|
| 6 | **UI** | Must | `DashboardSnapshot`: stat cards, applications strip, billing line, practice block, next-action CTA. |
| 7 | **Actions** | Must | Primary: follow **Next action** link; retry on load error. |
| 8 | **Rules** | Must | Profile completeness &lt; 80 → nudge Profile; stale sent/follow_up/interview apps → Review; else Jobs/Review heuristics in `computeNextAction`. |
| 9 | **States** | Must | Clerk loading · query loading · error + retry · empty data message · success → snapshot UI. |
| 10 | **Validation** | Must | Server output validated by `snapshotOutputSchema` (Zod). |
| 11 | **Idempotency** | Should | Read-only snapshot; refetch safe. |
| 12 | **Flags** | Could | N/A — none documented. |

---

## C. Backend — data and API (explicit paths)

| Child ID | Type | Repo path | MoSCoW | Notes |
|----------|------|-----------|--------|-------|
| SCR-DASHBOARD-API-01 | tRPC `getSnapshot` | `backend/src/trpc/routers/dashboard.router.ts` | Must | `protectedProcedure`; aggregates profile, applications, interviewSessions practice stats, billing via `getAccountStateService`. |
| SCR-DASHBOARD-MAP-01 | Status mapper | `backend/src/trpc/routers/dashboard-snapshot.mapper.ts` | Must | Maps legacy `applications.status` → dashboard enum. |
| SCR-DASHBOARD-API-REG | Router mount | `backend/src/trpc/routers/index.ts` (`dashboard: dashboardRouter`) | Must | |
| SCR-DASHBOARD-AUTH-01 | AuthZ | `protectedProcedure` + `ctx.user.id` / `clerkId` for billing | Must | |
| SCR-DASHBOARD-DATA-01 | Schema (read) | `backend/src/db/schema.ts` — `users`, `profiles`, `careerGoals`, `skills`, `experiences`, `documentUploads`, `applications`, `interviewSessions` | Must | No **new** dashboard-only table; uses existing tables. |
| SCR-DASHBOARD-DATA-SQL | New migration | — | **N/A** | No dashboard-specific DDL in current slice; future billing ledger wiring may add SQL (track under billing slice). |

---

## D. Frontend — UI code (explicit paths)

| Child ID | Type | Repo path | MoSCoW | Notes |
|----------|------|-----------|--------|-------|
| SCR-DASHBOARD-FE-PAGE | Page | `frontend/src/app/dashboard/DashboardPage.tsx` | Must | `api.dashboard.getSnapshot.useQuery` |
| SCR-DASHBOARD-FE-COMP | Layout | `frontend/src/components/dashboard/DashboardSnapshot.tsx` | Must | |
| SCR-DASHBOARD-FE-TYPES | Types | `frontend/src/types/dashboard.ts` | Must | Mirror snapshot DTO for FE. |
| SCR-DASHBOARD-FE-ROUTE | Router | `frontend/src/router.tsx` (`path: 'dashboard'`) | Must | |
| SCR-DASHBOARD-FE-NAV | Nav label | `frontend/src/lib/navigationCopy.ts`, `frontend/src/components/layout/Sidebar.tsx` | Should | |
| SCR-DASHBOARD-FE-TRPC | Client | `frontend/src/lib/api.ts` (`api` / `AppRouter`) | Must | Shared types: `shared/trpc` (router types). |

---

## E. NFR, a11y, legal

| Topic | MoSCoW | Notes |
|-------|--------|-------|
| Performance | Should | Single query round-trip; `staleTime: 30_000` on FE. |
| Security | Must | No secrets on client; Bearer via Clerk token. |
| Observability | Should | Standard tRPC errors surface to UI. |
| a11y | Should | Full audit N/A in this doc — follow unified layout policy. |
| Theme/layout | Must | [`docs/policies/unified-app-layout-and-theme-standard-v1.0.md`](../../../policies/unified-app-layout-and-theme-standard-v1.0.md) |
| Copy risk | Must | Billing card shows **available balance** derived partly from engine; posted/pending ledger fields currently **zeros** in router (see gaps). |

---

## F. Tests and DoD

### Backend

| Test file(s) | Command | Result |
|--------------|---------|--------|
| `backend/src/trpc/routers/__tests__/dashboard.router.spec.ts` | `cd /Users/nikodem/job-app-restore/proj/backend && npx vitest run src/trpc/routers/__tests__/dashboard.router.spec.ts` | **2026-04-19** — 1 file, **10** tests, **PASS** |

**Gap (honest):** no hermetic Vitest for full `getSnapshot` DB path yet — mapper only. **Should** add router integration test with mocked `db` (PO/QC may require before GREEN).

### Frontend

| Test file(s) | Command | Result |
|--------------|---------|--------|
| — | — | **N/A** — no `DashboardPage` / `DashboardSnapshot` RTL test in repo at scan date; justify or add under a bounded FE slice. |

**Acceptance (product)**

- [ ] Signed-in user opens `/dashboard` and sees snapshot without uncaught error.  
- [ ] Error state shows message + retry.  
- [ ] Next action link matches server `nextAction` (profile / review / jobs).  

**QC:** path TBD per process when slice submitted for verdict.

---

## G. Build proof

| Layer | Command | Exit code | Date / commit |
|-------|---------|-----------|---------------|
| Backend | `cd /Users/nikodem/job-app-restore/proj/backend && npm run build` | **2** (2026-04-19 scan) — **not green on branch at scan time**; unrelated routers may fail `tsc`. Re-run after merge gate. | |
| Frontend | `cd /Users/nikodem/job-app-restore/proj/frontend && npm run build` | *(re-run locally when verifying this spec)* | |

---

## H. Deploy

| Env vars | Deploy order | Rollback |
|----------|--------------|----------|
| `VITE_API_URL`, Clerk, `DATABASE_URL` on API | standard BE → FE | usual |

---

## I. Traceability (summary)

| Screen ID | Child ID | Type | Repo path | Status |
|-----------|----------|------|-----------|--------|
| SCR-DASHBOARD | API-01 | tRPC | `backend/src/trpc/routers/dashboard.router.ts` | As-built |
| SCR-DASHBOARD | MAP-01 | mapper | `backend/src/trpc/routers/dashboard-snapshot.mapper.ts` | As-built |
| SCR-DASHBOARD | FE-PAGE | UI | `frontend/src/app/dashboard/DashboardPage.tsx` | As-built |
| SCR-DASHBOARD | FE-COMP | UI | `frontend/src/components/dashboard/DashboardSnapshot.tsx` | As-built |

---

## Known gaps vs canonical docs (YELLOW)

1. **Gap map** ([`19-screens-canonical-implementation-and-gap-map-v1.md`](../../../features/19-screens-canonical-implementation-and-gap-map-v1.md)): Dashboard **YELLOW** — “aggregate contract not explicit enough”; **mitigation in repo:** single `dashboard.getSnapshot` exists; **remaining:** no **jobs** slice inside snapshot (spec mentioned jobs aggregate); billing **posted/pending** ledger fields in router are **placeholders (0)** — real ledger slice is separate work.  
2. **Telemetry** (`dashboard_opened`, …) — **not verified** in this path scan; track under analytics slice if required.  
3. **FE tests** — missing (see §F).

---

## Ready for QC

**Partial:** inventory + paths + honest gaps documented. **Full Ready for QC: Yes** only after PO/QC decide: e.g. FE smoke test + optional hermetic `getSnapshot` test + build rows in §G filled.
