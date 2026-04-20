# 19 Screens — Canonical Implementation Spec + Gap Map vs Code Snapshot

Status: canonical working draft for repo execution
Date baseline: 2026-04-19
Snapshot baseline: `proj-snapshot-2026-04-19-0323.zip`
Audience: Product Owner, Agent A/B/C, QC

---

## 0. How to use this file

This is the canonical implementation file for the 19 target screens.
It is meant to replace vague screen-level discussions with bounded implementation rules.

For each screen this file defines:
- product purpose
- route and owning frontend file(s)
- backend owner(s)
- required data contract
- required user actions
- required states
- billing requirements if applicable
- tests required before QC
- definition of done
- current gap vs code snapshot

This file is intentionally operational.
If code, router, or route does not exist, the screen is a gap or partial gap, not "implicitly implemented elsewhere".

**Production-ready bar (data, flows, billing, no false “done”):** [`19-screens-production-readiness-and-cross-flows-v1.md`](./19-screens-production-readiness-and-cross-flows-v1.md)

---

## 1. Global rules for all 19 screens

### 1.1 Core product rules
- Every screen must answer one user question and move the user to a sensible next action.
- Every screen must be connected to a real backend effect or real persisted data.
- No dead toggles, dead CTA buttons, dead cards, or UI-only state pretending to be product state.
- If a screen triggers spend, spend rules must follow approve -> commit/reject.
- If a screen produces a durable output, it must be visible again after refresh.

### 1.2 Shared UI rules
Every screen must support these states:
- loading
- empty
- error
- populated

Every screen must include:
- title
- short purpose line
- primary CTA
- deterministic empty state
- deterministic error state with retry

### 1.3 Shared implementation rules
- FE page file must be thin and orchestrate feature components/hooks.
- FE must not mix raw backend entities with display-only derived state inside the page file.
- If 2+ modules feed one screen, create a view model / aggregate query / mapper.
- BE ownership must be explicit. If multiple routers feed the screen, one aggregate contract should still exist.
- DTOs must be explicit at FE/BE boundary.

### 1.4 Shared billing rules
If a screen may consume credits:
- show fixed cost or estimated cost before user starts action
- ask for approval before effect if required by policy
- commit after success
- reject on failure / cancel / abandon
- never debit directly outside billing engine

### 1.5 Shared QC rules
No screen is done unless delivery includes:
- repo diff
- touched files list
- test commands run
- route proof or screenshot proof
- explicit done/not done statement
- no widening claims outside the bounded slice

---

## 2. Gap legend used in this file

- **GREEN**: route/page and backend owner exist; screen appears materially implemented or close enough for bounded closure
- **YELLOW**: route/page exists but aggregate contract, states, persistence, or domain closure appear incomplete or ambiguous
- **RED**: route missing or dedicated backend/feature surface missing; screen is a true gap or needs bounded MVP creation

---

## 3. Snapshot-derived route map

Observed frontend app pages in snapshot:
- `/dashboard` -> `frontend/src/app/dashboard/DashboardPage.tsx`
- `/profile` -> `frontend/src/app/profile/ProfilePage.tsx`
- `/jobs` -> `frontend/src/app/jobs/JobsDiscovery.tsx`
- `/jobs/sources` or settings-driven source control -> `frontend/src/app/jobs/JobSources.tsx`
- `/applications` -> `frontend/src/app/applications/ApplicationsPage.tsx`
- `/review` -> `frontend/src/app/review/ReviewQueue.tsx`
- `/documents` -> `frontend/src/app/documents/DocumentLab.tsx`
- `/style` -> `frontend/src/app/style/StyleStudio.tsx`
- `/assistant` -> `frontend/src/app/assistant/AssistantPage.tsx`
- `/analysis` -> `frontend/src/app/analysis/AiAnalysisPage.tsx`
- `/interview` -> `frontend/src/app/interview/InterviewPractice.tsx`
- `/coach` -> `frontend/src/app/coach/CoachPage.tsx`
- `/warmup` -> `frontend/src/app/warmup/DailyWarmupPage.tsx`
- `/negotiation` -> `frontend/src/app/negotiation/NegotiationPage.tsx`
- `/job-radar` -> `frontend/src/app/job-radar/JobRadarLandingPage.tsx`
- `/job-radar/scan/:id` -> `frontend/src/app/job-radar/JobRadarScanPage.tsx`
- `/job-radar/report/:id` -> `frontend/src/app/job-radar/JobRadarReportPage.tsx`
- `/job-radar/admin/complaints` -> `frontend/src/app/job-radar/admin/JobRadarAdminComplaintsPage.tsx`
- `/skills` -> `frontend/src/app/skills/SkillsLab.tsx`
- `/settings` -> `frontend/src/app/settings/SettingsHub.tsx`
- `/settings/security` -> `frontend/src/app/settings/SecurityPage.tsx`
- `/billing` -> `frontend/src/app/billing/BillingPage.tsx`
- `/legal` -> `frontend/src/app/legal/LegalHub.tsx`
- supporting but not in the 19-core list: auth, reports, FAQ, salary, auto-apply, radar legacy page, legal policy pages

