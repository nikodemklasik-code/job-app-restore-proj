# Agent 3 Practice And Preferences Spec

**Obowiązujący obieg wykonania (szukanie raportów, dostawa, Ready For QC):** [`./IMPLEMENTATION_EXECUTION_RULES.md`](./IMPLEMENTATION_EXECUTION_RULES.md)

**Po werdykcie QC:** tylko kod + raport §6 — **§5a**, **Hard Rule 8** (bez dyskusji zamiast implementacji).

## Owner
**Agent 3**

## Workstream
Practice modules and user system preferences:
- Daily Warmup
- Coach
- Interview
- Negotiation
- Settings
- Consent
- Community Centre

## Mission
Move mixed practice modules and preference systems from partially defined state into implemented repository state.

This is not a documentation role.
This is an implementation role.

---

## Mandatory Working Mode

You must:
- implement directly in the repository
- refactor real screens and related logic
- clean routing and naming
- wire credit visibility
- persist preferences and consent
- deliver implemented code, not concept summaries

You must not:
- write more specs instead of refactoring code
- leave module boundaries mixed
- declare completion because routes or labels changed without behaviour change
- drift into Agent 1 or Agent 2 ownership except required integration

---

## Owned Scope

### 1. Practice Modules Refactor

#### Required Module Separation
Refactor into four clearly distinct modules:
- **Daily Warmup**
- **Coach**
- **Interview**
- **Negotiation**

#### Required Renames
- `InterviewWarmup` → **DailyWarmupPage**
- `NegotiationCoach` → **NegotiationPage**

#### Shared UI Shell
Build / use shared shell components:
- **PracticeHeroHeader**
- **PracticeModeCard**
- **PracticeCostCard**
- **PracticeSessionPanel**
- **PracticeSupportRail**
- **PracticeActionBar**
- **PracticeProgressBadge**

#### Credit Logic
##### Daily Warmup
- **15 Seconds** = **Free**
- **30 Seconds** = **1 Credit**
- **45 Seconds** = **2 Credits**
- **60 Seconds** = **3 Credits**

##### Coach
- **Quick Reframe** = **2 Credits**
- **Structured Guidance** = **4 Credits**
- **Deep Coaching** = **7 Credits**
- **High Complexity Session** = **9 Credits**

##### Interview
- **Interview Lite · 7 Min** = monthly free allowance once
- **Interview Standard** = **4 Credits**
- **Interview Deep Practice** = **6 Credits**
- **Interview Deep Practice With Better Model** = **8 Credits**

##### Negotiation
- **Quick Reply Draft** = **2 Credits**
- **Counter Offer** = **3 Credits**
- **Strategy** = **5 Credits**
- **Simulation** = **7 Credits**

#### Required User Protection
For heavier actions:
- show **Estimated Cost**
- show **Maximum Cost Without Further Approval**
- require confirmation before spend

### 2. Settings And Consent

#### Required Outcomes
Implement or complete:
- **Social Consent**
- **Email Settings**
- **Case Study Preferences**
- **Community Visibility**
- **Referral Participation**
- **Shared Session Discoverability**
- **AI Settings**
- **Preference Persistence**

#### Required UI Sections
- **Account Settings**
- **Notifications**
- **Email Settings**
- **Social Consent**
- **Privacy**
- **AI Settings**
- **Integrations**
- **Case Study Preferences**

### 3. Community Centre

#### Required Outcomes
Build or complete:
- **Community Feed**
- **Become A Patron**
- **Refer A Friend**
- **Buy Credits**
- **Events And Sessions**
- **Featured Members**

#### Credit Linkage
Community must connect cleanly to:
- credit purchase flow
- visible balance
- patron / social actions where applicable

---

## Delivery Format

Every delivery must use this structure:

### Scope Implemented
- exact sub-scope completed

### Files Changed
- exact file paths changed

### Routes / Components / Stores Changed
- exact routes, components, stores, services, persistence logic affected

### Tests Added Or Updated
- exact test files
- exact commands run

### Integration Notes
- billing, consent, or shared-shell dependencies if any

### Existing QC reports (mandatory)

**Completion is invalid unless** the agent has **checked** `docs/qc-reports/` for an **existing QC report** that applies to this slice (same scope, resubmission, or follow-up) and has **explicitly reported its status** (e.g. file path + decision line: Approved / Not Approved / none found) **in the final delivery**.

### Ready For QC
- Yes / No

### Blockers
- real blockers only, if any

---

## Definition Of Done

Work is only done when:
- practice modules are no longer functionally mixed
- shared shell exists without collapsing module identity
- cost visibility is real
- settings and consent persist and affect behaviour
- community actions are visible and usable
- QC can validate the result in code and in UI
- **Existing QC reports:** completion is invalid unless the agent has checked `docs/qc-reports/` for an applicable QC report and **explicitly reported its status** in the final delivery (see *Delivery Format* → *Existing QC reports*).

---

## Dependencies
- Agent 1 for billing backend and allowance logic
- Agent 2 only for visual coherence if common patterns overlap

## Must Not Touch
- billing engine ownership
- Legal Hub Search ownership
- Job Radar and Skill Lab ownership except integration points

## One-Line Instruction
```text
Own the user practice and preference systems: Daily Warmup, Coach, Interview, Negotiation, Settings, Consent, and Community Centre. Implement them in real repository code, separate mixed modules, unify the visual shell, and make cost visibility and persistence real.
```
