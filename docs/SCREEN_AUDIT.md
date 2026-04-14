# Screen Audit — MultivoHub Frontend

**Audit date:** 2026-04-14
**Audited by:** Codebase analysis of `/frontend/src/app/`
**Purpose:** Product planning — identify what works, what is mock, what is gated.

---

## /auth — AuthPage

### What is on the screen
- Split layout: left side = sign-in/sign-up form; right side = animated device mockup showing demo video
- Sign-in form: email + password fields, show/hide password toggle, "Forgot password?" flow
- Sign-up form: full name + email + password fields
- Mode toggle: "Sign in" / "Sign up" tabs
- Social sign-in buttons: Google, Apple, Facebook, LinkedIn (OAuth via Clerk)
- Email code verification step (shown after sign-up or if account requires it)
- TOTP / backup code step (shown if 2FA is enabled)
- Forgot-password flow: enter email → enter reset code → enter new password
- Right panel: device mockup displaying looping MP4 demo videos from `/auth-videos/` (7 local clips)
- Animated feature ticker cards: "Dashboard", "Interview Practice", "AI Analysis", "Career Growth"
- Fallback placeholder (no video): animated bar chart UI with "Live" badge

### What works
- Full Clerk-powered sign-in with email + password
- Sign-up with email verification code
- Forgot-password reset flow (email code → new password)
- Social OAuth: Google, Apple, Facebook, LinkedIn
- 2FA (TOTP and backup code) for accounts with it enabled
- Auto-redirect to `/dashboard` if already signed in
- Error sanitisation: strips Clerk internal error messages; shows user-friendly copy
- Resend code button for both sign-up verification and sign-in code flows
- Muted autoplay video loop with sound toggle button
- YouTube embed support (reads `VITE_AUTH_DEMO_VIDEO_URLS`)

### What is placeholder or not implemented
- The right-panel device mockup falls back to a static decorative UI (animated bars, hardcoded "96%", "89%", "92%" values) when no video files are present — these numbers are purely decorative
- Ticker cards are purely decorative (no real data)

### Paid / credit-gated
- Not applicable (auth page is pre-login)

### Issues spotted
- Button label "Nowy czat" (Polish) is visible in AssistantPage but not here — no issue on this screen
- The `VITE_AUTH_DEMO_VIDEO_URL` (singular) env var is documented but `VITE_AUTH_DEMO_VIDEO_URLS` (plural) takes precedence; if only the singular is set it works via fallback, but could confuse configuration

---

## /dashboard — DashboardPage

### What is on the screen
- Page title: "Profile & Goals"
- "Your Details" card: Full name, Current role (optional), Current salary (£/yr, optional)
- "Career Goal" card: Target role, Target salary (£/yr)
- "Career Roadmap" card: Icon, description "Auto-filled once your CV and documents are scanned", link to `/documents`
- "Work Values" card: textarea (comma-separated values)
- "Auto-Apply Threshold" card: range slider 50–100%, explanatory text
- "Social Profile Analysis" card: LinkedIn, Facebook, Instagram consent checkboxes with link to `/settings`
- Autosave badge: "Saved" (appears briefly on change)

### What works
- All form fields read from and debounce-save to `localStorage` (`mvh-profile` key) — 800 ms debounce
- Autosave badge shows for 2 seconds on save
- Form pre-populates `fullName` from Clerk user object if localStorage is empty
- Navigation links to `/documents` and `/settings` work

### What is placeholder or not implemented
- Data is saved only to `localStorage` — nothing is persisted to the backend database. The form does not call any tRPC/API endpoint
- "Career Roadmap" section is a static placeholder: "Auto-filled once your CV and documents are scanned" — no actual roadmap is generated
- Social profile analysis checkboxes are saved to localStorage only; no backend scraping or analysis is wired up
- Auto-Apply Threshold slider is saved locally but the auto-apply system does not read this value from localStorage (it would need to be server-side)
- No "Save" button — relies entirely on debounced autosave with no feedback if save fails

### Paid / credit-gated
- None on this screen

### Issues spotted
- Data stored in `localStorage` only — if user clears browser storage or logs in on another device, all profile settings are lost. This is a significant data durability bug for a screen named "Profile & Goals"
- Social consent checkboxes here and in Settings are separate localStorage keys (`mvh-profile` vs `mvh-consents`) — they could get out of sync
- `autoApplyThreshold` slider claims to control AI auto-apply but the AutoApplyPage reads weekly limits from the server, not this value

---

## /jobs — JobsDiscovery

### What is on the screen
- Search bar: keyword, location, salary range inputs
- Source filter chips: Reed, Adzuna, Jooble, Indeed, Gumtree
- Session setup panels for Indeed and Gumtree (cookie-based login wizard)
- Job cards: company avatar, title, fit score (%), salary, location, work mode, source badge, posted date, scam warning, AI match bar, collapsible skills/requirements section
- "Why this match?" button per card → opens ExplainFitModal
- "Apply" external link button
- Company profile lazy-expand (click company name → loads AI-generated profile inline)
- ExplainFitModal: fit score, strengths list, gaps list, advice, scam detection

### What works
- Job search via tRPC (`api.jobs.search`) — real API calls to Reed, Adzuna, Jooble
- Fit score displayed per card (backend-computed)
- "Why this match?" opens a real tRPC call (`api.jobs.explainFit`) → GPT-powered analysis with strengths, gaps, advice
- Client-side scam detection (`quickScamCheck`) — regex pattern matching on title + description
- Application status badge per card (`api.applications.getAll` cross-referenced by job ID)
- Company profile card: real tRPC call (`api.jobs.getCompanyProfile`) returning industry, size, culture, interview style
- Indeed session login wizard: `api.jobSessions.startIndeedLogin`, `submitIndeedCode`, `testSession`, `remove` — real mutations
- Gumtree session login wizard: same pattern
- Session status polling (`api.jobSessions.getStatus`) — shows Connected / Expired / Not connected
- External apply link opens in new tab
- Link to Skills Lab from job skills section

