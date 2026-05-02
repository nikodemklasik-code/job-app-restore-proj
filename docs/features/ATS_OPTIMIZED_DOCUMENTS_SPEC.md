# ATS-Optimized CV & Cover Letter Generation Spec

**Status:** Draft  
**Priority:** High  
**Created:** 2 maja 2026  
**Owner:** Backend Team

---

## 🎯 Problem Statement

Obecne CV i Cover Letter generowane przez system:
- ❌ **Nie są rozpoznawalne przez ATS** (Applicant Tracking Systems)
- ❌ **Brakuje kluczowych sekcji** (experience, education nie są uwzględniane w pełni)
- ❌ **Nie są dopasowane do konkretnego ogłoszenia** (generyczne teksty)
- ❌ **Nie zawierają słów kluczowych** z job description
- ❌ **Format PDF nie jest ATS-friendly** (brak struktury, za dużo grafiki)

### Konsekwencje:
1. CV są odrzucane przez ATS przed dotarciem do rekrutera
2. Kandydaci tracą szanse na rozmowy mimo dobrych kwalifikacji
3. Fit score nie przekłada się na rzeczywiste dopasowanie dokumentów
4. Brak personalizacji sprawia, że aplikacje wyglądają masowo

---

## 🎯 Cele

### 1. **ATS Compliance** (90%+ parsing success rate)
- Prosty, czytelny layout bez skomplikowanych tabel
- Standardowe sekcje z rozpoznawalnymi nagłówkami
- Słowa kluczowe z job description
- Parsowalne daty, nazwy firm, tytuły stanowisk

### 2. **Kompletność Danych**
- Wszystkie sekcje profilu: Experience, Education, Skills, Trainings
- Pełne opisy stanowisk z achievements
- Daty w standardowym formacie (MM/YYYY)
- Kontakt: email, telefon, LinkedIn

### 3. **Indywidualne Dopasowanie**
- Analiza job description → ekstrakcja requirements
- Dopasowanie skills z profilu do requirements
- Reordering sekcji według relevance
- Tailored summary dla każdej aplikacji
- Keyword optimization (bez keyword stuffing)

### 4. **Nowoczesny Design**
- Clean, professional layout
- ATS-friendly ale wizualnie atrakcyjny dla ludzi
- Consistent branding (kolory, fonty)
- PDF z embedded fonts i proper structure

---

## 📋 Requirements

### Functional Requirements

#### FR1: Job Description Analysis
```typescript
interface JobAnalysis {
  // Extracted from job description
  requiredSkills: string[];           // Must-have skills
  preferredSkills: string[];          // Nice-to-have skills
  keywords: string[];                 // Important keywords (technologies, methodologies)
  seniority: 'junior' | 'mid' | 'senior' | 'lead' | 'principal';
  industry: string;                   // Tech, Finance, Healthcare, etc.
  responsibilities: string[];         // Key responsibilities from JD
  qualifications: string[];           // Education/certification requirements
  
  // Scoring
  keywordDensity: Record<string, number>;  // How often each keyword appears
  priorityScore: Record<string, number>;   // Importance of each skill (1-10)
}
```

**Implementation:**
- Use OpenAI to parse job description
- Extract structured data (skills, keywords, requirements)
- Calculate keyword importance based on frequency and position
- Identify seniority level from title and description

#### FR2: Profile-to-Job Matching
```typescript
interface ProfileJobMatch {
  matchedSkills: Array<{
    skill: string;
    profileEvidence: string[];        // Where in profile this skill appears
    jobRequirement: string;           // Matching requirement from JD
    matchStrength: number;            // 0-100
  }>;
  
  matchedExperience: Array<{
    experienceId: string;
    relevanceScore: number;           // 0-100
    matchingKeywords: string[];
    suggestedHighlights: string[];    // Which achievements to emphasize
  }>;
  
  gaps: Array<{
    requirement: string;
    severity: 'critical' | 'important' | 'nice-to-have';
    suggestion: string;               // How to address the gap
  }>;
  
  overallFitScore: number;            // 0-100
}
```

**Implementation:**
- Match profile skills against job requirements
- Score each experience entry by relevance to job
- Identify gaps and suggest how to address them
- Calculate overall fit score (improved algorithm)

