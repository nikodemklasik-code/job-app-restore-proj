# 19 Screens — RFQ Template (Required For Chain Entry)

## Metadata
- RFQ ID:
- Date:
- Owner Role: AGENT_1 / AGENT_2 / AGENT_3
- Slice Type: SCREEN_SLICE / CROSS_FLOW_SLICE / INFRA_SLICE
- Screen:
- Slice Title:
- Priority: P0 / P1 / P2
- RFQ Path:
- Report Path:
- Related Canonical Docs:
  - docs/features/19-screens-canonical-implementation-and-gap-map-v1.md
  - docs/features/19-screens-production-readiness-and-cross-flows-v1.md

## Goal
One bounded sentence describing what this slice delivers.

## Route And User Surface
- Route:
- FE entry file:
- Related components:
- Existing user path into this screen:
- Expected next step out of this screen:

## Backend Ownership
- Router(s):
- Service(s):
- DTO / contract owner:
- Persistence touched:
- Billing touched: yes / no
- Audit / report touched: yes / no

## In Scope
- 
- 
- 

## Out Of Scope
- 
- 
- 

## Production Readiness (This Slice)
List only the production-ready bars this slice must close. Do not claim the whole screen or whole spine.
- 
- 
- 

## Cross-Flows Touched
List only direct flows touched by this slice.
- Screen A -> Screen B:
- Screen B -> Screen C:

## API / DTO Contract
- Query / mutation names:
- Request DTO:
- Response DTO:
- Error states that must be user-visible:

## UI States Required
- Loading
- Empty
- Error
- Populated

## Acceptance Criteria
- [ ]
- [ ]
- [ ]
- [ ]

## Tests Required
- Unit:
- Integration:
- Smoke:
- Route proof:
- Billing proof (if applicable):
- Persistence proof:

## Files Expected To Change
- 
- 
- 

## Risks / Rollback
- Failure mode:
- Rollback path:
- What must NOT be broken by this slice:

## Delivery Instructions To Agent
- Commit only bounded scope.
- Do not widen into adjacent screens.
- Update report at Report Path.
- If blocked, state blocker explicitly and stop.
