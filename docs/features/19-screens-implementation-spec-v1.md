# 19 Screens — Implementation Spec v1.0

**Purpose:** Single agent/QC-facing spec: shared UI/data/billing/test rules, per-screen repo paths, DTOs, DoD, and task format.  
**Canonical gap map + per-screen DoD (import):** [`19-screens-canonical-implementation-and-gap-map-v1.md`](./19-screens-canonical-implementation-and-gap-map-v1.md)  
**Production-ready definition + cross-flows:** [`19-screens-production-readiness-and-cross-flows-v1.md`](./19-screens-production-readiness-and-cross-flows-v1.md)  
**Companion (product narrative + Title Case):** [`19-screens-for-users-and-agents.md`](./19-screens-for-users-and-agents.md) · [`product-screens-spec-v1.0.md`](./product-screens-spec-v1.0.md)  
**Squad split:** [`../squad/README.md`](../squad/README.md) — align Agent 1/2/3 with **Agent A / B / C** blocks below when assigning bounded slices.

---

## What is still missing (outside this document)

1. **Per-screen gap matrix** — table `screen → route exists? → backend aggregate? → tests present?` filled from repo audit (not duplicated here).
2. **`dashboard.getSnapshot`** (or equivalent) — contract may not exist yet; must be one bounded delivery with RFQ.
3. **Telemetry registry** — event names (`dashboard_opened`, …) must match one analytics module / policy doc.
4. **Community Centre** — dedicated route + MVP backend action (explicit product gap until filed).
5. **Legal Hub Search** — full `file_search`/vector path vs catalogue-grounded slice: honest QC boundary (see [`legal-hub-search-full-implementation-spec-v1.0.md`](./legal-hub-search-full-implementation-spec-v1.0.md)).
6. **AUTO_TASK_CHAIN / board** — each new screen slice gets a `docs/qc-reports/…-ready-for-qc.md` path **before** chain row, per automation rules.
7. **Screenshots / route proof** — per-slice delivery requirement, not stored in this markdown.

---

## Shared rules — all 19 screens

Every agent receives the **same** ruleset (otherwise each ships something different).

### Shared UI rules

- One **primary CTA** per screen; at most **two** secondary CTAs.
- Four states: **loading**, **empty**, **error**, **populated**.
- Header component on each screen: **title**, **one-line value statement**, **primary action**, optional **cost badge** if credits may be spent.
- No dead toggles.
- No CTA without a **real** backend action.
- **Skeletons** instead of spinner walls.
- Empty states must lead to a **sensible next step**, not a dead end.

### Shared data rules

- Inputs only from **routers / service layer** — no local fantasy state as source of truth.
- **DTOs** at FE/BE boundary are explicit; mapping via **hook/api layer**.
- Do not mix **raw entity** and **display model** in one component.
- Each screen that composes multiple sources has a **view model** or **mapper**.
- User-facing errors are **normalized**.

### Shared billing rules

If an action costs credits:

- Show **fixed** or **estimated** cost before start.
- **approve** before execution.
- **commit** after success.
- **reject** on failure / abandon.
- No direct debits outside the **billing engine**.

### Shared test rules

- Route render
- Loading
- Empty
- Error
- Main action
- Backend integration or **mock contract**
- **Cost exposure** if screen spends credits

---

## Agent split (A / B / C) — no scope mixing

| Track | Owner (concept) | Repo agents | Scope |
|-------|------------------|-------------|--------|
| **A** | Backend Core + trust surfaces | Agent 1 | Dashboard aggregate, Profile, Applications, Documents, Settings, Billing |
| **B** | Intelligence | Agent 2 | Jobs, AI Analysis, Job Radar, Skill Lab, Legal Hub Search |
| **C** | Practice + assistant surfaces | Agent 3 | AI Assistant, Interview, Coach, Daily Warmup, Negotiation, Applications Review, Community MVP |

Matches operational reset: **Core / Intelligence / Practice**, not everything at once.

---

## Task format (every screen slice)

**Task title:** `[SCREEN] [SLICE] [bounded goal]`

**Input:** route · FE file · BE router/service · expected DTO · current blocker · **out of scope**

**Delivery must include:** repo diff · touched files · tests run · route proof (or screenshot) · report markdown · explicit **done / not done**

**QC checks:** route renders · action hits backend · state survives refresh · billing obeys approve/commit/reject if costful · no anti-widening

---

## Closing principle

A screen is an **interface to decisions**, not decoration. Without explicit data in, actions out, next step, and testable DoD — it is **drawn**, not **shipped**.

