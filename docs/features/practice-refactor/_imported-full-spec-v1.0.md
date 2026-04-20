# Warmup, Coach, Interview, And Negotiation Refactor Spec

> **Repo copy:** verbatim import from `Warmup_Coach_Interview_Negotiation_Refactor_Spec.md` (Downloads). For navigation, prefer the split docs in this folder — [`README.md`](./README.md).

## Purpose

This spec defines the required refactor for four currently mixed modules:

- **Daily Warmup**
- **Coach**
- **Interview**
- **Negotiation**

The goal is to:
- separate their product roles clearly
- align naming, routing, and UI structure
- introduce consistent credit visibility
- preserve a shared visual shell where helpful
- eliminate functional overlap and confusion

---

## Core Product Rule

These four modules may share a common visual language, but they must not share the same product purpose.

### Shared UI Language
They may share:
- layout rhythm
- hero structure
- mode cards
- cost cards
- support rails
- action bars

### Different Product Roles
They must remain clearly distinct in:
- purpose
- interaction model
- expected outcome
- session logic
- pricing logic

---

# 1. Daily Warmup

## Canonical Name
**Daily Warmup**

## File Change
Rename:

```text
frontend/src/app/warmup/InterviewWarmup.tsx
```

to:

```text
frontend/src/app/warmup/DailyWarmupPage.tsx
```

## Purpose
A short, repeatable daily practice ritual designed to build momentum, speed, and consistency.

## Emotional Effect
The user should feel:
- light
- quick
- energised
- low-friction
- capable of starting immediately

## What Daily Warmup Is
Daily Warmup is:
- fast practice
- daily repetition
- short-answer mode
- timed
- credit-light
- low setup

## What Daily Warmup Is Not
Daily Warmup is not:
- full interview simulation
- deep coaching
- negotiation strategy
- long-form reflection
- session-based case practice

## Main Sections
- **Hero Header**
- **Choose Duration**
- **Duration Cost Cards**
- **Quick Practice Start**
- **Your Pace**
- **Progress**
- **Recent Warmups**

## Duration Logic
- **15 Seconds** = **Free**
- **30 Seconds** = **1 Credit**
- **45 Seconds** = **2 Credits**
- **60 Seconds** = **3 Credits**

### User-Facing Rule
Display:
**As Many Questions And Answers As Fit In The Selected Time**

## Required Components
- **PracticeHeroHeader**
- **PracticeModeCard**
- **PracticeCostCard**
- **PracticeActionBar**
- **PracticeProgressBadge**

## Primary CTA
- **Start 15 Seconds**
- **Start 30 Seconds**
- **Start 45 Seconds**
- **Start 60 Seconds**

## Secondary CTA
- **View Progress**
- **Repeat Last Warmup**

## Required States
- **Loading**
- **Empty**
- **Error**
- **Ready**
- **Running**
- **Completed**

## What Must Never Be Mixed Into Daily Warmup
- interview lobby
- deep coaching prompts
- negotiation counter-offers
- long answer reviews
- complex strategic framing

---

# 2. Coach

## Canonical Name
**Coach**

## File
Keep:

```text
frontend/src/app/coach/CoachPage.tsx
```

## Purpose
A deeper strategic support space that helps the user frame, reframe, understand, and strengthen their professional position.

## Emotional Effect
The user should feel:
- guided
- understood
- sharpened
- steadier
- more strategic

## What Coach Is
Coach is:
- strategic guidance
- narrative reframing
- confidence support
- career positioning
- deeper reflection
- action planning

## What Coach Is Not
Coach is not:
- full interview simulation
- daily timed practice
- negotiation simulator
- raw question bank
- quick-fire drill mode

## Main Sections
- **Hero Header**
- **Current Challenge**
- **Choose Coaching Depth**
- **Estimated Cost**
- **Coach Guidance**
- **Reframing**
- **Action Plan**
- **Growth Direction**

## Coaching Modes
- **Quick Reframe**
- **Structured Guidance**
- **Deep Coaching**

## Credit Logic
Coach uses estimated cost with approval before spend.

### Example Cost Bands
- **Quick Reframe** = **2 Credits**
- **Structured Guidance** = **4 Credits**
- **Deep Coaching** = **7 Credits**
- **High Complexity Session** = **9 Credits**

## Cost Rule
Display:
- **Estimated Cost**
- **Maximum Cost Without Further Approval**
- **Continue For X Credits**

### Required User Protection
The system must not exceed the shown cost without explicit user confirmation.

## Required Components
- **PracticeHeroHeader**
- **PracticeModeCard**
- **PracticeCostCard**
- **PracticeSessionPanel**
- **PracticeSupportRail**
- **PracticeActionBar**

