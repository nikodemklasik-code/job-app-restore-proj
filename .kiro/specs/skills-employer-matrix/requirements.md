# Requirements Document: Skills & Employer Verification Matrix

## Introduction

The Career Intelligence MVP — Skills & Employer Verification Matrix is a comprehensive system that transforms skills from simple declared strings into evidence-based, multi-dimensional measurements and verifies employers through trust/risk signals from multiple public and listing sources.

The system produces seven core scores (0-100 each): Skill Readiness, Market Value, Evidence Strength, Job Fit, Employer Trust, Employer Risk, and Action Priority. Skills are measured across five evidence levels (Declared → Observed → Demonstrated → Verified → Recent) and ten measurement dimensions. Employers are verified across nine signal categories (A–I) covering identity, transparency, compensation, stability, culture, recruitment process, technology maturity, UK-specific risks, and scam/fraud detection.

Every insight produced by the system carries trust metadata (sourceName, sourceUrl, sourceType, observedAt, freshness, confidence, explanationType, modelVersion, riskLanguage, userVisibleReason) to ensure transparency and auditability.

This document is organized by priority: P0 (foundational schema and core scoring), P1 (ingestion, UK signals, telemetry), and P2 (advanced AI summaries).

## Glossary

- **Skill_Service**: The backend service managing skills, user_skills, job_required_skills, and skill_signals
- **Employer_Intelligence_Service**: The backend service managing employers, employer_signals, and employer_sources
- **Scoring_Service**: The AI/Scoring service computing all seven scores with config, prompt versions, and eval sets
- **Job_Ingestion_Service**: The service ingesting raw jobs, normalizing them, and attaching source metadata
- **Telemetry_Service**: The service recording product_events for analytics and feedback loops
- **Credit_Service**: The service managing credit_accounts, ledger, reservations, and packages for paid AI actions
- **Skill_Evidence**: A record linking a user's skill to a specific source with evidence type, confidence, and metadata
- **Evidence_Level**: One of five levels: Declared, Observed, Demonstrated, Verified, Recent
- **Skill_Signal**: A typed insight about a skill (strength, gap, market_trend, salary_leverage, cv_value, verification_needed, learning_recommendation, interview_risk)
- **Employer_Signal**: A trust or risk signal about an employer with score, severity, title, explanation, and source reference
- **Employer_Source**: A data source for employer verification (Companies House, job listing, review site, news, social media)
- **Trust_Metadata**: Required metadata on every insight: sourceName, sourceUrl, sourceType, observedAt, freshness, confidence, explanationType, modelVersion, riskLanguage, userVisibleReason
- **Score_Audit_Log**: An immutable record of score computation with entityType, entityId, scoreType, inputHash, output, modelVersion, generatedAt
- **Skill_Taxonomy**: A normalized dictionary of canonical skill names with categories and relationships
- **Measurement_Dimension**: One of ten dimensions: Level, Recency, Depth, Breadth, Evidence, Market Value, Role Relevance, Job Match, Transferability, Gap Risk
- **Signal_Category**: One of nine employer verification categories (A–I) covering identity through scam detection
- **Action_Priority**: A computed recommendation (apply_now, save, reject, verify_employer) based on all other scores
- **Product_Event**: A telemetry record with userId, eventName, entityType, entityId, metadata, occurredAt
- **Job_Source_Snapshot**: A record tracking job listing provenance with source, firstSeenAt, lastSeenAt, hash, rawPayloadRef

---

## Requirements

---

## P0: Foundational Schema & Core Scoring

### Requirement 1: Skill Taxonomy and Normalized Skill Dictionary

**User Story:** As a user, I want my skills to be recognized and normalized against a canonical dictionary, so that matching, scoring, and gap analysis are consistent across all jobs and profiles.

#### Acceptance Criteria

1. THE Skill_Service SHALL maintain a normalized skill dictionary with canonical skill names, categories, and aliases
2. WHEN a user adds a skill or a skill is extracted from a source, THE Skill_Service SHALL resolve the skill to its canonical form using alias matching and fuzzy normalization
3. THE Skill_Service SHALL store skill relationships (parent/child, related, prerequisite) to support transferability scoring
4. IF a skill cannot be resolved to a canonical entry, THEN THE Skill_Service SHALL create a pending entry flagged for review and assign it a temporary canonical ID
5. THE Skill_Service SHALL support skill categories (programming_language, framework, tool, methodology, soft_skill, domain_knowledge, certification) for filtering and grouping
6. WHEN the skill dictionary is updated, THE Skill_Service SHALL re-normalize existing user_skills that match new aliases without changing user-facing labels

