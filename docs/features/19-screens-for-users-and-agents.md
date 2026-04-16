# 19 Screens For Users And Agents

**Repo note:** Kanoniczny, rozszerzony opis ekranów: [`product-screens-spec-v1.0.md`](./product-screens-spec-v1.0.md). Ten plik jest importem agent-ready z `~/Downloads/19_Screens_For_Users_And_Agents.md` (2026-04-16).

This document consolidates the 19 core product screens in a user- and agent-ready format.
It is intended as a practical source of truth for implementation, review, and product alignment.
All screen names, section names, CTA labels, and statuses should remain in **Title Case**.

---

## 1. Dashboard

**Purpose**  
The daily control centre. It should immediately show what changed, what matters now, and what the next best actions are.

**Emotional Effect**  
The user should feel oriented, calmer, and in motion.

**Main Sections**
- **Today’s Overview**
- **Applications Snapshot**
- **Jobs Snapshot**
- **Radar Signals**
- **Next Actions**
- **Recent Activity**
- **Growth Focus**

**Key Components**
- `PageHeader`
- `MetricCard`
- `ActivityList`
- `ActionCard`
- `SignalBadge`
- `ProgressBlock`

**Primary CTA**
- **Open Jobs**
- **Open Applications**
- **Open Job Radar**

**What Must Never Happen**
- no dead dashboard feeling
- no random cards without priority
- no admin-panel look

---

## 2. Profile

**Purpose**  
The source of truth for the user’s professional identity and future direction.

**Emotional Effect**  
The user should feel: “This is who I am professionally, and this is where I am going.”

**Main Sections**
- **Personal Information**
- **Professional Summary**
- **Skills**
- **Experience**
- **Education**
- **Courses And Certificates**
- **Languages**
- **Hobbies And Interests**
- **Auto-Apply Threshold**
- **Work Values**
- **Growth Plan**
- **Roadmap**

**Key Components**
- `PageHeader`
- `SectionHeader`
- `FormField`
- `TagList`
- `MetricCard`
- `TimelineBlock`
- `ProgressBlock`

**Primary CTA**
- **Save Profile**
- **Update Threshold**
- **Update Values**

**What Must Never Happen**
- no plain form-wall experience
- no disconnect between profile and growth direction
- no missing values / threshold logic

---

## 3. Jobs

**Purpose**  
A decision screen for job opportunities, not just a search page.

**Emotional Effect**  
The user should feel: “I can see which opportunities deserve my time.”

**Main Sections**
- **Search**
- **Filters**
- **Results**
- **Manual Job Entry**
- **Suggested Opportunities**
- **Saved Opportunities**

**Key Components**
- `PageHeader`
- `FilterBar`
- `OpportunityCard`
- `FitBadge`
- `RiskBadge`
- `InsightBlock`

**Primary CTA**
- **Open Original Listing**
- **Save As Draft**
- **Queue Auto-Apply**
- **Review Employer**

**What Must Never Happen**
- no flat job-board feel
- no listings without fit / risk explanation
- no blind auto-apply without threshold logic

---

## 4. Applications

**Purpose**  
The live operating screen for all applications and their lifecycle.

**Emotional Effect**  
The user should feel: “My applications are moving through a clear process.”

**Main Sections**
- **Applications List**
- **Email Send Panel**
- **Lifecycle History**
- **Prepared But Not Sent**
- **Follow-Up Queue**

**Key Components**
- `ApplicationCard`
- `StatusBadge`
- `TimelineBlock`
- `StickyActionBar`
- `Panel`

**Primary CTA**
- **Mark Prepared**
- **Send Application Email**
- **Mark Follow-Up Sent**
- **Move To Interview**

**What Must Never Happen**
- no confusing status progression
- no hidden next action
- no static archive feeling

---

## 5. Applications Review

**Purpose**  
The analysis layer after sending applications.

**Emotional Effect**  
The user should feel: “Even silence and delay can be interpreted and acted on.”

**Main Sections**
- **Days Without Response**
- **Response Tracking**
- **Follow-Up Tracking**
- **Employer Reply**
- **Listing Status**
- **Lifecycle History**
- **Action Recommendation**

