# Requirements Document: Job Match Documentation

## Introduction

This feature provides comprehensive documentation explaining how the Job Match analysis system works. The system analyzes job listings against candidate profiles to produce match scores, identify skills gaps, compare salary expectations, and assess employer trustworthiness. The documentation will serve developers, product managers, and potentially end-users who want to understand the scoring methodology.

The documentation covers five main analysis components:
1. **Job Match Scoring** - Overall compatibility score calculation
2. **Job Fit Analysis** - Profile-to-job-requirements matching
3. **Skills Gap Analysis** - Missing skills identification
4. **Salary Matching** - Compensation range comparison with market benchmarks
5. **Employer Analysis** - Trust signals and risk assessment

## Glossary

- **Job_Match_System**: The complete system that analyzes job listings and produces compatibility scores
- **Scoring_Engine**: The Job Radar scoring engine service that computes six metric scores
- **AI_Personalizer**: The service that uses AI to explain job fit and generate personalized content
- **Job_Protection_Service**: The service that assesses scam risk and employer trust signals
- **Candidate_Profile**: User profile containing skills, experience, summary, and interview performance
- **Job_Listing**: Job posting with title, description, requirements, salary, and company information
- **Fit_Score**: Numerical score (0-100) representing overall job-candidate compatibility
- **Skills_Gap**: Set of required skills that the candidate does not currently possess
- **Benchmark**: Market salary data (median, P25, P75) for comparison
- **Trust_Score**: Employer credibility score (0-100) based on listing quality signals
- **Risk_Score**: Scam/fraud risk score (0-100) based on suspicious patterns
- **Driver**: Individual scoring factor with impact value, confidence level, and type (positive/negative)
- **Signal**: Detected data point from job listing (e.g., salary_min, work_mode, benefits)
- **EARS_Pattern**: Easy Approach to Requirements Syntax - structured requirement format

## Requirements

### Requirement 1: Document Job Match Scoring Components

**User Story:** As a developer or product manager, I want to understand how the overall Job Match score is calculated, so that I can explain the system to stakeholders and debug scoring issues.

#### Acceptance Criteria

1. THE Documentation SHALL list all six scoring metrics computed by the Scoring_Engine (employer_score, offer_score, market_pay_score, benefits_score, culture_fit_score, risk_score)
2. WHEN describing each metric, THE Documentation SHALL explain the base score, driver calculation method, and confidence capping rules
3. THE Documentation SHALL explain how drivers are aggregated using the capLowConfidenceDrivers function with base scores
4. THE Documentation SHALL document the clampScore function that ensures final scores stay within 0-100 range
5. THE Documentation SHALL explain the deriveRecommendation function that produces final recommendations based on all six metrics
6. THE Documentation SHALL include code examples showing how drivers are created with label, impact, confidence, and driverType fields
7. THE Documentation SHALL explain the confidenceOverall calculation that aggregates confidence levels across all drivers
8. FOR ALL scoring metrics, THE Documentation SHALL list the specific signals that influence each metric

### Requirement 2: Document Job Fit Analysis Logic

**User Story:** As a developer, I want to understand how profile-to-job matching works, so that I can improve the matching algorithm and explain results to users.

#### Acceptance Criteria

1. THE Documentation SHALL explain the scoreJobFit function that computes skill matching ratios
2. WHEN describing skill matching, THE Documentation SHALL document the baseline score of 40 and how points are earned
3. THE Documentation SHALL explain the skill matching tiers (6+ skills: +35pts, 4-5 skills: +25pts, 2-3 skills: +15pts, 1 skill: +7pts)
4. THE Documentation SHALL document the title alignment scoring (up to 20 points) based on job title word matching
5. THE Documentation SHALL explain seniority alignment detection (up to 10 points) using seniority terms
6. THE Documentation SHALL document work mode preference matching (up to 5 points) for remote work
7. THE Documentation SHALL explain the penalty system for obvious mismatches (-10 points for zero skill overlap)
8. THE Documentation SHALL document the score capping logic (90-98 range for high scores, 10-99 absolute bounds)
9. THE Documentation SHALL explain the explainJobFit function that uses AI to generate detailed fit analysis
10. WHEN describing AI-based fit analysis, THE Documentation SHALL document the JSON response format with score, strengths, gaps, advice, extractedRequirements, and breakdown fields
11. THE Documentation SHALL explain how interview performance data influences fit scoring (+5 for strong performance, -5 per weak area matching job requirements)
12. THE Documentation SHALL document the employment history integration that prevents experienceMatch from defaulting to 0

