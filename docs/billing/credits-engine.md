# Credits Engine

## Purpose
The credits engine governs how heavier AI and processing actions consume credits in a predictable, auditable, and backend-authoritative way.

## Core Rule
Show cost first. Approve second. Execute third. Settle fairly. Never spend silently.

## Credit Action Models

### Fixed Cost
Use fixed-cost pricing when compute load and execution depth are predictable.

The user must see the exact cost before the action starts.

### Estimated Cost
Use estimated-cost pricing when execution cost depends on response depth, number of sources, model tier, session length, or synthesis complexity.

Every estimated action must expose:
- estimated cost
- maximum approved cost
- pricing mode
- execution scope

The backend must not exceed the approved maximum without fresh user confirmation.

## Backend Authority
The backend is the only source of truth for:
- price calculation
- approval
- authorization
- commit
- cancellation
- ledger durability

The frontend may preview cost, but it must never be treated as the final authority.

## Spend Lifecycle
Every spend event must move through explicit states:
- estimated
- approved
- authorized
- committed
- cancelled
- failed
- refunded where applicable

## Required Spend Event Fields
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

## Settlement Rules
If an action completes successfully, commit the final cost and write a durable ledger event.

If an action fails, cancel or adjust the spend and show the user a clean outcome.

If an action completes below the estimated depth, the final charge may be lower.

The final charge must never be higher than the approved maximum without new consent.

## Trust Rule
Credits must feel visible, predictable, auditable, fair, and reversible when appropriate.
