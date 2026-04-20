# Billing and credits — refactor spec (v1.0)

Parent index: [`README.md`](./README.md)

Module credit numbers: [`daily-warmup-v1.0.md`](./daily-warmup-v1.0.md), [`coach-v1.0.md`](./coach-v1.0.md), [`interview-v1.0.md`](./interview-v1.0.md), [`negotiation-v1.0.md`](./negotiation-v1.0.md).

---

## Product philosophy

No exclusive functional subscription tiers.

Every user has access to all modules.  
Usage is controlled by:

- **Monthly Free Allowance**  
- **Credit Balance**  
- **Visible Cost Per Action**  
- **Approval Before Dynamic Spend**  

---

## Monthly free allowance

Each user receives monthly:

- **1 Interview Lite · 7 Min**  
- **5 Assistant Replies**  
- **2 Daily Warmups**  
- **Basic Job Search**  
- **Basic Job Radar Browse**  
- **Mini Models Only**  

---

## Billing screen direction

Refactor Billing into:

- **Current Credit Balance**  
- **Monthly Free Allowance**  
- **Credits Used This Month**  
- **Buy Credits**  
- **Cost Per Action**  
- **Usage History**  
- **Estimated Cost Rules**  

### Files to update

- `frontend/src/app/billing/BillingPage.tsx`  
- `frontend/src/stores/billingStore.ts`  

---

## Credit logic rules

### Fixed cost actions

Used for:

- Daily Warmup  
- PDF Export  
- Basic Assistant Reply  
- Interview Lite  
- Basic Job Match  

### Estimated cost + approval

Used for:

- Coach  
- Legal Hub Search  
- Deep AI Analysis  
- Negotiation Deep Modes  
- more complex AI flows  

### Required user rule

Display:

- **Estimated Cost**  
- **Maximum Cost Without Further Approval**  
- **Continue For X Credits**  

If a higher cost is required, the system must ask again.
