# Shared practice shell + routing — refactor spec (v1.0)

Parent index: [`README.md`](./README.md)

---

## Core product rule (reminder)

These four modules may share a common visual language, but they must not share the same product purpose.

### Shared UI language

They may share:

- layout rhythm  
- hero structure  
- mode cards  
- cost cards  
- support rails  
- action bars  

### Different product roles

They must remain clearly distinct in:

- purpose  
- interaction model  
- expected outcome  
- session logic  
- pricing logic  

---

## Shared front-end shell

These four modules should use a shared visual shell.

### New shared components

Create:

```text
frontend/src/features/practice-shell/components/
  PracticeHeroHeader.tsx
  PracticeModeCard.tsx
  PracticeCostCard.tsx
  PracticeSessionPanel.tsx
  PracticeSupportRail.tsx
  PracticeActionBar.tsx
  PracticeProgressBadge.tsx
```

### Shared shell structure

Each module should use:

- **Hero Header**  
- **Mode / Duration / Depth Selector**  
- **Visible Cost Panel**  
- **Main Interaction Area**  
- **Right Support Rail**  
- **Action Footer**  

### Rule

**Shared shell does not mean shared product logic.**

---

## Routing changes

### Target routes

Keep only:

- `/warmup`  
- `/coach`  
- `/interview`  
- `/negotiation`  

### Required naming in UI

- **Daily Warmup**  
- **Coach**  
- **Interview**  
- **Negotiation**  

### Must remove from UI naming

- `InterviewWarmup`  
- `NegotiationCoach`  

### Files to update

- `frontend/src/router.tsx`  
- sidebar / nav / header route labels  
- any links or redirect helpers pointing to old names  