**Key Components**
- `ReviewCard`
- `MetricCard`
- `StatusBadge`
- `InsightBlock`
- `ActionCard`

**Primary CTA**
- **Send Follow-Up**
- **Open Employer Reply**
- **Move To Interview**
- **Close Application**

**What Must Never Happen**
- no passive waiting-room feeling
- no status without interpretation
- no duplicated logic from Applications

---

## 6. Documents Upload

**Purpose**  
The intake layer for raw user documents.

**Emotional Effect**  
The user should feel: “My documents are being turned into useful structured data.”

**Main Sections**
- **Upload Area**
- **Uploaded Documents**
- **Extracted Fields Preview**
- **Import To Profile**

**Supported Document Types**
- **CV**
- **Cover Letter**
- **Diploma**
- **Certificate**
- **Course Document**
- **Portfolio**
- **Reference**
- **Supporting Documents**

**Key Components**
- `UploadDropzone`
- `DocumentCard`
- `ExtractionPreview`
- `PrimaryButton`

**Primary CTA**
- **Preview Extracted Fields**
- **Re-Run Extraction**
- **Import To Profile**

**What Must Never Happen**
- no generic uploader feel
- no “Reference” hidden inside “Other”
- no weak extraction preview

---

## 7. Style Studio

**Purpose**  
The premium workshop for generating polished documents and emails.

**Emotional Effect**  
The user should feel: “I am producing something professional and ready to send.”

**Main Sections**
- **Target Job**
- **Generation Mode**
- **Template Picker**
- **Generated Output**
- **Matched Skills**
- **Download**

**Required Assets**
- **5 CV Templates**
- **5 Cover Letter Templates**
- **Employer Email Templates**
- **Follow-Up Email Templates**
- **Feedback Request Email Templates**

**Key Components**
- `TemplateCard`
- `PreviewPanel`
- `TagList`
- `SplitLayout`
- `StickyActionBar`

**Primary CTA**
- **Generate**
- **Download**
- **Switch Template**

**What Must Never Happen**
- no cheap document-generator feel
- no mixing with document upload
- no weak preview experience

---

## 8. AI Assistant

**Purpose**  
The primary basic assistant support layer for fast, useful, practical help.

**Emotional Effect**  
The user should feel: “I can get help quickly without entering chaos.”

**Main Sections**
- **Conversation**
- **Relevant Context**
- **Suggested Actions**
- **Next Best Step**

**Key Components**
- `ChatPanel`
- `ContextCard`
- `ActionCard`
- `InsightBlock`
- `StickyActionBar`

**Primary CTA**
- **Open Coach**
- **Open Interview**
- **Open Negotiation**
- **Open Applications Review**

**What Must Never Happen**
- no generic chatbot look
- no duplication of deeper modules
- no weak routing logic

---

## 9. AI Analysis

**Implementation note (repo):** UI shell with demo charts lives at **`/ai-analysis`** (`frontend/src/app/analysis/AiAnalysisPage.tsx`). Real data and evaluator logic require backend + profile contracts.

**Purpose**  
The interpretation layer for strengths, gaps, recommendations, and rewrite opportunities.

**Emotional Effect**  
The user should feel: “I can clearly see what works and what weakens my position.”

**Main Sections**
- **Analysis Summary**
- **Strengths**
- **Gaps**
- **Recommendations**
- **Suggested Rewrite**
- **Signals Detected**

**Key Components**
- `InsightBlock`
- `VerdictPanel`
- `SignalBadge`
- `RewriteCard`

**Primary CTA**
- **Apply Suggestion**
- **Rewrite**
- **Open Related Module**

**What Must Never Happen**
- no duplication of AI Assistant
- no shallow “good / bad” analysis
- no unclear next step

---

## 10. Interview

**Purpose**  
The live practice environment for interview preparation.

**Emotional Effect**  
The user should feel: “I am rehearsing real pressure, not reading theory.”

**Main Sections**
- **Interview Setup**
- **Live Practice**
- **Answer Review**
- **Session Summary**

**Key Components**
- `QuestionCard`
- `TimerBlock`
- `AnswerPanel`
- `ReviewPanel`
- `ProgressBlock`

