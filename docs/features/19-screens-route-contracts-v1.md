# 19 Screens — Route Contracts v1

This is a minimal route-to-contract reference for RFQ and QC.

| Screen | Route | FE Entry | Primary BE Owner | Minimal Contract |
|---|---|---|---|---|
| Dashboard | /dashboard | frontend/src/app/dashboard/DashboardPage.tsx | profile + billing + applications + jobs aggregate | DashboardSnapshot |
| Profile | /profile | frontend/src/app/profile/ProfilePage.tsx | backend/src/trpc/routers/profile.router.ts | ProfileDto + Completeness |
| Jobs | /jobs | frontend/src/app/jobs/JobsDiscovery.tsx | backend/src/trpc/routers/jobs.router.ts | JobListItem[] |
| Applications | /applications | frontend/src/app/applications/ApplicationsPage.tsx | backend/src/trpc/routers/applications.router.ts | ApplicationList + Timeline |
| Applications Review | /review or review queue route | current review surface | backend/src/trpc/routers/review.router.ts | ApplicationReviewItem[] |
| Documents | /documents | frontend/src/app/documents/DocumentLab.tsx | backend/src/trpc/routers/documents.router.ts | DocumentItem[] |
| Style Studio | /style | frontend/src/app/style/StyleStudio.tsx | backend/src/trpc/routers/style.router.ts | StyleRequest -> StyledOutput |
| AI Assistant | /assistant | frontend/src/app/assistant/AssistantPage.tsx | backend/src/trpc/routers/assistant.router.ts | AssistantThread |
| AI Analysis | /analysis | frontend/src/app/analysis/AiAnalysisPage.tsx | analysis service layer | AnalysisResult |
| Interview | /interview | frontend/src/app/interview/InterviewPractice.tsx | backend/src/trpc/routers/interview.router.ts | InterviewSession |
| Coach | /coach | frontend/src/app/coach/CoachPage.tsx | backend/src/trpc/routers/coach.router.ts | CoachResult |
| Daily Warmup | /warmup | frontend/src/app/warmup/DailyWarmupPage.tsx | warmup/session-practice layer | WarmupSession |
| Negotiation | /negotiation | frontend/src/app/negotiation/NegotiationPage.tsx | negotiation service/router | NegotiationResult |
| Job Radar | /job-radar | frontend/src/app/job-radar/* | backend/src/trpc/routers/jobRadar.router.ts | Scan + Report |
| Skill Lab | /skills | frontend/src/app/skills/SkillsLab.tsx | backend/src/trpc/routers/skillLab.router.ts | SkillSignal[] |
| Community Centre | /community | planned route | community service layer | CommunitySnapshot |
| Settings | /settings | frontend/src/app/settings/SettingsHub.tsx | emailSettings + security + jobSources | SettingsSnapshot |
| Billing | /billing | frontend/src/app/billing/BillingPage.tsx | backend/src/trpc/routers/billing.router.ts | BillingSnapshot |
| Legal Hub Search | /legal | frontend/src/app/legal/LegalHub.tsx | backend/src/trpc/routers/legalHub.router.ts | LegalSearchResult |

---

**Import:** Spokkn `po_repo_ready_bundle.zip` (2026-04-19).  
**Canonical gap map + detail:** [`19-screens-canonical-implementation-and-gap-map-v1.md`](./19-screens-canonical-implementation-and-gap-map-v1.md).  
**Worked examples:** [`../squad/po-examples/README.md`](../squad/po-examples/README.md).