## Primary CTA
- **Continue For X Credits**
- **Start Quick Reframe**
- **Start Structured Guidance**
- **Start Deep Coaching**

## Secondary CTA
- **Change Depth**
- **Review Action Plan**

## Required States
- **Loading**
- **Empty**
- **Error**
- **Ready**
- **Estimate Shown**
- **In Session**
- **Completed**

## What Must Never Be Mixed Into Coach
- live interview turn-taking
- timer-first warmup logic
- negotiation pricing / offers
- interview question-bank identity
- mock interview lobby behaviour

---

# 3. Interview

## Canonical Name
**Interview** or **Interview Practice**

## File
Keep:

```text
frontend/src/app/interview/InterviewPractice.tsx
```

## Purpose
A realistic interview practice environment with structured questions, live answering, and review.

## Emotional Effect
The user should feel:
- engaged
- alert
- challenged
- professionally tested
- closer to a real interview

## What Interview Is
Interview is:
- mock interview
- realistic practice
- session-based
- question and answer flow
- answer review
- summary and takeaways

## What Interview Is Not
Interview is not:
- daily ritual warmup
- strategic coaching
- negotiation rehearsal
- generic AI chat
- low-stakes repetition only

## Main Sections
- **Hero Header**
- **Choose Interview Mode**
- **Interview Cost Cards**
- **Interview Setup**
- **Live Practice**
- **Answer Review**
- **Session Summary**

## Interview Modes
- **Interview Lite · 7 Min**
- **Interview Standard**
- **Interview Deep Practice**

## Credit Logic
- **Interview Lite · 7 Min** = monthly free allowance once
- **Interview Standard** = **4 Credits**
- **Interview Deep Practice** = **6 Credits**
- **Interview Deep Practice With Better Model** = **8 Credits**

## Required Components
- **PracticeHeroHeader**
- **PracticeModeCard**
- **PracticeCostCard**
- **PracticeSessionPanel**
- **PracticeSupportRail**
- **PracticeActionBar**

## Primary CTA
- **Start Interview Lite**
- **Start Interview Standard**
- **Start Deep Practice**

## Secondary CTA
- **Review Last Session**
- **Change Interview Mode**

## Required States
- **Loading**
- **Empty**
- **Error**
- **Ready**
- **Setup**
- **Connecting**
- **Live**
- **Processing**
- **Completed**

## What Must Never Be Mixed Into Interview
- daily warmup timer identity
- strategic coach reframing blocks as the primary mode
- negotiation offer or counter-offer logic
- low-depth micro-practice branding

---

# 4. Negotiation

## Canonical Name
**Negotiation**

## File Change
Rename:

```text
frontend/src/app/negotiation/NegotiationCoach.tsx
```

to:

```text
frontend/src/app/negotiation/NegotiationPage.tsx
```

## Purpose
A negotiation-focused module for salary, conditions, boundaries, terms, and response strategy.

## Emotional Effect
The user should feel:
- clearer
- stronger
- less passive
- more deliberate
- more prepared to respond

## What Negotiation Is
Negotiation is:
- offer handling
- counter-offer strategy
- reply drafting
- boundary setting
- condition framing
- negotiation simulation as a sub-mode

## What Negotiation Is Not
Negotiation is not:
- generic coaching
- full interview practice
- warmup timer training
- mixed coach + simulator identity

## Main Sections
- **Hero Header**
- **Negotiation Context**
- **Choose Mode**
- **Estimated Cost**
- **Suggested Positioning**
- **Reply Drafts**
- **Boundary Support**
- **Counter Strategy**

## Negotiation Modes
- **Quick Reply Draft**
- **Counter Offer**
- **Strategy**
- **Simulation**

## Credit Logic
- **Quick Reply Draft** = **2 Credits**
- **Counter Offer** = **3 Credits**
- **Strategy** = **5 Credits**
- **Simulation** = **7 Credits**

## Required Components
- **PracticeHeroHeader**
- **PracticeModeCard**
- **PracticeCostCard**
- **PracticeSessionPanel**
- **PracticeSupportRail**
- **PracticeActionBar**

## Primary CTA
- **Continue For X Credits**
- **Start Quick Reply Draft**
- **Start Counter Offer**
- **Start Strategy**
- **Start Simulation**

## Secondary CTA
- **Change Mode**
- **Review Draft**
- **Compare Replies**

## Required States
- **Loading**
- **Empty**
- **Error**
- **Ready**
- **Estimate Shown**
- **In Session**
- **Completed**

## What Must Never Be Mixed Into Negotiation
- coach identity as the primary naming
- interview question-bank flow
- daily warmup time loop
- generic multi-purpose simulator branding