**Primary CTA**
- **Start Interview**
- **Next Question**
- **Review Answer**
- **Finish Session**

**What Must Never Happen**
- no quiz feel
- no flat question list
- no weak sense of live practice

---

## 11. Coach / Trainer

**Purpose**  
The deeper guided growth module for narrative, confidence, and communication development.

**Emotional Effect**  
The user should feel: “I am building myself strategically, not just fixing a sentence.”

**Structure**
- **10 Sections Total**
- **7 Active**
- **3 Coming Soon**

**Commercial Logic**
- all sections visible
- active sections usable now
- higher difficulty = more credits
- easier sections = fewer credits

**Main Sections**
- **Current Challenge**
- **Coach Guidance**
- **Reframing**
- **Action Plan**
- **Training Map**
- **Difficulty Levels**

**Key Components**
- `TrainingMap`
- `SectionCard`
- `DifficultyBadge`
- `CreditGateCard`
- `ActionPlanPanel`

**Primary CTA**
- **Start Session**
- **Unlock With Credits**
- **View Difficulty**

**What Must Never Happen**
- no dead list of sessions
- no confusion between active and coming soon
- no generic coaching chat feel

---

## 12. Daily Warmup

**Purpose**  
The lightweight daily practice ritual.

**Emotional Effect**  
The user should feel: “I can do something useful quickly and keep momentum.”

**Durations**
- **15 Seconds** = Free
- **30 Seconds** = Paid
- **45 Seconds** = Higher Cost
- **60 Seconds** = Highest Cost

**Main Sections**
- **Choose Duration**
- **Today’s Warmup**
- **Quick Practice**
- **Your Pace**
- **Progress**

**Key Components**
- `DurationCard`
- `TimerBlock`
- `QuestionCard`
- `ProgressBlock`

**Primary CTA**
- **Start 15 Seconds**
- **Start 30 Seconds**
- **Start 45 Seconds**
- **Start 60 Seconds**

**What Must Never Happen**
- no heavy academic feel
- no unclear free vs paid structure
- no confusing time logic

---

## 13. Negotiation

**Purpose**  
The boundary, value, and offer-handling module.

**Emotional Effect**  
The user should feel: “I do not only react. I can set terms.”

**Main Sections**
- **Negotiation Context**
- **Suggested Positioning**
- **Reply Drafts**
- **Risk Signals**
- **Boundary Support**
- **Offer Framing**

**Key Components**
- `ReplyCard`
- `InsightBlock`
- `BoundaryPanel`
- `RiskBadge`

**Primary CTA**
- **Generate Reply**
- **Reframe My Position**
- **Prepare Counter**
- **Practice Negotiation**

**What Must Never Happen**
- no salary-calculator feel
- no weak boundary language
- no duplication of Coach

---

## 14. Job Radar

**Purpose**  
The live market intelligence and opportunity monitoring module.

**Emotional Effect**  
The user should feel: “The market is moving, and I can see what matters before I drown in noise.”

**Views**
- **Overview**
- **Opportunities**
- **Watchlist**
- **Employers**
- **Signals**
- **Sources**
- **Alerts**

**Main Sections**
- **Radar Hero Header**
- **Radar Summary Strip**
- **Search And Filters**
- **Opportunity Grid**
- **Insight Rail**
- **Employer Watchlist**
- **Alerts**

**Key Components**
- `RadarHeroHeader`
- `MetricCard`
- `OpportunityCard`
- `EmployerCard`
- `SignalBadge`
- `WatchlistPanel`
- `InsightBlock`

**Primary CTA**
- **Open Listing**
- **Why This Match**
- **Save Lead**
- **Add To Watchlist**
- **Open In Applications**
- **Review Employer**

**What Must Never Happen**
- no admin-table look
- no dead scrape-feed feel
- no weak signal hierarchy

---

## 15. Skill Lab

**Purpose**  
The module for skill value, proof, salary relevance, and CV strength.

**Emotional Effect**  
The user should feel: “I can see not only what I know, but what it is worth.”