### Requirement 3: Document Skills Gap Identification

**User Story:** As a product manager, I want to understand how skills gaps are identified, so that I can design features that help users address missing skills.

#### Acceptance Criteria

1. THE Documentation SHALL explain how job requirements are extracted from job descriptions using keyword patterns and bullet point parsing
2. WHEN describing requirement extraction, THE Documentation SHALL document the extractJobSignals function with its regex patterns
3. THE Documentation SHALL explain the uniqueStrings deduplication logic that removes duplicate requirements
4. THE Documentation SHALL document the limit of 8 requirements and 10 keywords extracted per job
5. THE Documentation SHALL explain how candidate skills are matched against extracted requirements (case-insensitive substring matching)
6. THE Documentation SHALL document the gaps array in the explainJobFit response that lists unmatched requirements
7. THE Documentation SHALL explain how the AI generates actionable advice based on identified gaps
8. THE Documentation SHALL document the extractedRequirements field that can update job listings with parsed requirements

### Requirement 4: Document Salary Matching Logic

**User Story:** As a developer, I want to understand how salary comparison works, so that I can debug benchmark issues and explain salary scores to users.

#### Acceptance Criteria

1. THE Documentation SHALL explain the computeMarketPayScoreWithBenchmark function that compares job salary to market data
2. WHEN describing benchmark comparison, THE Documentation SHALL document the base score of 30 points
3. THE Documentation SHALL explain the benchmark data structure (salaryMedian, salaryP25, salaryP75, confidence)
4. THE Documentation SHALL document the four salary tiers (above P75: +22pts, above median: +12pts, below median: -6pts, below P25: -16pts)
5. THE Documentation SHALL explain how job salary average is calculated from salaryMin and salaryMax
6. THE Documentation SHALL document the benchmark confidence levels (low, medium, high) and how they affect driver confidence
7. THE Documentation SHALL explain the penalty drivers for missing benchmark data (-4pts) or unmatchable salary (-6pts)
8. THE Documentation SHALL document the capLowConfidenceDrivers function that reduces impact of low-confidence drivers
9. THE Documentation SHALL explain the salaryMatch component in the breakdown object from explainJobFit

### Requirement 5: Document Employer Analysis Criteria

**User Story:** As a product manager, I want to understand how employer trust and risk are assessed, so that I can explain safety features to users and improve detection accuracy.

#### Acceptance Criteria

1. THE Documentation SHALL explain the assessEmployerSignals function that computes trust and risk scores
2. WHEN describing trust scoring, THE Documentation SHALL document the baseline trust score of 50 points
3. THE Documentation SHALL explain salary transparency scoring (full range: +10pts, no salary: risk flag)
4. THE Documentation SHALL document description quality tiers (detailed >800 chars: +10pts, thin <250 chars: risk flag)
5. THE Documentation SHALL explain requirements clarity detection using regex patterns (+5pts for clear requirements)
6. THE Documentation SHALL document work mode clarity detection (+5pts for explicit work mode)
7. THE Documentation SHALL explain benefit detection using BENEFIT_PATTERNS array (12 benefit types)
8. THE Documentation SHALL document UK-specific signals (right_to_work, DBS, IR35, security clearance, visa sponsorship, equality statement)
9. THE Documentation SHALL explain the assessJobScamRisk function that detects fraud patterns
10. WHEN describing scam detection, THE Documentation SHALL document HIGH_RISK_PATTERNS (8 patterns, +30pts each)
11. THE Documentation SHALL document MEDIUM_RISK_PATTERNS (6 patterns, +15pts each)
12. THE Documentation SHALL explain the thin listing penalty (no salary + short description: +10pts risk)
13. THE Documentation SHALL document URL shortener detection in apply URLs (+20pts risk)
14. THE Documentation SHALL explain risk level classification (high ≥50, medium ≥25, low <25)
15. THE Documentation SHALL document trust level classification (verified ≥75, likely_legit ≥55, review ≥35, risky <35)
16. THE Documentation SHALL explain how scam risk reduces trust score (trustScore -= riskScore * 0.4)

### Requirement 6: Document Job Radar Scoring Engine Architecture