### Requirement 2: Skill Evidence Model and Storage

**User Story:** As a user, I want my skills to be backed by evidence from multiple sources, so that my profile reflects verifiable competence rather than just declarations.

#### Acceptance Criteria

1. THE Skill_Service SHALL store skill evidence records with fields: id, userId, skillId, sourceType, sourceId, evidenceType, evidenceText, evidenceUrl, extractedAt, occurredAt, confidence, verifiedByUser, metadata
2. WHEN evidence is extracted from a source (CV, GitHub, portfolio, certificate), THE Skill_Service SHALL create a Skill_Evidence record with sourceType indicating the origin
3. THE Skill_Service SHALL classify each evidence record into exactly one Evidence_Level: Declared (user claims), Observed (system detected in CV/profile), Demonstrated (portfolio/GitHub/case study), Verified (certificate/test/recommendation), Recent (used in last 6 months)
4. THE Skill_Service SHALL assign a confidence score (0.0–1.0) to each evidence record based on source reliability and extraction method
5. WHEN a user manually confirms or rejects extracted evidence, THE Skill_Service SHALL update the verifiedByUser field and adjust confidence accordingly
6. THE Skill_Service SHALL support multiple evidence records per skill per user, selecting the highest-confidence and most-recent evidence for scoring
7. IF evidence is older than 24 months and no newer evidence exists, THEN THE Skill_Service SHALL flag the skill as potentially stale with a recency penalty

### Requirement 3: Multi-Dimensional Skill Scoring

**User Story:** As a user, I want my skills scored across multiple dimensions, so that I understand not just whether I have a skill but how strong, relevant, and marketable it is.

#### Acceptance Criteria

1. THE Scoring_Service SHALL compute skill scores using six weighted dimensions: level match (25%), evidence strength (20%), recency (15%), market demand (15%), role relevance (15%), transferability (10%)
2. WHEN computing the Skill Readiness Score, THE Scoring_Service SHALL aggregate dimension scores into a single 0-100 value representing readiness to use the skill in recruitment
3. THE Scoring_Service SHALL compute the Evidence Strength Score (0-100) based on the highest evidence level achieved, number of corroborating sources, and confidence of each evidence record
4. WHEN computing recency, THE Scoring_Service SHALL use occurredAt timestamps from evidence records, applying a decay function where skills used within 6 months score highest and skills unused for 24+ months score lowest
5. THE Scoring_Service SHALL compute market demand by referencing job listing frequency for the skill in the user's target role and market
6. THE Scoring_Service SHALL compute role relevance by matching the skill against required and preferred skills in the user's target job descriptions
7. THE Scoring_Service SHALL compute transferability by evaluating skill relationships (parent/child, related) and cross-domain applicability
8. FOR ALL score computations, THE Scoring_Service SHALL write an entry to the Score_Audit_Log with entityType, entityId, scoreType, inputHash, output, modelVersion, and generatedAt

### Requirement 4: Skill Signal Generation

**User Story:** As a user, I want actionable signals about my skills, so that I know which skills to develop, verify, or leverage for specific opportunities.

#### Acceptance Criteria

1. THE Skill_Service SHALL generate typed Skill_Signals for each user skill: strength, gap, market_trend, salary_leverage, cv_value, verification_needed, learning_recommendation, interview_risk
2. WHEN a skill has high evidence and high market demand, THE Skill_Service SHALL generate a "strength" signal with explanation and salary_leverage data
3. WHEN a target role requires a skill the user lacks or has weak evidence for, THE Skill_Service SHALL generate a "gap" signal with learning_recommendation
4. WHEN a skill's market demand is trending up or down significantly, THE Skill_Service SHALL generate a "market_trend" signal with direction and magnitude
5. WHEN a skill has only Declared evidence level, THE Skill_Service SHALL generate a "verification_needed" signal suggesting ways to demonstrate or verify the skill
6. WHEN a skill appears frequently in interview questions for the user's target role, THE Skill_Service SHALL generate an "interview_risk" signal if evidence is weak
7. THE Skill_Service SHALL attach Trust_Metadata to every generated signal (sourceName, sourceUrl, sourceType, observedAt, freshness, confidence, explanationType, modelVersion, riskLanguage, userVisibleReason)