### What is placeholder or not implemented
- No "Save job" or bookmark functionality — jobs cannot be saved without creating an application
- No pagination or infinite scroll — limited to one page of results
- Indeed and Gumtree search may not actually return results even when session is active (depends on backend Playwright scraper being functional)
- Salary range filter input visible in imports but search results are not filtered by it on the client

### Paid / credit-gated
- "Why this match?" (explainFit) consumes AI credits
- Indeed and Gumtree job results require session setup (user must enter their own Indeed/Gumtree credentials)

### Issues spotted
- `quickScamCheck` fires on both card render and inside the modal — two separate calls with different inputs (card uses `job.description ?? ''` which may be empty)
- Company profile card fires a tRPC query every time a user expands it, with no caching key differentiation per job — if the same company appears twice, two separate requests fire

---

## /applications — ApplicationsPipeline

### What is on the screen
- Page header: "My Applications", "Add Application" button
- Stats row: Total, Response Rate (%), Interviews count, Offers count
- Filter pills: All, Draft, Ready, Submitted, Interview, Offer, Rejected
- Application cards: company avatar, job title, company, status badge, fit score bar, fit reasons (bullet points), notes snippet
- Per-card actions (context-dependent on status):
  - Draft: "Generate Documents" button
  - Prepared: "View Cover Letter", "Send by Email" button
  - Any: "Mark Interview", "Mark Accepted", "Mark Rejected" outcome buttons
  - Follow-up: generate follow-up email button
  - Email monitoring toggle (grant/revoke)
- Cover letter modal: view generated cover letter text
- Send by email modal: enter recipient email, send
- New application modal: job title, company, notes fields
- Follow-up text preview area

### What works
- Fetch all applications from DB (`api.applications.getAll`)
- Analytics (`api.applications.getAnalytics`): response rate, interviews, offers are backend-computed
- Create new application (`api.applications.create`) — saves to DB
- Generate documents (`api.applications.generateDocuments`) — real AI call generating cover letter + fit reasons
- Send application by email (`api.applications.sendByEmail`) — real email dispatch
- Record outcomes (`api.applications.recordOutcome`) — updates status in DB
- Generate follow-up email (`api.applications.generateFollowUp`) — AI-generated email text
- Email monitoring grant/revoke (`api.emailMonitoring.grant`, `revoke`)
- Status filter pills with live counts
- Cover letter snapshot stored per application

### What is placeholder or not implemented
- "Download CV PDF" button is visible in profile (via `api.applications.downloadCvPdf`) but not present on this screen — PDF download is wired in profile only
- Fit reasons only show after "Generate Documents" is run — blank otherwise
- No drag-and-drop Kanban view (cards are in a grid, not pipeline columns)

### Paid / credit-gated
- "Generate Documents" consumes AI credits
- "Generate Follow-up" consumes AI credits
- "Send by Email" requires SMTP configured in Settings

### Issues spotted
- The `follow_up_sent` status exists in `JobsDiscovery` STATUS_META but not in the ApplicationsPipeline `AppStatus` type — status mismatch between the two screens
- `generateDocsMutation.variables?.applicationId` comparison for spinner is correct but the variable is checked by reference; could show wrong spinner if multiple cards are clicked rapidly

---

## /review — ReviewQueue (actual component: SkillsLab / Applications Review)

### What is on the screen
- Page title shows "Applications Review" (despite the component being `SkillsLab` imported in `review/ReviewQueue.tsx`)
- File upload zone: drag-and-drop or click, accepts PDF/DOCX/TXT
- Results grid (after upload):
  - "Extracted from document" card: skill chips with overlap (green) and gap (amber) variants, remove button per gap skill
  - "Your profile skills" card: existing profile skills
  - "Add all missing skills" button
  - "Add" button per individual gap skill
- Summary: extracted skills count, profile skill count

### What works
- CV/document upload (`api.cv.upload`) — real parsing with skill extraction
- Comparing extracted skills vs profile skills (overlap detection)
- "Add all missing" and "Add single skill" (`api.profile.saveSkills`) — saves to DB
- Drag-and-drop file handling via `useFileUpload` hook
- Profile skills fetched from DB (`api.profile.getProfile`)

### What is placeholder or not implemented
- The page title says "Applications Review" but the actual function is skill extraction from documents — the title is misleading
- No actual "review queue" for AI-reviewed applications (despite the route name `/review`)

### Paid / credit-gated
- CV parsing (`api.cv.upload`) uses AI and likely consumes credits

### Issues spotted
- This file (`review/ReviewQueue.tsx`) exports `SkillsLab` component, not a ReviewQueue. The route `/review` shows the SkillsLab document-upload/skill-extraction tool. This appears to be a naming mismatch — either the route or component name is wrong
- There is a separate `/skills` route that also contains SkillsLab — it is unclear which one users should use

---

## /assistant — AssistantPage

### What is on the screen
- Page title: "AI Career Assistant", subtitle "Your personal career strategist powered by GPT-4o"
- Privacy note: "Private messages from Instagram, Facebook, and LinkedIn are not used as AI input"
- "Nowy czat" (Polish: "New chat") button and "Odśwież" (Polish: "Refresh") button
- Error banner (dismissible)
- Message thread: user messages (indigo bubble, right-aligned) and AI messages (grey bubble, left-aligned)
- Empty state: 4 quick-action prompt chips (CV review, salary negotiation, behavioural interview, job search strategies)
- Input: auto-expanding textarea, send button (Enter to send), mic button for voice input
- TTS button per AI message ("Czytaj" / "Czyta…" — Polish labels)

