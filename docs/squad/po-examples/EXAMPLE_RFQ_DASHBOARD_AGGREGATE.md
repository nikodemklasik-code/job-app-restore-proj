# RFQ — Dashboard Aggregate Snapshot

## Metadata
- RFQ ID: SCREEN-A-001
- Date: 2026-04-19
- Owner Role: AGENT_1
- Slice Type: SCREEN_SLICE
- Screen: Dashboard
- Slice Title: dashboard aggregate snapshot
- Priority: P0
- RFQ Path: docs/agent-work/dashboard-dashboard-aggregate-snapshot-rfq.md
- Report Path: docs/qc-reports/dashboard-dashboard-aggregate-snapshot-ready-for-qc.md

## Goal
Deliver a single dashboard snapshot contract that powers loading / empty / error / populated states and one next-best-action card.

## Route And User Surface
- Route: /dashboard
- FE entry file: frontend/src/app/dashboard/DashboardPage.tsx
- Related components: dashboard cards / quick stats / next action card
- Existing user path into this screen: auth -> dashboard
- Expected next step out of this screen: profile, jobs, applications, interview, billing

## Backend Ownership
- Router(s): create or harden dashboard aggregate path using existing profile, billing, applications, jobs owners
- Service(s): dashboard aggregate service / mapper
- DTO / contract owner: DashboardSnapshot
- Persistence touched: no new persistence
- Billing touched: read-only
- Audit / report touched: no

## In Scope
- single snapshot response
- loading / empty / error / populated FE states
- one next-best-action card based on snapshot

## Out Of Scope
- redesign of all dashboard cards
- full reports integration
- new analytics system

## Production Readiness (This Slice)
- dashboard must not depend on many unrelated spinners
- next-best-action must be explicit
- partial backend failure must not blank the whole page

## Cross-Flows Touched
- Dashboard -> Profile
- Dashboard -> Jobs
- Dashboard -> Interview
- Dashboard -> Billing

## API / DTO Contract
- Query: dashboard.getSnapshot
- Response DTO: DashboardSnapshot
- Error states: aggregate unavailable, partial modules unavailable

## Acceptance Criteria
- [ ] one snapshot powers page
- [ ] loading/empty/error/populated render
- [ ] next-best-action card routes correctly
- [ ] partial missing modules show warning, not full crash

## Tests Required
- Unit: mapper
- Integration: aggregate query
- Smoke: /dashboard route
- Route proof: screenshot/log
- Billing proof: snapshot includes billing read data
- Persistence proof: refresh keeps same state shape

## Files Expected To Change
- frontend/src/app/dashboard/DashboardPage.tsx
- backend aggregate path
- shared dto file if needed

## Risks / Rollback
- Failure mode: dashboard blank due to aggregate failure
- Rollback path: revert to previous page composition
- What must NOT be broken by this slice: profile, jobs, billing routes
