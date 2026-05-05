# AI Skill Job Search — End-to-End v2 (Branch: `work`)

## Product Outcome
Build a complete, trustworthy AI-assisted job discovery flow that improves **match quality** and **application conversion**, while remaining explainable and safe.

Success is measured by:
- higher save/apply rate from AI-ranked jobs,
- sustained positive feedback ratio (`up` / all feedback),
- low regression risk via testable contracts and staged rollout.

---

## What v2 changes vs the previous version

1. **Stronger explainability contract**: every recommendation includes explicit strengths, gaps, and next actions.
2. **Feedback loop hardening**: optimistic UX + server persistence + hydration consistency checks.
3. **E2E reliability checklist**: clear API/UI/test/release gates to prevent partial implementation.
4. **Operational readiness**: feature flag, fallback strategy, and KPI monitoring from day one.

---

## End-to-End User Flow

### Step 1 — Search
- User enters role/query, location, and sources.
- System returns normalized jobs.
- Client applies fit threshold and exclusion filters.

### Step 2 — AI Ranking
For each visible job, compute a transparent aggregate score:
- skill overlap,
- experience relevance,
- existing fit score contribution,
- freshness bonus,
- gap penalty.

Display top recommendations sorted by aggregate score.

### Step 3 — Explainability
Each recommendation must show:
- **Why it matches** (top reasons),
- **What is missing** (top gaps),
- **How to improve** (next action hints).

### Step 4 — Feedback
- User can vote `up`/`down`.
- UI updates immediately (optimistic).
- Signed-in users persist feedback on backend.
- On next load, server-hydrated feedback must match UI state.

### Step 5 — Conversion
- Save/unsave jobs with optimistic rollback on error.
- Create application draft from discovery/detail.
- Optional document generation follows draft creation.

---

## Backend Contracts (must pass)

### Recommendation feedback
- `jobs.getRecommendationFeedback` returns `Record<jobId, 'up' | 'down'>` for current user.
- `jobs.saveRecommendationFeedback` upserts by `(userId, jobId)`.
- Data table: `ai_job_recommendation_feedback` with stable timestamps.

### Discovery and conversion
- Existing discovery endpoints remain backward-compatible.
- Save/unsave and application draft creation remain idempotent for repeat actions.

---

## Frontend Requirements (must pass)

- Loading and empty states for search and recommendation panels.
- Signed-out guard for mutating actions (save, feedback, draft creation).
- Optimistic feedback and optimistic save state with rollback on failure.
- Stable local persistence keys (versioned).
- Defensive handling of null/empty job fields.

---

## Observability & KPIs

### Required events
- `ai_reco_impression`
- `ai_reco_feedback`
- `ai_reco_saved_job`
- `ai_reco_create_draft`

### KPI dashboard
- recommendation CTR,
- save rate from AI list,
- draft creation rate from AI list,
- feedback positive ratio,
- mutation failure rate.

---

## Test Matrix (E2E)

### Automated
1. **Unit**
   - score aggregation boundaries (0..100 clamp),
   - feedback state reducer/hydration behavior.
2. **Integration**
   - feedback upsert and re-read consistency,
   - save/unsave rollback behavior on simulated failure.
3. **UI/E2E**
   - search → rank → feedback → refresh persistence,
   - save/unsave + create draft from recommendation.

### Manual smoke
1. Auth user: run search, verify ranking and explanations.
2. Submit `up` then refresh; state persists.
3. Submit `down` for same job; state updates and persists.
4. Save and unsave job; verify server sync.
5. Create draft from recommended job.

---

## Rollout Plan

1. Ship behind `ai_skill_job_search_v2` flag.
2. Internal users only (phase 0).
3. 10% cohort (phase 1), compare baseline KPIs.
4. 50% cohort (phase 2) if error budget is healthy.
5. 100% rollout + post-launch review.

Fallback:
- If ranking fails or latency spikes, fall back to standard sorting and keep core search usable.

---

## Definition of Done

Feature is complete only when:
- contracts above are implemented and verified,
- all automated checks pass,
- manual smoke passes without critical defects,
- KPI instrumentation is live,
- rollout/fallback playbook is documented.

---

## Branch Execution Checklist (`work`)

- [ ] Implement any remaining inline review comments in code.
- [ ] Re-run `build`, tests, and quick discovery smoke.
- [ ] Commit as follow-up on `work`.
- [ ] Push `work` and open/update PR notes with KPI impact.