# Wallet and Ledger Contract

## Purpose
This document defines the contract for wallet visibility, ledger durability, and pending spend representation.

## Wallet principles
The wallet must always expose:
- current spendable balance
- pending spend
- posted spend history
- free allowance if applicable
- estimated cost before heavy actions
- recent usage history

The wallet must never feel ambiguous.

## Wallet categories
The product may support:
- allowance balance
- purchased credits
- promo credits
- referral credits
- patron credits
- authorized spend
- committed spend
- adjustments

## Required wallet views
### Available balance
The amount that can currently be spent without exceeding limits.

### Posted ledger
Committed charges and credits that already affected the account.

### Pending spend
Queued or authorized charges that may affect the account when committed.

## Ledger entry contract
A posted ledger entry should include:
- id
- direction
- category
- description
- currency
- amountCents
- sourceType
- sourceId
- occurredAt

## Pending charge contract
A pending charge should include:
- id
- category
- status
- description
- currency
- amountCents
- sourceType
- sourceId
- expectedCommitAt
- createdAt

## Billing summary contract
A billing summary should include:
- currency
- postedDebitCents
- postedCreditCents
- postedNetCents
- pendingDebitCents
- pendingCreditCents
- pendingNetCents
- availableBalanceCents
- pendingCount
- postedCount

## Durability rule
Every committed spend must produce a durable ledger entry.
Every pending spend must produce a durable pending charge entry or equivalent authorization event.

## Fairness rule
If an authorized action fails, the pending authorization must be cancelled or adjusted.
The system must not leave unclear charges without an execution outcome.