### Requirement 5: Employer Trust/Risk Schema and Storage

**User Story:** As a user, I want employers verified through multiple data sources, so that I can assess credibility before investing time in applications.

#### Acceptance Criteria

1. THE Employer_Intelligence_Service SHALL store employer records with fields: id, name, normalizedName, website, market, registryId, createdAt, updatedAt
2. THE Employer_Intelligence_Service SHALL store employer sources with fields: employerId, sourceType, sourceName, sourceUrl, observedAt, confidence
3. THE Employer_Intelligence_Service SHALL store employer signals with fields: employerId, signalType, score, severity, title, explanation, sourceId
4. WHEN a new employer is encountered in a job listing, THE Employer_Intelligence_Service SHALL create or match an employer record using name normalization and domain matching
5. THE Employer_Intelligence_Service SHALL support source types including: companies_house, job_listing, glassdoor, linkedin, news, crunchbase, website_analysis, social_media
6. THE Employer_Intelligence_Service SHALL classify signals into the nine verification categories (A–I): identity_credibility, offer_transparency, compensation_benefits, business_stability, culture_management, recruitment_process, technology_maturity, uk_local_risks, scam_fraud
7. WHEN multiple sources provide conflicting signals, THE Employer_Intelligence_Service SHALL weight signals by source confidence and recency, flagging conflicts for user visibility

### Requirement 6: Employer Trust Score Computation

**User Story:** As a user, I want a clear trust score for each employer, so that I can quickly assess whether a company is credible and worth applying to.

#### Acceptance Criteria

1. THE Scoring_Service SHALL compute the Employer Trust Score (0-100) by aggregating positive signals across all nine verification categories
2. WHEN computing trust, THE Scoring_Service SHALL weight Category A (identity/credibility) signals highest as foundational trust indicators
3. THE Scoring_Service SHALL increase trust score for: verified company registration, active website with matching domain, consistent location data, salary transparency, clear job descriptions, positive employee reviews, stable leadership
4. THE Scoring_Service SHALL apply diminishing returns when multiple signals from the same category contribute to trust
5. WHEN an employer has fewer than 3 verified sources, THE Scoring_Service SHALL cap the trust score at 60 and flag "limited data" to the user
6. THE Scoring_Service SHALL attach Trust_Metadata to the computed trust score explaining which sources contributed and their individual confidence levels
7. FOR ALL trust score computations, THE Scoring_Service SHALL write an entry to the Score_Audit_Log

### Requirement 7: Employer Risk Score Computation

**User Story:** As a user, I want to understand specific risks associated with an employer, so that I can make informed decisions about whether to proceed with an application.

#### Acceptance Criteria

1. THE Scoring_Service SHALL compute the Employer Risk Score (0-100) by aggregating negative signals across all nine verification categories
2. WHEN computing risk, THE Scoring_Service SHALL weight Category I (scam/fraud) signals highest as critical safety indicators
3. THE Scoring_Service SHALL increase risk score for: missing company identity, suspicious domain patterns, salary too-good-to-be-true, upfront payment requests, personal data overreach, vague responsibilities, duplicate/spam listings, unverifiable recruiter
4. WHEN Category D (business stability) signals indicate layoffs, reposting patterns, or funding instability, THE Scoring_Service SHALL contribute moderate risk with explanation
5. IF the risk score exceeds 70, THEN THE Scoring_Service SHALL flag the employer as "high risk" with prominent user-visible warnings
6. THE Scoring_Service SHALL ensure risk score and trust score are computed independently — a high trust score does not automatically suppress risk signals
7. THE Scoring_Service SHALL use signal language in all risk explanations, following UX copy rules: never "This employer is bad", always "Possible risk signal: [specific observation]"
8. FOR ALL risk score computations, THE Scoring_Service SHALL write an entry to the Score_Audit_Log

### Requirement 8: Job Fit Score with Evidence-Based Skills

**User Story:** As a user, I want my job fit score to reflect the strength of my skill evidence, so that I get more accurate match assessments than simple keyword matching.

#### Acceptance Criteria

