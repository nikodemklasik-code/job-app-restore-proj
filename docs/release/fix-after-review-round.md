# Fix Round After Review

Date: 2026-04-21

## Real fixes applied after review feedback
1. Fixed runtime JSON parsing crash (`Unexpected token '<'`) by using `parseJsonSafely` in Assistant/Coach/Interview/Negotiation transcribe flows.
2. Made local smoke test green and deterministic by adding `scripts/smoke-local.sh` and wiring `package.json` script.
3. Completed mature-module audit + label sync to `APP_SCREENS`.
4. Restored compatibility in practice-shell components (`PracticeHeroHeader`, `PracticeCostCard`, `PracticeProgressBadge`) to support both legacy and config-driven props.

## Outcome
- Build, tests, and local smoke are green after the fix round.