### What works
- Full streaming chat with GPT-4o via `useCareerAssistantStore` (calls `/api/interview/stream` or similar tRPC store)
- Conversation history persisted and loaded on sign-in (`loadHistory`)
- Voice input: browser `MediaRecorder` → Whisper STT via `/api/interview/transcribe`
- Text-to-speech per AI message via `/api/interview/tts`
- Quick action prompts trigger a real message send with mode context
- "New chat" clears messages; "Refresh" reloads history

### What is placeholder or not implemented
- None significant — core functionality is real

### Paid / credit-gated
- Every AI message consumes credits (GPT-4o backend)
- TTS per message consumes credits

### Issues spotted
- Two buttons have Polish labels ("Nowy czat", "Odśwież") and the TTS button also uses Polish ("Czytaj", "Czyta…", "Zatrzymaj czytanie") — inconsistent with the English UI elsewhere. This is a localisation bug
- Mode context (`sendMessage(action.prompt, action.mode)`) is passed for quick actions but `handleSend` always uses `'general'` regardless of conversation context

---

## /interview — InterviewPractice

### What is on the screen
- Lobby phase: job selector (from saved applications), interview mode selector (6 modes: Behavioral, Technical, HR, Case Study, Language Check, General), persona selector (HR Recruiter "Sarah", Hiring Manager "James", Tech Lead "Alex"), difficulty indicator, "Start Interview" button
- Setup-check phase: mic + camera check before call starts
- Call phase: animated AI avatar (face with blinking eyes, breathing), voice bars when AI is speaking, user video preview (webcam), exchange counter, call timer, notes sidebar, live transcript overlay
- Feedback panel (per user turn): STAR presence indicators (S/T/A/R), score (0–100), improvement tip, clarity score, confidence note
- Adaptive insights banner: averageScore, suggestedDifficulty, weak/strong areas
- Live summary panel (expandable): summary, strengths, weaknesses, communication notes, next focus
- End call → "Complete" phase: coaching plan (up to 5 items), "Download Report" button
- Premium lock overlay (Lock icon) for PDF report on free plan

### What works
- Real streaming AI interviewer via SSE (`/api/interview/stream`) with job context injected
- Text-to-speech AI voice via `/api/interview/tts`
- Whisper STT for user answers via `/api/interview/transcribe` and browser MediaRecorder
- Per-turn client-side STAR detection and scoring (`scoreTurnClient`, `detectStarClient`)
- Coaching plan generated client-side from all user messages (`generateCoachingPlan`)
- Markdown interview report generated client-side (`generateMarkdownReport`)
- Adaptive insights delivered server-side via SSE stream `type: 'insights'` events
- Webcam access for user video (no recording, display only)
- Exchange counter, call timer
- Job list loaded from DB (`api.jobs.listForUser`)

### What is placeholder or not implemented
- STAR scoring and coaching plan are entirely client-side heuristics (regex + word count) — not GPT-evaluated
- Clarity score and confidence note are heuristic-only (filler word count)
- Live interview summary is generated client-side; it is not stored to the database
- Adaptive insights (`averageScore`, `sessionCount`) depend on server sending insights data in the SSE stream — if backend does not send them, the UI shows nothing (no error)
- PDF download is behind a premium check (`useBillingStore`) — free users see a lock icon

### Paid / credit-gated
- Full interview session uses AI credits (streaming)
- PDF report download requires paid plan (Pro or Autopilot)

### Issues spotted
- The webcam is started but only shown as a small preview — there is no recording of the video, so the "camera" feature is decorative
- `MAX_EXCHANGES` is hardcoded to 8 — no way for users to adjust
- If mic permission is denied, recording fails silently (catch block is empty `/* mic denied */`)

---

## /warmup — InterviewWarmup

### What is on the screen
- Random behavioural question displayed (from bank of 15)
- Streak counter (Flame icon)
- "Already done today" badge if completed today
- Phase flow: Ready → Countdown (3s) → Recording (60s countdown) → Transcribing → Reviewing → Done
- Timer bar during recording
- Transcription result (editable textarea)
- Result card: score (0–100), label (Excellent / Good / Developing / Needs Work), "What worked" bullets, "To improve" bullets, "Interview tip"
- "Try another" and star/score display
- Browser TTS reads the question aloud on load

### What works
- Voice recording via browser MediaRecorder → Whisper STT (`/api/interview/transcribe`)
- Client-side scoring: STAR component detection + word count + filler word penalty
- Streak tracking via `localStorage` (survives page refresh, resets if >1 day missed)
- TTS question read-aloud via browser `SpeechSynthesisUtterance` (no API cost)
- Transcript is editable before scoring — user can correct STT errors

### What is placeholder or not implemented
- Scoring is entirely client-side heuristics — no GPT evaluation
- Streak is stored in `localStorage` only — not server-persisted, not visible across devices
- No history of past warmup sessions
- Question bank is hardcoded (15 questions); no personalisation from user profile

### Paid / credit-gated
- Whisper STT call uses server resources; unclear if it consumes credits
- Otherwise free

### Issues spotted
- `alreadyDone` state is initialised once on mount (`useState(doneToday)`) but `doneToday` reads `localStorage` at call time — if the user completes a warmup during the same session, the "already done" badge does not appear until page refresh
- Question is read aloud on every render when phase === 'ready' — if TTS is slow to load voices, there may be a delay or silent failure (no user feedback)

---

## /coach — CoachPage

