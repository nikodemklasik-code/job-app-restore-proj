# URGENT TASK — Profile must work end-to-end

## Priority

P0 / urgent.

The Profile screen must become fully functional across backend, frontend, persistence, validation and tests. It is not acceptable for Profile to be visually present while profile sections fail to save, reload incorrectly, lose nested data, or rely on local placeholder state. A profile page that eats user data is not a profile page. It is a shredder with inputs.

## Current QC concern

The current backend contains a dangerous compatibility path in `backend/src/trpc/routers/profile.router.ts`:

- `profile.updateFull` defaults `skills`, `experiences`, `educations`, and `trainings` to empty arrays.
- The mutation then deletes existing rows and reinserts from input.
- If frontend sends a partial payload, omitted arrays can be interpreted as empty arrays and existing profile data can be deleted.

This must be fixed before Profile can be accepted.

## Required backend scope

Backend agent must make Profile server-authoritative and safe.

Required capabilities:

1. `getProfile` or `getFull` returns the full current user profile from the database.
2. Personal info saves and reloads correctly:
   - full name,
   - email if editable by product contract,
   - phone,
   - location,
   - headline,
   - summary,
   - LinkedIn URL,
   - CV URL.
3. Skills save and reload correctly.
4. Experiences save and reload correctly.
5. Educations save and reload correctly.
6. Trainings/certifications save and reload correctly.
7. Career goals save and reload correctly:
   - current role,
   - current salary,
   - target role,
   - target salary or range,
   - seniority,
   - work values,
   - auto-apply threshold,
   - strategy fields where supported.
8. Social consents save and reload correctly.
9. Preference flags save and reload correctly.
10. Match context and growth recommendation endpoints reflect saved profile data.

## Required backend fixes

### Fix `updateFull` semantics

Missing arrays must mean: leave existing data unchanged.

Provided arrays must mean: replace that specific section.

Provided empty arrays must mean: intentionally clear that specific section.

Do not use `.default([])` for destructive child collections in partial compatibility payloads.

### Separate patch vs replace semantics

Preferred contract:

- `savePersonalInfo` patches personal fields only.
- `saveSkills` replaces skills only.
- `replaceExperiences` replaces experiences only.
- `replaceEducations` replaces educations only.
- `replaceTrainings` replaces trainings only.
- `saveCareerGoals` patches career goals only.
- `updateFull` is either made safe for partial payloads or documented as full replace and used only with full payload.

### Authentication and ownership

Private profile data must use authenticated backend identity:

- use `protectedProcedure`,
- use `ctx.user.id`,
- do not trust client-supplied `userId` for private profile ownership.

Legacy public profile procedures must be migrated, removed, or explicitly isolated if truly still required.

## Required frontend scope

Frontend agent must integrate Profile with real backend state.

Required behaviour:

1. Profile loads from backend on page open.
2. Each section shows loading state.
3. Each section shows backend error state.
4. Saving a section updates backend.
5. Reloading the page shows persisted values.
6. Updating one section does not erase another section.
7. Empty section states are honest, not placeholder data.
8. Save buttons are disabled or show progress while saving.
9. Validation errors are visible and mapped to the right fields.
10. No local-only profile state is presented as persisted data.

## End-to-end acceptance scenarios

### Scenario 1 — Personal info patch

1. User has existing skills and one experience.
2. User edits only phone and headline.
3. Save personal info.
4. Reload profile.
5. Phone and headline are updated.
6. Existing skills and experience are still present.

Pass only if no nested data is lost.

### Scenario 2 — Skills replace

1. User has skills: `React`, `TypeScript`.
2. User changes skills to `React`, `Node.js`.
3. Save skills.
4. Reload profile.
5. Skills are exactly `React`, `Node.js`.
6. Experiences, educations and trainings remain unchanged.

### Scenario 3 — Intentional clear

1. User has trainings.
2. User explicitly removes all trainings in the trainings section.
3. Save trainings.
4. Reload profile.
5. Trainings are empty.
6. Other sections remain unchanged.

### Scenario 4 — Career goals

1. User edits target role, salary range, seniority and work values.
2. Save career goals.
3. Reload profile.
4. Values persist.
5. Dashboard/Profile match context reflects the updated target role and values.

### Scenario 5 — Consent and flags

1. User toggles social consent and preference flags.
2. Save.
3. Reload.
4. Values persist exactly.

## Required tests

Backend tests must cover:

- partial `updateFull` does not clear omitted child collections,
- provided empty array clears only that section,
- section-specific save methods do not mutate unrelated sections,
- authenticated user cannot read or write another user's profile,
- `getProfile` after save returns persisted values.

Frontend tests or smoke evidence must cover:

- profile load,
- edit personal info,
- edit skills,
- edit experience,
- edit education,
- edit trainings,
- edit career goals,
- reload and verify persistence,
- backend error display.

## PR evidence required

Backend PR must include:

- changed profile procedures,
- exact semantics for patch vs replace,
- tests run,
- migration notes if any,
- ownership/auth explanation.

Frontend PR must include:

- Profile components touched,
- backend procedures called,
- screenshots or screen notes for loaded, saving, error and saved states,
- smoke evidence that reload keeps data,
- confirmation that no section uses placeholder data as final state.

## Completion phrase

Backend agent may only mark backend ready by writing:

`Backend contract implemented and tested for Profile.`

Frontend agent may only mark frontend ready by writing:

`Frontend integrated with real Profile backend contract and tested.`

QC will only accept with:

`Profile Done.`

Anything else is not accepted.
