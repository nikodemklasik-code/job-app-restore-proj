# 19 Screens — Production Readiness + Cross-Flow Requirements

**Status:** canonical product bar (complements gap map + implementation spec)  
**Audience:** Product Owner, Agent A/B/C, QC  
**Related:** [`19-screens-canonical-implementation-and-gap-map-v1.md`](./19-screens-canonical-implementation-and-gap-map-v1.md) · [`19-screens-implementation-spec-v1.md`](./19-screens-implementation-spec-v1.md) · **8-module pack:** [`8-modules-production-ready-pack-v1.md`](./8-modules-production-ready-pack-v1.md) · [`../squad/production-ready-modules-bundle/README.md`](../squad/production-ready-modules-bundle/README.md) · **remaining screens pack:** [`remaining-screens-production-ready-pack-v1.md`](./remaining-screens-production-ready-pack-v1.md) · [`../squad/remaining-screens-production-ready-bundle/README.md`](../squad/remaining-screens-production-ready-bundle/README.md)

---

## What “production-ready” means (operating definition)

A screen is **not** production-ready only because:

- the route opens,
- something renders,
- an agent wrote “done”.

**Production-ready** means:

- real persisted data,
- edge cases handled,
- durable state after refresh,
- a sensible next step,
- billing rules respected,
- context not lost across modules,
- **no claiming a full module** when only a **bounded slice** exists — especially for Practice, Negotiation, and Legal Hub Search.

---

## 1. Dashboard

**Main gap:** a **single aggregate** (dashboard snapshot), not many independent spinners.

**Needs:**

- one `dashboard` snapshot contract,
- prioritized next step, not only a grid of cards,
- resilience to partial data (e.g. billing OK, jobs timeout),
- real alerts: low balance, incomplete profile, overdue follow-up,
- personalization from profile + recent actions.

**Common failure modes:**

- cards render but nothing defines “what’s next”,
- data without priority order,
- ignores billing state and profile readiness.

**Cross-links to close:**

- Dashboard → Profile when completeness low,
- Dashboard → Jobs when profile ready but no discovery activity,
- Dashboard → Warmup / Interview when user is in active interview practice context,
- Dashboard → Billing when balance low,
- Dashboard → Reports when fresh outcome should be reviewed.

---

## 2. Profile

Source of truth: if Profile is not production-ready, the rest of the product guesses.

**Needs:**

- durable save,
- completeness score,
- validation and versioning of critical fields,
- separation of raw profile data vs derived signals,
- downstream propagation of changes.

**Still to close:**

- salary expectations affect Jobs and Negotiation,
- target roles affect Jobs, Radar, Skill Lab,
- skills affect Skill Lab and document recommendations,
- work preferences affect offer ranking.

**Common failure:**

- profile saves but Jobs / Radar / Assistant still read stale state,
- completeness is decorative and drives nothing.

**Cross-links:**

- Profile → Jobs: starter filters and relevance,
- Profile → Job Radar: fit note and scoring context,
- Profile → Documents: tailoring suggestions,
- Profile → Skill Lab: value bands and gaps,
- Profile → Auto-apply / Applications suggestions.

---

## 3. Jobs

Not production-ready if it is only a list of postings.

**Needs:**

- deduplication across sources,
- explicit source badge,
- persisted `saved` / `hidden` / applied state,
- partial provider failure handling,
- basic fit note or relevance,
- filters aligned with profile.

**Also:**

- expired listing state,
- empty salary handling,
- “already in applications” state,
- sensible handoff to Job Radar and Applications.

**Cross-links:**

- Jobs → Job Radar: start scan from a concrete job,
- Jobs → Applications: pipeline item,
- Jobs → Documents: tailoring for listing,
- Jobs → Assistant: “should I apply?” style routing,
- Job Sources / Settings → Jobs: feed must actually change when settings change.

---

## 4. Applications

Pipeline is retention; production needs an **audit trail**.

**Needs:**

- stable stage transition model,
- timeline / history of changes,
- links to job, radar, document, report,
- notes with timestamps,
- distinct terminal statuses.

**Also:**

- follow-up due logic,
- linked CV version,
- link to upcoming interview prep,
- manual application without job board.

**Cross-links:**

- Applications → Interview when stage = interview,
- Applications → Negotiation when offer / terms pending,
- Applications → Documents to pin CV / CL version,
- Applications → Reports for prep history,
- Job Radar report → Applications without losing context.

---

## 5. Applications Review

Easy to ship as a half-product. Must answer: **what to do after I applied?**

**Needs:**

- days-without-response calculation,
- follow-up due detection,
- recommendations: follow up / wait / archive,
- integration with real application timeline,
- listing still active / unknown.

**Common failure:**

- review UI exists but cannot perform a real action on the application.

**Cross-links:**