### What is on the screen
- Category selector: 4 cards (Behavioural, Technical, Motivation, Situational), each showing question count
- Session flow: select category → see question → countdown (3s) → recording (90s) → review transcript → evaluating → result
- Question with hint (expandable)
- Credits display: current balance (`api.billing.getCurrentPlan`)
- Recording phase: mic button, stop button, timer
- Review phase: editable transcript textarea
- Result card: AI score, label, "What worked", "To improve", "Expert insight", "Interview tip", credits used
- Session history: all Q&A pairs with scores in current session
- "Session complete" summary with average score

### What works
- Voice recording → Whisper STT (same `/api/interview/transcribe` endpoint)
- AI evaluation via `api.coach.evaluateAnswer` mutation — real GPT call returning structured feedback
- Credits display (fetched from DB)
- Credits cost per evaluation (5 credits, `CREDITS_COST = 5`)
- Session entries stored in component state and shown in history
- Hint text per question (hardcoded in QUESTION_BANK)

### What is placeholder or not implemented
- Session history is in-memory only — not saved to DB, lost on page refresh
- No overall session report or download
- Credits cost is hardcoded at 5 on the frontend; actual deduction is server-side

### Paid / credit-gated
- Each AI evaluation costs 5 credits (shown in UI)
- Free plan has 500 credits/month — visible via billing

### Issues spotted
- If the user has 0 credits, the mutation will fail server-side but the UI shows no pre-check; the user submits and only sees an error after
- The credits balance shown is from `staleTime: 30_000` — could be 30s out of date after multiple evaluations

---

## /negotiation — NegotiationCoach

### What is on the screen
- Mode toggle: "Coach" (chat) and "Simulator" (role-play negotiation)
- Coach mode: chat messages, input bar with mic button, quick practice scenario chips, voice toggle, audio level visualiser (VAD)
- Simulator mode: offer configuration form (role, company, offered salary, currency, target salary, market rate, benefits) then chat
- Practice scenario chips: 4 presets (salary negotiation, contract rate, partnership deal, vendor pricing)
- Streaming AI responses rendered as formatted Markdown

### What works
- Streaming coach chat via `/api/negotiation/stream`
- Streaming simulation via `/api/negotiation/simulate`
- Voice input: VAD (Voice Activity Detection) via Web Audio API + MediaRecorder → Whisper STT
- TTS for AI responses via `/api/interview/tts`
- Markdown rendering (headings, bold, lists) — custom renderer with XSS escaping
- Practice scenario quick-fill
- Premium check: `useBillingStore` → `isPremium` flag used to show/hide features

### What is placeholder or not implemented
- VAD (voice activity detection) auto-detects speech but the threshold/sensitivity is not user-configurable
- Conversation history is not persisted to DB — lost on page refresh
- No session export or summary

### Paid / credit-gated
- Negotiation coach requires non-free plan (`isPremium` check — `currentPlan.plan !== 'free'`)
- Free users see a lock overlay

### Issues spotted
- `API_VOICE_BASE` and `API_BASE` are both declared at the top of the file pointing to the same `VITE_API_URL` — redundant, but not a bug
- `isPremium` is `null` while billing data loads — during loading, the lock overlay may flash on/off

---

## /profile — ProfilePage

### What is on the screen
- Personal info section: full name, email, phone, summary textarea, "Save" button
- Skills section: existing skill chips with remove button, add new skill input + button
- Experience section: list of work entries (employer, title, dates, description), edit/delete buttons, "Add Experience" button
- Education section: list of education entries, edit/delete buttons, "Add Education" button
- Trainings/Certifications section: list of training entries with credential URL, edit/delete buttons
- CV upload section: drag-and-drop or click, shows parsed data (name, email, skills, summary) with "Import to Profile" button
- "Download CV as PDF" button

### What works
- Full CRUD for personal info, skills, experiences, educations, trainings via tRPC (`api.profile.*`, `useProfileStore`)
- CV upload + AI parsing (`api.cv.upload`) — extracts name, email, skills, summary
- "Import to Profile" (`api.cv.importToProfile`) — copies parsed CV data into the profile DB record
- "Download CV as PDF" (`api.applications.downloadCvPdf`) — generates and downloads a formatted PDF
- All data loaded from and saved to the backend DB
- Error display via `profileStore.error`

### What is placeholder or not implemented
- Profile photo upload — not present (Clerk profile photo is not surfaced here)
- LinkedIn URL / social links — not a field
- The "summary" field is a free-text textarea; no AI-assist to improve it is wired here

### Paid / credit-gated
- CV upload parsing uses AI (likely credits)
- PDF generation likely uses AI/template (credits unclear)

### Issues spotted
- No validation on date fields (startDate, endDate) — user can enter free text, no date picker
- `downloadCvPdf` is accessed as `api.applications.downloadCvPdf` — mixing concerns (cv download under applications router)

---

## /skills — SkillsLab

### What is on the screen
- Section 1: "CV Market Valuation" — locked state shows blurred placeholder cards (£00,000 – £00,000), "Unlock for 25 credits" CTA button; unlocked state shows current and max potential salary ranges with progress bars, AI summary
- Section 2: "Skills Gap" — two-column comparison: "Your Skills" (6 hardcoded skills with proficiency bars) vs "Market Requirements" (6 hardcoded requirement bars), colour-coded (green/orange/red)
- Section 3: "Recommended Courses" — 5 hardcoded course cards (Udemy, Coursera, freeCodeCamp) with placeholder `#` URLs
- Section 4: "Your Profile Skills" — skill bars from actual DB profile, each expandable to show AI-suggested courses (via `api.style.suggestCoursesForSkill`)

