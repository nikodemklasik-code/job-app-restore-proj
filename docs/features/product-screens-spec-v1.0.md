# Product Screens Spec v1.0 (Overwritten)

**Related (agent-ready digest, same 19 screens, Title Case):** [`19-screens-for-users-and-agents.md`](./19-screens-for-users-and-agents.md) — import z `~/Downloads/19_Screens_For_Users_And_Agents.md` (2026-04-16). Ten plik (`product-screens-spec-v1.0.md`) zostaje kanonicznym, bogatszym opisem produktu; tamten format jest wygodny pod review agentów i checklisty implementacji.

## Product Intent

This is one product, not unrelated modules in one shell.

Every screen must provide:
- clear purpose
- clear emotional effect
- clear next action
- visual and naming consistency (Title Case)

## 1. Dashboard

Purpose: daily orientation and prioritization.

Main Sections:
- Today’s Overview
- Applications Snapshot
- Jobs Snapshot
- Radar Signals
- Next Actions
- Recent Activity
- Growth Focus

Visible Content:
- new listings from Job Radar
- applications needing follow-up
- active application statuses
- quick entry to Coach, Interview, Assistant, Case Practice
- growth signals (what strengthens, what needs attention)
- shortcut to user roadmap

Primary CTA:
- Open Jobs
- Open Applications
- Open Job Radar
- Continue In Coach
- Open Case Practice

Emotional Effect: orientation, control, movement, priority.

## 2. Profile

Purpose: professional identity and growth direction.

Main Sections:
- Personal Information
- Professional Summary
- Skills
- Experience
- Education
- Courses And Certificates
- Languages
- Hobbies And Interests
- Auto-Apply Threshold
- Work Values
- Growth Plan
- Roadmap

### Auto-Apply Threshold (System Setting)

Fields:
- Auto-Apply Enabled
- Minimum Match Threshold
- Require Manual Review For High-Risk Employers
- Require Salary Visibility
- Require Value Alignment
- Exclude Low-Clarity Listings

Affects:
- Jobs
- Job Radar
- Applications
- Employer Validation
- Auto-Apply Logic

### Work Values

Subsections:
- Must-Have Values
- Preferred Values
- Red Flags I Will Not Accept

Feeds:
- employer validation
- Job Radar
- auto-apply
- manual review suggestions

### Growth Plan

Required fields:
- Target Role
- Target Seniority
- Target Salary Range
- Priority Skills To Build
- Skills To Verify
- Documents To Improve
- Practice Areas
- Next Strategic Step

### Roadmap

Required blocks:
- Current Position
- Next Milestone
- Medium-Term Goal
- Long-Term Direction
- Suggested Actions
- Blocked Areas
- High-Impact Improvements

Emotional Effect: "I have direction, not only static data."

## 3. Jobs

Purpose: decision screen for high-value opportunities.

Main Sections:
- Search
- Filters
- Results
- Manual Job Entry
- Suggested Opportunities
- Saved Opportunities

Each Opportunity Card shows:
- Role Title
- Employer
- Location
- Work Mode
- Salary
- Skills Match
- Value Alignment
- Risk Level
- Why This Match
- Auto-Apply Eligible
- Manual Review Recommended

CTA:
- Open Original Listing
- Save As Draft
- Queue Auto-Apply
- Why This Match
- Review Employer

## 4. Applications

Purpose: active lifecycle management, not passive storage.

Main Sections:
- Applications List
- Email Send Panel
- Lifecycle History
- Prepared But Not Sent
- Follow-Up Queue

Lifecycle:
- Draft
- Prepared
- Sent
- Waiting For Response
- Follow-Up Sent
- Interview
- Rejected
- Accepted

CTA:
- Mark Prepared
- Send Application Email
- Mark Follow-Up Sent
- Move To Interview
- Mark Rejected
- Mark Accepted
- Mark Rejection Email Request