**Main Sections**
- **Skill Overview**
- **Verification**
- **Skill Value**
- **Salary Impact**
- **CV Value Signals**
- **Market Value Signals**
- **High-Value Skills**
- **Underused Skills**
- **Proof And Evidence**
- **Skills That Increase Your Position**
- **Skills That Need Stronger Proof**
- **What Strengthens Your CV**
- **What Weakens Your Position**

**Skills And Courses Relationship**
- **Related Skills**
- **Courses Supporting This Skill**
- **This Course Strengthens**
- **Learning Evidence**
- **Still Needs Practice**
- **Still Needs Verification**

**Key Components**
- `SkillCard`
- `SignalBadge`
- `MetricCard`
- `EvidencePanel`
- `ValueInsightBlock`

**Primary CTA**
- **Verify Skill**
- **Add Evidence**
- **Review Skill Value**

**What Must Never Happen**
- no dead skill list
- no hiding CV value signals
- no separation between skills and course evidence

---

## 16. Community Centre

**Purpose**  
The social and engagement layer of the product.

**Emotional Effect**  
The user should feel: “This is a living product with people, movement, and belonging.”

**Main Sections**
- **Community Feed**
- **Become A Patron**
- **Refer A Friend**
- **Buy Credits**
- **Events And Sessions**
- **Featured Members**

**Key Components**
- `FeedCard`
- `PatronCard`
- `ReferralCard`
- `CreditsCard`
- `EventCard`

**Primary CTA**
- **Become A Patron**
- **Refer A Friend**
- **Buy Credits**
- **Join Event**
- **Open Community Feed**

**What Must Never Happen**
- no side-card afterthought feeling
- no corporate coldness
- no hidden credit flow

---

## 17. Settings

**Purpose**  
The full control centre for permissions, preferences, notifications, and consent.

**Emotional Effect**  
The user should feel: “I control how the product works around me.”

**Main Sections**
- **Account Settings**
- **Notifications**
- **Email Settings**
- **Social Consent**
- **Privacy**
- **AI Settings**
- **Integrations**
- **Case Study Preferences**

**Key Components**
- `ToggleField`
- `FormField`
- `ConsentPanel`
- `EmailSettingsCard`
- `PrivacyPanel`

**Primary CTA**
- **Save Settings**
- **Update Preferences**
- **Manage Consent**

**What Must Never Happen**
- no settings junk drawer
- no missing email / consent logic
- no unclear data-control experience

---

## 18. Billing

**Purpose**  
The subscription, invoice, and credits management screen.

**Emotional Effect**  
The user should feel: “I understand what I have, what it costs, and what I can use.”

**Main Sections**
- **Current Plan**
- **Billing Status**
- **Invoices**
- **Plan Options**
- **Credits Balance**
- **Credit Usage**

**Key Components**
- `PlanCard`
- `InvoiceCard`
- `CreditsCard`
- `MetricCard`

**Primary CTA**
- **Upgrade Plan**
- **Manage Billing**
- **View Invoice**
- **Buy Credits**

**What Must Never Happen**
- no confusion about credits
- no hidden billing structure
- no scary / cluttered billing UX

---

## 19. Auth

**Purpose**  
The entry gate for fast, clean access to the product.

**Emotional Effect**  
The user should feel: “I can get in quickly without friction or confusion.”

**Main Sections**
- **Sign In**
- **Sign Up**
- **Reset Password**
- **Two-Factor Authentication**

**Key Components**
- `AuthCard`
- `FormField`
- `PrimaryButton`
- `SecondaryButton`

**Primary CTA**
- **Sign In**
- **Continue With Google**
- **Send Reset Link**
- **Verify Code**

**What Must Never Happen**
- no heavy or outdated auth experience
- no confusing multi-step flow
- no clutter

---

# Global Product Rules

## One Product, Not Many Projects
Every screen must feel like part of a single product system.

## Title Case Everywhere
All screen names, sections, CTA, labels, badges, and statuses must remain in Title Case.

## Attractive, Not Administrative
The product must never default into:
- admin-panel energy
- database-dump layouts
- dead grey dashboards
- low-hierarchy clutter

## Every Screen Must Answer
- what the user should feel here
- what the user should understand here
- what the user should do next here

## Product Promise
This is not just a job application app.  
It is a system for regaining clarity, building position, strengthening value, and moving professionally with more confidence and control.