---

# Screen specs (1–19)

Below: **Repo FE/BE**, **goal**, **minimal DTO / query where given**, **key UI**, **tests**, **DoD**. Wording aligned with Title Case where user-facing.

## 1. Dashboard

- **Repo FE:** `frontend/src/app/dashboard/DashboardPage.tsx`
- **Repo BE:** aggregate from `profile.router`, `billing.router`, `applications.router`, `jobs.router`, `jobRadar.router`, `assistant.router`; optional reports/review.
- **Goal:** Answer “what should I do now?” — not a news feed, junk drawer, or marketing landing.
- **UI:** Header (greeting, completeness, credits, main CTA); priority strip (1 + 1 backup); quick stats; modules grid; activity; alerts.
- **DTO:** `DashboardSnapshot` (profile completeness, billing, applications, jobs, practice, recommendations) — prefer **`dashboard.getSnapshot`** or one controlled composition (not 8 hooks / 8 spinners).
- **Loading:** skeleton header + 4 stat cards + 2 recommendation skeletons.
- **Empty:** new user — Complete profile, Upload CV, Start job discovery.
- **Error:** fallback card + retry + profile/settings if partial failure.
- **Telemetry:** `dashboard_opened`, `dashboard_next_action_clicked`, `dashboard_module_card_clicked`.
- **Tests:** new user render; active user; low balance; missing profile recommendation; retry after error; contract snapshot.
- **DoD:** one aggregate or controlled composition; max 2 concurrent spinners; unambiguous next step; CTAs hit real routes.

## 2. Profile

- **Repo FE:** `frontend/src/app/profile/ProfilePage.tsx`
- **Repo BE:** `profile.router.ts`, `profileSourceOfTruth.ts`, `profileSourceOfTruth.policy.ts`
- **Goal:** Source of truth for jobs, radar, auto-apply, growth, recommendations.
- **Sections:** Career basics; target role; salary/thresholds; work values; skills/evidence; roadmap/growth; completeness.
- **DTO:** `ProfileDto` (basics, targets, salary, values, skills, autoApplyThreshold, roadmap, blockedAreas, completeness).
- **Mutations:** `profile.get`, `profile.update`, `profile.getCompleteness`, optional `profile.recalculateDerivedSignals`.
- **Validation:** salary min ≤ target; threshold 0–100; max desired roles; location length bound.
- **Autosave:** simple sections autosave; heavy sections explicit save; visible “saved”.
- **Edge cases:** partial onboarding; CV import; locked save; concurrent tabs.
- **Downstream:** every change affects jobs matching, radar fit note, skill recs, auto-apply.
- **Tests:** single-section update; completeness; salary validation; downstream refresh; reload persistence.
- **DoD:** refresh keeps data; completeness correct; downstream reads new profile; no dead fields.

## 3. Jobs

- **Repo FE:** `frontend/src/app/jobs/JobsDiscovery.tsx`
- **Repo BE:** `jobs.router.ts`, `jobDiscoveryService.ts`, `profileDrivenDiscovery.ts`, `providerRegistry.ts`
- **Goal:** Profile-aligned job discovery.
- **UI:** Search header; filters; results; detail drawer; saved/hide/apply strip.
- **DTO:** `JobListItem` (id, title, company, location, workMode, salary, postedAt, source, saved, hidden, basicMatchNote, fitScore).
- **Actions:** `jobs.search`, `jobs.save`, `jobs.hide`, `jobs.addToApplications`, `jobRadar.startFromSavedJob`.
- **Loading:** list skeleton ~8 rows; filters visible, disabled while loading.
- **Empty:** No results + suggest widen filters / update profile.
- **Error:** partial provider failure must not kill page; warning + partial results.
- **Edge cases:** dedupe; missing salary; expired listing; offline source; AI results source-badged.
- **Tests:** filters; save/hide persist; add to applications; send to radar id; dedupe mapping.
- **DoD:** real results; source transparency; actions persist; stable drawer with incomplete data.

## 4. Applications

- **Repo FE:** `ApplicationsPage.tsx`, `ApplicationsPipeline.tsx`
- **Repo BE:** `applications.router.ts`
- **Goal:** Durable application pipeline.
- **Stages:** draft → prepared → sent → waiting → follow-up → interview → rejected → accepted.
- **UI:** Header counts; pipeline; row/card; detail drawer (timeline, notes, next action, CV, radar).
- **Mutations:** create; update stage; note; document; archive; mark offer/rejected.
- **Validation:** allowed stage graph; terminal states; document ownership.
- **Timeline:** audit events for moves; notes with timestamps; actor user/system/import.
- **Empty / Error:** as in spec (empty CTA; optimistic rollback on stage failure).
- **Tests:** create; move stage; terminal; notes; linked docs.
- **DoD:** durable pipeline; history; linked context visible; no local-only fake moves.

