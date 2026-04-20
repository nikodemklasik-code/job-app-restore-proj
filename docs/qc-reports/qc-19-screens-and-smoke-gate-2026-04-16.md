# QC Gate — 19 Screens Checklist + AI Live Smoke Pattern

**Role:** Quality Control Developer  
**Date:** 2026-04-16  
**References:**  
- Screen catalogue: [`docs/features/19-screens-for-users-and-agents.md`](../features/19-screens-for-users-and-agents.md)  
- QC role + verdict format: [`docs/policies/quality-control-developer-role-spec.md`](../policies/quality-control-developer-role-spec.md)  
- Prior smoke template: [`qc-ai-live-smoke-2026-04-16.md`](./qc-ai-live-smoke-2026-04-16.md)  
**Routing source of truth:** `frontend/src/router.tsx`  
**Shell titles:** `frontend/src/lib/navigationCopy.ts`

---

## 1. Scope Of This Gate

| Layer | What QC validated |
|--------|-------------------|
| **A — Inventory** | Each of the 19 named screens mapped to a **route + lazy page** (or documented substitute / gap). |
| **B — Build / compile** | `frontend` and `backend` production builds; backend unit test suite (`vitest --run`). |
| **C — Live AI smoke** | Same **pattern** as `qc-ai-live-smoke-2026-04-16.md` (env probe + optional `generateCareerResponse` probe). **Not** full browser E2E in this report. |

**Out of scope (explicit):** pixel-by-pixel theme regression across all six themes; Clerk production session walkthrough; manual click-through of every empty/loading edge case on each screen.

---

## 2. Nineteen-Screen Checklist (Catalogue vs Router)

Legend: **OK** = route exists under authenticated `AppShell` (or dedicated `/auth` for Auth). **SUB** = implemented but name/scope differs from catalogue section titles (acceptable if PO documents). **GAP** = no dedicated product surface matching the screen’s stated purpose.

| # | Screen (catalogue) | Route / notes | QC inventory |
|---|---------------------|---------------|--------------|
| 1 | Dashboard | `/dashboard` | OK |
| 2 | Profile | `/profile` | OK |
| 3 | Jobs | `/jobs` | OK |
| 4 | Applications | `/applications` | OK |
| 5 | Applications Review | `/review` | OK |
| 6 | Documents Upload | `/documents` → `DocumentLab` | SUB (Document Lab vs “upload-only”; PO alignment) |
| 7 | Style Studio | `/style-studio` | OK |
| 8 | AI Assistant | `/assistant` | OK |
| 9 | AI Analysis | `/ai-analysis` | OK — `SHELL_PAGE_TITLE` **missing** entry → header may show generic “Career Workspace” until fixed |
| 10 | Interview | `/interview` | OK |
| 11 | Coach / Trainer | `/coach` | OK |
| 12 | Daily Warmup | `/warmup` | OK |
| 13 | Negotiation | `/negotiation` | OK |
| 14 | Job Radar | `/radar`, `/job-radar`, nested scan/report/admin | OK (multiple routes; catalogue is one “module”) |
| 15 | Skill Lab | `/skills` | OK |
| 16 | Community Centre | — | **GAP** — no `Community*` route or nav surface in repo |
| 17 | Settings | `/settings`, `/security` | OK (Security split; catalogue “Settings” umbrella) |
| 18 | Billing | `/billing` | OK |
| 19 | Auth | `/auth` | OK (outside `AppShell`, as expected) |

**Additional routes (not one of the 19):** `/applications/board`, `/auto-apply`, `/ai-analysis` (listed above), `/case-practice` (**OK** route; `SHELL_PAGE_TITLE` **missing**), `/reports`, `/salary`, `/legal`, `/faq`, legal static routes — acceptable product surface; do not replace Community Centre without PO decision.

---

## 3. Smoke Pattern (AI Live) — Executed This Session

Per [`qc-ai-live-smoke-2026-04-16.md`](./qc-ai-live-smoke-2026-04-16.md):

1. **Env probe (optional repeat):**  
   `cd /Users/nikodem/job-app-restore/proj && node -e "import('dotenv').then(d=>{d.default.config(); console.log(process.env.OPENAI_API_KEY?'OPENAI_KEY_PRESENT':'OPENAI_KEY_MISSING');})"`  
   **Expected until secrets provided:** `OPENAI_KEY_MISSING` (same outcome as prior report if `.env` not loaded with key).