- Applications → Applications Review,
- Applications Review → Applications stage update,
- Applications Review → Assistant for follow-up phrasing,
- Applications Review → Reports if decision trace is required.

---

## 6. Documents / Document Lab

Without versioning and extraction you get `cv-final-v7-real-final.pdf`.

**Needs:**

- version lineage,
- parse status,
- extracted text state,
- primary CV indicator,
- job-specific variants,
- attach-to-application flow.

**Also:**

- duplicate handling,
- parse failure UX,
- scanned PDF fallback,
- stable export/download,
- ownership and access control.

**Cross-links:**

- Profile → Documents: what to upload or fix,
- Jobs / Job Radar → Documents: tailoring,
- Documents → Applications: pin version,
- Documents → AI Analysis / Style Studio,
- Documents → Reports: refine / analysis outcomes.

---

## 7. Style Studio

Not a random style toy; it must improve real materials.

**Needs:**

- clear style modes,
- input from a concrete document or text,
- before / after comparison,
- save result as new version,
- cost when AI path is not free.

**Cross-links:**

- Documents → Style Studio,
- Style Studio → Documents as new version,
- Style Studio → Applications when user attaches revised doc.

---

## 8. AI Assistant

Fast, light, **routing** — not pretending to be the expert for everything.

**Needs:**

- context resolver to profile, jobs, applications, reports,
- action chips to real modules,
- cost / meta where required,
- clear separation from Analysis and Coach,
- session persistence,
- policy guards.

**Common failure:**

- answers read well but cannot trigger or suggest a concrete product action.

**Cross-links:**

- Assistant ↔ Profile,
- Assistant ↔ Jobs,
- Assistant ↔ Documents,
- Assistant ↔ Interview / Coach,
- Assistant ↔ Billing when action is paid,
- Assistant → **concrete routes**, not generic chat.

---

## 9. AI Analysis

Expert tool, not a bigger chat.

**Needs:**

- structured outputs,
- explicit inputs: document, answer, job, profile,
- evidence vs inference distinction,
- deep mode with cost,
- retry / failure handling,
- export / save to reports.

**Cross-links:**

- Documents → AI Analysis,
- Jobs / Profile → fit review,
- AI Analysis → Documents (rewrite suggestions),
- AI Analysis → Reports.

---

## 10. Interview

Premium module: **hermetic session** and **hermetic billing**.

**Needs:**

- session state machine,
- approve / commit / reject,
- abandon rollback,
- summary / report persistence,
- application / job context,
- per-answer review.

**Also:**

- voice / text handling,
- timeout / reconnect,
- failed session cleanup,
- transparent cost before start.

**Cross-links:**

- Applications → Interview,
- Interview → Coach,
- Interview → Reports,
- Interview → Skill Lab,
- Billing → Interview guards.

---

## 11. Coach

Must not be the same product surface as Assistant.

**Needs:**

- dedicated prompts and output schema,
- handoff from Interview or Warmup,
- estimated cost,
- action plan output,
- save to reports.

**Common failure:**

- Coach is only a variant of the Assistant prompt.

**Cross-links:**

- Interview → Coach,
- Warmup → Coach,
- Coach → Reports,
- Coach → Skill Lab,
- Coach → Documents when feedback is material-specific.

---

## 12. Daily Warmup

Light, cheap, fast — heavy UX kills the point.

**Needs:**

- fixed cost per duration,
- start in 1–2 clicks,
- quick durable result,
- follow-up CTA,
- bounded prompt / session logic.

**Cross-links:**

- Dashboard → Warmup,
- Warmup → Coach,
- Warmup → Interview,
- Warmup → Reports,
- Billing → Warmup fixed-cost display.

---

## 13. Negotiation

Project state: not yet a full bounded slice.

**Needs:**

- separate domain logic,
- dedicated prompts and output schema,
- offer context,
- counter-offer logic,
- strategy vs draft vs roleplay,
- visible cost,
- save to application notes.

**Common failure:**

- glued reuse of Coach or Interview.

**Cross-links:**

- Applications (offer stage) → Negotiation,
- Profile salary / values → Negotiation,
- Negotiation → Reports,
- Negotiation → Documents if generating email reply,
- Billing → Negotiation.

---

## 14. Job Radar

Report must be **immutable / versioned**; scan flow fetch → parse → enrich → score → compose.

**Needs:**

- scan orchestration,
- progress state / polling,
- immutable scan reports,
- source transparency,
- complaint flow,
- ownership checks,
- rescan path,
- fit / risk / freshness / employer history in one coherent report.

**Cross-links:**

- Jobs → Job Radar,
- Job Radar report → Applications,
- Job Radar report → Documents,
- Job Radar report → Assistant,
- Job Radar admin complaints → governance / trust.

---

## 15. Skill Lab

Not random LLM wallpaper: **signals + justification**.

**Needs:**

