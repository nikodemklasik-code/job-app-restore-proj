# Credits Engine

## Purpose
The credits engine governs how heavier AI and processing actions consume credits in a predictable, auditable, and backend-authoritative way.

## Core rule
Show cost first. Approve second. Execute third. Settle fairly. Never spend silently.

## Credit action models

### Fixed-cost
Use fixed-cost pricing when compute load and execution depth are predictable.

Examples:
- short Daily Warmup tiers
- simple export flows
- basic assistant reply tiers
- short interview lite sessions

### Estimated-cost
Use estimated-cost pricing when execution cost depends on:
- response depth
- number of sources
- model tier
- session length
- synthesis complexity

Every estimated action must expose:
- estimated cost
- maximum approved cost
- pricing mode
- execution scope

The backend must not exceed the approved maximum without fresh user confirmation.

## Backend authority
The backend is the only source of truth for:
- price calculation
- approval
- reservation / authorization
- commit
- cancel
- refund
- ledger durability

The frontend may preview cost, but it must never be treated as the final authority.

## Spend lifecycle
Every spend event must move through explicit states:
- estimated
- approved
- reserved
- committed
- cancelled
- failed
- refunded

## Required spend event fields
Each spend event should include:
- userId
- actionType
- feature
- pricingMode
- estimatedCost
- approvedMaxCost
- actualCost
- modelTier
- sourceComplexity
- depthLevel
- status
- referenceId
- notes
- createdAt
- committedAt
- cancelledAt
- refundedAt
- refundReference

## Settlement rules
### Success
If the action completes successfully:
- commit the final cost
- ensure actualCost <= approvedMaxCost unless fresh approval was obtained
- write a durable ledger event

### Failure
If the action fails:
- cancel the reservation or reverse the spend
- do not silently keep the full charge
- write a durable failure / cancellation event

### Partial completion
If the action completes below the estimated depth:
- the final cost may be lower
- the final cost must never be higher than approved without new consent

## Safety rule
No expensive AI action may execute in a paid path unless the backend has:
1. validated the request
2. computed or confirmed cost
3. verified balance or allowance
4. approved or reserved spend
5. recorded the event

## Trust rule
Credits must feel:
- visible
- predictable
- auditable
- fair
- reversible when appropriate

The system must optimize for user trust, not hidden monetization.
