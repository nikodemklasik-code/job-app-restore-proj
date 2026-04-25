# Runtime surface split — Issue #48

This file is the canonical working table for issue #48. The goal is to split runtime cleanup between Agent 1 and Agent 2 and stop treating a discovered `.tsx` file as a finished product surface.

## Agent 1 — core account and operations surfaces

Agent 1 owns the account/product operations side. These screens must be checked for real frontend wiring, backend contracts, auth identity, persistence and smoke evidence.

| screen | FE file | BE file | router | DB table / persistence | route | sidebar | works? | blocker |
|---|---|---|---|---|---|---|---|---|
| Dashboard | `frontend/src/app/dashboard/DashboardPage.tsx`; `frontend/src/components/dashboard/DashboardSnapshot.tsx` | `backend/src/trpc/routers/dashboard.router.ts` | `dashboard.getSnapshot` | `profiles`, `careerGoals`, `skills`, `experiences`, `documentUploads`, `applications`, `billingLedger`, `pendingCharges`, `interviewSessions` | `/dashboard` | yes, expected | partial | Move limited-data notice to top status; add activity/news; reduce over-dominant promo surface. |
| Billing | `frontend/src/app/billing/BillingPage.tsx`; `frontend/src/components/billing/BillingLedgerPanels.tsx` | `backend/src/trpc/routers/billing.router.ts` | `billing.*` | `billingLedger`, `pendingCharges`, user/account billing services | `/billing` | yes, expected | partial | Remove client-provided `userId` from private billing/payment/portal flows; backend must use auth identity. |
| Settings / Job Sources | `frontend/src/app/settings/JobSourcesSettingsTab.tsx`; store path to verify | job-source/settings routers to verify | job source/settings procedures | provider settings + missing method-consent persistence | `/settings` | yes, expected | partial | API/browser method consent is currently localStorage; must become server-authoritative. |
| Applications | `ApplicationsPage.tsx` path to verify | applications router to verify | `applications.*` | `applications` | `/applications` | yes, expected | unknown | Need durable stage transitions, audit trail and DB status consistency check. |
| Applications Review | `ReviewQueue.tsx` path to verify | `review.router.ts` path to verify | `review.*` | applications/review state | `/review` | yes, expected | unknown | Related job/listing status and review queue math must not be inferred incorrectly. |
| Profile runtime | profile page path to verify; `frontend/src/stores/profileStore.ts` | `backend/src/trpc/routers/profile.safe.router.ts`; `backend/src/services/profileSnapshot.service.ts` | `profile.*` | `profiles`, `careerGoals`, `socialConsents`, `userPreferenceFlags`, child collections | `/profile` | yes, expected | partial | Save/reload/completeness must preserve omitted child collections and refresh downstream consumers. |

## Agent 2 — AI, practice, growth and community surfaces

Agent 2 owns the AI/practice/growth/community side. Personalised AI flows must use ProfileSnapshot/ProfileCompletion and must return visible `incomplete_profile` UI when critical fields are missing.

| screen | FE file | BE file | router | DB table / persistence | route | sidebar | works? | blocker |
|---|---|---|---|---|---|---|---|---|
| Job Radar / Job Scanner | `frontend/src/app/job-radar/JobRadarScanPage.tsx`; `frontend/src/features/job-radar/hooks/use-job-radar-scan.ts` | `backend/src/trpc/routers/jobRadar.router.ts`; `backend/src/modules/job-radar/*` | `jobRadar.*` | job radar scan/report repositories | `/job-radar` | yes, expected | partial | Registry stub must not present fake success; use real adapter or `partial_report` / unavailable state. UI must handle `incomplete_profile`. |
| Skill Lab | FE path to verify | `backend/src/trpc/routers/skillLab.router.ts`; `backend/src/services/skillLabCore.service.ts`; `backend/src/services/skillLabSignals.service.ts`; `backend/src/ai/skills-engine/*` | `skillLab.*` | `skillClaims`, profile child collections | `/skills` or `/skill-lab` to verify | yes, expected | partial | Frontend must read real `coreSignals`; show empty states; no fake salary/course promises; add ProfileCompletion gate follow-up. |
| AI Assistant | assistant FE path to verify | `backend/src/trpc/routers/assistant.router.ts` | `assistant.*` | assistant conversations/messages + profile snapshot | `/assistant` to verify | yes, expected | partial | Backend gate foundation exists; UI must visibly handle `incomplete_profile`. |
| Interview | interview FE path to verify | `backend/src/trpc/routers/interview.router.ts` | `interview.*` | `interviewSessions`, `interviewAnswers`, credit spend events | `/interview` | yes, expected | partial | Start flow should be gated before session/spend creation; UI must show incomplete-profile state. |
| Coach | coach FE path to verify | `backend/src/trpc/routers/coach.router.ts` | `coach.*` | credit spend events; coach output as applicable | `/coach` | yes, expected | partial | Evaluation should gate before spend/AI run; release spend reservation on incomplete profile. |
| Negotiation | negotiation FE path to verify | router path to verify | to verify | to verify | `/negotiation` | yes, expected | unknown | Needs backend contract and ProfileCompletion gate if personalised. |
| Document Lab | document lab FE path to verify | documents/document lab router to verify | documents/style routes | document uploads/versions | `/documents` or `/document-lab` to verify | yes, expected | partial | Storage can remain ungated; personalised AI generation/analysis must be gated. |
| Style Studio | style studio FE path to verify | style endpoints to verify | style routes | generated docs/style state | route to verify | yes, expected | unknown | User-specific AI generation endpoints must be protected and profile-aware. |
| AI Analysis | AI analysis FE path to verify | router path to verify | to verify | to verify | route to verify | yes, expected | unknown | Needs canonical backend contract or explicit ownership. |
| Community Centre | `frontend/src/app/community/CommunityCentrePage.tsx` | backend contract not yet confirmed | none/unknown | none/unknown | `/community` | yes, expected | preview | Mark preview or remove dead CTA until backend contracts exist. |
| Daily Warmup | FE path to verify | router path to verify | to verify | to verify | route to verify | yes, expected | unknown | Must not fake conversational/persistence states. |
| Reports | FE path to verify | router path to verify | to verify | to verify | route to verify | yes, expected | unknown | Needs route/backend/persistence audit. |

## Immediate runtime order

1. Agent 1: Dashboard cleanup, Billing identity hardening, Job Sources server consent.
2. Agent 2: Job Radar partial/registry truth, Skill Lab real signals + empty states, incomplete-profile UI for AI flows.
3. QC: reject any screen that cannot fill the table with verifiable route, backend, persistence and smoke proof.

## Done gate

A screen is not Done unless all of the following are true:

- Frontend route exists and is reachable.
- Sidebar/nav entry is intentional and correct.
- Backend router/contract exists where the feature claims real data.
- DB persistence exists where the feature claims persistence.
- Protected flows use backend auth identity, not private client-provided `userId`.
- Loading, empty, error, success and permission states are implemented.
- AI-personalised flows use ProfileSnapshot/ProfileCompletion and visibly handle `incomplete_profile`.
- Smoke proof is attached to the PR.
