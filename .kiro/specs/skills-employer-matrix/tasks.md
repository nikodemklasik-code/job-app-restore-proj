# Implementation Tasks: Skills & Employer Verification Matrix

## Task 1: Create shared types and Trust Metadata utilities

- [x] Create `backend/src/services/skillMatrix/types.ts` with all shared TypeScript interfaces: `TrustMetadata`, `EvidenceLevel`, `EvidenceSourceType`, `SkillCategory`, `SignalCategory`, `SkillSignalType`, `ScoredResult`, `JobFitResult`, `ActionPriorityResult`
- [x] Create `backend/src/services/skillMatrix/trustMetadata.ts` with `computeFreshness()` utility function and `buildTrustMetadata()` factory helper
- [x] Create `backend/src/services/skillMatrix/errors.ts` with `SkillMatrixError` class and error codes (`TAXONOMY_RESOLUTION_FAILED`, `EVIDENCE_EXTRACTION_FAILED`, `SCORING_FAILED`, `EMPLOYER_LOOKUP_FAILED`, `INSUFFICIENT_DATA`)
- [x] Create `backend/src/services/skillMatrix/constants.ts` with scoring weights, evidence level scores, category weights, and threshold values referenced in the design

### Requirements addressed
- Requirement 24 (Trust Metadata on All Insights)
- Cross-cutting type definitions used by Requirements 1–14

---

## Task 2: Create Skill Taxonomy and Employer database schema

- [x] Create `backend/src/db/schemas/skills-matrix.ts` with Drizzle table definitions: `skillTaxonomy`, `skillRelationships`, `employers`, `employerSources`, `employerSignals`, `jobSourceSnapshots`, `scoreAuditLog`, `productEvents`, `applicationEvents`
- [x] Note: `skillEvidence` and `skillSignals` tables from the design overlap with existing `skill_evidence` in `schemas/skillup.ts` — extend the existing table with new columns (`evidenceUrl`, `occurredAt`, `verifiedByUser`) rather than creating a duplicate; add a new `skill_signals` table
- [x] Import the new schema file into `backend/src/db/schema.ts` (re-export all tables)
- [x] Run `cd /Users/nikodem/MultivoHub\ 26042026/job-app-restore-proj/backend && npx drizzle-kit generate` to produce the migration SQL (created manually as `0010_skills_employer_matrix.sql` due to ESM/CJS drizzle-kit issue)
- [x] Verify the generated migration file in `backend/src/db/migrations/`

### Requirements addressed
- Requirement 1 (Skill Taxonomy)
- Requirement 2 (Skill Evidence — schema extension)
- Requirement 5 (Employer Trust/Risk Schema)
- Requirement 11 (Score Audit Log)
- Requirement 14 (Application Events)
- Requirement 15 (Job Source Snapshots)
- Requirement 19 (Product Events / Telemetry)

---

## Task 3: Implement Skill Taxonomy Service

- [x] Create `backend/src/services/skillMatrix/skillTaxonomy.service.ts` implementing `resolveSkill()`, `getCanonicalSkill()`, `searchSkills()`, `getRelatedSkills()`, `createPendingSkill()`
- [x] Implement alias matching (exact → alias → fuzzy) with confidence scoring in `resolveSkill()`
- [x] Implement fuzzy normalization using Levenshtein distance or similar for unresolved skills
- [x] Implement `createPendingSkill()` that creates entries with `status: 'pending_review'` and a temporary canonical ID
- [x] Create `backend/src/services/skillMatrix/data/seed-taxonomy.ts` with initial ~500 canonical skills (programming languages, frameworks, tools, methodologies, soft skills, certifications) and their aliases

### Requirements addressed
- Requirement 1 (Skill Taxonomy and Normalized Skill Dictionary)

---

## Task 4: Implement Skill Evidence Service

- [x] Create `backend/src/services/skillMatrix/skillEvidence.service.ts` implementing `addEvidence()`, `getEvidenceForSkill()`, `getUserEvidence()`, `classifyEvidenceLevel()`, `confirmEvidence()`, `getBestEvidence()`
- [x] Implement evidence level classification logic: Declared (user claims), Observed (CV/profile extraction), Demonstrated (portfolio/GitHub), Verified (certificate/test), Recent (used in last 6 months)
- [x] Implement confidence scoring based on source reliability: certificate > github > portfolio > cv > profile
- [x] Implement `confirmEvidence()` that adjusts confidence up (confirmed) or down (rejected) based on `verifiedByUser`
- [x] Implement `getBestEvidence()` selecting highest-confidence, most-recent evidence per (userId, skillId)
- [x] Implement stale evidence detection: flag skills with all evidence older than 24 months

