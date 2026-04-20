# Skill Lab And Job Radar Refactor Spec

> **Repo copy:** verbatim import from macOS Downloads — `Skill_Lab_And_Job_Radar_Refactor_Spec 2.md`. Modular split: [`README.md`](./README.md). Developer split: [`../skill-lab-job-radar-refactor-three-developer-split-v1.0.md`](../skill-lab-job-radar-refactor-three-developer-split-v1.0.md).

## Purpose

This spec defines the required product and front-end refactor for:

- **Skill Lab**
- **Job Radar**

The goal is to:
- sharpen the purpose of each module
- remove overlap with other modules
- improve visual and product clarity
- align each module with the credits-first product model
- define required repo changes, UI structure, and Quality Control rules

---

# 1. Skill Lab

## Canonical Name
**Skill Lab**

## Purpose
Skill Lab is the user’s market value and capability intelligence layer.

It must help the user understand:
- what skills they have
- which skills are strong
- which skills are underused
- which skills are backed by evidence
- which skills increase salary potential
- which skills strengthen CV value
- which skills still need proof, practice, or verification

## Emotional Effect
The user should feel:
- clearer about their professional value
- more aware of what they can leverage
- more motivated to strengthen the right things
- less vague about “what they are worth”

## What Skill Lab Is
Skill Lab is:
- skill intelligence
- market value interpretation
- salary relevance visibility
- verification and evidence mapping
- CV value interpretation
- course-to-skill connection
- growth path support

## What Skill Lab Is Not
Skill Lab is not:
- a static skills list
- a document archive
- a generic courses page
- a second Profile page
- a dead verification dashboard
- a bland tag cloud of claimed abilities

---

## Main Sections

- **Hero Header**
- **Skill Overview**
- **Market Value**
- **Salary Impact**
- **CV Value Signals**
- **High-Value Skills**
- **Underused Skills**
- **Verification**
- **Proof And Evidence**
- **Courses Supporting Skills**
- **What Strengthens Your CV**
- **What Weakens Your Position**
- **Growth Recommendations**

---

## Required Product Logic

### A. CV Value Signals Must Be Prominent
CV Value Signals must not be buried inside a secondary card.

The user must clearly see:
- which skills strengthen their CV
- which skills are valuable in the market
- which skills contribute to stronger salary positioning
- which strengths are currently underexposed

### B. Salary Relevance Must Be Visible
Skill Lab must explicitly connect skills to earning potential.

Examples:
- **High Salary Impact**
- **Strong Market Value**
- **Good Salary Leverage**
- **Low Proof, High Potential**
- **Strong CV Value Signal**

### C. Skills And Courses Must Be Connected
Courses and certificates must not exist as a separate dead list.

Show:
- **Related Skills**
- **Courses Supporting This Skill**
- **This Course Strengthens**
- **Learning Evidence**
- **Still Needs Practice**
- **Still Needs Verification**

### D. Skill Verification Must Be Actionable
Verification should not be a passive status label only.

The user should understand:
- what is already verified
- what is only declared
- what is observed
- what needs stronger proof
- what can be verified next

---

## Credit Logic

### Free
- **View Skill Overview**
- **View Declared Skills**
- **View Basic Related Courses**

### Fixed Credit Actions
- **Skill Value Insight** = **2 Credits**
- **Salary Impact Insight** = **3 Credits**
- **Verification Flow** = **4 Credits**
- **CV Value Deep Review** = **5 Credits**

### Estimated Cost Actions
For heavier multi-skill review:
- **Estimated Skill Audit**
- **Estimated Salary Position Review**
- **Estimated CV Value Report**

Display:
- **Estimated Cost**
- **Maximum Cost Without Further Approval**
- **Continue For X Credits**

---

## Required Front-End Direction

Skill Lab must feel:
- premium
- insight-driven
- valuable
- motivating
- modern
- more like a career intelligence product than a spreadsheet