---

# 5. Shared Front-End Shell

These four modules should use a shared visual shell.

## New Shared Components
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

## Shared Shell Structure
Each module should use:
- **Hero Header**
- **Mode / Duration / Depth Selector**
- **Visible Cost Panel**
- **Main Interaction Area**
- **Right Support Rail**
- **Action Footer**

## Rule
Shared shell does not mean shared product logic.

---

# 6. Routing Changes

## Target Routes
Keep only:

- `/warmup`
- `/coach`
- `/interview`
- `/negotiation`

## Required Naming In UI
- **Daily Warmup**
- **Coach**
- **Interview**
- **Negotiation**

## Must Remove From UI Naming
- `InterviewWarmup`
- `NegotiationCoach`

## Files To Update
- `frontend/src/router.tsx`
- sidebar / nav / header route labels
- any links or redirect helpers pointing to old names

---

# 7. Billing And Credits Refactor

## Product Philosophy
No exclusive functional subscription tiers.

Every user has access to all modules.  
Usage is controlled by:
- **Monthly Free Allowance**
- **Credit Balance**
- **Visible Cost Per Action**
- **Approval Before Dynamic Spend**

## Monthly Free Allowance
Each user receives monthly:
- **1 Interview Lite · 7 Min**
- **5 Assistant Replies**
- **2 Daily Warmups**
- **Basic Job Search**
- **Basic Job Radar Browse**
- **Mini Models Only**

## Billing Screen Direction
Refactor Billing into:
- **Current Credit Balance**
- **Monthly Free Allowance**
- **Credits Used This Month**
- **Buy Credits**
- **Cost Per Action**
- **Usage History**
- **Estimated Cost Rules**

## Files To Update
- `frontend/src/app/billing/BillingPage.tsx`
- `frontend/src/stores/billingStore.ts`

---

# 8. Credit Logic Rules

## Fixed Cost Actions
Used for:
- Daily Warmup
- PDF Export
- Basic Assistant Reply
- Interview Lite
- Basic Job Match

## Estimated Cost + Approval
Used for:
- Coach
- Legal Hub Search
- Deep AI Analysis
- Negotiation Deep Modes
- more complex AI flows

## Required User Rule
Display:
- **Estimated Cost**
- **Maximum Cost Without Further Approval**
- **Continue For X Credits**

If a higher cost is required, the system must ask again.

---

# 9. Files To Change

## Frontend Files
- `frontend/src/app/warmup/InterviewWarmup.tsx` → rename and refactor
- `frontend/src/app/coach/CoachPage.tsx`
- `frontend/src/app/interview/InterviewPractice.tsx`
- `frontend/src/app/negotiation/NegotiationCoach.tsx` → rename and refactor
- `frontend/src/router.tsx`
- `frontend/src/app/billing/BillingPage.tsx`
- `frontend/src/stores/billingStore.ts`

## New Shared Files
- `frontend/src/features/practice-shell/components/...`

## Optional Shared Types
- `frontend/src/features/practice-shell/types/practice.types.ts`

---

# 10. Quality Control Rules

Quality Control must validate that:

## Daily Warmup
- it is truly short, light, and timed
- it does not behave like interview or coach

## Coach
- it is strategic guidance
- it does not behave like question-bank interview mode

## Interview
- it is clearly session-based interview practice
- it does not feel like warmup or coach

## Negotiation
- it is clearly negotiation-focused
- it does not keep the mixed “coach / simulator” confusion

## Billing
- credit cost is visible up front
- dynamic actions require estimate + confirmation
- no hidden spend exists

---

# 11. Implementation Order

## Phase 1
- rename files
- clean route names
- clean nav names

## Phase 2
- build shared practice shell components

## Phase 3
- refactor the four screens against their new role definitions

## Phase 4
- add visible credit logic and estimate / approval behaviour

## Phase 5
- run Quality Control pass only for these four modules

---

# 12. One-Line Developer Instruction

```text
Refactor Warmup, Coach, Interview, and Negotiation into four clearly separated modules with a shared visual shell but distinct product purpose. Rename InterviewWarmup to DailyWarmupPage, rename NegotiationCoach to NegotiationPage, keep Interview as realistic interview practice, keep Coach as strategic guidance, add visible credit cost logic, and update routing plus Billing to match the new credits-first model.
```

# 13. One-Line Quality Control Instruction

```text
Validate that Warmup, Coach, Interview, and Negotiation are no longer functionally mixed, that each screen has a distinct product role, that routing and naming are clean, and that visible credit cost logic is implemented correctly without hidden spend.
```
