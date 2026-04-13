# Live Interview — Documentation Index

This index covers the full documentation package for the **Live Interview** product.

Start here if you are a developer, product owner, or reviewer joining this work.

---

## Documents

### 1. Product Direction
`docs/product/live-interview-production-direction.md`

What the product is, why we are building it, and which decisions are locked.

Read this first if you are new to the project.

---

### 2. Implementation Plan
`docs/features/live-interview-implementation-plan.md`

Architecture, domain model, API contracts, decision logic, and phase breakdown.

Read this if you are building or extending the engine.

---

### 3. Engine Tasks
`docs/features/live-interview-engine-tasks.md`

Granular task list with deliverables, acceptance criteria, and current completion status.

Read this if you are picking up specific work items.

---

### 4. Validation Rubric
`docs/features/live-interview-validation-rubric.md`

Transcript scoring criteria, failure conditions, and production readiness thresholds.

Read this before signing off on launch readiness.

---

## Current Implementation Status

| Layer | Status |
|---|---|
| Domain models + enums | ✅ Done |
| In-memory session repository | ✅ Done |
| Session lifecycle (create, start, complete, abandon) | ✅ Done |
| Turn processing engine | ✅ Done |
| Intent classification | ✅ Done |
| Next-action decision engine | ✅ Done |
| Follow-up generation | ✅ Done |
| Clarification handling | ✅ Done |
| Candidate-question handling | ✅ Done |
| Session memory | ✅ Done |
| Summary generation | ✅ Done |
| tRPC API layer | ✅ Done |
| Frontend integration | ✅ Done |
| Unit tests | Pending |
| Integration tests | Pending |
| Transcript scenario fixtures | Pending |
| Manual transcript review | Pending |

---

## Key Source Files

| File | Purpose |
|---|---|
| `backend/src/services/liveInterviewEngine.ts` | Core engine: domain models, session state, turn processing, memory, summary |
| `backend/src/trpc/routers/liveInterview.router.ts` | tRPC endpoints: createSession, startSession, respond, complete, abandon, getSession |
| `frontend/src/app/interview/InterviewPractice.tsx` | Frontend: live mode integration, turn-taking UI, summary display |

---

## Quick Start for Backend

```ts
// Create session
const session = createSession(userId, 'behavioral', { targetRole: 'Product Manager' });

// Start interview (generates first question)
const { assistantMessage } = await startSession(session.id);

// Process a candidate turn
const result = await processTurn(session.id, 'I led a migration across three teams.');

// Complete session
const { summary } = await completeSession(session.id);
```

---

## One-Sentence Summary

The Live Interview engine is production-implemented. The next priority is test coverage and transcript validation before launch signoff.