1. THE Scoring_Service SHALL compute the Job Fit Score (0-100) by evaluating the user's skills against job requirements using evidence levels and measurement dimensions
2. WHEN computing job fit, THE Scoring_Service SHALL weight skills with higher evidence levels more heavily than Declared-only skills
3. THE Scoring_Service SHALL consider all ten measurement dimensions (Level, Recency, Depth, Breadth, Evidence, Market Value, Role Relevance, Job Match, Transferability, Gap Risk) when computing fit
4. WHEN a required skill has Verified or Recent evidence, THE Scoring_Service SHALL apply a confidence bonus to that skill's contribution to fit
5. WHEN a required skill has only Declared evidence, THE Scoring_Service SHALL apply a confidence penalty and generate a verification_needed signal
6. THE Scoring_Service SHALL factor in transferable skills (related skills with demonstrated evidence) as partial matches with reduced weight
7. THE Scoring_Service SHALL produce a breakdown showing per-skill contribution to the overall fit score with evidence level indicators
8. FOR ALL job fit computations, THE Scoring_Service SHALL write an entry to the Score_Audit_Log

### Requirement 9: Market Value Score

**User Story:** As a user, I want to understand the market value of my skills for my target role and market, so that I can negotiate effectively and prioritize skill development.

#### Acceptance Criteria

1. THE Scoring_Service SHALL compute the Market Value Score (0-100) representing the market value of a user's skill portfolio for their chosen role, market, and seniority level
2. WHEN computing market value, THE Scoring_Service SHALL reference job listing frequency, salary correlation, and demand trends for each skill in the user's target market
3. THE Scoring_Service SHALL weight skills by their salary_leverage signal — skills that correlate with higher compensation contribute more to market value
4. WHEN a user's skill portfolio covers 80% or more of high-demand skills for their target role, THE Scoring_Service SHALL score market value above 70
5. IF the user's target market has insufficient data (fewer than 50 relevant listings), THEN THE Scoring_Service SHALL flag the score as low-confidence and explain the data limitation
6. THE Scoring_Service SHALL attach Trust_Metadata to the market value score including data sources and sample sizes used
7. FOR ALL market value computations, THE Scoring_Service SHALL write an entry to the Score_Audit_Log

### Requirement 10: Action Priority Score

**User Story:** As a user, I want a clear recommendation on whether to apply now, save for later, reject, or verify the employer first, so that I can prioritize my job search efficiently.

#### Acceptance Criteria

1. THE Scoring_Service SHALL compute the Action Priority Score (0-100) synthesizing Job Fit, Employer Trust, Employer Risk, Market Value, and Skill Readiness scores into a single actionable recommendation
2. WHEN Job Fit is above 70 and Employer Trust is above 60 and Employer Risk is below 30, THE Scoring_Service SHALL recommend "apply_now" with high priority
3. WHEN Job Fit is above 50 but Employer Trust is below 50 or Employer Risk is above 50, THE Scoring_Service SHALL recommend "verify_employer" before applying
4. WHEN Job Fit is below 40 regardless of employer scores, THE Scoring_Service SHALL recommend "reject" with explanation of key gaps
5. WHEN Job Fit is between 40-70 and employer signals are neutral, THE Scoring_Service SHALL recommend "save" for further evaluation
6. THE Scoring_Service SHALL explain the recommendation using signal language: never "You are missing AWS, do not apply", always "AWS appears as a relevant gap; applying may still make sense if other fit signals are strong"
7. THE Scoring_Service SHALL attach Trust_Metadata to the action priority explaining which input scores drove the recommendation
8. FOR ALL action priority computations, THE Scoring_Service SHALL write an entry to the Score_Audit_Log

### Requirement 11: Score Audit Log

**User Story:** As a developer or compliance officer, I want every score computation logged immutably, so that I can audit, debug, and reproduce scoring decisions.

#### Acceptance Criteria

1. THE Scoring_Service SHALL write an audit log entry for every score computation with fields: entityType, entityId, scoreType, inputHash, output, modelVersion, generatedAt
2. THE Scoring_Service SHALL compute inputHash as a deterministic hash of all inputs used in the score computation to enable reproducibility checks
3. WHEN the same inputs produce a different output (model version change), THE Scoring_Service SHALL retain both entries with distinct modelVersion values
4. THE Score_Audit_Log SHALL NOT store raw personal data (CV content, full documents) — only hashed references and computed outputs
5. THE Scoring_Service SHALL retain audit log entries for a minimum of 12 months for compliance and debugging purposes
6. WHEN a user requests data deletion, THE Scoring_Service SHALL anonymize audit log entries by removing userId linkage while retaining aggregate scoring data