## 5. Applications Review

- **Repo FE:** `frontend/src/app/review/ReviewQueue.tsx` (or route renamed to Applications Review semantics).
- **Repo BE:** `review.router.ts` + applications history.
- **Goal:** “What next after I applied?”
- **DTO:** `ApplicationReviewItem` (applicationId, company, role, sentAt, daysWithoutReply, listingStatus, recommendedAction, reason).
- **Actions:** follow-up suggestion; mark followed up; snooze; move stage; archive.
- **Tests:** due logic; recommendation mapping; follow-up moves timeline; sync with Applications.
- **DoD:** queue reads real data; explainable recommendations; actionable from screen.

## 6. Documents Upload / Document Lab

- **Repo FE:** `frontend/src/app/documents/DocumentLab.tsx`
- **Repo BE:** `documents.router.ts`, `cv.router.ts`
- **Goal:** Upload, parse, version, attach.
- **DTO:** `DocumentItem` (id, name, kind, mimeType, parseStatus, extractedTextAvailable, versionNumber, parentDocumentId, linkedJobId, linkedApplicationId).
- **Mutations:** upload; delete; rename; set primary; request extraction; tailored version; attach.
- **Tests:** upload; parse transitions; versioning; attach; primary uniqueness.
- **DoD:** E2E upload; visible parse status; lineage; application can consume doc.

## 7. Style Studio

- **Repo FE:** `StyleStudio.tsx`, `StyleStudioRedirect.tsx`
- **Repo BE:** `style.router.ts`; may use skill/billing policies.
- **Goal:** Improve document style without mixing into generic chat.
- **DTO:** `StyleRequest` (documentId?, rawText?, styleMode, targetContext?).
- **Cost:** disclose before generate if AI path costs.
- **Tests:** generate; save as version; cost disclosure; unsupported input guard.
- **DoD:** improves real text; save/export; distinct from Documents / Analysis.

## 8. AI Assistant

- **Repo FE:** `AssistantPage.tsx`
- **Repo BE:** `assistant.router.ts`, `assistant-product-meta.ts`, prompts.
- **Goal:** Fast help + routing, not omniscient expert.
- **Contract:** short answer; next step; link to module; `aiProductMeta` when required.
- **Tests:** send/receive; context injection; route chip; meta visible; length bound.
- **DoD:** useful router; stable session; not Analysis/Coach/Legal.

## 9. AI Analysis

- **Repo FE:** `AiAnalysisPage.tsx`
- **Repo BE:** analysis services; shared OpenAI layer + document/profile context.
- **Goal:** Deep structured analysis (strengths/gaps/rewrite/fit/deep).
- **Billing:** deep mode estimated; approve before expensive run.
- **Tests:** input switch; structured render; deep cost; retry; export/copy.
- **DoD:** expert tool UX; not “bigger assistant”.

## 10. Interview

- **Repo FE:** `InterviewPractice.tsx`
- **Repo BE:** `interview.router.ts`, `liveInterview.router.ts`, `interview.ts`, `interviewConversation.ts`, prompts/reports.
- **Goal:** Realistic practice; separate from Coach and Warmup.
- **Flow:** setup (cost preview) → session → review → summary.
- **Billing:** approve → commit on complete → reject on abandon/fail.
- **State machine:** draft / active / completed / abandoned / failed.
- **Tests:** start; approval; answer flow; summary; abandon → reject; report persistence.
- **DoD:** E2E session; hermetic billing; saved report.

## 11. Coach

- **Repo FE:** `CoachPage.tsx`
- **Repo BE:** `coach.router.ts`, prompts, handoff services.
- **Goal:** Strategic support + action plan (not interview simulation).
- **Billing:** estimate + approve before generation.
- **Tests:** handoff from interview; structured output; cost; deep mode; save to reports.
- **DoD:** distinct from Assistant and Interview; structured action plan.

## 12. Daily Warmup

- **Repo FE:** `DailyWarmupPage.tsx`, `warmupTierCatalog.ts`
- **Repo BE:** `session-practice/warmupCredits.ts`, warmup session logic.
- **Goal:** Low-friction daily practice.
- **Rules:** fixed cost by duration; minimal setup; controlled session length.
- **Tests:** tier; cost display; start; result persistence; follow-up routes.
- **DoD:** few clicks to launch; clear cost/outcome; habit-friendly.

