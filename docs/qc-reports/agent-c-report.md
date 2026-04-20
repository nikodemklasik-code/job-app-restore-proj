### Sygnał Product Owner (nieoficjalny kanal → zapis w repo)
- 2026-04-16: Product Owner przekazał „zielone światło” na kontynuację prac integracyjnych (komunikat na czacie agenta). Oficjalna prawda procesowa nadal: raport + `READY FOR QC` + decyzja QC → PO.

### Sygnał QC — alias **„Vo”** (dla Agenta C)
- **2026-04-16:** W kanale `docs/qc-reports/` obowiązuje konwencja: **„Vo” = Agent C** (integracja A+B, weryfikacja end-to-end, historia/meta Assistanta, regresja nawigacji — zgodnie z `agent-c-task-card.md` i broadcastem w `qc-live-status.md`). To **nie** jest definicja sylaby „Vo” w nazwie marki **MultivoHub** dla użytkownika końcowego; to wyłącznie **etykieta procesowa** dla tego agenta.
- **2026-04-16:** Ten sam podmiot (**Agent C / Vo**) został zapisany jako **Visual Consistency Owner** w `qc-live-status.md` — obowiązek: egzekwowanie normy layout+motyw przy PR UI (checklista, eskalacja regresji), bez zastępowania PO w decyzjach produktowych.

---

## Agent C — Delivery annex (format §6 [`IMPLEMENTATION_EXECUTION_RULES.md`](../squad/IMPLEMENTATION_EXECUTION_RULES.md)) — Daily Warmup debit / tier catalog

**Date:** 2026-04-20

### Scope Implemented
- Single source of truth for Daily Warmup UI tiers and **credit debit amounts** (0 / 1 / 2 / 3) in the frontend repo; `DailyWarmupPage` imports the catalog (no duplicate tier arrays).
- Automated tests documenting alignment with backend `warmup_session` policy (`isValidWarmupSessionDebit` allows only 1, 2, 3 for paid sessions — see `backend/src/modules/session-practice/__tests__/warmupCredits.spec.ts`).

### Files Changed
- `frontend/src/app/warmup/warmupTierCatalog.ts` (new)
- `frontend/src/app/warmup/warmupTierCatalog.spec.ts` (new)
- `frontend/src/app/warmup/DailyWarmupPage.tsx` (import catalog; remove inline tier table)

### Routes / APIs / Schemas / Components Changed
- **Route:** unchanged (`/warmup`).
- **API:** unchanged — still `api.billing.spendCredits` with `feature: 'warmup_session'` and `amount: tier.credits` from catalog.

### Tests Added Or Updated
- `frontend/src/app/warmup/warmupTierCatalog.spec.ts`

### Existing Reports Checked
- `docs/qc-reports/qc-decision-practice-modules-settings-community-2026-04-18.md`
- `docs/qc-reports/qc-verdict-settings-url-resubmission-2026-04-19.md`
- `docs/qc-reports/execution-practice-settings-qc-resubmission-2026-04-19.md`
- `docs/squad/IMPLEMENTATION_EXECUTION_RULES.md`

### Existing QC Reports Checked
- Same as above; prior QC noted missing warmup debit tests for the broad practice slice — **this tranche adds** frontend catalog + tests (backend policy tests already existed).

### Integration Notes
- Keeps UI tier credits and billing `amount` in sync; reduces risk of regressing to legacy 30/45/60 debit values on the client.

### Ready For QC: Yes
- For **warmup tier / debit catalog + tests** only. Full practice + settings + server consent scope remains per [`qc-decision-practice-modules-settings-community-2026-04-18.md`](./qc-decision-practice-modules-settings-community-2026-04-18.md) until a separate delivery closes those items.

### Blockers
- None for this tranche. Server-side consent/community persistence still **open** for a future submission.

---

Completed Work
- Integrated Assistant structured metadata end-to-end between backend and frontend UI for Agent C integration scope.
- Wired deterministic routing/action behavior from real payload by using explicit action `route` and `mode` fields in shared contract.
- Completed sensitive-case safety visibility in Assistant flow with explicit safety note behavior and visible UI safety context.
- Stabilized history replay behavior so Assistant metadata remains usable after reload and is rendered in context/action/routing UI blocks.
- Verified no routing regressions for assistant flow and case-practice path in the integrated navigation setup.

Changed Files / Modules
- `backend/src/trpc/routers/assistant.router.ts`
- `backend/src/services/openai.ts`
- `shared/assistant.ts`
- `frontend/src/app/assistant/AssistantPage.tsx`
- `frontend/src/app/case-practice/CasePracticePage.tsx`
- `frontend/src/components/layout/Sidebar.tsx`
- `frontend/src/router.tsx`

Result
- Assistant UI now consumes structured backend metadata and presents coherent intent/context/safety/actions/routing output.
- Sensitive prompts (tribunal/ACAS/discrimination/harassment/emergency) produce visible safety behavior in both response text flow and metadata-driven UI.
- Suggested actions and route suggestions are no longer loosely inferred in UI; they are consumed from contract and mapped predictably.
- History reload preserves practical assistant context for integration flow and does not collapse to a plain chat-only experience.