### Requirement 12: Job Radar Trust Layer Integration

**User Story:** As a user, I want the Job Radar to display trust and risk information alongside job listings, so that I can make informed decisions without leaving the job browsing experience.

#### Acceptance Criteria

1. WHEN displaying a job listing in Job Radar, THE Job_Radar SHALL show the Employer Trust Score and Employer Risk Score alongside the Job Fit Score
2. THE Job_Radar SHALL display a trust level indicator (verified, likely_legit, review, risky) derived from the Employer Trust Score thresholds (≥75, ≥55, ≥35, <35)
3. WHEN the Employer Risk Score exceeds 50, THE Job_Radar SHALL display a prominent but non-alarmist risk indicator with the top contributing risk signals
4. THE Job_Radar SHALL display the Action Priority recommendation (apply_now, save, reject, verify_employer) as a primary call-to-action on each job card
5. WHEN a user clicks on a trust or risk indicator, THE Job_Radar SHALL open a Risk Explanation Drawer showing all contributing signals with Trust_Metadata
6. THE Job_Radar SHALL allow users to override the Action Priority recommendation and provide feedback on why they disagree

### Requirement 13: Credits Reservation Lifecycle for Paid AI Actions

**User Story:** As a user, I want to know the cost of AI-powered actions before they execute, so that I can manage my credits budget and avoid unexpected charges.

#### Acceptance Criteria

1. WHEN a user initiates a paid AI action (detailed skill analysis, employer deep-dive, market comparison), THE Credit_Service SHALL display the credit cost before execution and require confirmation
2. THE Credit_Service SHALL reserve credits before AI execution begins, preventing double-spend if multiple actions are triggered concurrently
3. WHEN an AI action completes successfully, THE Credit_Service SHALL convert the reservation to a confirmed charge in the billing ledger
4. IF an AI action fails or times out, THEN THE Credit_Service SHALL release the reservation and return credits to the user's balance
5. THE Credit_Service SHALL maintain a complete audit trail: credit_accounts (balance), ledger (confirmed transactions), reservations (pending holds), packages (purchased bundles)
6. WHEN a user's credit balance is insufficient for a requested action, THE Credit_Service SHALL display the shortfall and offer to purchase additional credits before proceeding
7. THE Credit_Service SHALL never execute a paid AI action without prior cost disclosure and user confirmation


### Requirement 14: Job-to-Application Flow with Evidence

**User Story:** As a user, I want my application flow to carry forward all skill evidence and employer verification data, so that I can track which evidence supported each application decision.

#### Acceptance Criteria

1. WHEN a user decides to apply to a job, THE Application_Service SHALL record the application with references to the Job Fit Score, Employer Trust Score, and Action Priority at the time of decision
2. THE Application_Service SHALL log application events (created, submitted, response_received, interview_scheduled, offer_received, rejected, withdrawn) with timestamps in an application_events table
3. WHEN an application is created, THE Application_Service SHALL snapshot the skill evidence that contributed to the fit score for that specific job
4. THE Application_Service SHALL allow users to attach additional evidence (cover letter notes, referral context) to application records
5. IF the employer's trust or risk scores change significantly after application, THEN THE Application_Service SHALL notify the user with updated signals

---

## P1: Ingestion, UK Signals, Telemetry & Feedback

### Requirement 15: Job Ingestion with Source Metadata

**User Story:** As a user, I want jobs ingested from multiple sources with full provenance tracking, so that I can trust the freshness and authenticity of listings.

#### Acceptance Criteria

1. THE Job_Ingestion_Service SHALL ingest job listings from configured providers (starting with Adzuna UK) and store raw payloads with source metadata
2. WHEN a job is ingested, THE Job_Ingestion_Service SHALL create a job_source_snapshot record with: jobId, source, firstSeenAt, lastSeenAt, hash, rawPayloadRef
3. THE Job_Ingestion_Service SHALL compute a content hash of each listing to detect duplicates and track changes across ingestion cycles
4. WHEN a previously seen job listing changes content, THE Job_Ingestion_Service SHALL update lastSeenAt and create a new snapshot if the hash differs, preserving history
5. THE Job_Ingestion_Service SHALL normalize ingested jobs into the canonical job format, extracting structured fields (title, salary, location, requirements, company) from raw data
6. IF a job listing disappears from the source for more than 7 days, THEN THE Job_Ingestion_Service SHALL mark it as potentially expired and reduce its visibility in Job Radar
7. THE Job_Ingestion_Service SHALL attach source confidence based on provider reliability (direct employer posting > aggregator > scraper)