#### FR3: Tailored CV Generation
```typescript
interface TailoredCvConfig {
  jobAnalysis: JobAnalysis;
  profileMatch: ProfileJobMatch;
  
  // Customization options
  emphasizeSkills: string[];          // Skills to highlight
  reorderExperience: boolean;         // Put most relevant first
  includeAllExperience: boolean;      // Or only relevant ones
  summaryStyle: 'technical' | 'leadership' | 'balanced';
  maxPages: 1 | 2 | 3;
}

interface GeneratedCv {
  // Sections
  summary: string;                    // Tailored to job
  skills: Array<{
    name: string;
    category: string;                 // Technical, Soft, Domain
    relevanceToJob: number;           // 0-100
  }>;
  experience: Array<{
    id: string;
    title: string;
    company: string;
    dates: string;
    description: string;              // Tailored description
    achievements: string[];           // Bullet points
    relevanceScore: number;
  }>;
  education: Array<{
    degree: string;
    school: string;
    dates: string;
    relevantCourses?: string[];       // If relevant to job
  }>;
  trainings: Array<{
    title: string;
    provider: string;
    date: string;
    relevanceToJob: number;
  }>;
  
  // Metadata
  atsScore: number;                   // Predicted ATS parsing success
  keywordCoverage: number;            // % of job keywords covered
  estimatedFitScore: number;          // Predicted recruiter rating
}
```

**Implementation:**
- Generate tailored summary using AI (focus on job-relevant skills)
- Reorder skills by relevance to job
- Reorder experience entries by relevance
- Rewrite experience descriptions to emphasize relevant achievements
- Include only relevant trainings/certifications
- Optimize keyword density (natural, not stuffed)

#### FR4: ATS-Friendly PDF Generation
```typescript
interface AtsPdfConfig {
  // Layout
  layout: 'single-column' | 'two-column';  // Single-column is more ATS-friendly
  fontSize: {
    name: number;                     // 18-24pt
    sectionHeaders: number;           // 12-14pt
    body: number;                     // 10-11pt
  };
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  
  // Styling
  useColors: boolean;                 // Minimal colors for ATS
  useBulletPoints: boolean;           // Standard bullets (•)
  useIcons: boolean;                  // Icons can confuse ATS
  
  // Structure
  sectionOrder: string[];             // ['summary', 'experience', 'education', 'skills']
  includeLinkedIn: boolean;
  includePhoto: boolean;              // Not recommended for ATS
  
  // ATS Optimization
  useStandardSectionNames: boolean;   // "Work Experience" not "My Journey"
  avoidTables: boolean;               // Tables confuse ATS
  avoidTextBoxes: boolean;            // Text boxes are often skipped
  embedFonts: boolean;                // Ensure fonts are embedded
}
```

**Implementation:**
- Use PDFKit with ATS-friendly settings
- Single-column layout (no complex multi-column)
- Standard section headers (WORK EXPERIENCE, EDUCATION, SKILLS)
- No tables, no text boxes, no images (except minimal header accent)
- Embedded fonts (Helvetica, Arial, or similar)
- Proper PDF structure tags for accessibility

#### FR5: Cover Letter Personalization
```typescript
interface TailoredCoverLetter {
  // Structure
  greeting: string;                   // "Dear [Hiring Manager Name]" or "Dear Hiring Team"
  opening: string;                    // Hook + why this role
  body: string[];                     // 2-3 paragraphs
  closing: string;                    // Call to action
  signature: string;
  
  // Content
  companyResearch: {
    companyName: string;
    industry: string;
    recentNews?: string;              // Optional: recent company news
    values?: string[];                // Company values to mention
  };
  
  roleAlignment: {
    topMatchedSkills: string[];       // 3-5 skills that match job
    relevantAchievements: string[];   // 2-3 achievements to highlight
    whyThisRole: string;              // Personalized reason
  };
  
  // Tone
  tone: 'formal' | 'professional' | 'conversational';
  length: 'short' | 'medium' | 'long'; // 150-250 words recommended
}
```

**Implementation:**
- Analyze company from job posting
- Extract company values/culture from description
- Match candidate's achievements to job requirements
- Generate personalized opening (not generic "I am writing to apply")
- Include specific examples of relevant experience
- End with clear call to action

---

## 🏗️ Architecture

### Data Flow

```
1. User clicks "Tailor Resume" on Job Detail Page
   ↓
2. Frontend calls api.applications.generateDocuments
   ↓
3. Backend fetches:
   - Job details (title, description, requirements)
   - User profile (all sections)
   - User's experience, education, skills, trainings
   ↓
4. AI Analysis:
   - Parse job description → JobAnalysis
   - Match profile to job → ProfileJobMatch
   ↓
5. Document Generation:
   - Generate tailored CV text
   - Generate tailored cover letter text
   ↓
6. PDF Generation:
   - Create ATS-friendly CV PDF
   - Create professional cover letter PDF
   ↓
7. Store snapshots in applications table
   ↓
8. Return to frontend → navigate to /applications
```