Observed backend routers/services in snapshot include:
- `profile.router.ts`
- `jobs.router.ts`
- `jobSources.router.ts`
- `applications.router.ts`
- `review.router.ts`
- `documents.router.ts`
- `cv.router.ts`
- `style.router.ts`
- `assistant.router.ts`
- `jobRadar.router.ts`
- `radar.router.ts` (legacy/adjacent)
- `interview.router.ts`
- `liveInterview.router.ts`
- `coach.router.ts`
- `skillLab.router.ts`
- `billing.router.ts`
- `legalHub.router.ts`
- `security.router.ts`
- `emailSettings.router.ts`
- `autoApply.router.ts`
- service modules for negotiation, warmup credits, legal hub search, job sources, skillup, billing policy

---

## 4. Canonical screen implementation specs + gap map

---

# SCREEN 1. Dashboard

## Purpose
Central command surface after auth. User should know current state, top priority, and what to do next.

## Canonical route
`/dashboard`

## Frontend owner
- `frontend/src/app/dashboard/DashboardPage.tsx`

## Backend owner
Primary aggregate should be introduced if missing:
- `profile.router.ts`
- `billing.router.ts`
- `applications.router.ts`
- `jobs.router.ts`
- `jobRadar.router.ts`
- `assistant.router.ts`

## Required aggregate contract
```ts
export type DashboardSnapshot = {
  profile: {
    completeness: number;
    nextMissingField?: string;
  };
  billing: {
    balance: number;
    freeAllowanceLeft: number;
    lowBalance: boolean;
  };
  applications: {
    activeCount: number;
    overdueFollowups: number;
  };
  jobs: {
    savedCount: number;
    newMatchesCount: number;
  };
  practice: {
    nextAction?: "warmup" | "interview" | "coach";
    recentScoreDelta?: number;
  };
  recommendations: Array<{
    id: string;
    title: string;
    reason: string;
    targetRoute: string;
    priority: "high" | "medium";
  }>;
};
```

## Required UI sections
- header with greeting, profile completeness, credits badge
- next best action card
- quick stats row
- modules grid
- recent activity panel
- alerts panel

## Required actions
- continue next best action
- complete profile
- review jobs
- continue practice
- go to billing if balance risk

## Required states
- loading skeleton
- empty new-user state
- partial-data warning state
- populated state

## Required tests
- renders for new user
- renders for active user
- low-balance alert visible
- missing-profile recommendation visible
- retry works on error
- aggregate contract test

## DoD
- user sees at least 1 clear next step
- cards use real data
- no spinner wall
- all CTA targets exist

## Gap map vs snapshot
**YELLOW**
- FE page exists.
- Backend aggregate is not clearly visible as one dedicated dashboard router in snapshot.
- Risk: Dashboard may still be composed from scattered calls instead of one stable snapshot contract.
- Required bounded work: create explicit dashboard aggregate query or mapper layer.

---

# SCREEN 2. Profile

## Purpose
Source of truth for the user’s job goals, work values, salary targets, and skills.

## Canonical route
`/profile`

## Frontend owner
- `frontend/src/app/profile/ProfilePage.tsx`

## Backend owner
- `backend/src/trpc/routers/profile.router.ts`
- `backend/src/services/profileSourceOfTruth.ts`
- `backend/src/services/profileSourceOfTruth.policy.ts`

## Required contract
Fields must include, at minimum:
- career basics
- target roles
- seniority
- location/work mode
- salary range
- work values
- skills
- auto-apply threshold
- growth plan / roadmap
- blocked areas
- profile completeness

