# Agent 1 — MySQL DDL evidence pack — Ready For QC

**Date:** 2026-04-19  
**Agent:** Agent 1  
**Bounded scope:** **Repo-only** — document canonical DDL scripts that unblock `profile` / `liveInterview` schema alignment with Drizzle; **no** claim of execution on VPS unless PO attaches execution log in a separate ops note.

---

## Scope implemented (evidence)

| Artefact | Path | Purpose |
|----------|------|---------|
| Career goals + user preference flags DDL | [`backend/sql/2026-04-19-career-goals-strategy-user-prefs.sql`](../../backend/sql/2026-04-19-career-goals-strategy-user-prefs.sql) | `ALTER career_goals` (target salary min/max, seniority, `strategy_json`); `CREATE user_preference_flags` |
| Live Interview pending spend column | [`backend/sql/2026-04-20-live-interview-pending-spend.sql`](../../backend/sql/2026-04-20-live-interview-pending-spend.sql) | `ALTER live_interview_sessions` → `pending_credit_spend_event_id` nullable |

Scripts include inline comments: apply on MySQL before relying on matching server code.

---

## Files touched (this intake)

- `docs/qc-reports/agent-1-mysql-ddl-evidence-ready-for-qc.md` (this delivery)  
- Evidence references only: `backend/sql/*.sql` listed above (no code change in this slice).

---

## Tests

- **Automated:** None for raw SQL application (honest gap — DDL is applied against MySQL by ops/PO process).  
- **Repo compile:** Covered elsewhere — `npm run build` on backend is green when schema + routers align after migrations are applied on the DB.

---

## Test command run

_Not applicable for SQL files._ Backend smoke if needed:

```bash
cd /Users/nikodem/job-app-restore/proj/backend && npm run build
```

---

## Out of scope

- Running SQL on production/staging (PO / ops).  
- Changing Drizzle schema or routers in this intake.

---

## Ready For QC

**Yes** — QC should verify: (1) scripts exist and match documented merge-gate intent; (2) no over-claim of VPS execution without evidence.

---

## Blockers / honest gaps

- **VPS execution:** Not proven in this document — PO must record **when** scripts were applied or attach `mysql` client transcript if QC requires execution proof.