## 5. Applications Review

Purpose: post-send interpretation and next-step guidance.

Main Sections:
- Days Without Response
- Response Tracking
- Follow-Up Tracking
- Employer Reply
- Listing Status
- Lifecycle History
- Action Recommendation

CTA:
- Send Follow-Up
- Mark As No Response
- Open Employer Reply
- Move To Interview
- Close Application

## 6. Documents Upload

Purpose: convert raw documents into usable profile and decision data.

Main Sections:
- Upload Area
- Uploaded Documents
- Extracted Fields Preview
- Import To Profile

Document Types:
- CV
- Cover Letter
- Diploma
- Certificate
- Course Document
- Portfolio
- Reference
- Supporting Documents

Reference extraction should attempt:
- reference type
- person or organization
- relationship
- key strengths mentioned
- date

CTA:
- Preview Extracted Fields
- Re-Run Extraction
- Import To Profile
- Delete

## 7. Style Studio

Purpose: premium-quality document workshop.

Main Sections:
- Target Job
- Generation Mode
- Template Picker
- Generated Output
- Matched Skills
- Download

Must include:
- 5 CV Templates
- 5 Cover Letter Templates
- Employer Email Templates
- Follow-Up Email Templates
- Feedback Request Email Templates

CTA:
- Generate
- Download
- Switch Template
- Use Job Context
- Use Profile Data

## 8. AI Assistant

Purpose: fast, clean, basic support and routing.

Main Sections:
- Conversation
- Relevant Context
- Suggested Actions
- Next Best Step

CTA:
- Open Coach
- Open Interview
- Open Negotiation
- Open Applications Review
- Try A Similar Case

Rule: AI Assistant is not a replacement for deep modules.

## 9. AI Analysis

Purpose: interpretation layer, not second assistant chat.

Main Sections:
- Analysis Summary
- Strengths
- Gaps
- Recommendations
- Suggested Rewrite
- Signals Detected

Analyses:
- documents
- answers
- fit
- communication quality
- framing strength

CTA:
- Apply Suggestion
- Rewrite
- Open Related Module

## 10. Interview

Purpose: realistic practice, not quiz mechanics.

Main Sections:
- Interview Setup
- Live Practice
- Answer Review
- Session Summary

CTA:
- Start Interview
- Next Question
- Review Answer
- Finish Session

## 11. Coach / Trainer

Purpose: deeper guided growth system.

Access Structure:
- 10 Sections Total
- 7 Active
- 3 Coming Soon

Commercial Logic:
- all sections visible
- active sections available
- harder sections cost more credits
- easier sections cost fewer credits
- Coming Soon visible but locked

Main Sections:
- Current Challenge
- Coach Guidance
- Reframing
- Action Plan
- Training Map
- Difficulty Levels

Statuses:
- Available
- Costs Credits
- Coming Soon
- Difficulty Level

CTA:
- Start Session
- Unlock With Credits
- View Difficulty
- See What Is Included

## 12. Daily Warmup

Purpose: light, repeatable practice ritual.

Durations:
- 15 Seconds (Free)
- 30 Seconds (Paid/Credits)
- 45 Seconds (Higher Cost)
- 60 Seconds (Highest Short-Form Tier)

Main Sections:
- Choose Duration
- Today’s Warmup
- Quick Practice
- Your Pace
- Progress

CTA:
- Start 15 Seconds
- Start 30 Seconds
- Start 45 Seconds
- Start 60 Seconds

## 13. Negotiation

Purpose: language for boundaries, offers, and positioning.

Main Sections:
- Negotiation Context
- Suggested Positioning
- Reply Drafts
- Risk Signals
- Boundary Support
- Offer Framing

CTA:
- Generate Reply
- Reframe My Position
- Prepare Counter
- Practice Negotiation

## 14. Job Radar

Purpose: live opportunity intelligence layer.