### Requirements addressed
- Requirement 2 (Skill Evidence Model and Storage)

---

## Task 5: Implement Scoring Service — core algorithms

- [x] Create `backend/src/services/scoring/skillReadiness.ts` with `computeSkillReadiness()` using 6 weighted dimensions (level 25%, evidence 20%, recency 15%, market 15%, role 15%, transferability 10%)
- [x] Create `backend/src/services/scoring/evidenceStrength.ts` with `computeEvidenceStrength()` based on highest level, corroboration bonus, and confidence multiplier
- [x] Create `backend/src/services/scoring/recency.ts` with `computeRecencyDimension()` implementing the decay curve (100→80 at 6mo, 80→50 at 12mo, 50→20 at 24mo+)
- [x] Create `backend/src/services/scoring/marketValue.ts` with `computeMarketValue()` referencing job listing frequency, salary correlation, and coverage bonus
- [x] Create `backend/src/services/scoring/jobFit.ts` with `computeJobFit()` using evidence-weighted skill matching with per-skill contribution breakdown
- [x] Create `backend/src/services/scoring/employerTrust.ts` with `computeEmployerTrust()` aggregating positive signals with category weights and diminishing returns
- [x] Create `backend/src/services/scoring/employerRisk.ts` with `computeEmployerRisk()` aggregating negative signals with Category I weighted highest
- [x] Create `backend/src/services/scoring/actionPriority.ts` with `computeActionPriority()` synthesizing all scores into apply_now/save/reject/verify_employer recommendation
- [x] Create `backend/src/services/scoring/auditLog.ts` with `writeAuditEntry()` that computes inputHash (SHA-256) and inserts into `score_audit_log`
- [x] Create `backend/src/services/scoring/index.ts` barrel export and `ScoringService` class orchestrating all computations

### Requirements addressed
- Requirement 3 (Multi-Dimensional Skill Scoring)
- Requirement 6 (Employer Trust Score)
- Requirement 7 (Employer Risk Score)
- Requirement 8 (Job Fit Score)
- Requirement 9 (Market Value Score)
- Requirement 10 (Action Priority Score)
- Requirement 11 (Score Audit Log)

---

## Task 6: Implement Skill Signal Generation Service

- [x] Create `backend/src/services/skillMatrix/skillSignals.service.ts` implementing `generateSignals()`, `getUserSignals()`, `getSignalsForJob()`
- [x] Implement signal type generators: `strength` (high evidence + high demand), `gap` (required skill missing/weak), `market_trend` (demand trending), `salary_leverage` (salary correlation), `cv_value`, `verification_needed` (declared-only), `learning_recommendation`, `interview_risk` (weak evidence + frequent interview topic)
- [x] Attach `TrustMetadata` to every generated signal using the `buildTrustMetadata()` helper
- [x] Implement signal expiry logic (signals expire when underlying data changes)

### Requirements addressed
- Requirement 4 (Skill Signal Generation)

---

## Task 7: Implement Employer Intelligence Service

- [x] Create `backend/src/services/employerIntel/employerIntel.service.ts` implementing `findOrCreateEmployer()`, `addSource()`, `getEmployerProfile()`, `getSignalsByCategory()`
- [x] Implement employer name normalization (lowercase, strip Ltd/Inc/PLC suffixes, trim whitespace) ensuring idempotency
- [x] Implement domain matching for employer deduplication (extract domain from website, match against existing records)
- [x] Create `backend/src/services/employerIntel/signalDetector.ts` with the 9 category detector functions: `detectIdentityCredibility()`, `detectOfferTransparency()`, `detectCompensationBenefits()`, `detectBusinessStability()`, `detectCultureManagement()`, `detectRecruitmentProcess()`, `detectTechnologyMaturity()`, `detectUkLocalRisks()`, `detectScamFraud()`
- [x] Implement signal conflict resolution: weight by source confidence and recency, flag conflicts for user visibility
- [x] Integrate with existing `jobProtection.ts` patterns for baseline heuristic signal detection

