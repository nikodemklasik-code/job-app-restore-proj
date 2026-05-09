# Requirements Document

## Introduction

This spec covers a comprehensive set of quality fixes and UX improvements across the MultivoHub job application platform. The issues span routing errors, broken provider integrations, incorrect data extraction, missing data persistence, and UI layout bugs. Resolving these issues will restore core platform functionality and improve the user experience.

## Glossary

- **Platform**: The MultivoHub job application platform (frontend + backend monorepo)
- **Router**: The React Router v7 configuration that maps URL paths to page components
- **Job_Provider**: A backend service that fetches job listings from an external source (e.g. Adzuna, Jooble, Reed)
- **Provider_Registry**: The module that instantiates and returns all available Job_Provider instances
- **Job_Description_Parser**: The backend service that extracts structured sections (responsibilities, requirements, benefits, qualifications) from raw job description text
- **Job_Data_Extractor**: The backend service that extracts skills, employment type, experience level, and other metadata from job listings
- **Skills_Gap_Analyzer**: The component that compares user profile skills against job listing requirements to produce a personalized gap analysis
- **CV_Parser**: The backend service that extracts structured data (skills, experience, education, contact info) from uploaded CV files
- **User_Profile**: The stored user data including skills, experience, education, and preferences
- **Job_Card**: A frontend UI component displaying a job listing summary with metadata
- **Application_Card**: A frontend UI component displaying a job application with flip-card (avers/revers) animation
- **Skill_Lab**: The frontend page for skills management, gap analysis, and learning recommendations
- **Dashboard**: The main landing page showing job tiles, stats, and quick actions
- **Education_Provider_Taxonomy**: A data structure containing universities, colleges, and online course providers for training recommendations

## Requirements

### Requirement 1: Job Radar Route Resolution

**User Story:** As a user, I want to access the Job Radar page via the sidebar navigation, so that I can view my job radar scans without encountering a 404 error.

#### Acceptance Criteria

1. WHEN a user navigates to the `/job-radar` path, THE Router SHALL render the JobRadar page component
2. WHEN a user navigates to the legacy `/radar` path, THE Router SHALL redirect to `/job-radar`
3. IF the JobRadar page component fails to load, THEN THE Platform SHALL display a loading fallback rather than an ErrorBoundary 404

### Requirement 2: All Job Providers Operational

**User Story:** As a user, I want all job providers to return results regardless of their integration method (API, scraping, session-based), so that I get maximum job coverage.

#### Acceptance Criteria

1. WHEN the Adzuna provider receives a search query, THE Job_Provider SHALL return job listings by using valid API credentials and correct endpoint parameters
2. WHEN the Jooble provider receives a search query, THE Job_Provider SHALL return job listings by bypassing bot detection (appropriate headers, user-agent rotation, request throttling)
3. WHEN the Indeed provider receives a search query, THE Job_Provider SHALL return job listings by maintaining valid session state or using an alternative access method
4. WHEN the LinkedIn provider receives a search query, THE Job_Provider SHALL return job listings by maintaining valid session state or using an alternative access method
5. WHEN the Glassdoor provider receives a search query, THE Job_Provider SHALL return job listings by maintaining valid session state or using an alternative access method
6. WHEN the Monster provider receives a search query, THE Job_Provider SHALL return job listings by using the current API endpoint format
7. WHEN the Totaljobs provider receives a search query, THE Job_Provider SHALL return job listings by using updated scraping selectors matching the current page structure
8. WHEN the CV_Library provider receives a search query, THE Job_Provider SHALL return job listings by using updated scraping selectors matching the current page structure
9. WHEN the Find_a_Job provider receives a search query, THE Job_Provider SHALL return job listings by using the current GOV.UK API endpoint
10. IF a Job_Provider fails to return results, THEN THE Provider_Registry SHALL log a diagnostic entry including provider name, integration method, query, HTTP status, and error message
11. IF a Job_Provider is temporarily unavailable, THEN THE Platform SHALL skip that provider gracefully and return results from remaining operational providers
12. THE Platform SHALL display provider health status in a diagnostics view showing which providers are operational, degraded, or offline

### Requirement 3: Real Skills Extraction from Job Listings

**User Story:** As a user, I want job cards to show actual skills extracted from the job description, so that I can quickly assess skill relevance.

#### Acceptance Criteria

1. WHEN a job listing is processed, THE Job_Data_Extractor SHALL extract specific technical skills, tools, and frameworks mentioned in the description text
2. THE Job_Data_Extractor SHALL produce skill names that match actual technologies (e.g. "React", "Python", "AWS") rather than generic categories (e.g. "Advanced frameworks", "Cloud platforms")
3. IF the job description contains no identifiable skills, THEN THE Job_Data_Extractor SHALL return an empty skills array rather than placeholder text
4. WHEN displaying skills on a Job_Card, THE Platform SHALL show only skills returned by the Job_Data_Extractor for that specific listing

### Requirement 4: Job Description Section Parsing

**User Story:** As a user, I want job descriptions to be split into clearly labelled sections (responsibilities, requirements, benefits, salary), so that I can scan listings efficiently.

#### Acceptance Criteria

1. WHEN a job listing is stored or displayed, THE Job_Description_Parser SHALL extract and label distinct sections: responsibilities, requirements, qualifications, and benefits
2. WHEN the job description contains identifiable section headers, THE Job_Description_Parser SHALL use header-based splitting to identify section boundaries
3. IF the job description has no clear section headers, THEN THE Job_Description_Parser SHALL use keyword-based heuristics to classify content into sections
4. WHEN a Job_Card detail view is rendered, THE Platform SHALL display parsed sections with appropriate headings rather than a single block of raw text
5. FOR ALL valid job descriptions, parsing then formatting then parsing SHALL produce equivalent section content (round-trip property)

