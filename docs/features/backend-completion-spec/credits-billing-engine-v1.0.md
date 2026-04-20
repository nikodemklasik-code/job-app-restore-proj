# Credits and billing engine — backend spec

Index: [`README.md`](./README.md) · Monolit §1: [`_imported-full-spec-v1.0.md`](./_imported-full-spec-v1.0.md)

---

## Status

This is one of the largest remaining backend gaps.

The old billing model does not yet appear to be fully aligned with the new philosophy:
- full product access for all
- monthly free allowance
- credits-first usage
- visible cost per action
- approval before dynamic spend
- no hidden credit consumption

---

## Required backend features

Implement:
- **Monthly Free Allowance**
- **Credit Balance**
- **Credit Packs**
- **Credit Spend Events**
- **Fixed-Cost Actions**
- **Estimated-Cost Actions**
- **Approval Before Spend**
- **Maximum Approved Cost**
- **Usage History**
- **Monthly Reset Logic**
- **No Rollover Logic** unless intentionally added later

---

## Required data model areas

- user credit balance
- monthly free allowance balance
- action cost type
- spend status
- approval status
- usage history entries
- reset timestamps
- pack purchases

---

## Required API / service logic

- get current balance
- get monthly allowance remaining
- estimate action cost
- approve spend
- deduct spend
- reject spend if insufficient balance
- create usage history entries
- reset allowance monthly

---

## QC must validate

- fixed cost actions deduct correctly
- estimated cost actions require user approval
- actual spend never exceeds approved maximum
- free allowance resets correctly
- no hidden spend occurs
- billing and usage history remain consistent