### Requirement 16: Adzuna UK Provider Integration

**User Story:** As a UK-based job seeker, I want Adzuna UK listings ingested with full metadata, so that I have access to a broad UK job market with proper source attribution.

#### Acceptance Criteria

1. THE Job_Ingestion_Service SHALL integrate with the Adzuna UK API to fetch job listings matching user-configured search criteria
2. WHEN fetching from Adzuna, THE Job_Ingestion_Service SHALL extract and store: title, description, salary_min, salary_max, location, company, category, contract_type, created date
3. THE Job_Ingestion_Service SHALL map Adzuna categories to the internal skill taxonomy for automatic skill requirement extraction
4. THE Job_Ingestion_Service SHALL respect Adzuna API rate limits and implement exponential backoff on failures
5. WHEN an Adzuna listing includes salary data, THE Job_Ingestion_Service SHALL normalize it to annual GBP for consistent comparison
6. THE Job_Ingestion_Service SHALL run ingestion on a configurable schedule (default: every 6 hours) and track ingestion health metrics

### Requirement 17: UK-Specific Employer Signals

**User Story:** As a UK-based job seeker, I want employer verification to include UK-specific signals (visa sponsorship, IR35, security clearance), so that I can filter opportunities relevant to my work authorization and circumstances.

#### Acceptance Criteria

1. THE Employer_Intelligence_Service SHALL detect and score UK-specific signals in Category H: visa_sponsorship, right_to_work, security_clearance, ir35_status, gbp_salary, remote_uk_only, london_weighting, agency_vs_direct
2. WHEN a job listing mentions visa sponsorship, THE Employer_Intelligence_Service SHALL create a signal indicating sponsorship availability with confidence based on explicitness of the statement
3. WHEN a job listing indicates IR35 status (inside/outside), THE Employer_Intelligence_Service SHALL create a signal with the determination and source reference
4. WHEN a job listing requires security clearance (SC, DV, CTC, BPSS), THE Employer_Intelligence_Service SHALL create a signal with clearance level and whether existing clearance is required vs obtainable
5. THE Employer_Intelligence_Service SHALL detect agency vs direct employer postings by analyzing recruiter patterns, email domains, and listing language
6. WHEN a listing specifies London weighting or location-based salary adjustments, THE Employer_Intelligence_Service SHALL factor this into compensation scoring
7. THE Employer_Intelligence_Service SHALL verify Companies House registration for UK employers and create identity_credibility signals based on company age, active status, and filing history

### Requirement 18: Employer Verification Categories B-G Signal Detection

**User Story:** As a user, I want comprehensive employer signals across all verification categories, so that I have a complete picture of employer quality beyond basic identity checks.

#### Acceptance Criteria

1. WHEN analyzing a job listing, THE Employer_Intelligence_Service SHALL extract Category B (offer transparency) signals: salary_disclosed, employment_form_clear, seniority_explicit, responsibilities_detailed, requirements_separated, process_described, work_mode_stated, location_timezone_clear
2. WHEN analyzing compensation data, THE Employer_Intelligence_Service SHALL extract Category C signals: salary_competitiveness (vs market benchmarks), salary_ambiguity, equity_mentioned, bonus_structure, pension_contribution, health_insurance, learning_budget, equipment_provision, paid_leave_above_statutory
3. WHEN analyzing employer reputation data, THE Employer_Intelligence_Service SHALL extract Category D signals: funding_stage, layoff_signals, reposting_frequency, employee_review_sentiment, leadership_stability, product_traction, market_risk, legal_issues
4. WHEN analyzing culture indicators, THE Employer_Intelligence_Service SHALL extract Category E signals: work_life_balance, management_quality, psychological_safety, diversity_inclusion, learning_culture, autonomy_level, meeting_culture, remote_maturity
5. WHEN analyzing recruitment process indicators, THE Employer_Intelligence_Service SHALL extract Category F signals: response_rate, process_length, take_home_fairness, salary_discussion_timing, recruiter_quality, ghosting_risk, interview_transparency, candidate_experience
6. WHEN analyzing technology indicators, THE Employer_Intelligence_Service SHALL extract Category G signals: tech_stack_clarity, engineering_maturity, product_maturity, security_maturity, data_maturity, ai_maturity, legacy_risk, on_call_expectations
7. FOR ALL extracted signals, THE Employer_Intelligence_Service SHALL attach Trust_Metadata including the specific source and extraction confidence

