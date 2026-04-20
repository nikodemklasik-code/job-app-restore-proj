# 19 Screens — Gap Map v1

Legend:
- GREEN = present and close to production slice
- YELLOW = present but missing production bars or cross-flows
- RED = missing or too incomplete to enter chain as full screen work

| Screen | Repo Surface | Status | Main Gap |
|---|---|---:|---|
| Dashboard | frontend/src/app/dashboard/DashboardPage.tsx | YELLOW | no single aggregate snapshot / next-best-action bar |
| Profile | frontend/src/app/profile/ProfilePage.tsx | GREEN/YELLOW | downstream sync and completeness enforcement |
| Jobs | frontend/src/app/jobs/JobsDiscovery.tsx | GREEN/YELLOW | save/hide/add-to-applications bridge and source parity |
| Applications | frontend/src/app/applications/* | GREEN | audit trail and cross-links must stay intact |
| Applications Review | review queue surface exists but needs hardening | YELLOW | follow-up recommendations and actions |
| Documents | frontend/src/app/documents/DocumentLab.tsx | GREEN/YELLOW | version lineage + attach-to-application |
| Style Studio | frontend/src/app/style/StyleStudio.tsx | GREEN/YELLOW | save-as-version + bounded billing clarity |
| AI Assistant | frontend/src/app/assistant/AssistantPage.tsx | GREEN/YELLOW | routing chips + context persistence |
| AI Analysis | frontend/src/app/analysis/AiAnalysisPage.tsx | YELLOW | backend ownership and save-to-reports |
| Interview | frontend/src/app/interview/InterviewPractice.tsx | GREEN/YELLOW | summary persistence + report bridge |
| Coach | frontend/src/app/coach/CoachPage.tsx | GREEN | keep separate from Assistant |
| Daily Warmup | frontend/src/app/warmup/* | YELLOW | fixed-cost quick-session proof |
| Negotiation | frontend/src/app/negotiation/NegotiationPage.tsx | YELLOW/RED | still not fully bounded / separate domain closure |
| Job Radar | frontend/src/app/job-radar/* | GREEN | action bridge to applications/documents |
| Skill Lab | frontend/src/app/skills/SkillsLab.tsx | GREEN/YELLOW | evidence-based route-outs |
| Community Centre | dedicated route not clearly present | RED | new route + one durable BE action required |
| Settings | frontend/src/app/settings/* | YELLOW | server-backed parity and dead-toggle cleanup |
| Billing | frontend/src/app/billing/BillingPage.tsx | GREEN | ledger parity + pending spend visibility |
| Legal Hub Search | frontend/src/app/legal/LegalHub.tsx + module docs | GREEN/YELLOW | source pills / scope summary / PDF export path closure |

---

**Import:** Spokkn `po_repo_ready_bundle.zip` (2026-04-19).  
**Deeper spec:** [`19-screens-canonical-implementation-and-gap-map-v1.md`](./19-screens-canonical-implementation-and-gap-map-v1.md) · **Production bar:** [`19-screens-production-readiness-and-cross-flows-v1.md`](./19-screens-production-readiness-and-cross-flows-v1.md).  
**Worked examples (not chain paths):** [`../squad/po-examples/README.md`](../squad/po-examples/README.md).
