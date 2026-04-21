# Review Regression Checklist (Post-PR)

Date: 2026-04-21

## Scope covered
- Sidebar + router consistency
- Billing visibility and labels
- Practice modules (Warmup / Coach / Interview / Negotiation)
- Dashboard readiness panels
- Settings readiness summary
- Mature modules: SkillsLab, Job Radar, Legal Hub, Billing
- Build/tests/smoke

## Checklist status
- [x] Sidebar uses centralized `APP_SCREENS`
- [x] Router aliases present (`interview-warmup`, `negotiation-coach`)
- [x] Practice-shell components support new + legacy props where needed
- [x] Warmup page compiles with current practice-shell API
- [x] Dashboard renders readiness cards
- [x] Settings renders readiness summary
- [x] Mature module labels aligned to `APP_SCREENS`
- [x] `npm run build` passes
- [x] `npm run test:frontend` passes
- [x] `npm run test:backend` passes
- [x] `npm run smoke:local` passes