### What works
- CV Market Valuation: real tRPC call (`trpcClient.cv.getMarketValue.mutate`) — costs 25 credits, result cached in `localStorage`
- "Recalculate" clears localStorage cache and re-unlocks
- Profile skills loaded from DB (`api.profile.getProfile` via `useProfileStore`)
- Per-skill course suggestions: real `api.style.suggestCoursesForSkill` mutation
- Skill bars use a `pseudoLevel` function to derive display level from skill name hash (deterministic but not real data)

### What is placeholder or not implemented
- Skills Gap section ("Your Skills" and "Market Requirements") uses entirely hardcoded mock data (`MY_SKILLS_MOCK`, `MARKET_REQUIREMENTS_MOCK`) — React, Node.js, TypeScript, AWS, Docker, SQL with fixed percentages. This is NOT the user's actual skills
- Recommended Courses section uses hardcoded `COURSES_MOCK` with `url: '#'` — the links go nowhere
- Skill proficiency bars in the "Your Profile Skills" section use `pseudoLevel(name)` — a deterministic hash of the skill name string, NOT any real self-assessment or AI evaluation
- Market Requirements are generic and not personalised to the user's target role

### Paid / credit-gated
- CV Market Valuation costs 25 credits to unlock (one-time per result, cached)
- Per-skill course suggestions consume credits (via `api.style.suggestCoursesForSkill`)

### Issues spotted
- The Skills Gap section shows completely fake data to users without any indication that it is placeholder. A user could believe React is "80%" and AWS is "30%" of their actual skill level
- Course URLs are all `'#'` — clicking any recommended course goes nowhere. This is a broken UX
- The `pseudoLevel` function produces the same number for the same skill name on every load — not based on any real data
- Two separate "Skills Lab" surfaces exist: `/review` (ReviewQueue.tsx) for document-based skill extraction and `/skills` (SkillsLab.tsx) for the gap/courses view — confusing naming

---

## /salary — UKSalaryCalculator

### What is on the screen
- Tab navigation: PAYE, Contractor (Ltd), Take-Home Comparison
- PAYE tab: gross salary input, pension % input, student loan Plan 2 toggle; output: net annual, net monthly, income tax, NI, pension, student loan, effective tax rate
- Contractor (Ltd) tab: day rate input, days/week, weeks/year, expenses; output: gross revenue, employer NI, corporation tax breakdown (with marginal relief), dividend allowance, dividend tax, take-home
- Comparison tab: side-by-side PAYE vs contractor for the same gross income, with percentage difference

### What works
- All tax calculations are fully client-side, using UK 2024/25 constants (hardcoded)
- PAYE: Income tax with tapered personal allowance above £100k, NI (main + upper), student loan Plan 2, pension deduction
- Corporation tax with marginal relief (£50k–£250k profit range)
- Dividend tax with £500 allowance, basic/higher/additional rates
- Employer NI calculation
- All numbers update in real time as inputs change (`useMemo`)
- Stat cards with highlight for net take-home

### What is placeholder or not implemented
- No server calls — fully self-contained
- Scottish income tax rates not included (England/Wales rates only)
- No salary sacrifice (e.g. cycle to work) beyond pension
- Student Loan Plan 1, Plan 4, Plan 5, and Postgraduate Loan not included
- No "what if" scenario saving

### Paid / credit-gated
- Free to use (per BillingPage comparison matrix, Salary Calculator is a Pro feature)

### Issues spotted
- The corporation tax marginal relief formula divides by `CORP_TAX_UPPER_LIMIT` (250,000) but the standard marginal relief formula should divide by profit — the current implementation may produce slightly off results in the marginal band
- There is no disclaimer that this is for estimation only (though the statutory nature of UK tax implies that)

---

## /style-studio — StyleStudio

### What is on the screen
- Three upload slots: CV, Cover Letter, Skills List (PDF/DOCX/TXT)
- Per-slot: drag-and-drop zone, file preview (filename + 300-char preview), remove button
- "Analyse Writing Style" button (shows after at least one doc uploaded)
- Style analysis results panel: word count, sentence count, tone labels, top action verbs
- AI suggestions panel (after AI analysis): suggestions list, overall score, tone, top verbs
- "Rewrite Summary" button with tone selector (professional / concise / confident / data-driven)
- "Rewrite Skills Section" button with same tone selector
- Rewritten text display
- "Import to Profile" button (imports skills from uploaded doc to DB)
- "Download CV PDF" button
- "Generate from Job" section: doc type toggle (CV/Cover Letter), job title + company inputs + textarea for job description, "Generate" button

### What works
- File upload and parsing via `api.cv.upload` for CV slot; base64 encoding for all slots
- Local style analysis (`analyseTextLocal`): word count, sentence count, tone detection, action verb frequency — runs entirely client-side
- AI analysis (`styleApi.analyzeDocument`): real tRPC mutation returning score, suggestions, tone
- AI rewrite for summary and skills sections (`styleApi.rewriteSection`): real tRPC mutation
- Import to Profile: `api.cv.importToProfile` — saves parsed skills/name/summary to DB
- Download CV PDF: `api.applications.downloadCvPdf`

### What is placeholder or not implemented
- "Generate from Job" section: the UI captures job title, company, description, and a generate button, but the actual generation logic is not visible in the first 200 lines — needs further investigation. The `genJobId` state is set but the mutation for document generation from a job is likely `api.applications.generateDocuments`
- No versioning of rewrites — only the latest rewrite is shown; previous versions are lost

### Paid / credit-gated
- AI analysis and rewrite consume credits (Pro/Autopilot)
- Per billing matrix, Style Studio is a Pro feature

### Issues spotted
- `styleApi` is cast with `(api as any).style` — this bypasses TypeScript safety; if the router is renamed or removed, this breaks at runtime without a compile error
- The local style analysis (`analyseTextLocal`) and AI analysis run independently — the UI shows local results immediately and then AI results later; they may disagree, potentially confusing users