### Requirement 5: Skill-Based Job Search

**User Story:** As a user, I want to search for jobs by specific skills, so that I can find roles matching my expertise.

#### Acceptance Criteria

1. WHEN a user submits a skill-based search query, THE Platform SHALL include the skill terms in the provider search parameters
2. WHEN skill-based search results are returned, THE Platform SHALL rank results by the number of matching skills found in each listing
3. IF no results match the specified skills, THEN THE Platform SHALL broaden the search to related skills and indicate the broadened scope to the user
4. THE Platform SHALL support multi-skill search where results match at least one of the specified skills

### Requirement 6: CV Upload Profile Population

**User Story:** As a user, I want my uploaded CV data to automatically populate my profile fields, so that I do not have to manually re-enter information.

#### Acceptance Criteria

1. WHEN a user uploads a CV file, THE CV_Parser SHALL extract skills, experience entries, education entries, full name, email, and phone number
2. WHEN the CV_Parser returns extracted data, THE Platform SHALL persist the extracted skills to the User_Profile skills field
3. WHEN the CV_Parser returns extracted data, THE Platform SHALL persist the extracted experience entries to the User_Profile experience field
4. WHEN the CV_Parser returns extracted data, THE Platform SHALL persist the extracted education entries to the User_Profile education field
5. IF the User_Profile already contains data in a field, THEN THE Platform SHALL merge new CV data with existing data without duplicating entries
6. WHEN CV data is persisted to the User_Profile, THE Platform SHALL notify the user of which fields were updated

### Requirement 7: Skill Lab UX Refresh

**User Story:** As a user, I want the Skill Lab page to have an improved layout and integrate with the Skills Matrix, so that I can manage my skills effectively.

#### Acceptance Criteria

1. THE Skill_Lab SHALL display the user's skills organized by the Skills Matrix categories (technical, soft, domain)
2. THE Skill_Lab SHALL provide visual indicators of skill proficiency levels
3. WHEN a user adds or removes a skill, THE Skill_Lab SHALL update the display without a full page reload
4. THE Skill_Lab SHALL display recommended learning resources linked to skill gaps
5. THE Skill_Lab SHALL integrate with the Education_Provider_Taxonomy to suggest relevant courses

### Requirement 8: Dashboard Job Tile Navigation

**User Story:** As a user, I want to click job tiles on the dashboard and be taken to the full job listing, so that I can view details of interesting roles.

#### Acceptance Criteria

1. WHEN a user clicks a job tile on the Dashboard, THE Platform SHALL navigate to the job detail page at `/jobs/{jobId}`
2. THE Dashboard job tiles SHALL render as clickable elements with appropriate cursor and hover states
3. IF the job detail page fails to load, THEN THE Platform SHALL display an error message with a back-navigation option

### Requirement 9: Application Card Layout Fix

**User Story:** As a user, I want application cards to display without overlapping, so that I can read and interact with each application clearly.

#### Acceptance Criteria

1. THE Application_Card components SHALL maintain consistent spacing and not overlap adjacent cards
2. WHEN an Application_Card flip animation is triggered, THE Platform SHALL contain the animation within the card's allocated space
3. WHILE an Application_Card is in its flipped (revers) state, THE Platform SHALL preserve the card's dimensions and not affect the layout of surrounding cards
4. THE Application_Card grid layout SHALL accommodate cards of varying content height without overflow

### Requirement 10: Personalized Skills Gap Analysis

**User Story:** As a user, I want the skills gap analysis to compare my actual profile skills against real job requirements, so that I receive actionable learning recommendations.

#### Acceptance Criteria

1. WHEN a skills gap analysis is performed, THE Skills_Gap_Analyzer SHALL compare the User_Profile skills against the specific requirements extracted from the target job listing
2. THE Skills_Gap_Analyzer SHALL identify missing skills as the difference between job requirements and user skills
3. THE Skills_Gap_Analyzer SHALL produce skill names that match actual technologies and competencies rather than generic placeholder text (e.g. not "Advanced frameworks" or "Cloud platforms")
4. IF the User_Profile has no skills defined, THEN THE Skills_Gap_Analyzer SHALL prompt the user to add skills or upload a CV before generating analysis
5. WHEN displaying gap analysis results, THE Platform SHALL show specific skill names, relevance to the job, and suggested learning paths

### Requirement 11: Education and Training Provider Taxonomy

**User Story:** As a user, I want the platform to suggest relevant universities, colleges, and online course providers, so that I can find training to close my skill gaps.

#### Acceptance Criteria

1. THE Platform SHALL maintain an Education_Provider_Taxonomy containing universities, colleges, and online course providers
2. THE Education_Provider_Taxonomy SHALL categorize providers by type (university, college, online platform, bootcamp)
3. THE Education_Provider_Taxonomy SHALL associate providers with skill domains they cover
4. WHEN a skill gap is identified, THE Platform SHALL suggest relevant education providers from the taxonomy that offer courses in the missing skill area
5. THE Education_Provider_Taxonomy SHALL include at minimum: major UK universities, FE colleges, and online platforms (Coursera, Udemy, Pluralsight, LinkedIn Learning, freeCodeCamp)