### New Services

#### `backend/src/services/jobAnalyzer.ts`
```typescript
export async function analyzeJobDescription(
  jobDescription: string,
  jobTitle: string,
  company: string
): Promise<JobAnalysis>;

export async function matchProfileToJob(
  profile: CompleteProfile,
  jobAnalysis: JobAnalysis
): Promise<ProfileJobMatch>;
```

#### `backend/src/services/documentTailoring.ts`
```typescript
export async function generateTailoredCv(
  profile: CompleteProfile,
  jobAnalysis: JobAnalysis,
  profileMatch: ProfileJobMatch,
  config: TailoredCvConfig
): Promise<GeneratedCv>;

export async function generateTailoredCoverLetter(
  profile: CompleteProfile,
  jobAnalysis: JobAnalysis,
  profileMatch: ProfileJobMatch,
  companyResearch: CompanyResearch
): Promise<TailoredCoverLetter>;
```

#### Updated `backend/src/services/pdfGenerator.ts`
```typescript
// Add ATS-friendly mode
export async function generateAtsCvPdf(
  cv: GeneratedCv,
  config: AtsPdfConfig
): Promise<Buffer>;

// Improve existing functions
export async function generateCvPdf(
  profile: CvProfile,
  experience?: Experience[],
  education?: Education[],
  trainings?: Training[],
  atsMode?: boolean
): Promise<Buffer>;
```

---

## 🎨 PDF Layout Design

### ATS-Friendly CV Layout