---

## /radar — JobRadar

### What is on the screen
- Header: "Job Radar", subtitle about AI skill trend predictions for next 6–12 months
- Sector/role focus input (optional, AI infers from application history if blank)
- "Analyse" button
- Loading state: spinner + "Analysing your job search history and market signals…"
- Results (after generation):
  - Summary card: sector name, generation date, AI summary paragraph
  - Per-skill accordion cards: skill name, trend badge (Hot now / Rising / Emerging), timeframe, expand for reason + recommended courses with links
- Empty state: illustration + "Predict your next skill move" CTA

### What works
- Real AI generation via `api.radar.generate` tRPC mutation
- Results show skill name, trend classification, timeframe, reason, and courses
- Courses are linked (AI-generated URLs, not hardcoded)
- Sector can be explicitly set or left blank
- "Refresh" re-runs the analysis

### What is placeholder or not implemented
- No result caching — every "Analyse" button click costs credits and regenerates
- No history of past radar runs
- Course links are AI-generated — quality/accuracy not guaranteed

### Paid / credit-gated
- `api.radar.generate` consumes AI credits

### Issues spotted
- If the user has no applications, the note says "AI infers from your applications" but there is nothing to infer from — the backend likely defaults to a generic response without surfacing this to the user
- No cache: clicking "Refresh" immediately after seeing results wastes credits

---

## /auto-apply — AutoApplyPage (actual path: `/autopilot`)

**Note:** The route `/auto-apply` listed in the task maps to the component at `frontend/src/app/autopilot/AutoApplyPage.tsx`.

### What is on the screen
- Push notification toggle (subscribe/unsubscribe)
- Weekly quota bar: used/limit, plan label, reset date, upgrade CTA
- "Pending items" section: jobs waiting to be sent when quota resets
- Stats row: Pending (blue), Applied (green), Failed (red), Total (white)
- "Add to Queue" button → modal form: job title, company, apply URL, apply email (optional), source selector (indeed/reed/gumtree/manual)
- Queue list: each item shows job title, company, source, status badge, fit score, applied/scheduled/created dates, retry/skip buttons
- "Clear Completed" button

### What works
- Queue loaded from DB (`api.autoApply.getQueue`)
- Stats loaded from DB (`api.autoApply.getStats`) — weekly usage, limits, plan
- Add to queue (`api.autoApply.addToQueue`) — saves to DB
- Retry (reset to pending) and Skip (`api.autoApply.updateStatus`)
- Clear completed (`api.autoApply.clearCompleted`)
- Push notification subscribe/unsubscribe via `usePushNotifications` hook
- Weekly limit enforcement (server-side): 3/week free, 15/week Pro, 50/week Autopilot

### What is placeholder or not implemented
- Auto-applying itself is a backend job — the frontend only manages the queue. The actual submission (browser automation / form fill) is a backend Playwright process; its status is reflected in the `status` field
- No visibility into why an item failed — `errorMessage` is in the type but not displayed in the card UI
- Apply email field is accepted but it is unclear if the backend uses it for email-based applications vs URL-based

### Paid / credit-gated
- Weekly limits by plan: Free = 3/week, Pro = 15/week, Autopilot = 50/week
- Auto-apply to matched jobs is an Autopilot-only feature per billing matrix

### Issues spotted
- `errorMessage` field exists on `QueueItem` type but is not rendered in the card — users cannot see why an application failed
- The push notification toggle only appears if `push.isSupported` — on unsupported browsers (e.g., Safari desktop pre-17) it silently disappears with no explanation

---

## /documents — DocumentLab

### What is on the screen
- Page title: "Document Lab"
- Upload zone: drag-and-drop, supports PDF/DOCX/DOC/TXT/JPG/JPEG/PNG, multiple files
- CV Score widget (2 cards): "Current CV score: 68/100" and "Potential after optimisation: 91/100"
- Uploaded documents list: filename, upload date, processed checkmark, delete button
- Session memory note: uploaded documents are available in Interview, Coach, and Negotiation sessions

### What works
- File upload via `api.documents.upload` (base64-encoded text extraction)
- List documents from DB (`api.documents.list`)
- Delete document (`api.documents.delete`)
- Uploads work for multiple files at once (loops through FileList)

### What is placeholder or not implemented
- CV Score "68/100" and "Potential: 91/100" are hardcoded static values — not computed from any uploaded CV
- "AI rewrites, keywords, ATS fixes" caption under the potential score is marketing copy, not a functional feature on this screen
- No document preview or text view after upload
- Document type is hardcoded to `'other'` for all uploads — categorisation not implemented
- Text extraction uses `file.text()` which works for TXT but not for PDF or DOCX — binary formats will produce garbage text

### Paid / credit-gated
- None visible on this screen

### Issues spotted
- `file.text()` is called on all files including PDFs and images — PDFs are binary and `text()` will return garbled content. The backend receives base64-encoded garbage for non-text files. This is a significant bug: PDF/DOCX documents are not actually parsed on the frontend before upload; the backend must handle decoding but the encoding here is wrong (`btoa(unescape(encodeURIComponent(text)))` on binary data)
- CV Score values (68/100 and 91/100) are hardcoded — users uploading their actual CV see the same static numbers regardless of content

---

## /reports — ReportsHub