**User Story:** As a developer, I want to understand the Job Radar scoring engine architecture, so that I can maintain and extend the scoring system.

#### Acceptance Criteria

1. THE Documentation SHALL explain the ScoringEngineService class and its four repository dependencies
2. WHEN describing the compute method, THE Documentation SHALL document the signal filtering logic (isConflicted !== true)
3. THE Documentation SHALL explain the six metric computation methods (computeEmployerScore, computeOfferScore, etc.)
4. THE Documentation SHALL document the driver persistence logic using persistableDrivers method
5. THE Documentation SHALL explain the findings generation logic in buildFindings method
6. THE Documentation SHALL document the five finding types (positive, red_flag, warning, benchmark, initial_assessment)
7. THE Documentation SHALL explain finding codes (OFFER_CLARITY_OK, SALARY_MISSING, ELEVATED_RISK, REGISTRY_INACTIVE, PAY_BENCHMARK_OK)
8. THE Documentation SHALL document finding severity levels (low, medium, severe)
9. THE Documentation SHALL explain the signal-based driver creation for employer_score (official source signals, missing data signals)
10. THE Documentation SHALL document the signal-based driver creation for offer_score (work_mode, salary_missing, benefits)
11. THE Documentation SHALL explain the signal-based driver creation for risk_score (salary_missing, missing data count)

### Requirement 7: Create Bilingual Documentation Structure

**User Story:** As a Polish-speaking user or developer, I want documentation available in Polish, so that I can understand the system in my native language.

#### Acceptance Criteria

1. THE Documentation SHALL be created in both English and Polish versions
2. WHEN creating Polish documentation, THE Documentation SHALL use accurate technical translations for all terms
3. THE Documentation SHALL maintain identical structure and content depth in both language versions
4. THE Documentation SHALL use Polish equivalents for key terms (Job Match → Dopasowanie do oferty, Skills Gap → Braki w umiejętnościach, Salary Matching → Dopasowanie wynagrodzenia)
5. THE Documentation SHALL be saved in docs/job-radar/ directory with clear language indicators in filenames

### Requirement 8: Include Code Examples and Data Flow Diagrams

**User Story:** As a developer, I want code examples and visual diagrams, so that I can quickly understand implementation patterns and data flow.

#### Acceptance Criteria

1. THE Documentation SHALL include TypeScript code snippets showing driver creation patterns
2. WHEN showing code examples, THE Documentation SHALL include actual function signatures from the implementation
3. THE Documentation SHALL include example JSON responses from explainJobFit showing all fields
4. THE Documentation SHALL include example signal objects showing structure and field types
5. THE Documentation SHALL include a data flow diagram showing how signals flow through the scoring engine
6. THE Documentation SHALL include a scoring calculation example with actual numbers showing driver aggregation
7. THE Documentation SHALL include example benchmark data structures with P25, median, P75 values

### Requirement 9: Document Integration Points and API Contracts

**User Story:** As a developer, I want to understand how components integrate, so that I can modify one component without breaking others.

#### Acceptance Criteria

1. THE Documentation SHALL explain the explainFit tRPC endpoint in jobs.router.ts
2. WHEN describing the endpoint, THE Documentation SHALL document the input schema (userId, jobId)
3. THE Documentation SHALL explain how profile data is fetched (skills, summary, experiences)
4. THE Documentation SHALL document how interview insights are integrated into fit analysis
5. THE Documentation SHALL explain the automatic requirement extraction that updates job listings
6. THE Documentation SHALL document the parallel execution of fit analysis and scam assessment
7. THE Documentation SHALL explain the response format combining fit and scam analysis results

### Requirement 10: Document Testing and Validation Approach

**User Story:** As a developer, I want to understand how to test scoring logic, so that I can verify changes don't break existing behavior.

#### Acceptance Criteria

1. THE Documentation SHALL explain which components are suitable for property-based testing (round-trip properties for scoring)
2. WHEN describing testing approach, THE Documentation SHALL identify invariants (score bounds 0-100, driver confidence levels)
3. THE Documentation SHALL explain which components require integration testing (AI-based explainJobFit, benchmark fetching)
4. THE Documentation SHALL document example test cases for each scoring tier (skill matching tiers, salary benchmark tiers)
5. THE Documentation SHALL explain how to test with mock data vs real OpenAI API calls
6. THE Documentation SHALL document the fallback behavior when OpenAI client is unavailable

