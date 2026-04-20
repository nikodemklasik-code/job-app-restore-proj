# QC Agent Work — Spot Verification

**Date:** 2026-04-19  
**Reviewer:** QC (repo spot check, no chat-only handoff)  
**Refs:** [`IMPLEMENTATION_EXECUTION_RULES.md`](../squad/IMPLEMENTATION_EXECUTION_RULES.md) · [`QC_OpenAI_Models_And_Secrets_Spec.md`](../squad/QC_OpenAI_Models_And_Secrets_Spec.md) · [`qc-live-status.md`](./qc-live-status.md)

---

## QC Scope Reviewed

- **module:** Mixed — (1) backend OpenAI governance, (2) Assistant / Legal Hub AI UX, (3) prior squad slice Practice/Settings/Community vs current tree  
- **phase:** Cross-cutting (implementation + documentation discipline)  
- **owner / agent:** A/B/C deliveries present in working tree; no single agent attribution in diff  
- **exact scope:** Repository state at verification time: `backend/src/lib/openai/*`, `assistant.router`, `legalHub.router`, `shared/assistant.ts`, large `frontend/` diff vs `HEAD` (see `git diff --stat`)

---

## Previous QC Report Checked

**Yes**

---

## Previous QC Report Path / Reference

- [`qc-live-status.md`](./qc-live-status.md) — Practice/Settings/Community slice **Not Approved For Integration** (full 2026-04-18); narrow settings tranche **Approved For Integration** (`qc-verdict-settings-url-resubmission-2026-04-19.md`).  
- [`qc-decision-practice-modules-settings-community-2026-04-18.md`](./qc-decision-practice-modules-settings-community-2026-04-18.md) — **Not Approved For Integration** (tests, persistence, DoD).  
- [`qc-to-po-assistant-integration-2026-04-16.md`](./qc-to-po-assistant-integration-2026-04-16.md) — Assistant slice previously **Approved For Integration** (historical; current delta must stay coherent).  
- [`qc-ai-live-smoke-2026-04-16.md`](./qc-ai-live-smoke-2026-04-16.md) — Live AI smoke **Not Approved** until `OPENAI_API_KEY` + successful call (unchanged as environment gate).

---

## Previously Reported Issues Resolved

- **Central OpenAI client / model sprawl (partial):** `rg 'new OpenAI\\(' backend` shows **only** [`backend/src/lib/openai/openai.client.ts`](../../backend/src/lib/openai/openai.client.ts) — feature files no longer construct ad-hoc clients (aligns with QC OpenAI spec intent).  
- **Model registry + env keys:** Implemented under `backend/src/lib/openai/model-registry.ts`, `config/ai.env.ts`, Vitest in `src/lib/openai/__tests__/`.  
- **Assistant safe product meta:** `AssistantAiProductMeta` in [`shared/assistant.ts`](../../shared/assistant.ts); populated in [`assistant.router.ts`](../../backend/src/trpc/routers/assistant.router.ts); UI strip in [`AssistantPage.tsx`](../../frontend/src/app/assistant/AssistantPage.tsx).  
- **Legal Hub catalogue-grounded synthesis:** Optional `includeGroundedSummary` + `trySynthesizeLegalCatalogHits` (prompt-bound to catalogue hits only; **not** full OpenAI `file_search` vector path yet — documented in module comment).

---

## Previously Reported Issues Still Open

- **Practice + Settings + Community (2026-04-18 decision):** Prior QC required **automated tests** and **persistence/API** clarity for consent/community; this spot check did **not** find new `*.test.*` / `*.spec.*` under `frontend/` for Coach/Settings surfaces — **assume still open** until agent delivery report proves otherwise.  
- **Live AI smoke:** Still environment-dependent per `qc-ai-live-smoke-2026-04-16.md`.  
- **OpenAI spec “Responses API” / `file_search`:** SDK-backed `responses.*` and Legal vector `file_search` are **not** fully implemented; catalogue-grounded chat completion is an acceptable interim only if PO accepts wording vs spec literal.

---

## New Issues Found

- **Monolithic diff (114+ files in `git diff --stat`):** Brak jawnego podziału na raporty dostawy per zakres (§6 `IMPLEMENTATION_EXECUTION_RULES`) utrudnia izolowany werdykt integracyjny — ryzyko „tacowania” wielu tematów w jednym merge.  
- **Default model IDs (`gpt-5.4-*` etc.):** Wymagają ważnych nazw w koncie OpenAI lub jawnego `OPENAI_MODEL` / `OPENAI_DEFAULT_MODEL` na VPS — ryzyko runtime 4xx jeśli operacyjnie nie ustawione.

