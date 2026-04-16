# Agent A Delivery Report - Skills And Courses

> **Superseded for process hygiene:** the canonical Agent A submission for QC intake is now `docs/qc-reports/agent-a-report.md` (includes the Skills Lab + Profile work listed below, plus the wider Agent A slice described in that report).
>
> This document is retained as an archival detail note for the Skills↔Courses UI evidence fields.

Completed work

- Implemented the Skills And Courses delivery in frontend UI with explicit skill-to-course evidence mapping.
- Added required fields in Skills Lab:
  - Related Skills
  - Courses Supporting This Skill
  - This Course Strengthens
  - Learning Evidence
  - Still Needs Practice
  - Still Needs Verification
- Added a matching Skills And Courses Link section in Profile to expose the same evidence model in profile context.
- Fixed TypeScript strictness issue by normalizing course `credentialUrl` to `string | null`.

Changed files / modules

- `frontend/src/app/skills/SkillsLab.tsx`
  - Added `buildSkillCourseLinks(...)`
  - Added Skills And Courses UI section and evidence cards
  - Added type-safe credential URL normalization
- `frontend/src/app/profile/ProfilePage.tsx`
  - Added memoized skills-to-courses mapping
  - Added Skills And Courses Link section with required evidence and follow-up fields

Result

- Users can now see clear links between declared skills and courses/certifications.
- Courses are presented as learning evidence for skills, not as isolated entries.
- Required QC fields are visible in both Skills Lab and Profile views.
- Frontend build passes with current changes.

How to verify

- Build check:
  - `cd /Users/nikodem/job-app-restore/proj/frontend && npm run build`
- UI checks:
  - Open `/skills` and confirm section `Skills And Courses` is present with all required fields.
  - Open `/profile` and confirm section `Skills And Courses Link` is present with linked course/certificate evidence.
- State checks:
  - With no skills/trainings: empty guidance is shown.
  - With skills/trainings: cards render with evidence and follow-up labels.
  - With missing credential URLs: fallback evidence message is shown.

Known limitations / follow-up

- Current linking is heuristic (string matching + fallback), not contract-backed relation mapping.
- Recommended follow-up: Agent B provides persistent relation/API (`skillId`, `courseId`, `evidence`, `confidence`) for deterministic mapping.
- This delivery is frontend-only and does not introduce backend telemetry.

Status

- READY FOR QC