2. **Build / test (non-live, executed):**  
   - `cd /Users/nikodem/job-app-restore/proj/frontend && npm run build` → **exit 0** (Vite reported `built in ~19s`; chunk size warning non-blocking).  
   - `cd /Users/nikodem/job-app-restore/proj/backend && npm run build && npm test -- --run` → **exit 0** (17 files, 46 tests passed in observed run).

3. **Live model call:** Not re-executed as passing gate — **blocked** without `OPENAI_API_KEY` in the environment used for QC (consistent with prior smoke doc).

---

## 4. Checklist Against `quality-control-developer-role-spec.md` (Summary)

| Criterion | Result |
|-----------|--------|
| Product alignment (19-screen **parity** as a gate) | **Fails** — Community Centre absent; AI Analysis / Case Practice shell titles incomplete in `navigationCopy`. |
| Routes / module separation | **Mostly OK** — gaps and title map as above. |
| Technical (build, tests, no broken compile) | **Passes** for observed `npm run build` / `npm test`. |
| Live AI path proven | **Not proven** — environment block. |
| Full UI polish / all states per screen | **Not validated** in this gate (would require per-screen QC submissions). |

---

## 5. Required Verdict (Normative)

```md
Not Approved

Problem:
The nineteen-screen catalogue is not fully represented in the shipping router (Community Centre missing), shell page titles omit at least `/ai-analysis` and `/case-practice`, and the live OpenAI smoke path cannot be signed off without a configured OPENAI_API_KEY in the QC runtime environment.

Why This Fails Quality Control:
Per `docs/policies/quality-control-developer-role-spec.md`, integration approval requires product alignment and confidence in critical paths. A literal “all 19 screens + live AI” gate fails on catalogue parity and unverified live AI.

Affected Area:
- `frontend/src/router.tsx` / product IA (screen 16)
- `frontend/src/lib/navigationCopy.ts` (header consistency)
- Runtime env for `OPENAI_API_KEY` (assistant live path)

Required Fix:
1. PO decision: implement Community Centre surface **or** formally demote screen 16 from the canonical nineteen with doc update in `19-screens-for-users-and-agents.md` + `product-screens-spec-v1.0.md`.
2. Add `SHELL_PAGE_TITLE` entries for `/ai-analysis` and `/case-practice` (Title Case) and verify `Sidebar` / router stay in sync.
3. Re-run live AI smoke per `qc-ai-live-smoke-2026-04-16.md` with key present; attach results to a new QC appendix or update that smoke file.

Status:
Not Approved
```

## QC Verdict (operational)

**Not Approved For Integration** — zgodnie z normatywnym blokiem w **§5** powyżej.

## Required Next Action

- `Owning agent: required work is executed in the repository, not in chat instead of implementation — see docs/squad/IMPLEMENTATION_EXECUTION_RULES.md §5a and Hard Rule 8.`

1. Wykonać poprawki z pola **Required Fix** w §5 (Community / tytuły `/ai-analysis` i `/case-practice` / ponowny live smoke z kluczem).  
2. **PO:** decyzja Community vs formalne zejście ekranu 16 z katalogu 19 + aktualizacja dokumentów produktowych wskazanych w §5.  
3. **QC:** po dostawie — delta względem tego dokumentu; bez spełnienia §5 nadal **Not Approved For Integration** dla tej bramki.

---

## 6. Non-Blocking Follow-Ups (Do Not Override Verdict Above)

- **Documentation:** [`qc-ai-live-smoke-2026-04-16.md`](./qc-ai-live-smoke-2026-04-16.md) line 1 contains a stray `ok` prefix before `#` — cosmetic cleanup on next edit.  
- **Frontend bundle:** Vite warns main chunk over 500 kB — performance backlog, not a gate failure for this document.  
- **Theme standard:** Continue Visual Consistency Owner track per [`visual-consistency-owner-role-spec.md`](../policies/visual-consistency-owner-role-spec.md).

---

## 7. Communication

- **Agents:** do not mark “19 screens + live smoke” **done** until PO resolves GAP/title items and live smoke is green or explicitly waived in writing by PO with QC note.  
- **PO:** assign priority for Community vs doc demotion; unblock AI key for staging QC.