## Required UI sections
- career basics
- target role and seniority
- salary + thresholds
- work values
- skills and evidence
- growth plan / roadmap
- completeness summary

## Required actions
- update section
- save section / autosave
- recalculate completeness
- refresh downstream recommendations

## Required tests
- update one section persists
- reload retains data
- completeness recalculates
- invalid salary rejected
- downstream usage contract remains stable

## DoD
- data survives refresh
- completeness visible and meaningful
- profile changes affect jobs/radar/skill downstream

## Gap map vs snapshot
**GREEN/YELLOW**
- FE page and backend source-of-truth services exist.
- Likely one of the stronger slices in repo.
- Yellow only because downstream propagation proof must be validated in QC, not assumed.

---

# SCREEN 3. Jobs

## Purpose
Discovery surface for job opportunities aligned to the profile.

## Canonical route
`/jobs`

## Frontend owner
- `frontend/src/app/jobs/JobsDiscovery.tsx`

## Backend owner
- `backend/src/trpc/routers/jobs.router.ts`
- `backend/src/services/jobSources/jobDiscoveryService.ts`
- `backend/src/services/jobSources/profileDrivenDiscovery.ts`
- `backend/src/services/jobSources/providerRegistry.ts`

## Required data per job row
- title
- company
- location
- work mode
- salary if known
- source
- posted date / freshness
- saved state
- hidden state
- basic match note
- actions available

## Required actions
- search/filter/sort
- save job
- hide job
- add to applications
- send to Job Radar

## Required states
- loading list skeleton
- empty results
- provider partial failure with warning
- populated list + detail drawer

## Required tests
- filters change query
- save/hide persists
- add to applications creates pipeline item
- send to radar passes correct source job id
- dedupe works

## DoD
- source transparency visible
- persistence on save/hide
- actions are connected to backend

## Gap map vs snapshot
**GREEN/YELLOW**
- FE page exists.
- Backend jobs source registry/services exist.
- Yellow because provider reliability, dedupe, and consistent source transparency are typical weak spots and need contract proof.

---

# SCREEN 4. Applications

## Purpose
Persistent application pipeline across stages.

## Canonical route
`/applications`

## Frontend owner
- `frontend/src/app/applications/ApplicationsPage.tsx`
- `frontend/src/app/applications/ApplicationsPipeline.tsx`

## Backend owner
- `backend/src/trpc/routers/applications.router.ts`

## Canonical stages
- draft
- prepared
- sent
- waiting
- follow-up
- interview
- rejected
- accepted

## Required UI
- header stats
- pipeline / grouped list
- application cards
- detail drawer with timeline
- notes and linked artifacts

## Required actions
- create manual application
- move stage
- add notes
- attach document
- link radar report
- archive / reopen where allowed

## Required tests
- create manual application
- move stage persists
- optimistic update rollback on failure
- terminal stage handling
- timeline entries created

## DoD
- stage changes durable
- history visible
- linked documents/jobs/reports visible

## Gap map vs snapshot
**GREEN**
- FE and backend router exist.
- Implementation likely present enough for bounded hardening rather than invention.

---

# SCREEN 5. Applications Review

## Purpose
Answer what to do after application was sent: wait, follow up, archive, escalate.

## Canonical route
`/review` or `/applications/review`

## Frontend owner
- `frontend/src/app/review/ReviewQueue.tsx`

## Backend owner
- `backend/src/trpc/routers/review.router.ts`
- uses application history data

## Required data
- application id
- sent date
- days without response
- listing status
- recommended action
- reason for recommendation

## Required actions
- mark follow-up sent
- snooze
- archive
- update application stage
- generate follow-up guidance if supported

## Required tests
- queue formation logic
- follow-up due logic
- review action syncs back to applications

## DoD
- review queue reads real application state
- user can act directly from queue

## Gap map vs snapshot
**YELLOW**
- FE page and backend router exist.
- Needs explicit proof that it is truly applications-review and not an isolated queue surface without full lifecycle integration.

---

# SCREEN 6. Documents Upload / Document Lab

## Purpose
Upload, parse, preview, version, and attach user documents.

## Canonical route
`/documents`

## Frontend owner
- `frontend/src/app/documents/DocumentLab.tsx`

## Backend owner
- `backend/src/trpc/routers/documents.router.ts`
- `backend/src/trpc/routers/cv.router.ts`
- `backend/src/services/cvParser.ts`