Views:
- Overview
- Opportunities
- Watchlist
- Employers
- Signals
- Sources
- Alerts

Main Screen Sections:
- Radar Hero Header
- Radar Summary Strip
- Search And Filters
- Opportunity Grid
- Insight Rail
- Employer Watchlist
- Alerts

Each Opportunity Card shows:
- Fit Signal
- Risk Signal
- Freshness
- Salary
- Why This Is On Your Radar
- Watchlist State

CTA:
- Open Listing
- Why This Match
- Save Lead
- Add To Watchlist
- Open In Applications
- Review Employer
- Hide

## 15. Skill Lab

Purpose: market value and positioning, not skill storage.

Main Sections:
- Skill Overview
- Verification
- Skill Value
- Salary Impact
- CV Value Signals
- Market Value Signals
- High-Value Skills
- Underused Skills
- Proof And Evidence
- Skills That Increase Your Position
- Skills That Need Stronger Proof
- What Strengthens Your CV
- What Weakens Your Position

Required Skills/Courses Links:
- Related Skills
- Courses Supporting This Skill
- This Course Strengthens
- Learning Evidence
- Still Needs Practice
- Still Needs Verification

## 16. Community Centre

Purpose: active social layer, not decorative extra.

Main Sections:
- Community Feed
- Become A Patron
- Refer A Friend
- Events And Sessions
- Featured Members

CTA:
- Become A Patron
- Refer A Friend
- Join Event
- Open Community Feed

## 17. Settings

Purpose: real center of preferences and consent.

Main Sections:
- Account Settings
- Notifications
- Email Settings
- Social Consent
- Privacy
- AI Settings
- Integrations
- Case Study Preferences

Social Consent includes:
- community visibility
- referral participation
- shared session discoverability
- social contact permissions

Email Settings includes:
- marketing email toggle
- product update email toggle
- follow-up reminders
- job alert emails
- assistant summary emails

Case Study Preferences includes:
- allow anonymized case use
- allow product research participation
- allow success story requests
- allow future outreach for interviews/testing

CTA:
- Save Settings
- Update Preferences
- Manage Consent

## 18. Billing

Purpose: transparent plans, credits, and usage clarity.

Main Sections:
- Buy Credits
- Current Plan
- Billing Status
- Invoices
- Plan Options
- Credits Balance
- Credit Usage

Credit-linked areas:
- Coach / Trainer
- Daily Warmup
- Community Centre
- future paid interactions

CTA:
- Upgrade Plan
- Manage Billing
- View Invoice
- Buy Credits

## 19. Auth

Purpose: low-friction secure access.

Main Sections:
- Sign In
- Sign Up
- Reset Password
- Two-Factor Authentication

CTA:
- Sign In
- Continue With Google
- Send Reset Link
- Verify Code

## 20. Case Practice

Purpose: high-pressure professional reality practice.

Main Sections:
- Case Inbox
- Case Detail
- Role Brief
- Preparation
- Live Response
- Pushback Round
- Joint Call Prompt
- Verdict
- Reflection

Modes:
- Play Solo
- Join Joint Call
- Open Private Session
- Prepare For Tomorrow

Key Categories:
- Explain What Happened
- Defend Your Decision
- Mediation
- Boundary Setting
- Fair Treatment Concern
- Reasonable Adjustments
- Speak Under Time Pressure
- Prepare For Tomorrow

## Global Rules

### Title Case Everywhere
- Screen names, sections, CTA, statuses, badges.

### One Product, Not Many Projects
- Every screen must feel like one system.

### Attractive, Not Administrative
- no admin-panel feel
- no database-dump layout
- no flat dead dashboard patterns

### Emotional Clarity
Each screen must answer:
- what user should feel
- what user should understand
- what user should do next

## Product Promise

This is not only a CV-sending app.  
It is a system for:
- regaining clarity
- building professional position
- choosing stronger opportunities
- strengthening career confidence and leverage