### Requirement 19: Telemetry Events and Product Analytics

**User Story:** As a product team, I want comprehensive telemetry on user interactions with skills and employer data, so that I can measure feature effectiveness and improve scoring accuracy.

#### Acceptance Criteria

1. THE Telemetry_Service SHALL record product events with fields: userId, eventName, entityType, entityId, metadata, occurredAt
2. WHEN a user views a skill signal, THE Telemetry_Service SHALL record a "skill_signal_viewed" event with signal type and skill context
3. WHEN a user acts on an Action Priority recommendation (applies, saves, rejects, verifies), THE Telemetry_Service SHALL record the action and whether it aligned with the recommendation
4. WHEN a user provides feedback on a score or signal (agrees, disagrees, reports inaccuracy), THE Telemetry_Service SHALL record the feedback event with the original score and user's assessment
5. WHEN a user views employer trust/risk details, THE Telemetry_Service SHALL record which signal categories were expanded and time spent reviewing
6. THE Telemetry_Service SHALL NOT store personally identifiable information in event metadata — only anonymized entity references and interaction types
7. THE Telemetry_Service SHALL support event aggregation queries for measuring: recommendation accuracy, signal engagement rates, score distribution, and feature adoption

### Requirement 20: Feedback Loops for Score Improvement

**User Story:** As a user, I want to provide feedback on scores and signals, so that the system improves its accuracy over time based on real outcomes.

#### Acceptance Criteria

1. WHEN a user disagrees with a Job Fit Score, THE Scoring_Service SHALL record the disagreement with optional reason and use it as a training signal for model improvement
2. WHEN a user reports an employer signal as inaccurate, THE Employer_Intelligence_Service SHALL flag the signal for review and reduce its confidence in future computations
3. WHEN a user's application outcome is known (offer received, rejected, ghosted), THE Scoring_Service SHALL compare the outcome against the original Action Priority recommendation to measure accuracy
4. THE Scoring_Service SHALL compute recommendation accuracy metrics (precision, recall) per score type on a rolling 30-day window
5. WHEN recommendation accuracy drops below 60% for any score type, THE Scoring_Service SHALL flag the score type for model review
6. THE Feedback system SHALL anonymize all user feedback before using it for model training — no individual user's feedback is attributable in training data
7. THE Feedback system SHALL implement a retention policy: raw feedback retained for 90 days, aggregated metrics retained indefinitely

---

## P2: Advanced AI Summaries & Intelligence

### Requirement 21: AI-Powered Skill Gap Analysis and Learning Recommendations

**User Story:** As a user, I want AI-generated analysis of my skill gaps with specific learning recommendations, so that I can efficiently close gaps for my target roles.

#### Acceptance Criteria

1. WHEN a user requests detailed skill gap analysis (paid AI action), THE Scoring_Service SHALL generate a comprehensive report comparing the user's evidence-backed skills against target role requirements
2. THE Scoring_Service SHALL prioritize gaps by impact: skills that appear in 70%+ of target role listings and have high salary_leverage are flagged as critical gaps
3. WHEN generating learning recommendations, THE Scoring_Service SHALL suggest specific actions (courses, projects, certifications) matched to the gap severity and user's existing evidence level
4. THE Scoring_Service SHALL estimate time-to-close for each gap based on the user's current evidence level and the target evidence level needed
5. THE Scoring_Service SHALL explain recommendations using signal language: never "You must learn X", always "X appears in 80% of target listings; demonstrating it through a portfolio project could strengthen your fit score by approximately 15 points"
6. FOR ALL AI-generated analysis, THE Scoring_Service SHALL attach Trust_Metadata and write to Score_Audit_Log

### Requirement 22: AI-Powered Employer Deep-Dive Summary

**User Story:** As a user, I want an AI-generated summary synthesizing all employer signals into a readable narrative, so that I can quickly understand an employer's overall profile without reading individual signals.

#### Acceptance Criteria

