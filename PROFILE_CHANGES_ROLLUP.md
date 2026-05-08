# Profile changes rollup — 2026-05-08

This file consolidates the Profile-related work found in the last-week Git history and the fixes applied in this commit.

## Historical Profile work found on `work`

- `2c637f6` — updated `backend/src/trpc/routers/profile.router.ts` while adding progressive job discovery UI.
- `c8940cf` — fixed multi-area persistence, including profile save behavior.
- `398d1fb` — added `achievements` to the shared `ProfileExperience` contract.
- `ca7e48d` — added the Profile redesign plan.
- `111ebaf` — added the SQL migration for `experiences.achievements`.
- `3c97c75` — added the achievements migration runner and documentation.
- `729c590` — added quick-start documentation for fixing Profile on the VPS.
- `06fe359` — added the final Profile fix summary.
- `507b81b` — added the related `relevance_score` migration for profile training relevance.

## Fixes applied in this commit

- Normalized the shared `ProfileExperience` interface formatting and made `achievements` part of every loaded experience snapshot.
- Added a defensive `normalizeAchievements()` helper in the Profile router so invalid JSON/null values cannot leak into the API response or database writes.
- Returned `achievements` from `fetchProfileSnapshot()` so Profile, documents, applications and matching flows can reuse outcome evidence.
- Accepted and saved `achievements` in `updateFull`, `replaceExperiences`, and the legacy `saveExperience` procedure.
- Preserved achievements when Profile screen state is hydrated from the backend.
- Added an editable “Achievements / Outcomes” textarea to the active Profile screen (`ProfileScreenV2`) with one outcome per line.

## Operational note

The production Profile load error described in earlier docs still depends on the database migration being present in the target environment. If production still reports `Unknown column 'achievements' in 'field list'`, run the existing VPS migration flow documented in `READY_TO_FIX_PROFILE.md`.