## Required UI sections
- upload dropzone
- list of documents
- parse status
- preview panel
- version history
- actions panel

## Required actions
- upload
- retry parse
- rename
- delete
- mark primary CV
- create tailored version
- attach to application

## Required tests
- upload happy path
- parse transition pending -> ready/failed
- primary CV uniqueness
- version linkage
- attach to application works

## DoD
- documents persist
- parse status visible
- version chain visible
- application can consume selected document

## Gap map vs snapshot
**GREEN/YELLOW**
- FE page and routers exist.
- Yellow because version lineage and parse-failure UX usually need explicit closure.

---

# SCREEN 7. Style Studio

## Purpose
Document style improvement tool, separate from general editing or analysis.

## Canonical route
`/style`

## Frontend owner
- `frontend/src/app/style/StyleStudio.tsx`
- `frontend/src/app/style/StyleStudioRedirect.tsx`

## Backend owner
- `backend/src/trpc/routers/style.router.ts`
- `backend/src/services/styleDocumentAnalysis.service.ts`

## Required UI
- source selector
- style mode selector
- input preview
- output comparison
- apply/copy/save actions

## Billing
- if AI generation costs credits, expose fixed/estimated cost first

## Required tests
- generate style variant
- save as new version/document
- unsupported source handled
- cost visible if applicable

## DoD
- produces usable edited output
- result can be persisted or copied
- clearly distinct from Documents and AI Analysis

## Gap map vs snapshot
**GREEN/YELLOW**
- FE and backend exist.
- Yellow because it must prove distinct product identity and persistence path, not just a one-off transform tool.

---

# SCREEN 8. AI Assistant

## Purpose
Fast help and routing layer across the product, not the deep expert layer.

## Canonical route
`/assistant`

## Frontend owner
- `frontend/src/app/assistant/AssistantPage.tsx`

## Backend owner
- `backend/src/trpc/routers/assistant.router.ts`
- assistant meta/product-aware OpenAI support

## Required UI
- chat history
- suggested prompts
- action chips
- context references
- optional aiProductMeta / usage badge

## Required behavior
- short helpful responses
- clear next-step routing
- product-aware context injection
- not replace Coach, Legal, or AI Analysis

## Required tests
- send/receive flow
- context inclusion
- route chip click
- safe fallback
- answer length / mode constraint where implemented

## DoD
- user gets practical next step
- history stable within thread
- no role confusion with analysis/coach/legal

## Gap map vs snapshot
**GREEN**
- FE page and router exist.
- Snapshot includes assistant-meta tests, suggesting this slice is materially present.

---

# SCREEN 9. AI Analysis

## Purpose
Deep analysis surface for stronger structured insight than chat.

## Canonical route
`/analysis`

## Frontend owner
- `frontend/src/app/analysis/AiAnalysisPage.tsx`

## Backend owner
- analysis may share assistant/openai/document context layers; explicit route/service surface should be confirmed in bounded slice

## Required UI
- input selector
- analysis mode selector
- cost/deep mode indicator
- structured results sections
- copy/save actions

## Required result sections
- strengths
- gaps
- rewrite suggestions
- recommended next step
- evidence/inference distinction

## Required tests
- mode switch
- deep mode cost shown
- structured response render
- retry on failure

## DoD
- visibly different from Assistant
- visibly more structured than chat
- results usable downstream or exportable

## Gap map vs snapshot
**YELLOW**
- FE page exists.
- No clearly named dedicated backend `analysis.router.ts` appears in snapshot.
- Likely implemented through shared AI/backend layers, but ownership contract is not canonical yet.
- Required work: establish explicit backend contract or clearly document which router owns it.

---

# SCREEN 10. Interview

## Purpose
Realistic interview practice with session lifecycle and billing control.

## Canonical route
`/interview`

## Frontend owner
- `frontend/src/app/interview/InterviewPractice.tsx`

## Backend owner
- `backend/src/trpc/routers/interview.router.ts`
- `backend/src/trpc/routers/liveInterview.router.ts`
- `backend/src/services/interview.ts`
- `backend/src/services/interviewConversation.ts`
- report assemblers

## Required flow
- setup
- session active
- per-answer progression
- summary
- report persistence

## Billing
- approve before session
- commit on success
- reject on failure/abandon

## Required tests
- start session
- answer flow
- completion summary
- abandon rollback
- report persistence
- spend state transition tests

## DoD
- end-to-end session works
- cost path hermetic
- reports reachable after completion

