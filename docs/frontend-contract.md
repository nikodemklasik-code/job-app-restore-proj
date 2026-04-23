# Frontend contract

## Top-level destinations
- Dashboard
- Profile
- Document Hub
- Jobs
- Applications
- Applications Review
- Daily Warmup
- Interview
- Coach
- Negotiation
- Case Study
- Skills Lab
- Reports Hub
- Legal Hub
- Community Centre
- Billing
- Settings


### Case Study
- Owner: case interview preparation
- Purpose: user practices structured case-study style problem solving and communication
- Not for: behavioural interview drills, daily warmup repetition, salary negotiation strategy
- Primary CTA: Start case study session
- Empty state: explain that case practice starts when the user opens a structured case session and that feedback appears after completing a response flow
- Canonical route: /case-study
- Legacy aliases: /case-practice


### Interview
- Owner: dedicated interview session practice
- Purpose: user runs interview sessions with prompts, follow-ups, and interview-specific feedback
- Not for: daily repetition, general coaching ownership, salary negotiation planning
- Primary CTA: Start interview session
- Empty state: explain that feedback appears after starting and completing an interview flow
- Canonical route: /interview
### Negotiation
- Owner: offer, salary, and negotiation strategy
- Purpose: user prepares negotiation positions, response language, and counter-offer strategy
- Not for: behavioural interview drills, daily warmup, legal source search
- Primary CTA: Start negotiation session
- Empty state: explain that negotiation analysis begins after entering an offer, message, or scenario
- Canonical route: /negotiation
- Legacy aliases: /negotiation-coach


### Coach
- Owner: coaching feedback and answer-improvement strategy
- Purpose: user gets diagnosis of answer quality, weak patterns, and targeted improvement guidance
- Not for: full interview session ownership, salary negotiation, legal guidance
- Primary CTA: Get coaching feedback
- Empty state: explain that coaching output appears after submitting an answer or starting a coaching flow
- Canonical route: /coach
### Legal Hub
- Owner: legal information and approved-source legal research
- Purpose: user reviews legal topics and runs grounded legal search inside the legal workspace
- Not for: coaching ownership, negotiation strategy, general settings
- Primary CTA: Search legal sources
- Empty state: explain that legal results appear after entering a legal topic or question
- Canonical route: /legal
### Skills Lab
- Owner: skills, skill-gap analysis, and CV value development
- Purpose: user evaluates current skills, identifies missing capabilities, and improves CV value against target roles
- Not for: recruitment-process reporting, legal guidance, document intake
- Primary CTA: Analyse skills and CV value
- Empty state: explain that analysis appears after entering a target role, job description, or relevant profile material
- Canonical route: /skills
### Reports Hub
- Owner: analytical verification of the recruitment process
- Purpose: user reviews how the recruitment process is performing across applications, including application volume, response rate, rejection rate, interview progression, and time-to-outcome
- Not for: skill-gap development, CV value analysis, document intake, legal guidance
- Primary CTA: Review recruitment process analytics
- Empty state: explain that reports appear after real applications enter the pipeline and enough process data exists to evaluate outcomes
- Canonical route: /reports
- Legacy aliases: /ai-analysis



### Document Hub
- Owner: document intake, upload, parsing, and import workflows
- Purpose: user manages documents and starts document-derived workflows from the canonical document workspace
- Not for: billing management, profile-only editing, legal guidance
- Primary CTA: Upload or import a document
- Empty state: explain that document workflows begin here and prompt the user to upload their first document
- Canonical route: /documents
### Community Centre
- Owner: community participation and peer connection
- Purpose: user discovers community activity, discussions, events, and participation entry points
- Not for: privacy settings, billing management, legal workflows
- Primary CTA: Join community activity
- Empty state: explain what community actions will appear here and direct user to preparatory actions
- Canonical route: /community
- Legacy aliases: /settings/community


### Daily Warmup
- Owner: short daily-readiness routine
- Purpose: user completes a fast repeatable readiness session to keep practice momentum
- Not for: full interview sessions, deep coaching, negotiation strategy
- Primary CTA: Start warmup
- Empty state: explain that the routine begins with a short timed session and lightweight feedback
- Canonical route: /warmup

### Dashboard
- Owner: overall job-search overview and prioritisation
- Purpose: user sees current status, next actions, and high-level progress across the product
- Not for: deep document editing, legal research, full analytics investigation
- Primary CTA: Continue highest-priority next action
- Empty state: explain that overview data appears after profile, documents, or applications are added
- Canonical route: /dashboard
### Profile
- Owner: structured candidate profile data
- Purpose: user reviews and edits profile information used across matching and AI workflows
- Not for: canonical document intake, billing controls, legal research
- Primary CTA: Complete or update profile
- Empty state: explain that profile can be filled manually or imported from Document Hub
- Canonical route: /profile
### Jobs
- Owner: job discovery and opportunity browsing
- Purpose: user finds and reviews job opportunities relevant to profile and preferences
- Not for: application analytics, document parsing, community participation
- Primary CTA: Browse matching jobs
- Empty state: explain how job suggestions appear after profile and preferences are available
- Canonical route: /jobs
### Applications
- Owner: application tracking and management
- Purpose: user reviews and updates active applications and their statuses
- Not for: deep reporting, legal guidance, document intake
- Primary CTA: Review applications
- Empty state: explain that applications appear after saving or importing tracked opportunities
- Canonical route: /applications
### Applications Review
- Owner: application review queue and follow-up support
- Purpose: user processes application items needing review, correction, or action
- Not for: raw job discovery, community activity, legal search
- Primary CTA: Review pending items
- Empty state: explain that review items appear when applications require attention
- Canonical route: /applications-review
- Legacy aliases: /review


### Billing
- Owner: plans, credits, and subscription controls
- Purpose: user reviews plan entitlements, usage, credits, and upgrade options
- Not for: document intake ownership, profile editing, legal workflows
- Primary CTA: Manage plan or credits
- Empty state: explain current plan state and available upgrade paths
- Canonical route: /billing
### Settings
- Owner: account preferences, configuration, and system-level options
- Purpose: user manages settings, privacy, preferences, and configuration controls
- Not for: community ownership, document intake ownership, legal search ownership
- Primary CTA: Update preferences
- Empty state: explain available configuration areas and their purpose
- Canonical route: /settings
### FAQ
- Owner: product guidance and self-serve clarification
- Purpose: user finds concise answers about product behaviour, flows, and workspace ownership
- Not for: canonical task execution, legal advice, billing control
- Primary CTA: Find an answer
- Empty state: explain that FAQs answer common product questions and route users to the correct workspace
- Canonical route: /faq