### What is on the screen
- Page header: "Analytics & Reports"
- Stats row: Total applications, Response rate (%), Interviews count, Avg fit score
- Application Funnel: horizontal bars for Applied → Interview → Offer, with conversion rates between stages; also shows Draft, Prepared, Rejected counts
- 30-Day Activity Timeline: 4 weekly bars (this week, 1–2 wks ago, 2–3 wks ago, 3–4 wks ago)
- Job Source Performance: bar chart of applications by source (Reed, Adzuna, Indeed, Gumtree, LinkedIn, Direct)
- Top Companies: companies by application count
- Export buttons: "CSV" and "JSON" (downloads locally)

### What works
- All data computed from `api.applications.getAll` (real DB data)
- Funnel conversion rates calculated client-side from status counts
- Activity timeline grouped by creation date (4-week rolling window)
- Source detection from job ID prefix and notes field (heuristic)
- CSV and JSON export generate and download locally (no server call)
- Stats row shows real totals and response rate

### What is placeholder or not implemented
- Avg fit score stat card: calculated from `fitScore` field — this is only set after "Generate Documents" is run; most manual entries will show null/0
- Source detection is heuristic (checks `jobId`, `notes`, `jobTitle` for source keywords) — not reliable for manually added applications
- No date range filter
- No chart library — all charts are CSS bar charts with div widths

### Paid / credit-gated
- None — Reports are free to view

### Issues spotted
- Source performance depends on `jobId` containing the source name prefix, which is only true for jobs added through the Jobs Discovery flow; manual entries show as "Direct / Other"
- The funnel only shows Applied/Interview/Offer as meaningful stages; Draft and Prepared are shown below the funnel but not included in conversion rate calculations

---

## /billing — BillingPage

### What is on the screen
- Page title: "Billing & Credits"
- Status message banner (success/error)
- PayPal capture loading state
- Current plan banner: plan name, AI credits balance, renewal date, "Manage" button (opens Stripe portal)
- Payment method toggle: Card/Apple Pay/Google Pay (Stripe), PayPal, Crypto (Coinbase Commerce)
- Plan comparison cards: Free (£0), Pro (£9.99/mo), Autopilot (£24.99/mo)
- Feature comparison table: 14 rows comparing feature availability across plans
- Billing history section: date, plan, amount, status
- Referral link section: copyable referral URL

### What works
- Billing data loaded from DB (`useBillingStore.loadBillingData`)
- Stripe checkout session creation (`trpcClient.billing.createCheckoutSession`) → redirects to Stripe
- PayPal order creation and capture (`createPayPalOrder`, `capturePayPalOrder`)
- Coinbase Commerce links for crypto payments (external links)
- "Manage" button opens Stripe customer portal (`openCustomerPortal`)
- PayPal return URL handling (reads `?paypal=success&token=...` query params)
- Copy referral link to clipboard
- Billing history displayed

### What is placeholder or not implemented
- Crypto payment (Coinbase) is an external link with a 10-minute manual activation note — not automated
- Referral link uses `userId.slice(0, 8)` as the code — no referral tracking system is visible in the frontend
- Billing history is loaded but only shows existing records; no invoice download

### Paid / credit-gated
- This is the billing screen itself

### Issues spotted
- `STRIPE_PRICE_IDS` reads from `VITE_STRIPE_PRO_PRICE_ID` and `VITE_STRIPE_AUTOPILOT_PRICE_ID` env vars — if these are empty (no `.env.local`), the upgrade button silently shows "This plan is not available right now" error without hinting at a config problem
- PayPal `approveUrl` is navigated to via `window.location.href = new URL(approveUrl).toString()` — if `approveUrl` contains a relative path or invalid URL, `new URL()` will throw an uncaught exception

---

## /settings — SettingsHub

### What is on the screen
- Page title: "Settings"
- Tab navigation: Overview, Privacy & Consents, Accessibility, Email & SMTP, Telegram, Job Sources, System Readiness
- Overview tab: quick links to Security and Billing, email notifications toggle
- Privacy & Consents tab: toggles for LinkedIn/Facebook/Instagram analysis, SMTP email automation, IMAP tracking, IMAP offer emails, auto-apply, push notifications — all with brief descriptions
- Accessibility tab: theme picker (Light/Dark — 2 themes), Focus Mode toggle (hide sidebar), Reduced Motion info
- Email & SMTP tab: provider selector (Gmail, Outlook, Yahoo, Custom SMTP), username/password/from-name fields, Save & Test button, Remove button, connection status badge
- Telegram tab: setup instructions for @MultivoHubBot, Chat ID input, 3 notification toggles (apply/reply/interview), Verify & Save, Send Test, Disconnect buttons, status badge
- Job Sources tab: (loaded from `useSettingsStore.jobSources`)
- System Readiness tab: 4 progress bars (Profile, Email Integration, CV Upload, Job Sources — Job Sources is hardcoded to 60%)

### What works
- Email SMTP settings: save, test connection, remove (`api.emailSettings.*`)
- Telegram settings: save, verify Chat ID, send test message, disconnect (`api.telegram.*`)
- Email notifications toggle stored via `useSettingsStore`
- Theme switching: Light/Dark via `useThemeStore` (persisted)
- Focus mode toggle (hides sidebar) via `useThemeStore`
- Privacy consents saved to `localStorage` (`mvh-consents` key)
- System Readiness reads from DB (profile, email settings, latest CV)

### What is placeholder or not implemented
- Privacy consent toggles save only to `localStorage` — not synced to the backend
- Job Sources tab content not visible in audited portion (relies on `useSettingsStore.jobSources`)
- System Readiness "Job Sources" bar is hardcoded to 60% — not computed from real data
- No option to delete account from Settings (FAQ says to contact support)

### Paid / credit-gated
- Telegram notifications are an Autopilot-only feature per billing matrix