## Gap map vs snapshot
**GREEN/YELLOW**
- FE and backend interview/liveInterview routers exist with tests.
- Yellow because project state explicitly says legacy interview wider closure is not fully complete, so bounded approved slices must not be overstated.

---

# SCREEN 11. Coach

## Purpose
Strategic guidance and reframing based on context or prior practice.

## Canonical route
`/coach`

## Frontend owner
- `frontend/src/app/coach/CoachPage.tsx`

## Backend owner
- `backend/src/trpc/routers/coach.router.ts`
- `backend/src/ai/services/coach-handoff.service.ts`

## Required UI
- topic selector
- depth selector
- estimated cost
- context attachment
- structured output sections

## Required output sections
- what is working
- what is blocking progress
- reframing
- action plan
- next drill / next route

## Billing
- estimated cost visible before run
- approval if required

## Required tests
- interview handoff
- structured output validation
- spend engine integration
- save to reports

## DoD
- clearly not Assistant
- clearly not Interview
- action plan output is structured and reusable

## Gap map vs snapshot
**GREEN**
- FE page, router, and coach tests exist.
- Strong bounded slice candidate.

---

# SCREEN 12. Daily Warmup

## Purpose
Low-friction daily practice loop.

## Canonical route
`/warmup`

## Frontend owner
- `frontend/src/app/warmup/DailyWarmupPage.tsx`
- `frontend/src/app/warmup/warmupTierCatalog.ts`

## Backend owner
- `backend/src/modules/session-practice/warmupCredits.ts`
- practice/session logic feeding the route

## Required UI
- duration tiles 15/30/45/60
- fixed cost display
- fast-start CTA
- tiny results summary
- follow-up CTA

## Required tests
- tier selection
- cost per tier
- start/finish flow
- persistence of result
- follow-up route works

## DoD
- start in few clicks
- fixed cost visible
- session short and stable
- result visible after completion

## Gap map vs snapshot
**YELLOW**
- FE page and warmup credits module exist.
- No dedicated warmup router is obvious in snapshot.
- Needs explicit route-to-backend ownership confirmation so it is not quietly piggybacking on unrelated interview endpoints.

---

# SCREEN 13. Negotiation

## Purpose
Negotiation strategy, draft, and roleplay surface for offers/terms.

## Canonical route
`/negotiation`

## Frontend owner
- `frontend/src/app/negotiation/NegotiationPage.tsx`

## Backend owner
- `backend/src/services/negotiationConversation.ts`
- explicit router ownership should be established if absent

## Required UI
- context form
- mode selector: strategy / draft / roleplay
- cost display
- structured output blocks
- copy/save to application

## Required tests
- strategy output
- reply draft output
- roleplay mode
- save into application notes
- cost handling

## DoD
- clearly separate module identity
- usable negotiation artifacts produced
- can link back to applications

## Gap map vs snapshot
**YELLOW/RED**
- FE page exists.
- Backend has negotiation service, but no obvious dedicated negotiation router is visible in snapshot.
- Project state already says Negotiation is not yet fully closed as bounded slice.
- Canonical work required: define router/contract, billing mode, and persistence path.

---

# SCREEN 14. Job Radar

## Purpose
Opportunity intelligence over jobs/employers with scan -> report flow.

## Canonical route set
- `/job-radar`
- `/job-radar/scan/:id`
- `/job-radar/report/:id`
- `/job-radar/admin/complaints`

## Frontend owner
- landing page
- scan progress page
- report page
- admin complaints page

## Backend owner
- `backend/src/trpc/routers/jobRadar.router.ts`
- `backend/src/modules/job-radar/*`
- REST/OpenAPI bridge in module API folder

## Required flow
- start from saved job or URL
- show scan progress
- render immutable report
- support rescan
- support complaint creation
- admin complaint moderation

## Required report sections
- summary
- fit/risk/freshness
- findings
- sources
- employer track/history
- confidence/trust
- CTA out to applications/documents/assistant

## Required tests
- start scan
- polling status
- ownership checks
- report render contract
- complaint creation
- admin complaint list
- OpenAPI/trpc parity where in scope

## DoD
- scan and report work end-to-end
- report is decision-oriented
- source and freshness visible
- report versioning preserved

## Gap map vs snapshot
**GREEN**
- This is one of the strongest, most explicitly implemented modules in snapshot.
- Dedicated module, handlers, services, tests, and API mappings are all present.

