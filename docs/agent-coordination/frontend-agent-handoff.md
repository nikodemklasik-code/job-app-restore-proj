# Frontend Agent Handoff

## Mission

Make every screen use real backend contracts and expose honest UI states. Frontend must not hide backend gaps with local sample data, placeholder panels, fake success states, or routes that appear functional while the backend is absent.

A screen is not `Done` unless it is integrated end-to-end with the backend contract and has loading, empty, error, success and permission states where relevant.

## Immediate integration rules

1. Do not use placeholder arrays, static fake cards, or local sample records for completed screens.
2. Do not keep CTA buttons that do nothing, route nowhere meaningful, or trigger fake success.
3. Do not pass `userId` manually into private procedures once backend provides protected contracts.
4. Use authenticated tRPC context and generated API contracts where available.
5. All screens must render real backend errors clearly.
6. All billable actions must show cost before spend and display failure states.
7. If backend contract is missing, the screen is blocked, not finished.

## Screen instructions

### Applications

Backend is currently legacy-heavy. When backend migrates applications to protected procedures:

- Remove client-supplied `userId` from private application calls.
- Use canonical status enum and transitions from backend.
- Show real errors for forbidden, not found and precondition failures.
- Confirm generated documents and email send use owned application only.

Acceptance:

- Applications list, create, update status, generate documents, send email, follow-up and report download work with real backend.
- No local application queue logic contradicts backend Review queue.

### Applications Review

Backend `reviewRouter` is the source of truth.

- Use `review.getQueue` for ranking and recommendation.
- Do not derive review recommendations locally from raw application rows.
- Use backend mutations for follow-up, move-to-interview, close and no-response actions.

Acceptance:

- UI displays backend-provided `recommendedAction`, `recommendationReasons`, `listingStatus`, and related job.
- Mutations update backend and refresh queue.

### Billing

- Use protected billing contracts once backend migrates spend, payment and account routes.
- Remove client-supplied `userId` from private billing calls.
- Show cost before spend.
- Do not show a successful purchase or spend until backend confirms it.

Acceptance:

- Ledger, pending spend, account state, credit packs and usage history reflect real backend state.
- Payment and credit flows use authenticated backend ownership, not client-owned identity fields.

### Profile

- Do not use `updateFull` in a way that sends partial payloads which clear arrays accidentally.
- After backend fix, use explicit patch or replace semantics.
- Make destructive replacement visible in UI if clearing child collections.

Acceptance:

- Updating personal info does not remove skills, experiences, educations or trainings.
- Empty arrays clear only when user explicitly clears that section.

### Settings

- Do not display `aiSuggestions` as saved unless backend persists it.
- If backend removes `aiSuggestions`, remove it from the UI contract.
- If backend persists it, verify round-trip.

Acceptance:

- Toggle state after save matches state after reload.

### Security

- Use protected security procedures only.
- Remove `userId` from security calls.
- Display forbidden and not found correctly.

Acceptance:

- Passkeys and sessions shown are only current user's rows.
- Revoke/remove updates backend and UI without fake optimistic success hiding backend failure.

### Style Studio

- Use protected endpoints for rewrite and generate once backend migrates them.
- Display model output vs fallback provenance if backend returns fallback metadata.
- If action costs credits, show cost and approval state.

Acceptance:

- No public userId-based AI calls remain for user-specific document generation.
- Fallback text is marked if it is not full model output.

### Interview / Live Interview / Coach

- Stop using legacy public `finishAnswer` if present.
- Use protected canonical interview, liveInterview and coach procedures.
- Display billing and spend failure states.
- Do not mark a session complete unless backend confirms completion.

Acceptance:

- Session writes go through the canonical protected backend contract.
- Session history reflects persisted backend records.
- Coach evaluation shows real backend result and credits used.

### Jobs / Job Radar

- Use public job discovery only for public job data.
- Use protected routes for saved jobs, user statuses, fit explanations, session-cookie-assisted discovery, Job Radar scans and reports.
- Do not compute employer risk or scan state locally when backend owns it.

Acceptance:

- Public anonymous state does not include profile-derived or user-specific data.
- Authenticated state is scoped to current user.

### Documents

- Treat document text as sensitive.
- Do not claim encryption in UI unless backend implements real encryption, not base64 storage.
- Use versioned document endpoints for lineage/version UI.

Acceptance:

- Upload, list, delete, getText and version flows use backend ownership.
- UI copy does not overstate security guarantees.

### Community Centre, Daily Warmup, Negotiation, AI Analysis

Current issue:

- Backend canonical contracts on main are missing or unclear for these screens.

Required frontend work:

- Do not present these screens as fully complete unless backend contract exists.
- No placeholder stream cards or fake pending feeds as final functionality.
- If temporarily visible, label as unavailable or coming soon only if product explicitly allows it.
- Prefer blocked state over fake functionality.

Acceptance:

- Each screen has a real backend namespace or documented shared backend contract.
- Every CTA either performs a backend-backed action or is removed or disabled with honest explanation.

## Required PR evidence

Every frontend PR must include:

- screens touched,
- backend procedures called,
- loading, empty, error and success states covered,
- screenshots or concise UI evidence,
- tests run,
- smoke path tested,
- confirmation that no local mock data or placeholder data is used for completed flows.

## Task pass/fail rule

Frontend task passes only when:

1. Screen uses real backend data.
2. No placeholder data hides missing backend work.
3. No fake success state exists.
4. No private call passes client-supplied user identity once backend contract is protected.
5. Error, empty and loading states are visible and honest.
6. Backend agent confirms contract is implemented and tested.
7. QC confirms `Done`.

If frontend has to say `waiting for backend`, the task is blocked, not done.
