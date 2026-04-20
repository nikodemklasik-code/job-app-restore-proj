# Skill Lab v1.0

## Final Product Specification

## 1. Purpose

> **★ Materiały wspierające** — Skill Lab podpowiada **kierunek** i **rytm** rozwoju; **nie** jest jedyną możliwą ścieżką ani **nie** gwarantuje m.in. wynagrodzenia czy zatrudnienia. Wynik zależy od wielu czynników. [`supporting-materials-disclaimer-v1.0.md`](../policies/supporting-materials-disclaimer-v1.0.md)

**Skill Lab** is a private, AI-assisted career growth module that helps the user understand:

- what skills they currently claim,
- what skills are actually evidenced,
- what gaps exist relative to target roles,
- what their current market value is,
- what actions will increase their employability and salary potential,
- how their profile improves over time.

Skill Lab is not a course catalog, not a public rating system, and not a recruitment decision engine. It is a **private career development and market readiness system**.

## 2. Core product promise

Skill Lab answers six user questions:

1. Where am I today?
2. What can I already apply for?
3. What is missing for better roles?
4. Which of my skills are verified vs only declared?
5. What is my approximate market value today?
6. What should I do next to grow faster?

## 3. Product position

Skill Lab sits between:

- Profile
- Applications
- JobRadar
- Assistant

Skill Lab is the career growth engine of the product.

## 4. Main functional pillars

### 4.1 Skill Profile

- declared skills
- observed skills
- verified skills
- weakly evidenced skills
- inconsistent claims
- target role and growth direction

### 4.2 Skill Verification

Evidence sources:

- CV
- LinkedIn
- portfolio / GitHub / Behance
- references
- mock interviews
- coaching sessions
- AI conversations
- writing samples
- coding challenges
- certificates

### 4.3 Skill Gap Analysis

Relative to:

- selected job
- role family
- career goal

Output:

- strengths
- missing skills
- weak skills
- skills needing proof

### 4.4 Market Value

Outputs:

- current market value range
- projected value after milestones
- confidence
- key drivers

### 4.5 Growth Roadmap

Shows:

- what to do
- why it matters
- how long it may take
- what it unlocks
- how it affects role readiness and market value

## 5. Product principles

### 5.1 Private by default

All outputs are private to the user.

### 5.2 Evidence over self-description

Declared skill != proof.

### 5.3 Development-first language

Use:

- “Current evidence suggests…”
- “More proof would strengthen…”

Never:

- shame,
- humiliate,
- accuse.

### 5.4 Dynamic system

Recompute after:

- CV upload
- LinkedIn connect
- verification session
- target role update
- milestone completion

### 5.5 Explainability required

Every important output must show:

- evidence
- confidence
- next step

## 6. Inputs

### User inputs

- CV
- manual edits
- target role
- salary expectations
- certificates
- writing samples
- portfolio links
- references

### Connected sources

- LinkedIn
- GitHub
- Behance / Dribbble
- prior applications
- saved jobs

### AI generated

- mock interview observations
- coaching feedback
- communication signals
- language signals
- coding task evaluation

## 7. Skill model

### Claim

What user says.

### Evidence

What sources support / weaken.

### Assessment

Synthetic result:

- claimed level
- observed level
- verification status
- confidence
- consistency
- summary
- improvement note

## 8. Verification model

Statuses:

- self_declared
- lightly_evidenced
- partially_verified
- strongly_verified
- inconsistent

Rule:

No inconsistency from:

- one weak source
- one short conversation
- low-confidence only

## 9. Language verification

Each language includes:

- declared level
- observed level
- speaking
- writing
- comprehension
- confidence

Rule:

Never frame as certification.

Use:

- “Current evidence suggests…”

## 10. Soft skills verification

Allowed:

- communication
- structured thinking
- stakeholder management
- leadership
- collaboration
- autonomy
- problem solving

Never:

- diagnose personality
- label identity traits
- make psychological claims

## 11. Skill Gap Analysis

Each gap includes:

- skill
- severity
- importance
- current level
- target level
- summary
- recommended action

Gap severities:

- missing
- weak
- needs_proof
- stretch

Importance:

- must_have
- important
- optional

## 12. Market Value

Inputs:

- role family
- location
- seniority
- verified skills
- language
- evidence strength

Outputs:

- current range
- projected range
- confidence
- drivers

Rule:

Estimate only. Never guarantee.

## 13. Growth Roadmap

Milestone types:

- skill
- experience
- portfolio
- language
- certificate
- interview
- proof

Each milestone:

- title
- summary
- skills
- duration
- difficulty
- impact
- unlocks
- status

Statuses:

- suggested
- planned
- in_progress
- done
- skipped

Priority:

1. role readiness impact
2. market value impact
3. low effort
4. short time-to-proof

## 14. Main screens

### Current Position

- profile
- market value
- strongest skills
- blockers

### Skill Verification

- declared vs observed
- status
- confidence

### Language Verification

- language strengths / gaps

### Skill Gaps

- gaps vs role

### Market Value

- value + assumptions

### Growth Roadmap

- next steps
- progress

### Verification Lab

- mock interviews
- coding checks
- writing checks
- language checks

## 15. Trust and privacy

- private by default
- minimal sensitive data retention
- retention policy for raw evidence
- user can:
  - edit claims
  - add proof
  - change goals
  - understand changes

## 16. Success metrics

- more verified skills over time
- fewer critical gaps
- milestone completion
- better application readiness
- higher confidence in market value
- user usefulness score

## 17. MVP scope

Included:

- CV ingestion
- claim extraction
- CV evidence
- mock interview evidence
- skill assessments
- language baseline
- role gap analysis
- market value estimate
- roadmap

Deferred:

- deep portfolio graph analysis
- public certification
- coach workflows

## 18. Final definition

**Skill Lab is a private AI-powered career growth engine that converts user claims, evidence, and market expectations into verified skills, skill gaps, market value estimates, and a dynamic development roadmap.**

It helps users become:

- more employable
- more credible
- more ready
- more valuable

## 19. Required Product Updates (Mandatory)

### 19.1 Skill Lab: CV Value Signals and salary visibility

CV Value Signals must not only show that a skill exists. They must show what that skill may be worth in the market.

Core rule:
- which skills strengthen the CV
- which skills increase employability
- which skills may justify higher salary range
- which skills are underexposed
- which skills need stronger proof

Required new sections in Skill Lab:
- CV Value Signals
- Market Value Signals
- Salary Potential
- High-Value Skills
- Underused Skills
- Proof and Evidence
- Skills That Increase Your Position
- Skills That Need Stronger Proof

Required insight types:
- This Skill Can Increase Your Salary Range
- This Skill Is Strong In The Market Right Now
- This Skill Strengthens Seniority Positioning
- This Skill Is Valuable But Underused In Your CV
- This Skill Needs Better Evidence To Carry Salary Weight
- This Combination Of Skills Increases Market Value

Required salary-linked outputs (per skill or cluster):
- Estimated Salary Impact
- Market Demand Strength
- Role Relevance
- CV Strength Contribution

Example user-facing labels:
- High Salary Impact
- Strong Market Value
- Good Salary Leverage
- Low Proof, High Potential
- Well-Paid Skill Cluster
- Strong CV Value Signal

UX rule:
- salary relevance must be visible in the main Skill Lab experience
- do not hide salary impact in secondary tooltips only
- user should clearly feel: "These skills are worth money."

### 19.2 Skills and Courses: one connected growth system

Courses and certificates must be explicitly connected to skills. They cannot remain isolated as static records.

Required behavior:
- map each course/certificate to one or more skills
- mark whether it supports, strengthens, partially verifies, or lightly signals a skill
- surface whether additional practical proof is still needed

Required UI relationships:
- Related Skills
- Courses Supporting This Skill
- This Course Strengthens
- Learning Evidence
- Still Needs Practice
- Still Needs Verification

Example user-facing messages:
- This Course Strengthens Your Data Analysis Positioning
- This Certificate Supports Your Project Management Skill
- This Skill Has Learning Evidence But Still Needs Practical Proof
- This Course Adds Credibility To Your CV
- This Skill Cluster Gains Value From These Courses

UX rule:
- skills and courses must feel like one growth system, not two unrelated lists

### 19.3 Non-negotiable acceptance rule

Skill Lab is not approved if:
- salary/value relevance is missing from main views
- high-value vs underused skills are not surfaced explicitly
- proof quality is not tied to salary leverage
- skills and courses remain visually or logically disconnected