---

# SCREEN 15. Skill Lab

## Purpose
Show user skill value, evidence, verification hints, and growth actions.

## Canonical route
`/skills`

## Frontend owner
- `frontend/src/app/skills/SkillsLab.tsx`

## Backend owner
- `backend/src/trpc/routers/skillLab.router.ts`
- `backend/src/services/skillLabCore.service.ts`
- `backend/src/services/skillLabSignals.service.ts`
- `backend/src/modules/skillup/*`

## Required UI
- value overview
- strengths
- underused skills
- salary impact hints
- evidence hints
- verification hints
- related courses
- growth recommendations

## Required tests
- signal generation
- evidence hints rendering
- course mapping
- route-outs to jobs/documents/practice

## DoD
- recommendations are justified
- evidence hooks visible
- not just generic motivational summary

## Gap map vs snapshot
**GREEN/YELLOW**
- FE page, router, services, and modules exist.
- Yellow only because QC must confirm evidence-backed outputs rather than vague AI-only summaries.

---

# SCREEN 16. Community Centre

## Purpose
Community/referral/patron/credit-entry social layer.

## Canonical route
`/community` (target)

## Frontend owner
- no dedicated community page observed in snapshot

## Backend owner
- no clearly dedicated community router observed in snapshot
- may reuse referral/credit hooks later, but not present as canonical dedicated screen

## Required MVP if implemented now
- referral code/action
- patron/support entry if part of product
- community highlights/events panel
- direct path to buy credits if product wants this here

## Required tests
- route exists
- one real backend action exists
- visibility or referral state persists

## DoD
- standalone route exists
- not hidden inside settings/billing
- minimum one persistent action exists

## Gap map vs snapshot
**RED**
- No dedicated community centre page is visible in observed snapshot routes.
- No clearly named community router/module appears in backend list.
- This is a real gap and should be created as bounded MVP if still part of the target 19.

---

# SCREEN 17. Settings

## Purpose
User control surface for account, consent, notifications, AI preferences, and job sources.

## Canonical route
`/settings`

## Frontend owner
- `frontend/src/app/settings/SettingsHub.tsx`
- `frontend/src/app/settings/JobSourcesSettingsTab.tsx`
- `frontend/src/app/settings/settingsTabFromUrl.ts`

## Backend owner
- `backend/src/trpc/routers/emailSettings.router.ts`
- `backend/src/trpc/routers/security.router.ts`
- `backend/src/trpc/routers/jobSources.router.ts`
- profile/privacy-related persistence where applicable

## Required tabs
- account
- notifications
- email
- privacy/consent
- AI
- job sources
- security entrypoint

## Required rules
- tab URL mapping must work
- every toggle has server-backed persistence
- security not buried beyond discoverability

## Required tests
- open via URL tab
- save setting persists after reload
- changing job source affects jobs discovery
- toggles reflect server state not stale local defaults

## DoD
- settings are real and predictable
- no dead toggles
- source-related settings feed discovery

## Gap map vs snapshot
**GREEN/YELLOW**
- FE settings hub and supporting router surfaces exist.
- Yellow because project state explicitly flags Settings/Consent/Community as still needing cleanup and separation.

---

# SCREEN 18. Billing

## Purpose
Transparent credits-first usage and cost surface.

## Canonical route
`/billing`

## Frontend owner
- `frontend/src/app/billing/BillingPage.tsx`

## Backend owner
- `backend/src/trpc/routers/billing.router.ts`
- `backend/src/services/creditsBilling.ts`
- `backend/src/services/creditsBilling.policy.ts`
- `backend/src/services/billingGuard.ts`
- `backend/src/services/creditsConfig.ts`

## Required UI
- current balance
- monthly free allowance left
- usage history
- packs/recharge
- pending spend states
- cost policy explanation

## Required tests
- billing snapshot render
- usage ordering
- pending spend state
- low balance warning
- module spend consistency checks

## DoD
- user can understand what they spent and why
- ledger state reflected accurately
- supports trust for all costful modules

## Gap map vs snapshot
**GREEN**
- Billing router and supporting policy/services are explicit and mature in snapshot.

---

# SCREEN 19. Legal Hub Search

## Purpose
Source-restricted legal and official-material search within Legal Hub.

## Canonical route
`/legal`

