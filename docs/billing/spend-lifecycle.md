# Spend Lifecycle

## Purpose
This document defines the required lifecycle of paid or credit-consuming backend actions.

## Lifecycle stages

### 1. Estimate
The backend computes:
- pricing mode
- estimated cost
- maximum approved cost
- relevant execution metadata

### 2. Approve
The user approves the action if approval is required.
The backend records:
- approved maximum
- action reference
- approval timestamp

### 3. Authorize
The backend verifies:
- available balance or allowance
- feature eligibility
- pricing validity

If valid, the backend creates an authorized spend record.

### 4. Execute
The backend runs the actual action:
- AI inference
- synthesis
- export
- scan
- session
- processing flow

### 5. Settle
After execution:
- commit final cost if successful
- reduce final cost if execution used less depth
- cancel if failed

### 6. Record
Write durable records to:
- spend event history
- pending charges where applicable
- billing ledger

## Hard rules
- no hidden spend
- no execution without backend authorization
- no overrun beyond approved maximum without fresh consent
- no silent failure with retained charge
- no frontend-only balance truth

## Failure handling
If execution fails:
- mark the spend event as failed or cancelled
- release the authorization where applicable
- return a clear user-facing result

## Auditability
At any time, the system should make it possible to answer:
- what was approved
- what actually ran
- what was finally charged
- why the amount was charged
- whether any cancellation occurred
