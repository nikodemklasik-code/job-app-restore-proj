# Example screen (fictional) — `SCR-EXAMPLE-REVIEW-QUEUE`

> Demonstrates how **C (below UI)** nests under one screen. Replace with real IDs and repo paths in your product.

## A. Identity

- **ID:** `SCR-EXAMPLE-REVIEW-QUEUE`  
- **Goal:** Show applications that exceeded a silence threshold and suggest next actions.  
- **Roles:** Signed-in user (own data only).  
- **Related:** Applications list, single application detail.

## C. Below UI (example children)

| Child ID | Type | Example artefact |
|----------|------|------------------|
| `SCR-EXAMPLE-REVIEW-QUEUE-DATA-01` | Migration | `silence_periods` table + FK to `applications` |
| `SCR-EXAMPLE-REVIEW-QUEUE-API-01` | tRPC | `review.getQueue` — `protectedProcedure`, output schema |
| `SCR-EXAMPLE-REVIEW-QUEUE-API-02` | tRPC | `applications.updateStatus` — ownership check |

## F. Tests (example)

```bash
# example only — adjust to your monorepo
cd /path/to/backend && npx vitest run src/trpc/routers/__tests__/review.router.spec.ts
```

## H. Traceability snippet

| Screen ID | Child ID | Repo path | Status |
|-----------|----------|-----------|--------|
| SCR-EXAMPLE-REVIEW-QUEUE | DATA-01 | backend/sql/…sql | |
| SCR-EXAMPLE-REVIEW-QUEUE | API-01 | backend/src/trpc/routers/review.router.ts | |

## I. Explicit code lists (example — fill for real PR)

**Backend files (every path):**

- `backend/sql/<migration>.sql`
- `backend/src/db/schema.ts` (or module)
- `backend/src/trpc/routers/review.router.ts`
- `backend/src/trpc/routers/index.ts` (if router wired)

**Frontend files (every path):**

- `frontend/src/pages/ReviewPage.tsx`
- `frontend/src/components/review/ReviewQueue.tsx`
- `frontend/src/components/review/FollowUpAction.tsx`
- `frontend/src/types/review.ts`
- (route registration file in your app)

**Build proof:** backend `npm run build` exit `0`; frontend `npm run build` exit `0` — record commit SHA and date in real spec.