```
┌─────────────────────────────────────────────────────────┐
│  JOHN SMITH                                             │
│  john.smith@email.com | +44 7700 900000 | London, UK   │
│  linkedin.com/in/johnsmith                              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  PROFESSIONAL SUMMARY                                   │
│  ─────────────────────────────────────────────────────  │
│  Senior Software Engineer with 8+ years of experience   │
│  in full-stack development, specializing in React,      │
│  Node.js, and AWS. Proven track record of delivering    │
│  scalable solutions for fintech companies. Seeking      │
│  Senior Full-Stack Engineer role at [Company] to        │
│  leverage expertise in microservices architecture.      │
│                                                         │
│  TECHNICAL SKILLS                                       │
│  ─────────────────────────────────────────────────────  │
│  Languages: JavaScript, TypeScript, Python, Java        │
│  Frontend: React, Next.js, Vue.js, TailwindCSS         │
│  Backend: Node.js, Express, NestJS, Django              │
│  Cloud: AWS (EC2, Lambda, S3, RDS), Docker, Kubernetes │
│  Databases: PostgreSQL, MongoDB, Redis                  │
│                                                         │
│  PROFESSIONAL EXPERIENCE                                │
│  ─────────────────────────────────────────────────────  │
│  Senior Software Engineer                               │
│  TechCorp Ltd | London, UK | 01/2020 – Present         │
│  • Led development of microservices platform serving    │
│    500K+ users, reducing API response time by 40%       │
│  • Architected React-based dashboard with real-time     │
│    data visualization, improving user engagement 25%    │
│  • Mentored team of 5 junior developers, establishing   │
│    code review practices and CI/CD pipelines            │
│                                                         │
│  Software Engineer                                      │
│  StartupXYZ | London, UK | 06/2017 – 12/2019           │
│  • Built full-stack web application using React and     │
│    Node.js, handling 10K+ daily active users            │
│  • Implemented automated testing suite, increasing      │
│    code coverage from 30% to 85%                        │
│  • Optimized database queries, reducing load times 50%  │
│                                                         │
│  EDUCATION                                              │
│  ─────────────────────────────────────────────────────  │
│  BSc Computer Science                                   │
│  University of London | 2013 – 2017                    │
│  First Class Honours                                    │
│                                                         │
│  CERTIFICATIONS                                         │
│  ─────────────────────────────────────────────────────  │
│  • AWS Certified Solutions Architect – Associate (2023) │
│  • Certified Kubernetes Administrator (2022)            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Key ATS-Friendly Features:
1. ✅ **Single column** (no complex layouts)
2. ✅ **Standard section headers** (PROFESSIONAL SUMMARY, EXPERIENCE, EDUCATION)
3. ✅ **Clear hierarchy** (name largest, sections bold, body regular)
4. ✅ **Standard bullet points** (•)
5. ✅ **Dates in standard format** (MM/YYYY)
6. ✅ **No tables, no text boxes**
7. ✅ **Keywords naturally integrated** (not stuffed)
8. ✅ **Contact info at top** (easy to parse)
9. ✅ **Quantified achievements** (numbers, percentages)
10. ✅ **Relevant skills first** (matched to job description)

---

## 🔧 Implementation Plan

### Phase 1: Job Analysis & Matching (Week 1)
**Files to create/modify:**
- `backend/src/services/jobAnalyzer.ts` (NEW)
- `backend/src/services/aiPersonalizer.ts` (UPDATE)

**Tasks:**
1. Create `analyzeJobDescription()` function
   - Extract required/preferred skills
   - Identify keywords and their importance
   - Determine seniority level
   - Extract responsibilities and qualifications

2. Create `matchProfileToJob()` function
   - Match skills with evidence
   - Score experience entries by relevance
   - Identify gaps
   - Calculate improved fit score

3. Update `explainJobFit()` to use new analysis
   - More detailed strengths/gaps
   - Better keyword extraction
   - Improved scoring algorithm

**Acceptance Criteria:**
- Job analysis extracts 8-15 relevant skills
- Keyword importance scores are accurate
- Profile matching identifies top 3-5 relevant experiences
- Fit score correlates with actual job match

### Phase 2: Document Tailoring (Week 2)
**Files to create/modify:**
- `backend/src/services/documentTailoring.ts` (NEW)
- `backend/src/services/aiPersonalizer.ts` (UPDATE)

**Tasks:**
1. Create `generateTailoredCv()` function
   - Generate job-specific summary
   - Reorder skills by relevance
   - Reorder experience by relevance
   - Rewrite experience descriptions with relevant keywords
   - Filter trainings by relevance

2. Create `generateTailoredCoverLetter()` function
   - Research company (from job description)
   - Match achievements to requirements
   - Generate personalized opening
   - Create compelling body paragraphs
   - Add clear call to action

3. Update prompts for better AI generation
   - More specific instructions
   - Include job context
   - Emphasize natural keyword integration
   - Avoid generic phrases

**Acceptance Criteria:**
- CV summary mentions job title and company
- Top 3 skills match job requirements
- Experience descriptions include relevant keywords
- Cover letter mentions specific company details
- No generic phrases ("I am excited to apply")

### Phase 3: ATS-Friendly PDF Generation (Week 3)
**Files to modify:**
- `backend/src/services/pdfGenerator.ts` (UPDATE)

**Tasks:**
1. Create `generateAtsCvPdf()` function
   - Single-column layout
   - Standard section headers
   - No tables, no text boxes
   - Minimal colors (black + one accent)
   - Embedded fonts
   - Proper PDF structure

2. Update `generateCvPdf()` to accept full profile data
   - Experience with achievements
   - Education with details
   - Trainings/certifications
   - Skills categorized

3. Improve `generateCoverLetterPdf()`
   - Better formatting
   - Professional layout
   - Consistent with CV design

4. Add ATS scoring function
   - Estimate parsing success rate
   - Check for ATS-unfriendly elements
   - Provide recommendations

**Acceptance Criteria:**
- PDF passes ATS parsing test (90%+ success)
- All sections are properly structured
- Text is selectable and searchable
- No visual elements that confuse ATS
- Professional appearance for human reviewers

### Phase 4: Integration & Testing (Week 4)
**Files to modify:**
- `backend/src/trpc/routers/applications.router.ts` (UPDATE)
- `backend/src/services/emailAutoApply.ts` (UPDATE)

**Tasks:**
1. Update `generateDocuments` endpoint
   - Use new job analysis
   - Use new document tailoring
   - Use new PDF generation
   - Store richer metadata

2. Update `emailAutoApply.ts`
   - Use new document generation
   - Include full profile data
   - Generate ATS-friendly PDFs

3. Add new endpoints
   - `analyzeJobFit` (detailed analysis)
   - `previewTailoredCv` (before generating)
   - `getAtsScore` (check ATS compatibility)

4. Testing
   - Unit tests for job analysis
   - Integration tests for document generation
   - ATS parsing tests (use online ATS checkers)
   - Manual review of generated documents

**Acceptance Criteria:**
- All endpoints work correctly
- Documents are generated in <5 seconds
- ATS score is 85%+ for all generated CVs
- Cover letters are personalized and compelling
- No errors in production

---

## 📊 Success Metrics

### Technical Metrics
- **ATS Parsing Success Rate:** 90%+ (test with online ATS checkers)
- **Keyword Coverage:** 70%+ of job keywords in CV
- **Generation Time:** <5 seconds per document
- **Error Rate:** <1% of document generations fail

### Business Metrics
- **Interview Rate:** +30% increase (more CVs pass ATS)
- **User Satisfaction:** 4.5+ stars for document quality
- **Time Saved:** 15+ minutes per application (vs manual tailoring)
- **Application Completion Rate:** +20% (easier to apply)

### Quality Metrics
- **Relevance Score:** 85%+ (manual review)
- **Keyword Density:** 2-3% (natural, not stuffed)
- **Readability:** Flesch Reading Ease 60+ (professional but clear)
- **Uniqueness:** <30% similarity between documents for different jobs

---

## 🧪 Testing Strategy

### 1. ATS Compatibility Testing
**Tools:**
- Jobscan.co (ATS resume checker)
- Resume Worded (ATS optimization)
- TopResume ATS checker

**Test Cases:**
- Upload generated CV to ATS checker
- Verify all sections are parsed correctly
- Check keyword match score
- Ensure contact info is extracted
- Verify dates and companies are recognized

### 2. Job Matching Testing
**Test Cases:**
- Generate CV for 10 different job types
- Verify skills are reordered correctly
- Check experience relevance scores
- Ensure keywords from JD appear in CV
- Validate fit score accuracy

### 3. Quality Testing
**Test Cases:**
- Manual review by recruiters
- Check for generic phrases
- Verify achievements are quantified
- Ensure no keyword stuffing
- Validate professional tone

### 4. Performance Testing
**Test Cases:**
- Generate 100 documents concurrently
- Measure average generation time
- Check memory usage
- Monitor OpenAI API costs
- Verify PDF file sizes (<500KB)

---

## 🚀 Deployment Plan

### Pre-Deployment
1. ✅ Run all tests (unit, integration, ATS)
2. ✅ Manual review of 20+ generated documents
3. ✅ Performance testing (load test)
4. ✅ Cost analysis (OpenAI API usage)
5. ✅ Backup database

### Deployment Steps
1. Deploy backend changes to staging
2. Test on staging with real user data
3. Deploy to production (off-peak hours)
4. Monitor error logs and performance
5. Gradual rollout (10% → 50% → 100%)

### Post-Deployment
1. Monitor ATS success rate
2. Collect user feedback
3. Track interview rate changes
4. Optimize based on data
5. Iterate on prompts and algorithms

---

## 💰 Cost Analysis

### OpenAI API Costs
**Current:**
- `generateCoverLetter`: ~500 tokens = $0.0025
- `generateCvSummary`: ~300 tokens = $0.0015
- **Total per application:** ~$0.004

**New (with job analysis):**
- `analyzeJobDescription`: ~800 tokens = $0.004
- `matchProfileToJob`: ~600 tokens = $0.003
- `generateTailoredCv`: ~1000 tokens = $0.005
- `generateTailoredCoverLetter`: ~800 tokens = $0.004
- **Total per application:** ~$0.016

**Increase:** 4x (from $0.004 to $0.016)

**Monthly Cost (1000 applications):**
- Current: $4
- New: $16
- **Increase: $12/month**

**ROI:**
- If interview rate increases 30%, users get 300 more interviews per 1000 applications
- Value to users: Significantly higher (more job offers)
- Cost increase: Minimal ($12/month for 1000 applications)

---

## 📚 References

### ATS Best Practices
- [Jobscan ATS Guide](https://www.jobscan.co/blog/ats-resume/)
- [TopResume ATS Tips](https://www.topresume.com/career-advice/what-is-an-ats-resume)
- [Indeed ATS Resume Guide](https://www.indeed.com/career-advice/resumes-cover-letters/ats-resume)

### PDF Generation
- [PDFKit Documentation](https://pdfkit.org/)
- [ATS-Friendly PDF Structure](https://www.jobscan.co/blog/ats-friendly-resume-template/)

### AI Prompting
- [OpenAI Best Practices](https://platform.openai.com/docs/guides/prompt-engineering)
- [Prompt Engineering Guide](https://www.promptingguide.ai/)

---

## 🔄 Future Enhancements

### Phase 5: Advanced Features (Future)
1. **Multi-language support** (Polish, German, French)
2. **Industry-specific templates** (Tech, Finance, Healthcare)
3. **A/B testing** (test different CV formats)
4. **LinkedIn integration** (import profile data)
5. **Real-time ATS scoring** (as user edits profile)
6. **Company research API** (fetch company news, values)
7. **Achievement suggestions** (AI suggests how to phrase achievements)
8. **Keyword optimization tool** (suggest missing keywords)

---

**Document Version:** 1.0  
**Last Updated:** 2 maja 2026  
**Next Review:** After Phase 1 completion