Avoid:
- grey admin panel feel
- raw tag lists
- hidden salary logic
- lifeless skill tables

---

## Suggested Shared Sections / Components

Create or reuse:

```text
frontend/src/features/skill-lab/components/
  SkillLabHeroHeader.tsx
  SkillCard.tsx
  SkillValueCard.tsx
  SalaryImpactCard.tsx
  CvValueSignalCard.tsx
  VerificationCard.tsx
  EvidencePanel.tsx
  RelatedCourseList.tsx
  GrowthRecommendationPanel.tsx
  SkillLabActionBar.tsx
```

---

## Repo Changes For Skill Lab

### Frontend
Keep and refactor the Skill Lab feature into a clearer value-first module.

Suggested focus areas:
- `frontend/src/app/skills/...`
- `frontend/src/features/skills/...` or equivalent existing paths

### Required Outcome
The Skill Lab route must clearly expose:
- salary value
- CV value
- verification
- courses linked to skills
- growth path recommendations

---

## What Must Never Be Mixed Into Skill Lab
- Job Radar listing discovery
- Profile form editing as the primary experience
- generic AI Assistant chat layout
- buried salary logic
- “claimed skills only” with no market interpretation

---

# 2. Job Radar

## Canonical Name
**Job Radar**

## Purpose
Job Radar is the live opportunity intelligence layer.

It must help the user understand:
- what opportunities matter right now
- what changed in the market
- which listings are strong
- which listings are risky
- which employers deserve attention
- which leads are worth acting on
- which signals are promising, unclear, or suspicious

## Emotional Effect
The user should feel:
- informed
- alert
- ahead of the market
- selective rather than overwhelmed
- guided toward better opportunities

## What Job Radar Is
Job Radar is:
- opportunity intelligence
- employer signal monitoring
- listing prioritisation
- fit + risk interpretation
- watchlist tracking
- source monitoring
- action-focused search support

## What Job Radar Is Not
Job Radar is not:
- a dead job board
- a scrape dump
- a moderation table
- a plain admin feed
- a duplicate of Jobs
- a static employer directory

---

## Main Views

- **Overview**
- **Opportunities**
- **Watchlist**
- **Employers**
- **Signals**
- **Sources**
- **Alerts**

---

## Main Screen Structure

- **Radar Hero Header**
- **Radar Summary Strip**
- **Search And Filters**
- **Opportunity Grid**
- **Insight Rail**
- **Employer Watchlist**
- **Alerts Panel**

---

## Required Opportunity Card Fields

Each opportunity card must show:
- **Role Title**
- **Employer**
- **Location**
- **Work Mode**
- **Source**
- **Posted / Detected Time**
- **Salary**
- **Fit Signal**
- **Risk Signal**
- **Freshness**
- **Why This Is On Your Radar**
- **Watchlist State**
- **Listing Status**

---

## Required Product Logic

### A. Fit And Risk Must Be Visible
Each card must clearly show:
- fit
- risk
- freshness
- why it matters

### B. Why This Match Must Exist
Every listing needs a short AI summary:
**Why This Is On Your Radar**

Examples:
- **Strong match for your target role and recent experience**
- **High salary upside but low listing clarity**
- **New listing from a monitored employer**
- **Relevant role with possible red flags in wording**

### C. Employer Context Must Matter
The user must be able to see:
- employer changes
- risk patterns
- source trust
- repeated listing behaviour
- watchlist events

### D. Job Radar Must Lead To Action
The module must not be passive.

Each listing should support actions such as:
- **Open Listing**
- **Save Lead**
- **Add To Watchlist**
- **Open In Applications**
- **Review Employer**
- **Hide**

---

## Credit Logic

### Free
- **Browse Signals**
- **Basic Search**
- **Basic Watchlist View**

### Fixed Credit Actions
- **Why This Match** = **1 Credit**
- **Employer Quick Review** = **2 Credits**
- **Deep Listing Analysis** = **2 Credits**
- **Employer Pattern Review** = **3 Credits**
- **Advanced Radar Scan** = **4 Credits**