---

## Functional Validation

- **Backend:** `cd /Users/nikodem/job-app-restore/proj/backend && npx vitest run` → **115 passed** (w tym `model-registry`, `assistant-product-meta`).  
- **Singleton / sekrety:** Brak `OPENAI_API_KEY` w kodzie poza odczytem env; brak wycieku klucza do frontendu w dodanych polach meta (tylko etykiety produktowe / widełki kredytów).  
- **Legal search API:** `legalHub.search` pozostaje publiczne; opcjonalne `groundedSummary` nie zwiększa powierzchni bez `OPENAI_API_KEY` (zwraca `null`).

---

## Product Validation

- Assistant: użytkownik widzi **tryb** i **szacunek kredytów** bez nazw modeli — zgodne z intencją „no backend jargon”.  
- Legal Hub: przycisk streszczenia jest opisany jako **catalogue only** — spójne z ograniczeniem źródeł; nadal potrzebna jasność PO czy to wystarcza zamiast docelowego `file_search`.

---

## Risk Validation

- **Cost honesty:** `aiProductMeta` to **heurystyka** (1–5 / cap 8), nie podpięcie pod `creditsConfig` — ryzyko rozjazdu z realnym billingiem dla Assistanta do czasu wspólnego klucza feature.  
- **Deploy:** Zmiana domyślnych modeli może wymagać aktualizacji `.env` na VPS przed deployem.

---

## QC Verdict (operational)

Mapowanie do integracji — **wyłącznie** wg sekcji **Integration Status** poniżej (tekst kanoniczny PO / QC). Nie rozszerzać **Approved** na szerszy zakres niż lista „narrow slice”.

---

## Integration Status

**Approved For Integration:**

- the narrow slice only:
  - centralized OpenAI layer in lib/openai
  - Assistant AI product meta
  - optional Legal Hub grounded summary from catalog hits
  - related backend tests

**Not Approved For Integration:**

- the wider frontend / Practice / Settings / Community batch
- any scope still blocked by [`qc-decision-practice-modules-settings-community-2026-04-18.md`](./qc-decision-practice-modules-settings-community-2026-04-18.md)
- full Legal Hub file_search / vector-store retrieval

**Binding rules**

- Do not broaden the approval beyond the narrow slice.  
- Do not describe the wider batch as approved.  
- Proceed by integrating the approved narrow slice and continuing implementation on the rejected or incomplete wider scope.

---

## Escalation To Product Owner

**No** — decyzja podziału Approved / Not Approved jest zapisana powyżej (tekst kanoniczny); eskalacja tylko przy zmianie zakresu lub sprzeczności z deployem.

---

## Required Next Action

- `Owning agent: required work is executed in the repository, not in chat instead of implementation — see docs/squad/IMPLEMENTATION_EXECUTION_RULES.md §5a and Hard Rule 8.`

1. **Integracja:** wdrożyć / zmergować **tylko** wąski zakres z listy **Approved For Integration** (izolowany PR lub cherry-pick ścieżek: `backend/src/lib/openai/**`, `backend/src/config/ai.env.ts`, `backend/src/config/ai.models.ts`, powiązane importy w serwisach/routerach, `shared/assistant.ts` / `shared/assistant.js`, `frontend` wyłącznie pliki **Assistant** + **Legal Hub** związane z meta / grounded summary — bez reszty „wider batch”).  
2. **Kontynuacja prac:** szerszy frontend Practice / Settings / Community — **Not Approved** do czasu osobnego `READY FOR QC` i delty względem [`qc-decision-practice-modules-settings-community-2026-04-18.md`](./qc-decision-practice-modules-settings-community-2026-04-18.md).  
3. **Legal Hub docelowo:** `file_search` / vector-store — poza obecnym AFI; osobna dostawa + QC.

---

## Historia

| Data | Zmiana |
|------|--------|
| 2026-04-19 | Utworzenie — spot verification agentów; hierarchia werdyktów wąski vs szeroki zakres. |
| 2026-04-19 | Ponowna weryfikacja: `backend` `npx vitest run` → **25** plików, **115** testów OK; `new OpenAI(` tylko w `openai.client.ts`. |
| 2026-04-19 | **Integration Status** — ujednolicono z kanonicznym tekstem PO: AFI tylko narrow slice; NAFI wider batch + `qc-decision-practice-*` + pełny Legal `file_search`; reguły „do not broaden”. |