How To Verify
- Build backend:
  - `cd /Users/nikodem/job-app-restore/proj/backend && npm run build`
- Build frontend:
  - `cd /Users/nikodem/job-app-restore/proj/frontend && npm run build`
- Evidence (aktualizacja raportu / FU-3 annex + ścieżka E2E w dokumencie): `cd /Users/nikodem/job-app-restore/proj/frontend && npm run build` — **OK** (2026-04-16)
- Runtime Assistant verification:
  - Open `/assistant`
  - Send normal prompts: CV/interview/salary/general
  - Confirm context sidebar updates with detected intent, linked modules, next best step
  - Confirm action rail buttons route to expected modules
- Sensitive-case verification:
  - Send prompts containing tribunal/ACAS/discrimination/harassment/emergency wording
  - Confirm safety note behavior is visible and coherent in response and sidebar safety section
  - Confirm compliance flags are shown when applicable
- History reload verification:
  - Refresh page and re-open existing assistant conversation
  - Confirm metadata-backed UI sections remain functional after history load

### Annex — FU-3 (Legacy history meta)

#### Tabela inferencji / reguł (skrót dla QC)

| # | Kontekst | Reguła | Skutek po `getHistory` + reload UI |
|---|----------|--------|-------------------------------------|
| 1 | Świeży turn z `mode` z klienta | `mode` wygrywa nad heurystyką tekstu (`resolveIntent`) | `meta.detectedIntent` i reszta pola zgodne z kontraktem |
| 2 | Starszy wiersz bez zapisanego `mode` | Heurystyka na tekście użytkownika (konserwatywna) | Możliwa łagodna rozbieżność vs identyczny prompt wysłany „dziś” |
| 3 | `sourceType` poza dozwolonym zbiorem | Walidacja w routerze; meta budowana tylko przez `buildAssistantResponseMeta` | Brak podwójnego scalania `contextRefs` |
| 4 | Rekord `assistant` w historii | Ten sam kształt `meta` co przy `sendMessage` | Sidebar (intent / actions / safety) nadal sensowny |
| 5 | Wątek wrażliwy zapisany przed FU-1 UI | Tekst odpowiedzi + ewentualne `safetyNotes` w meta | Po reloadzie warstwa safety nadal czytelna (tier z payloadu) |

#### Kroki repro (min. 3)

1. **Nowa rozmowa:** wyślij zwykły prompt (np. CV) → odśwież stronę → otwórz tę konwersację → potwierdź sidebar (intent, next step, brak pustego layoutu).
2. **Legacy:** jeśli masz starszą konwersację sprzed zmian kontraktu — otwórz ją po deployu → jeden reload → brak białego ekranu / brak całkowicie pustego `meta` tam gdzie UI oczekuje sekcji.
3. **Wrażliwy:** nowy wątek z frazą ACAS / tribunal → po odpowiedzi asystenta reload → sekcja safety nadal widoczna i spójna z FU-1 (warning vs block).

#### E2E A+B — realny payload → UI (ścieżka techniczna)

- **Backend `assistant.sendMessage`:** zwraca `aiRecord` z polem `meta` (intent, `routeSuggestions`, `suggestedActions`, `safetyNotes`, `complianceFlags`, `nextBestStep`) oraz `structured` (spójny kontrakt; UI korzysta z `meta` na liście wiadomości).
- **Frontend store:** `frontend/src/stores/careerAssistantStore.ts` — po mutacji `sendMessage` zapisuje `resp.userRecord` i `resp.aiRecord` (wraz z `meta`) do `messages`.
- **Frontend UI:** `frontend/src/app/assistant/AssistantPage.tsx` — `latestAssistantMeta` = ostatnia wiadomość `role === 'assistant'` z niepustym `meta`; ten obiekt zasila `ContextSidebar`, `ActionRail`, `RoutingBlocks`, `SensitiveCaseLayer` oraz blokuje input przy `block` w safety.
- **Reload historii:** `loadHistory` → `assistant.getHistory` — dla każdego wiersza `assistant` backend dokleja `meta` z `buildAssistantResponseMeta` (inferencja z tekstu użytkownika z poprzedniego turnu + `sourceType` wiersza); UI po odświeżeniu znów widzi ten sam model danych.

Known Limitations / Follow-Up
- Legacy assistant rows do not store explicit mode per turn in DB, so history metadata reconstruction uses conservative inference from user text.
- Safety note injection is currently applied at router output stage; follow-up can centralize this in one lower-level service layer if stricter policy isolation is required.
- Final QC should run a focused UX wording pass for sensitive-case copy consistency across warning vs block scenarios.

Status
- READY FOR QC (Submitted) — w tym **FU-3** annex powyżej + integracja slice C wg task card.