## 13. Negotiation

- **Repo FE:** `NegotiationPage.tsx`
- **Repo BE:** `negotiationConversation.ts`, prompts; router cleanup may still be open (per project state).
- **Goal:** Offer prep and reply artifacts; separate from Coach/Interview.
- **Tests:** draft; strategy; roleplay; save to application notes; cost.
- **DoD:** separate identity; usable artifacts.

## 14. Job Radar

- **Repo FE:** `JobRadarLandingPage.tsx`, `JobRadarScanPage.tsx`, `JobRadarReportPage.tsx`, admin complaints page.
- **Repo BE:** `jobRadar.router.ts`, `modules/job-radar/*`, `job-radar.express.router.ts`.
- **Goal:** Employer/job intelligence; versioned immutable reports; rescan = new result.
- **Tests:** saved job start; polling; report retrieval; ownership; rescan; complaint; OpenAPI parity where applicable.
- **DoD:** E2E scan; decision-oriented report; freshness/sources visible; admin isolated.

## 15. Skill Lab

- **Repo FE:** `SkillsLab.tsx`
- **Repo BE:** `skillLab.router.ts`, `skillLabCore.service.ts`, `skillLabSignals.service.ts`, `modules/skillup/*`.
- **Goal:** Market value, gaps, growth path — evidence-backed.
- **DTO:** `SkillSignal` (skill, band, salaryImpact, evidenceHints, verificationHints, relatedCourses, growthActions).
- **Tests:** signal generation; explanations; courses; evidence hints; routes to docs/jobs.
- **DoD:** justified recommendations; not vague wallpaper.

## 16. Community Centre

- **Repo FE:** dedicated route/component may be absent — **planned gap**; do not hide inside Settings/Billing.
- **Repo BE:** referral, patron, visibility, events hooks, credit entry (target).
- **MVP:** referrals; patron/credits entry; events placeholder; optional featured stories.
- **Tests:** referral code; credit entry; visibility persistence.
- **DoD:** standalone route; not mixed with consent/settings; at least one real backend action.

## 17. Settings

- **Repo FE:** `SettingsHub.tsx`, `JobSourcesSettingsTab.tsx`, `SecurityPage.tsx`, `settingsTabFromUrl.ts`
- **Repo BE:** `emailSettings.router.ts`, `security.router.ts`, `jobSources.router.ts`; profile/privacy as applicable.
- **Goal:** Account, consent, prefs, AI, job sources — **each option affects backend**; URL tab sync.
- **Tests:** open tab by URL; persist; reload reflects server; toggle downstream effect.
- **DoD:** real settings; no dead toggles; security not buried.

## 18. Billing

- **Repo FE:** `BillingPage.tsx`
- **Repo BE:** `billing.router.ts`, engine/guards.
- **Goal:** Transparent credits-first ledger UX.
- **DTO:** `BillingSnapshot` (balance, allowance, pendingSpends, usageHistory).
- **Tests:** snapshot; history order; pending render; low balance; consistency with module spends.
- **DoD:** user understands spend; matches ledger; builds trust for module costs.

## 19. Legal Hub Search

- **Repo FE:** `LegalHub.tsx` today; target may add `LegalHubSearchPage` + feature components; legal static pages: Cookies, Privacy, Terms.
- **Repo BE:** `legalHub.router.ts`, `modules/legal-hub-search/*`.
- **Goal:** Source-restricted legal search — not open-web legal chatbot.
- **UI:** header, search bar, source pills, scope dropdown, mode badge, answer card, sources used, scope summary, disclaimer, export, PDF.
- **Answer contract:** Short Answer; What The Sources Say; How This May Apply; Relevant Sources; What Is Still Unclear; When To Seek Formal Advice; Sources Used; Search Scope.
- **PDF:** question, timestamp, jurisdiction, scope, sources, disclaimer; no internal IDs/debug.
- **Backend flow:** validate query → resolve scope → map to approved groups/stores → retrieval/file_search → structured synthesis → optional PDF.
- **States:** loading, empty, error, populated.
- **Honesty:** full vector/file_search path may not be closed — bounded grounded slice may be live; do not overclaim in RFQ.
- **Tests:** toggles change scope; answer structure; sources panel; PDF; no open-web fallback; guard unsupported scope.
- **DoD:** active sources visible; grounded transparency; PDF preserves disclaimer; no false certainty.
