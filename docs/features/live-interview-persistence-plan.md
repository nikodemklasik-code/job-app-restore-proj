# Live Interview Persistence Plan
**Status:** Implementation Complete
**Priority:** P0
**Related Docs:**
- `docs/product/live-interview-production-direction.md`
- `docs/features/live-interview-implementation-plan.md`
- `docs/features/live-interview-engine-tasks.md`

---

## 1. Problem

The initial Live Interview engine stored all session state in a server-side in-memory `Map<string, LiveInterviewSession>`. This worked for development but is not viable for production:

- Sessions are lost on server restart or redeploy
- Sessions cannot scale across multiple server instances
- Transcripts are unrecoverable after process exit
- No ability to replay, audit, or review sessions
- No historical data for analytics or quality improvement

---

## 2. Solution

Persist Live Interview sessions and turns to the existing MySQL database using the Drizzle ORM layer already in the project.

---

## 3. Schema

### `live_interview_sessions`

| Column | Type | Notes |
|---|---|---|
| `id` | varchar(36) PK | UUID |
| `user_id` | varchar(36) NOT NULL | references users |
| `status` | varchar(30) | CREATED / ACTIVE / COMPLETED / ABANDONED |
| `stage` | varchar(50) | INTRO / WARMUP / CORE_EXPERIENCE / DEEP_DIVE / WRAP_UP / CLOSING |
| `mode` | varchar(50) | behavioral / technical / general / hr / case-study / language-check |
| `target_role` | varchar(200) | from roleContext |
| `company` | varchar(200) | nullable |
| `seniority` | varchar(100) | nullable |
| `role_description` | text | nullable |
| `max_turns` | int | config |
| `max_follow_ups_per_topic` | int | config |
| `turn_count` | int | running counter |
| `memory` | json | full `InterviewMemory` object |
| `summary` | json | nullable `InterviewSummary` |
| `created_at` | timestamp | |
| `updated_at` | timestamp | auto-updated |
| `started_at` | timestamp | nullable |
| `ended_at` | timestamp | nullable |

**Design notes:**
- `memory` is stored as a single JSON column. It is a bounded object (lists capped by engine logic). Not a concern for row size.
- `summary` is stored as JSON. Only populated on session completion.
- `roleContext` fields are denormalized into flat columns for queryability.

---

### `live_interview_turns`

| Column | Type | Notes |
|---|---|---|
| `id` | varchar(36) PK | UUID |
| `session_id` | varchar(36) NOT NULL | references live_interview_sessions |
| `speaker` | varchar(20) | 'assistant' or 'candidate' |
| `message` | text | full message content |
| `intent` | varchar(50) | nullable, classified CandidateIntent |
| `next_action` | varchar(50) | nullable, NextAction taken after this turn |
| `stage` | varchar(50) | stage at time of turn |
| `timestamp` | timestamp | turn creation time |

**Design notes:**
- Turns are kept in a separate table rather than embedded in the session row. This keeps session row size bounded even for long interviews.
- Ordered by `timestamp` when reconstructing transcripts.
- `intent` and `next_action` are stored for transcript auditing and quality analysis.

---

## 4. Repository Layer

`backend/src/services/liveInterviewRepository.ts`

Exports four async functions:

```
dbCreateSession(session: LiveInterviewSession): Promise<void>
dbGetSession(sessionId: string): Promise<LiveInterviewSession | undefined>
dbUpdateSession(session: LiveInterviewSession): Promise<void>
dbAppendTurn(turn: InterviewTurn, sessionId: string): Promise<void>
```

`dbGetSession` reconstructs the full `LiveInterviewSession` domain object by:
1. Loading the session row
2. Loading all turns for the session ordered by timestamp
3. Mapping both into the domain model

This keeps the repository layer thin and the engine domain model unchanged.

---

## 5. Engine Changes

`backend/src/services/liveInterviewEngine.ts`

The in-memory `sessionStore` Map was removed.

All session lifecycle functions were updated to use the repository:

| Function | Before | After |
|---|---|---|
| `createSession` | sync, writes to Map | async, calls `dbCreateSession` |
| `startSession` | async, reads/writes Map | async, calls `dbGetSession` + `dbUpdateSession` + `dbAppendTurn` |
| `processTurn` | async, reads/writes Map | async, calls `dbGetSession` + `dbUpdateSession` + `dbAppendTurn` × 2 |
| `completeSession` | async, reads/writes Map | async, calls `dbGetSession` + `dbUpdateSession` |
| `getSession` | sync, reads Map | async, calls `dbGetSession` |
| `abandonSession` | sync, writes Map | async, calls `dbGetSession` + `dbUpdateSession` |

---

## 6. Router Changes

`backend/src/trpc/routers/liveInterview.router.ts`

- `createSession` call is now awaited
- All `getSession` calls are now awaited
- `abandonSession` call is now awaited
- The `abandon` procedure handler is now `async`
- The `getSession` query handler is now `async`

---

## 7. Migration

A Drizzle migration is needed to create the two new tables in the database.

Run:
```
npm run drizzle:generate
npm run drizzle:push
```

Or generate and apply via the Drizzle Kit CLI configured in `backend/drizzle.config.ts`.

---

## 8. What This Enables

### Immediate
- Sessions survive server restarts and redeploys
- Multiple server instances can serve the same user session
- Transcripts are permanently stored for debugging and QA

### Soon
- Replay any session for quality review
- Score transcript quality against the validation rubric
- Export transcripts for analysis
- Track session drop-off rates (sessions abandoned vs completed)

### Later
- Historical performance analytics per user
- Cross-session memory (user has interviewed in behavioral mode 4 times, themes covered)
- Candidate progress tracking over time

---

## 9. What This Does Not Change

- The `LiveInterviewSession` domain model interface is unchanged
- The `InterviewTurn`, `InterviewMemory`, `InterviewSummary` interfaces are unchanged
- The tRPC API contract (inputs, outputs) is unchanged
- The frontend integration is unchanged

The persistence layer is a pure internal implementation swap. The product surface is identical.

---

## 10. Known Limitations of This Implementation

- No explicit foreign key constraint between `live_interview_sessions.user_id` and `users.id` in the Drizzle schema definition (consistent with the existing pattern in this codebase)
- No index on `live_interview_turns.session_id` defined in schema (MySQL will use a full scan for turn loading; acceptable at current scale, add index if session turn counts grow large)
- No pagination on `dbGetSession` turn loading (loads all turns in one query; capped by `maxTurns` config, so bounded)

---

## 11. One-Sentence Summary

The Live Interview session store was migrated from a server-side in-memory Map to a Drizzle/MySQL-backed repository, replacing all six session lifecycle functions with async DB-backed equivalents while keeping the domain model and API contract unchanged.
