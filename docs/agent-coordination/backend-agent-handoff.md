# Backend Agent Handoff

## Mission

Bring the backend to a production-safe, screen-complete state. The main failure pattern is old public tRPC procedures using client-supplied `userId` beside newer protected procedures using `ctx.user`. That split must be removed from private domains.

Backend is the source of truth. If the backend accepts fake identity, silently loses data, pretends to persist a setting, or charges credits through a client-trusted path, the task fails. Congratulations, the bar is basic integrity.

## Immediate blockers to fix

### P0 — Security router must be protected

File: `backend/src/trpc/routers/security.router.ts`

Current problem:
- `getPasskeys`, `getActiveSessions`, `revokeSession`, and `removePasskey` use `publicProcedure`.
- They accept `userId` from the client.
- Account security state must never trust client-supplied user identity.

Required fix:
- Convert account-security endpoints to `protectedProcedure`.
- Remove `userId` from inputs.
- Use `ctx.user.id` for local DB ownership.
- Ensure revoke/remove only affect rows owned by the authenticated user.

Acceptance tests:
- Current user can list only their own passkeys/sessions.
- Passing another user's id is impossible or ignored.
- Revoking another user's session returns forbidden/not found and changes nothing.
- Removing another user's passkey returns forbidden/not found and changes nothing.

### P0 — Applications router must stop trusting client userId

File: `backend/src/trpc/routers/applications.router.ts`

Current problem:
- The router handles private application data, generated documents, e-mail sending, PDFs, logs and analytics through `publicProcedure` with `userId` input.

Required fix:
- Convert private application procedures to `protectedProcedure`.
- Remove `userId` from private inputs.
- Use `ctx.user.id` and `ctx.user.clerkId` only.
- Keep only genuinely public catalogue-style endpoints public, if any.
- Enforce ownership for every `applicationId`.
- Standardise status transitions with Review and Dashboard.

Acceptance tests:
- User A cannot read/update/send/generate/log/download reports for User B's application.
- Status transitions are validated.
- E-mail send requires owned application and generated documents.
- Candidate report contains only current user's application data.

### P0 — Billing and credits engine must be protected

File: `backend/src/trpc/routers/billing.router.ts`

Current problem:
- Spend/account/payment flows include `publicProcedure` endpoints accepting `userId` from the client.
- Credits and payments must not trust client identity. Humanity has tried trusting clients before. It went poorly.

Required fix:
- Convert account state, usage history, approve/commit/reject/refund spend, PayPal order/capture, credit-pack order/capture, checkout and customer portal endpoints to authenticated identity where private or financial.
- Use `ctx.user.clerkId` for credit services that require Clerk id.
- Use `ctx.user.id` for local DB ownership.
- Keep public only static catalogue endpoints such as plan/credit-pack lists.
- Preserve idempotency for capture/grant flows.

Acceptance tests:
- User cannot approve/commit/reject/refund another user's spend event.
- User cannot capture another user's PayPal or credit pack order.
- Account state and usage history are scoped to authenticated user.
- Failed commit/reject paths do not strand pending spend events.

### P1 — Profile updateFull must not delete omitted data

File: `backend/src/trpc/routers/profile.router.ts`

Current problem:
- `updateFull` defaults `skills`, `experiences`, `educations`, and `trainings` to `[]`.
- It then deletes existing child rows and reinserts from input.
- Partial legacy payloads can silently wipe profile data.

Required fix:
- Missing arrays must mean `leave unchanged`.
- Provided arrays may mean `replace with this array`.
- If full replacement is required, expose it explicitly and document it.
- Do not default destructive collections to `[]`.

Acceptance tests:
- Existing skills/experiences/educations/trainings survive `updateFull` when arrays are omitted.
- Provided empty array intentionally clears only that provided collection.
- Personal info update does not modify unrelated child collections.

### P1 — Settings legacy alias must not fake aiSuggestions

File: `backend/src/trpc/routers/settings.router.ts`

Current problem:
- `settings.get` hardcodes `aiSuggestions: true`.
- `settings.update` accepts `aiSuggestions` but does not persist it.

Required fix options:
- Persist `aiSuggestions` in schema/DTO and make it round-trip, or
- Remove it from the compatibility contract and frontend usage.

Acceptance tests:
- If retained: `update({ aiSuggestions: false })` followed by `get()` returns false.
- If removed: no frontend/backend contract exposes the unsupported field.

### P1 — Interview legacy finishAnswer must be secured or removed

File: `backend/src/trpc/routers/interview.router.ts`

Current problem:
- `finishAnswer` is a public legacy endpoint.
- It writes answers and can complete sessions by `sessionId` without authenticated ownership.
- It swallows DB errors with `.catch(() => {})`.

Required fix:
- Convert to protected with session ownership, or remove after frontend migration.
- No silent catch on persistence.
- Completion must use the same spend lifecycle and scoring semantics as canonical endpoints.

Acceptance tests:
- User A cannot write to or complete User B's session.
- Persistence errors fail the request, not disappear into the void.

### P1 — Style public AI document endpoints must be protected

File: `backend/src/trpc/routers/style.router.ts`

Current problem:
- `rewriteSection` and `generateFromJob` are public and accept `userId`.
- These generate user-specific AI output and use plan/prompt behaviour.

Required fix:
- Convert to protected.
- Use `ctx.user.clerkId`.
- Add spend approval if product pricing requires it.
- Mark fallback output provenance if OpenAI is unavailable.

Acceptance tests:
- User identity cannot be spoofed.
- Fallback result is distinguishable from model result where relevant.
- Costed actions require approval.

### P1 — Jobs private personalisation must be protected

File: `backend/src/trpc/routers/jobs.router.ts`

Current problem:
- Public search may be acceptable, but personalised routes such as fit explanation, session-cookie use and user job statuses should not trust client userId.

Required fix:
- Split public job discovery from authenticated personalised job intelligence.
- Any use of profile, session cookies, saved jobs, applications, or interview insights must be protected.

Acceptance tests:
- Anonymous user can only access public job data.
- Authenticated user gets only their own saved/status/profile-derived data.

## Missing or unclear backend contracts on main

The following screens do not have clear canonical backend namespaces on `main` and must not be marked Done until resolved:

- Community Centre — no `community` router registered on main.
- Daily Warmup — no canonical warmup router; billing path appears legacy.
- Negotiation — no canonical negotiation router registered on main.
- AI Analysis — no dedicated canonical backend namespace; clarify whether it is intentionally folded into other routers.

## Required PR evidence

Every backend PR must include:

- list of changed procedures,
- which procedures are public and why,
- ownership/auth model,
- database rows affected,
- tests added or updated,
- commands run,
- frontend contract notes,
- migration notes if schema changed.

## Task pass/fail rule

Backend task passes only when:

1. Private data uses `protectedProcedure`.
2. No client-supplied `userId` controls private ownership.
3. Data-loss cases are covered by tests.
4. Spend/account/payment flows are authenticated and idempotent.
5. Frontend agent confirms integration with the real contract.
6. QC confirms `Done`.

If any one of these fails, the task is not done. Not “mostly done”. Not “ready except”. Not “tiny follow-up”. Not done.