### Requirements addressed
- Requirement 5 (Employer Trust/Risk Schema)
- Requirement 17 (UK-Specific Employer Signals)
- Requirement 18 (Employer Verification Categories B–G)

---

## Task 8: Implement Job Ingestion Service with Adzuna UK provider

- [x] Create `backend/src/services/skillMatrix/jobIngestion.service.ts` implementing provider ingestion, deduplication, and source snapshot management
- [x] Create `backend/src/services/skillMatrix/providers/adzunaUk.provider.ts` integrating with Adzuna UK API: fetch listings, extract fields (title, description, salary_min/max, location, company, category, contract_type), normalize salary to annual GBP
- [x] Implement content hash computation (SHA-256) for duplicate detection and change tracking
- [x] Implement `job_source_snapshots` lifecycle: create on first seen, update `lastSeenAt` on re-seen, mark expired after 7 days absent
- [x] Implement configurable ingestion schedule (default: every 6 hours) with rate limiting and exponential backoff
- [x] Map Adzuna categories to internal skill taxonomy for automatic skill requirement extraction

### Requirements addressed
- Requirement 15 (Job Ingestion with Source Metadata)
- Requirement 16 (Adzuna UK Provider Integration)

---

## Task 9: Implement Telemetry Service

- [x] Create `backend/src/services/telemetry/telemetry.service.ts` implementing `recordEvent()`, `queryEvents()`, `getRecommendationAccuracy()`
- [x] Implement event recording with fields: userId, eventName, entityType, entityId, metadata, occurredAt
- [x] Implement recommendation accuracy computation: compare action priority recommendations against actual application outcomes on a rolling 30-day window
- [x] Ensure no PII is stored in event metadata — only anonymized entity references
- [x] Implement event aggregation queries for measuring signal engagement rates, score distribution, and feature adoption

### Requirements addressed
- Requirement 19 (Telemetry Events)
- Requirement 20 (Feedback Loops — accuracy metrics)

---

## Task 10: Create tRPC routers for Skill Matrix, Employer Intel, Scoring, and Telemetry

- [x] Create `backend/src/trpc/routers/skillMatrix.router.ts` with procedures: `searchSkills`, `getSkillDetails`, `getUserEvidence`, `addEvidence`, `confirmEvidence`, `getUserSignals`, `getSignalsForJob`, `getSkillReadiness`, `getPortfolioOverview`, `syncFromLegacySkills`
- [x] Create `backend/src/trpc/routers/employerIntel.router.ts` with procedures: `getEmployerProfile`, `getEmployerByName`, `getSignalsByCategory`, `getTrustRiskScores`, `getUkSignals`, `reportSignalInaccuracy`
- [x] Create `backend/src/trpc/routers/scoring.router.ts` with procedures: `getJobFit`, `getActionPriority`, `getMarketValue`, `analyzeSkillGaps` (paid), `employerDeepDive` (paid), `marketComparison` (paid), `disagreeWithScore`
- [x] Create `backend/src/trpc/routers/telemetry.router.ts` with procedures: `recordEvent`, `getRecommendationAccuracy`
- [x] Register all new routers in `backend/src/trpc/routers/index.ts`
- [x] Add Zod input validation schemas for all procedures
- [x] Wire paid AI actions through existing `creditsBilling.ts` / `billingGuard.ts` for credit reservation lifecycle

### Requirements addressed
- Requirement 3–10 (all scoring endpoints)
- Requirement 12 (Job Radar Trust Layer — API surface)
- Requirement 13 (Credits Reservation for paid AI actions)
- Requirement 19–20 (Telemetry and Feedback endpoints)

---

## Task 11: Implement legacy skills migration utility

- [x] Create `backend/src/services/skillMatrix/migration.ts` implementing `migrateUserSkillsToEvidence()` that converts existing `skills` table rows into `skill_evidence` records with `evidenceType: 'declared'`, `sourceType: 'profile'`, `confidence: 0.5`
- [x] Implement `migrateEmployersFromJobs()` that creates `employers` records from unique `jobs.company` values with normalized names
- [x] Implement dual-write logic: profile save operations write to both `skills` (legacy) and `skill_evidence` (new)
- [x] Add `syncFromLegacySkills` mutation to the skillMatrix router that triggers per-user migration on demand
- [x] Ensure migration is idempotent (re-running does not create duplicate evidence records)