## Frontend owner
- currently observed: `frontend/src/app/legal/LegalHub.tsx`
- target future extraction may use dedicated feature components and `LegalHubSearchPage`

## Backend owner
- `backend/src/trpc/routers/legalHub.router.ts`
- `backend/src/modules/legal-hub-search/*`

## Required source groups
Core default-on:
- Primary Law
- Official Guidance
- ACAS
- Tribunal Decisions
- Appeal Tribunal Decisions

Optional approved groups:
- Explanatory Notes
- Official PDFs
- Curated Contract Law
- Curated Company Law

## Required UI
- search bar
- active source pills
- source scope dropdown
- mode badge
- answer card
- sources used panel
- search scope summary
- warning/disclaimer
- export menu / PDF

## Required answer contract
- Short Answer
- What The Sources Say
- How This May Apply
- Relevant Sources
- What Is Still Unclear
- When To Seek Formal Advice
- Sources Used
- Search Scope

## Required tests
- source toggles update scope
- structured answer shape
- sources used visible
- PDF export
- no open-web default fallback

## DoD
- user can see active scope
- answer is transparently grounded
- PDF preserves disclaimer and scope
- module does not overclaim certainty

## Gap map vs snapshot
**GREEN/YELLOW**
- Backend dedicated module exists with tests, PDF support, AI synthesis, and catalog service.
- FE currently appears as a single `LegalHub.tsx` page rather than the richer decomposed target structure from the implementation spec.
- Yellow because project state says full retrieval/vector/file_search path is not fully closed yet; bounded narrow legal slice must not be overstated as full retrieval completion.

---

## 5. Canonical cross-screen dependency map

### Core flow
1. Profile feeds Jobs, Job Radar, Skill Lab, auto-apply thresholds, and recommendations.
2. Jobs feeds Applications and Job Radar.
3. Job Radar feeds Applications, Documents tailoring, and Assistant context.
4. Documents feed Applications, Style Studio, AI Analysis, and profile evidence.
5. Applications feed Review, Interview context, Negotiation context, and reports.
6. Interview feeds Coach and Reports.
7. Warmup feeds Coach and Interview upsell path.
8. Billing gates all costful actions.
9. Legal Hub Search is intentionally isolated from open web and should not leak into generic assistant behavior.

### Screens that require especially strict separation
- Assistant vs AI Analysis vs Coach
- Interview vs Warmup vs Negotiation
- Settings vs Security vs Community
- Legal Hub Search vs open-web/general assistant behavior

---

## 6. Canonical gap summary table

| Screen | Status | Primary reason |
|---|---|---|
| Dashboard | YELLOW | aggregate contract not explicit enough in snapshot |
| Profile | GREEN/YELLOW | strong slice, downstream proof still needed |
| Jobs | GREEN/YELLOW | source transparency/dedupe/contract closure must be proven |
| Applications | GREEN | route + router present |
| Applications Review | YELLOW | likely partial lifecycle integration risk |
| Documents | GREEN/YELLOW | versioning/parse UX needs proof |
| Style Studio | GREEN/YELLOW | persistence and product identity need proof |
| AI Assistant | GREEN | explicit route/router/tests support existence |
| AI Analysis | YELLOW | FE route exists, backend ownership contract not canonical |
| Interview | GREEN/YELLOW | strong slice, but wider legacy closure still incomplete |
| Coach | GREEN | route/router/tests explicit |
| Daily Warmup | YELLOW | FE + billing piece exist, backend ownership contract not explicit |
| Negotiation | YELLOW/RED | FE exists, backend service exists, explicit router/closure missing |
| Job Radar | GREEN | strongest explicit module in snapshot |
| Skill Lab | GREEN/YELLOW | evidence-backed closure must be proven |
| Community Centre | RED | no dedicated route/backend surface seen |
| Settings | GREEN/YELLOW | explicit pages exist, cleanup still required |
| Billing | GREEN | explicit router/policy/services |
| Legal Hub Search | GREEN/YELLOW | dedicated backend module exists, FE/retrieval closure still partial |

---

## 7. Prioritized implementation closure order

### Tier 1: trust and state coherence
1. Billing
2. Profile
3. Dashboard aggregate
4. Applications
5. Documents
6. Settings

### Tier 2: intelligence and route clarity
7. Jobs
8. Job Radar
9. Skill Lab
10. Legal Hub Search
11. AI Analysis

