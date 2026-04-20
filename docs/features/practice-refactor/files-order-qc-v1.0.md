# Files, implementation order, QC — refactor spec (v1.0)

Parent index: [`README.md`](./README.md)

---

## Files to change

### Frontend files

- `frontend/src/app/warmup/DailyWarmupPage.tsx` (rename z `InterviewWarmup.tsx` — zrobione) + dalszy refactor  
- `frontend/src/app/coach/CoachPage.tsx`  
- `frontend/src/app/interview/InterviewPractice.tsx`  
- `frontend/src/app/negotiation/NegotiationPage.tsx` (rename z `NegotiationCoach.tsx` — zrobione) + dalszy refactor  
- `frontend/src/router.tsx`  
- `frontend/src/app/billing/BillingPage.tsx`  
- `frontend/src/stores/billingStore.ts`  

### New shared files

- `frontend/src/features/practice-shell/components/...`  

### Optional shared types

- `frontend/src/features/practice-shell/types/practice.types.ts`  

---

## Quality control rules

Quality Control must validate that:

### Daily Warmup

- it is truly short, light, and timed  
- it does not behave like interview or coach  

### Coach

- it is strategic guidance  
- it does not behave like question-bank interview mode  

### Interview

- it is clearly session-based interview practice  
- it does not feel like warmup or coach  

### Negotiation

- it is clearly negotiation-focused  
- it does not keep the mixed “coach / simulator” confusion  

### Billing

- credit cost is visible up front  
- dynamic actions require estimate + confirmation  
- no hidden spend exists  

---

## Implementation order

### Phase 1

- rename files  
- clean route names  
- clean nav names  

### Phase 2

- build shared practice shell components  

### Phase 3

- refactor the four screens against their new role definitions  

### Phase 4

- add visible credit logic and estimate / approval behaviour  

### Phase 5

- run Quality Control pass only for these four modules  