- evidence model,
- salary / value bands,
- underused skills,
- verification hints,
- growth actions,
- course mapping,
- inputs from profile, CV, jobs, practice.

**Cross-links:**

- Profile / Documents / Jobs → Skill Lab inputs,
- Skill Lab → Documents,
- Skill Lab → practice modules,
- Skill Lab → Reports.

---

## 16. Community Centre

Without dedicated route + backend actions it is an idea, not a screen.

**Needs:**

- clear bounded MVP,
- real backend actions,
- separation from Settings / consent,
- at least one working flow (e.g. referral or credits entry).

**Cross-links:**

- Community → Billing / buy credits,
- Community → profile visibility / discoverability,
- Community → referral credits — **without** mixing into privacy settings.

---

## 17. Settings

Not a junk drawer for unassigned features.

**Needs:**

- real backend effect per control,
- versioned / migratable settings where needed,
- URL-to-tab sync,
- fresh server state after reload,
- discoverable Security entry.

**Common failure:**

- toggle changes UI but not Jobs, notifications, privacy, or sources behavior.

**Cross-links:**

- Settings → Jobs feed behavior,
- Settings → notifications / email,
- Settings → privacy / consent,
- Settings → Security,
- Settings → Assistant / AI preferences if supported.

---

## 18. Billing

Trust screen: hidden cost destroys trust.

**Needs:**

- ledger-based history,
- monthly free allowance,
- pending spends,
- approve / commit / reject visibility,
- pack / recharge flow,
- module-level usage transparency.

**Also:**

- recovery for failed commit / reject,
- fixed vs estimated cost explanation,
- low balance warnings.

**Cross-links:**

- Billing ↔ Interview, Coach, Negotiation, AI Analysis / Assistant (paid paths),
- Dashboard → Billing alerts,
- module preflight → Billing.

---

## 19. Legal Hub Search

Approved sources only by default; visible scope; structured answer; PDF with disclaimer; **no open web as default**.

**Needs:**

- source registry as source of truth,
- scope toggles,
- retrieved source groups visible in answer,
- required answer sections per spec,
- PDF export with disclaimer,
- enforcement against open-web default,
- prompt guards against invented certainty,
- **real retrieval path** — not only “AI summary from vibes”.

**Honesty:** if only a narrow grounded summary path exists today, **do not** sell it as full Legal Search complete.

**Cross-links:**

- Legal Hub Search → Reports or PDF export,
- Legal Hub Search ↔ Billing if deep / heavy AI,
- Legal Hub Search ↔ Settings only for optional scope preferences if product supports it.

---

## Cross-screen gaps (often worse than single screens)

Teams ship views, not flows.

### Primary journey

Healthy flow:

**Auth → Profile → Dashboard → Jobs discovery → Job Radar report → Applications → Documents / Interview / Assistant → Reports → Dashboard.**

**Still missing for production:**

- redirect logic based on profile completeness,
- passing IDs / context between modules,
- durable “next step” state,
- reportability after each major module,
- dashboard refresh after downstream completion.

### Practice loops

- Dashboard → Warmup → Coach → Reports  
- Applications → Interview → Coach → Reports  
- Offer stage → Negotiation  

**Gaps:**

- Warmup does not produce an outcome usable for coaching,
- Interview does not persist to Reports,
- Coach cannot consume prior context,
- Negotiation does not read application / offer data.

### Billing spine

Every paid module: **approve → commit / reject**.

**Gaps:**

- each module invents its own cost math,
- no shared policy layer,
- user does not see cost before action,
- failure path skips reject / rollback.

### Reports spine

Reports hub = product memory.

**Gaps:**

- each module writes reports differently,
- no shared metadata model,
- report does not suggest a next action,
- export / preview inconsistent.

---

## System-level gaps (whole product, not one screen)

Without closing these, screens look “done” while the product stays a half-product.

- One coherent model: **identity + profile + billing + applications + reports**,
- Aggregates for main surfaces: **Dashboard, Reports, Applications, Profile**,
- Central AI layer with **role separation**: Assistant / Analysis / Coach / Interview / Negotiation,
- Shared **billing policy** layer,
- **Auditability:** application stages, billing actions, scan events, settings changes, report generation,
- Clear **next-step navigation** on every screen,
- **Deploy-safe and repo-safe execution discipline** (working tree cleanliness, canonical deploy path).

---

## Shortest checklist

### Per screen

- explicit backend owner,
- durable data,
- loading / empty / error / populated,
- sensible next step,
- test of primary action,
- audit / report where applicable,
- billing path if it costs.

### Per cross-module link

- context handoff,
- durable outcome,
- return to Dashboard / Reports / Application with refreshed state,
- no manual copy-paste between modules.

### Whole product

- coherent user state,
- billing spine,
- reports spine,
- AI role separation,
- deploy discipline,
- QC anti-widening.