### Tier 3: practice family closure
12. Interview
13. Coach
14. Daily Warmup
15. Negotiation

### Tier 4: weak or missing surfaces
16. Applications Review hardening
17. Style Studio hardening
18. Community Centre MVP creation
19. final polish of dashboard next-step routing across all screens

---

## 8. Required agent assignment map

### Agent A — Backend Core + trust surfaces
Owns:
- Dashboard aggregate
- Profile
- Applications
- Documents
- Settings
- Billing

### Agent B — Intelligence
Owns:
- Jobs
- Job Radar
- Skill Lab
- AI Analysis backend contract
- Legal Hub Search

### Agent C — Practice + user surfaces
Owns:
- Assistant
- Interview
- Coach
- Warmup
- Negotiation
- Applications Review
- Community Centre MVP if still in target 19

### QC must verify
- no widening claims
- route exists and renders
- action hits backend
- state survives refresh
- billing flow is correct where applicable
- feature identity is not blurred into adjacent modules

---

## 9. Required task template for all 19 screens

Each bounded delivery task must use this template:

### Title
`[SCREEN_NAME] [BOUNDED_SLICE] [OUTCOME]`

### Must include
- route
- frontend file(s)
- backend owner(s)
- current gap being closed
- explicit out-of-scope list
- test commands
- screenshots / route proof
- report markdown path

### Must not claim
- closure of adjacent screens
- closure of whole practice family if only one module changed
- closure of whole Legal Hub if only narrow grounded summary path changed
- closure of full dashboard if only one card got wired

---

## 10. Repo action required after adopting this file

**Imported into repo (canonical copy):**
- [`19-screens-canonical-implementation-and-gap-map-v1.md`](./19-screens-canonical-implementation-and-gap-map-v1.md) — this document (Spokkn baseline merged here)
- Companion (shorter agent rules + task format): [`19-screens-implementation-spec-v1.md`](./19-screens-implementation-spec-v1.md)
- Narrative Title Case screens: [`19-screens-for-users-and-agents.md`](./19-screens-for-users-and-agents.md)

**QC appendix paths (wired in repo):**
- [`19-screens-gap-map-v1.md`](./19-screens-gap-map-v1.md) — short GREEN/YELLOW/RED table
- [`19-screens-route-contracts-v1.md`](./19-screens-route-contracts-v1.md) — route / FE / BE / minimal contract table
- Slice templates + checklist: **`docs/squad/`** — `19-SCREENS_RFQ_TEMPLATE.md`, `READY_FOR_QC_REPORT_TEMPLATE.md`, `19-SCREENS_FIRST_PRODUCTION_SLICES.tsv`, `PO_BOOTSTRAP_CHECKLIST.md`, etc.
- Worked examples (not real QC intake paths): [`../squad/po-examples/README.md`](../squad/po-examples/README.md)
- Import note (ZIP audit): [`../squad/po-repo-ready-bundle/README.md`](../squad/po-repo-ready-bundle/README.md) · retired duplicate folder pointer: [`../squad/po-bootstrap/README.md`](../squad/po-bootstrap/README.md)
- Alias filename `19-screens-canonical-implementation-spec-v1.md` — only if you want the §10 original name verbatim (avoid duplicate content; prefer links above)

**Automation wiring (PO-owned, not automatic until you do it):**
- Each new bounded slice needs a real `docs/qc-reports/...-ready-for-qc.md` on disk **before** (or in the same commit as) a new `AGENT_*` row in `docs/squad/AUTO_TASK_CHAIN.tsv` — see [`docs/squad/AUTOMATION_PO_RUNBOOK.md`](../squad/AUTOMATION_PO_RUNBOOK.md) and `scripts/automation/po-automation-health.sh`.
- Point `TODAY_EXECUTION_BOARD.md` task lines at **this file’s §7 tier + §8 owner** when assigning the next tranche (replace improvised screen wording with `[SCREEN][SLICE]` titles from §9).

**Bootstrap for automatic execution environment:** [`docs/squad/19-SCREENS_AUTO_TASK_BOOTSTRAP.md`](../squad/19-SCREENS_AUTO_TASK_BOOTSTRAP.md).

---

## 11. Final operating rule

A screen is not done because it exists in `src/app/`.
A screen is done only when:
- route exists
- backend owner is explicit
- data contract is explicit
- primary actions work
- refresh preserves state
- billing is honest where applicable
- QC can verify the bounded claim without guessing