### Requirements addressed
- Design: Migration Strategy (Phases 1–3)
- Requirement 1.6 (re-normalize on dictionary update)

---

## Task 12: Create frontend Zustand stores

- [x] Create `frontend/src/stores/skillMatrixStore.ts` with state (skills, evidence, signals, scores, portfolioOverview, isLoading) and actions (loadPortfolio, addEvidence, confirmEvidence, syncFromLegacy, getSkillReadiness)
- [x] Create `frontend/src/stores/employerIntelStore.ts` with state (currentEmployer, signals, trustScore, riskScore, isLoading) and actions (loadEmployer, loadByName, reportInaccuracy)
- [x] Create `frontend/src/stores/scoringStore.ts` with state (jobFitScores, actionPriorities, marketValue, isLoading) and actions (getJobFit, getActionPriority, loadMarketValue, disagreeWithScore)
- [x] Wire all stores to tRPC client using existing `@trpc/react-query` patterns from the project

### Requirements addressed
- Design: Frontend Components and State Management
- Supports Requirements 1–10 (frontend data layer)

---

## Task 13: Build Skill Portfolio frontend view

- [x] Create `frontend/src/components/skills/SkillEvidenceCard.tsx` showing skill name, evidence level badge (declared/observed/demonstrated/verified/recent), confidence indicator, and attached signals
- [x] Create `frontend/src/components/skills/SkillPortfolioView.tsx` displaying all user skills with readiness scores, gap indicators, and signal summaries
- [x] Create `frontend/src/components/scoring/ScoreBreakdownPanel.tsx` with per-dimension visualization (bar chart or radar) for skill readiness breakdown
- [x] Create `frontend/src/components/shared/TrustMetadataTooltip.tsx` reusable tooltip showing source, confidence, freshness, and explanation type
- [x] Integrate into existing `frontend/src/app/skills/` page alongside or replacing `SkillsLab.tsx` (via `SkillsLabWithMatrix.tsx` tab wrapper)
- [x] Add "Sync from profile" button triggering `syncFromLegacySkills` for users with existing skills data

### Requirements addressed
- Requirement 1–4 (Skill taxonomy, evidence, scoring, signals — user-facing)
- Requirement 24 (Trust Metadata display)

---

## Task 14: Build Employer Trust/Risk UI components

- [x] Create `frontend/src/components/employer/EmployerTrustBadge.tsx` showing compact trust level indicator (verified ≥75, likely_legit ≥55, review ≥35, risky <35)
- [x] Create `frontend/src/components/employer/EmployerRiskDrawer.tsx` expandable drawer showing all signals grouped by category with Trust_Metadata
- [x] Create `frontend/src/components/jobs/ActionPriorityBadge.tsx` displaying apply_now/save/reject/verify_employer as primary CTA on job cards
- [x] Integrate `EmployerTrustBadge` and `ActionPriorityBadge` into existing Job Radar job cards (`frontend/src/features/job-radar/`)
- [x] Add risk indicator with top contributing signals when Employer Risk > 50 (via EmployerTrustBadge riskScore prop)
- [x] Implement "Override recommendation" action with feedback capture (disagreeWithScore via scoringStore)

### Requirements addressed
- Requirement 12 (Job Radar Trust Layer Integration)
- Requirement 26 (UX Copy and Risk Communication Standards)

---

## Task 15: Implement AI-powered paid features (P2)

- [x] Create `backend/src/services/scoring/aiGapAnalysis.ts` implementing detailed skill gap analysis with learning recommendations, time-to-close estimates, and signal language
- [x] Create `backend/src/services/scoring/aiEmployerDeepDive.ts` implementing narrative employer summary synthesizing all 9 categories with key strengths, notable risks, data gaps
- [x] Create `backend/src/services/scoring/aiMarketComparison.ts` implementing comparative analysis with salary benchmarks (P25, median, P75), emerging skills, and above/below market indicators
- [x] Wire all three through credit reservation lifecycle: display cost → reserve → execute → commit/release (creditsConfig.ts updated)
- [x] Create `frontend/src/app/skills/GapAnalysisReport.tsx` displaying AI-generated gap analysis with learning recommendations
- [x] Ensure all AI outputs use signal language (never judgments) and attach Trust_Metadata