1. WHEN a user requests an employer deep-dive (paid AI action), THE Scoring_Service SHALL generate a narrative summary synthesizing signals across all nine verification categories
2. THE Scoring_Service SHALL structure the summary with: key strengths, notable risks, data gaps, and overall assessment
3. THE Scoring_Service SHALL use signal language throughout: never "AI verified this company", always "Based on available public and listing signals"
4. WHEN data is insufficient for a category, THE Scoring_Service SHALL explicitly state "Insufficient data for [category] assessment" rather than omitting the category
5. THE Scoring_Service SHALL highlight the most impactful signals (top 3 positive, top 3 negative) with source attribution
6. THE Scoring_Service SHALL include a confidence statement indicating what percentage of verification categories have adequate data coverage
7. FOR ALL AI-generated summaries, THE Scoring_Service SHALL attach Trust_Metadata and write to Score_Audit_Log

### Requirement 23: AI-Powered Market Comparison

**User Story:** As a user, I want AI-generated market comparisons showing how my skills and target employers compare to market benchmarks, so that I can calibrate my expectations and strategy.

#### Acceptance Criteria

1. WHEN a user requests a market comparison (paid AI action), THE Scoring_Service SHALL generate a comparative analysis of the user's skill portfolio against market demand in their target role and geography
2. THE Scoring_Service SHALL identify skills where the user is above-market (strong evidence + declining demand) and below-market (weak evidence + rising demand)
3. THE Scoring_Service SHALL compare the user's target employers against market averages for trust, compensation, and culture signals
4. WHEN generating salary insights, THE Scoring_Service SHALL reference specific benchmark data (P25, median, P75) with sample sizes and confidence levels
5. THE Scoring_Service SHALL identify emerging skills in the user's target market that are not yet in their profile but show rapid demand growth
6. FOR ALL AI-generated comparisons, THE Scoring_Service SHALL attach Trust_Metadata and write to Score_Audit_Log

---

## Cross-Cutting Requirements

### Requirement 24: Trust Metadata on All Insights

**User Story:** As a user, I want every insight to carry transparent metadata about its source and confidence, so that I can assess the reliability of information presented to me.

#### Acceptance Criteria

1. THE system SHALL attach Trust_Metadata to every computed score, generated signal, and AI-produced insight
2. THE Trust_Metadata SHALL include all required fields: sourceName, sourceUrl, sourceType, observedAt, freshness, confidence, explanationType, modelVersion, riskLanguage, userVisibleReason
3. WHEN displaying insights to users, THE system SHALL make Trust_Metadata accessible (expandable detail, tooltip, or drawer) without cluttering the primary interface
4. THE system SHALL compute freshness as a function of time elapsed since observedAt, degrading confidence for stale data
5. IF Trust_Metadata cannot be fully populated (missing source URL or observedAt), THEN THE system SHALL still display the insight but with a reduced confidence indicator and "limited source data" note

### Requirement 25: Data Privacy and User Control

**User Story:** As a user, I want full control over my profile data and skill evidence, so that I can view, export, and delete my information in compliance with data protection principles.

#### Acceptance Criteria

1. THE system SHALL allow users to view all stored skill evidence, employer signals, and computed scores associated with their profile
2. WHEN a user requests data deletion, THE system SHALL remove all personal skill evidence, application records, and telemetry events within 30 days
3. THE system SHALL NOT store raw CV content, full document text, or unprocessed personal data in logs or audit records
4. WHEN user-generated feedback is used for model improvement, THE system SHALL anonymize it by removing userId linkage before inclusion in training data
5. THE system SHALL maintain a clear processing basis for all public source data used in employer verification (legitimate interest for publicly available business information)
6. THE system SHALL provide data export in a machine-readable format (JSON) including all user skills, evidence, scores, and application history

### Requirement 26: UX Copy and Risk Communication Standards

**User Story:** As a user, I want risk information communicated in a balanced, non-alarmist way, so that I can make informed decisions without being unduly frightened or misled.

#### Acceptance Criteria

1. THE system SHALL use signal language for all risk communications: observations and patterns, never judgments or conclusions
2. THE system SHALL never state "This employer is bad" — instead use "Possible risk signal: [specific observation with source]"
3. THE system SHALL never state "AI verified this company" — instead use "Based on available public and listing signals"
4. THE system SHALL never state "You are missing X, do not apply" — instead use "X appears as a relevant gap; applying may still make sense if other fit signals are strong"
5. WHEN presenting risk scores above 50, THE system SHALL always include at least one actionable suggestion (verify employer, check specific source, compare with similar listings)
6. THE system SHALL present employer intelligence as informational signals that support user decision-making, not as automated gatekeeping that blocks actions
