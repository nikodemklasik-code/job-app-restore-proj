# Deploy Status and Post-Prod Backlog

Date: 2026-04-21

## Deploy status
- Staging/prod deploy was **not executed in this container session** (no production credentials/remote runtime control here).

## Post-production backlog

### P0 (critical)
1. Validate production env vars after deploy (`DATABASE_URL`, Clerk/OpenAI secrets, webhook URLs).
2. Run production smoke for key routes and API health checks immediately after deploy.
3. Verify billing-related user paths (plan fetch, top-up, portal redirect) in production.

### P1 (important)
1. Add E2E route smoke (Playwright/Cypress) for 16 core app routes.
2. Add explicit contract tests for transcribe/TTS non-JSON fallback behavior.
3. Add CI gate for local smoke script execution in PR pipeline.

### P2 (polish)
1. Improve chunk-splitting for large frontend bundles.
2. Standardize practice-shell component APIs to remove legacy prop bridge later.
3. Expand audit docs with screenshots and UX acceptance notes.