### Requirements addressed
- Requirement 21 (AI Skill Gap Analysis)
- Requirement 22 (AI Employer Deep-Dive)
- Requirement 23 (AI Market Comparison)
- Requirement 13 (Credits Reservation Lifecycle)

---

## Task 16: Implement feedback loops and data privacy

- [x] Add score disagreement recording in Scoring Service: store disagreement with reason, use as training signal (feedback.service.ts)
- [x] Add signal inaccuracy reporting in Employer Intelligence Service: flag signal, reduce confidence in future computations (feedback.service.ts)
- [x] Implement application outcome tracking: compare outcomes against original Action Priority to measure accuracy (telemetry.service.ts)
- [x] Implement recommendation accuracy metrics (precision/recall per score type, rolling 30-day window) with alert when accuracy drops below 60% (telemetry.service.ts)
- [x] Implement user data export endpoint (JSON format: skills, evidence, scores, application history) (dataPrivacy.service.ts)
- [x] Implement user data deletion: remove personal evidence, application records, telemetry events within 30 days; anonymize audit log entries (dataPrivacy.service.ts)

### Requirements addressed
- Requirement 20 (Feedback Loops)
- Requirement 25 (Data Privacy and User Control)

---

## Task 17: Install fast-check and implement property-based tests

- [x] Run `cd /Users/nikodem/MultivoHub\ 26042026/job-app-restore-proj/backend && npm install --save-dev fast-check`
- [x] Create `backend/src/services/skillMatrix/__tests__/skillTaxonomy.property.spec.ts` — Property 24 (normalization idempotency)
- [x] Create `backend/src/services/skillMatrix/__tests__/skillEvidence.property.spec.ts` — Properties 3, 4, 7 (classification, confidence bounds, stale flagging)
- [x] Create `backend/src/services/skillMatrix/__tests__/scoring.property.spec.ts` — Properties 8, 9, 14, 15, 17 (score bounds, recency monotonicity, trust cap, independence, action priority rules)
- [x] Create `backend/src/services/skillMatrix/__tests__/trustMetadata.property.spec.ts` — Property 19 (metadata present on every insight)
- [x] Create `backend/src/services/skillMatrix/__tests__/uxCopy.property.spec.ts` — Property 20 (no forbidden phrases)
- [x] Create `backend/src/services/skillMatrix/__tests__/jobIngestion.property.spec.ts` — Property 21 (content hash determinism)
- [x] Create `backend/src/services/skillMatrix/__tests__/ukSignals.property.spec.ts` — Property 22 (UK signal keyword detection)
- [x] Create `backend/src/services/skillMatrix/__tests__/credits.property.spec.ts` — Property 23 (credits balance invariant)
- [x] Configure minimum 100 iterations per property test

### Requirements addressed
- Design: Testing Strategy (all 24 correctness properties)
- Validates Requirements 1–26 through formal property verification

---

## Task 18: Integration tests and graceful degradation

- [x] Create `backend/src/services/skillMatrix/__tests__/integration/employerIntel.integration.spec.ts` — end-to-end employer signal detection with mocked sources
- [x] Create `backend/src/services/skillMatrix/__tests__/integration/adzunaProvider.integration.spec.ts` — Adzuna API integration with mocked responses
- [x] Create `backend/src/services/skillMatrix/__tests__/integration/aiGapAnalysis.integration.spec.ts` — AI gap analysis with mocked OpenAI
- [x] Create `backend/src/services/skillMatrix/__tests__/integration/dataPrivacy.integration.spec.ts` — data deletion and export workflow
- [x] Implement graceful degradation: if new scoring unavailable, fall back to existing `scoreJobFit()` in `aiPersonalizer.ts`; if employer intel has no data, fall back to `assessEmployerSignals()` in `jobProtection.ts` (gracefulDegradation.ts)
- [x] Verify all AI features degrade to deterministic alternatives when OpenAI is unavailable (all AI features use deterministic heuristics, no OpenAI dependency)

### Requirements addressed
- Design: Error Handling and Graceful Degradation
- Design: Testing Strategy (integration tests)