### Estimated Cost Actions
For heavier employer / market synthesis:
- **Deep Employer Review**
- **Deep Market Pattern Review**
- **Advanced Multi-Signal Scan**

Display:
- **Estimated Cost**
- **Maximum Cost Without Further Approval**
- **Continue For X Credits**

---

## Required Front-End Direction

Job Radar must feel:
- premium
- alive
- strategic
- high-signal
- visually richer than a standard dashboard

Avoid:
- admin-panel ugliness
- scrape-feed energy
- flat grey listing tables
- overcompressed cards
- random unlabeled badges

---

## Suggested Shared Sections / Components

Create or refactor into:

```text
frontend/src/features/job-radar/components/
  RadarHeroHeader.tsx
  MetricCard.tsx
  OpportunityCard.tsx
  EmployerCard.tsx
  SignalBadge.tsx
  RiskBadge.tsx
  FitBadge.tsx
  WatchlistPanel.tsx
  InsightBlock.tsx
  SourceHealthCard.tsx
  AlertCard.tsx
  RadarFilterBar.tsx
  RadarActionBar.tsx
```

---

## Repo Changes For Job Radar

### Route Cleanup
The repo currently suggests overlapping Job Radar identities.

Unify and simplify routing so that the user clearly lands in the real Job Radar module.

### Required Route Direction
Choose one operational route pattern and keep it clean.

Recommended:
- `/job-radar`

Avoid keeping two overlapping product identities unless one is clearly only a landing / intro view.

### Frontend Outcome
Job Radar must clearly expose:
- overview
- opportunity grid
- watchlist
- employer signals
- source signals
- alerts

---

## What Must Never Be Mixed Into Job Radar
- Skill Lab value intelligence
- generic Jobs list without signal logic
- admin moderation table design
- vague employer cards with no action logic
- duplicated route identity with unclear purpose

---

# 3. Shared Billing And Credit Rules

Both Skill Lab and Job Radar must align with the new credits-first system.

## Product Philosophy
- no exclusive functional subscription tiers
- all users can access the modules
- usage depth is controlled through credits
- monthly free allowance applies where relevant
- costs must be visible before spend
- heavier actions need estimate + approval

## Required UI Rules
Every paid or estimated action must show:
- **Cost**
or
- **Estimated Cost**
and, where needed:
- **Maximum Cost Without Further Approval**

---

# 4. Quality Control Rules

Quality Control must validate:

## Skill Lab
- salary value is visible and not buried
- CV Value Signals are prominent
- courses are linked to skills
- the module feels like value intelligence, not just a skills list
- credit logic is visible and honest

## Job Radar
- the module does not look like an admin panel
- opportunity cards are attractive and high-signal
- fit and risk logic are understandable
- employer context is actionable
- route identity is not duplicated or confusing
- credit logic is visible and honest

---

# 5. Files To Review And Refactor

## Skill Lab
Review the current Skill Lab app and feature files and refactor toward:
- clearer market value logic
- clearer salary impact
- stronger CV value emphasis
- better skill-course relationships

## Job Radar
Review the current Job Radar app and related feature files and refactor toward:
- one clean operational route
- one strong main Job Radar experience
- more premium card design
- clearer signal hierarchy
- more actionable employer context

---

# 6. One-Line Developer Instruction

```text
Refactor Skill Lab into a value-first capability intelligence module with visible salary impact, CV Value Signals, verification, and course-to-skill mapping; refactor Job Radar into a premium live opportunity intelligence module with a clean route identity, strong opportunity cards, clear fit and risk signals, visible credit logic, and no admin-panel feel.
```

# 7. One-Line Quality Control Instruction

```text
Validate that Skill Lab now clearly communicates market value, salary impact, CV strength, and verification logic, and that Job Radar now feels like a premium opportunity intelligence module with clean routing, strong signal hierarchy, actionable employer context, and visible credit cost rules.
```