### Issues spotted
- Privacy consents in Settings (`mvh-consents` localStorage key) and on Dashboard (`mvh-profile` key, `linkedinConsent` etc.) are separate — they will not stay in sync
- SMTP password field: a user who previously saved a password and does not re-enter it when editing other fields (e.g., fromName) will send an empty `smtpPass` — the backend must handle this "keep existing password" case correctly or the password will be overwritten with null

---

## /security — SecurityPage

### What is on the screen
- Page title: "Security & Passkeys"
- Passkeys section: list of registered passkeys (name, last used, active/inactive badge), "Add Passkey" button, "Remove" button per key
- Two-Factor Authentication section: current 2FA status (enabled/disabled), setup flow (idle → QR code → verify code → backup codes), "Enable 2FA" / "Disable 2FA" buttons
- Active Sessions section: list of active Clerk sessions (device type icon, device name, last active time), "Revoke" button per session
- Error message display

### What works
- Passkey list loaded from `useSecurityStore` (backed by Clerk API)
- Remove passkey via `removePasskey` store action
- TOTP setup: `user.createTOTP()` → generates QR code (via `QRCode.toDataURL`) → `user.verifyTOTP()` → shows backup codes
- Disable TOTP: `user.disableTOTP()`
- Copy TOTP secret to clipboard
- Show/hide TOTP secret toggle
- Active sessions list and per-session revoke via `useSecurityStore.revokeSession`

### What is placeholder or not implemented
- "Add Passkey" button is rendered but has no `onClick` handler — it does nothing when clicked
- Passkey addition flow is not implemented

### Paid / credit-gated
- None — security features are available to all plans

### Issues spotted
- "Add Passkey" button is a non-functional dead button — `<Button variant="outline" size="sm">Add Passkey</Button>` has no handler. This is a broken feature
- Backup codes are shown once during setup and cannot be retrieved again — no warning that they should be saved is prominent enough (text is in the card content, not a visible alert)

---

## /legal — LegalHub

### What is on the screen
- Page header with Scale icon
- 5 accordion sections:
  1. Privacy & GDPR — 6 Q&A items (right to erasure, data portability, what recruiters can ask, lawful basis, retention, SAR)
  2. Employment Rights — 6 Q&A items (NMW 2024/25, notice periods, IR35, zero-hours, worker categories, SSP/holiday pay)
  3. Recruitment Regulations — 5 Q&A items (conduct regulations, recruiter disclosure obligations, background check rules, 14-week opt-out, agency worker regulations)
  4. Application Checklist — 5 Q&A items (right to work, what employers cannot ask, references, salary history, offer letter timing)
  5. Useful Resources — GOV.UK links and official resources (rendered as Q&A)
- External link icon in header

### What works
- Accordion expand/collapse for each item
- All content is static (hardcoded in the file) — no API calls needed
- Covers real UK law references (UK GDPR, Employment Rights Act 1996, Equality Act 2010, Conduct Regulations 2003, etc.)

### What is placeholder or not implemented
- None — content is informational and fully present

### Paid / credit-gated
- Free to all users

### Issues spotted
- The "Useful Resources" section is rendered as Q&A items but looks like plain links — the content string begins with "Employment status checker: GOV.UK > Employment status" and is truncated; the accordion answer likely contains broken formatting (text referencing GOV.UK without actual hyperlinks in the accordion answer)
- Content accuracy: NMW rates (£11.44) and Student Loan Plan 2 threshold (£27,295) are hardcoded for 2024/25 — these will become outdated without a content update

---

## /faq — FAQPage

### What is on the screen
- Page header: "FAQ" with HelpCircle icon
- Category filter pills: All, Getting Started, Jobs & Applications, AI Features, Privacy & Security, Billing & Plans, Technical
- Accordion FAQ list — 17 questions total across 6 categories

### What works
- Filter by category (client-side)
- Accordion expand/collapse per item
- All content is static (hardcoded)

### What is placeholder or not implemented
- Some FAQ answers reference features with outdated names ("CV Studio" for what is now `/profile` or `/documents`): the FAQ says "CV Studio (Profile page)" but the actual route is `/profile`, and the document upload is at `/documents`
- No search functionality

### Paid / credit-gated
- Free to all users

### Issues spotted
- FAQ answer for "What file format does CV Studio accept?" says "PDF files only" but the actual Document Lab accepts PDF, DOCX, DOC, TXT, JPG, JPEG, PNG — the answer is outdated or refers to a different screen
- Several answers describe features that may not match the current implementation (e.g., "cryptographically signed" coaching reports — not verified in source)

---

## Summary: Mock / Placeholder Items Requiring Attention

| Screen | Item | Type |
|---|---|---|
| Dashboard | All form data saved to localStorage only | Missing backend persistence |
| Dashboard | Career Roadmap card | Static placeholder |
| Dashboard | Social consent checkboxes | localStorage only, no backend |
| DocumentLab | CV Score 68/100 and 91/100 | Hardcoded fake values |
| DocumentLab | file.text() on PDF/DOCX | Bug — produces garbled text |
| SkillsLab | Skills Gap chart (Your Skills + Market Requirements) | Hardcoded mock data |
| SkillsLab | Recommended Courses with `url: '#'` | Broken links |
| SkillsLab | Skill proficiency bars via pseudoLevel() | Hash-based fake values |
| SecurityPage | "Add Passkey" button | Dead button, no handler |
| Settings | Privacy consent toggles | localStorage only |
| Settings | Job Sources readiness bar (60%) | Hardcoded |
| Warmup | Streak tracking | localStorage only, not cross-device |
| Coach | Session history | In-memory only, not persisted |
| Negotiation | Conversation history | In-memory only, not persisted |
| FAQ | "CV Studio accepts PDF only" | Outdated — other formats supported |
| Legal | GOV.UK resource links | Text-only, no actual hyperlinks in answers |
