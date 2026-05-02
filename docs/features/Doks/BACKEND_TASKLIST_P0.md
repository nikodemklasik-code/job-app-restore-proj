# BACKEND TASKLIST P0

## P0.1 Trust & Evidence Foundation
- [ ] Migration: skill_evidence
- [ ] Migration: employers
- [ ] Migration: employer_sources
- [ ] Migration: employer_signals
- [ ] Migration: score_audit_log
- [ ] Migration: product_events
- [ ] Seed: skills, employers, jobs, signals, credits

## P0.2 API & Scoring
- [ ] GET /api/job-radar
- [ ] GET /api/jobs/:jobId
- [ ] GET /api/skills/signals
- [ ] POST /api/skills/evidence
- [ ] GET /api/employers/:employerId/snapshot
- [ ] Job Fit Score v0
- [ ] Employer Trust Score v0
- [ ] Employer Risk Score v0
- [ ] Action Priority Score v0

## P0.3 Action & Credits
- [ ] POST /api/jobs/:jobId/save
- [ ] POST /api/jobs/:jobId/apply
- [ ] PATCH /api/applications/:id/status
- [ ] GET /api/credits/account
- [ ] GET /api/credits/ledger
- [ ] POST /api/credits/reservations
- [ ] POST /api/credits/reservations/:id/commit
- [ ] POST /api/credits/reservations/:id/cancel

## Final acceptance
- [ ] Every score has reasons/confidence/source metadata
- [ ] Every paid action uses reserve -> commit/cancel
- [ ] Ledger is append-only
- [ ] Apply creates Application + ApplicationEvent
- [ ] Shared TS types/OpenAPI delivered to frontend
