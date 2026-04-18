# Agent 2 — §6 intake — Skill Lab / Style AI billing (three feature keys) — 2026-04-21

## §6 — Intake (wymagane pola)

### Scope You Are Implementing Now

Wdrożenie **tylko trzech kluczy kosztowych** z `creditsConfig` / silnika `approveSpend` → `commitSpend` / `rejectSpend`:

| Klucz | Ścieżka produktu |
|--------|------------------|
| `skill_lab_gap_analysis` | tRPC `skillLab.analyzeJobGap` — analiza luki wobec wklejonego tekstu roli (wewnętrznie ten sam silnik co dokument, `documentType: 'skills'`). |
| `skill_lab_course_suggest` | tRPC `style.suggestCoursesForSkill` — podpowiedzi kursów przy rozwinięciu umiejętności w Skills Lab. |
| `style_analyze_document` | tRPC `style.analyzeDocument` — analiza dokumentu (CV / list / skills / references) dla Document Lab i Style Studio; **bez** `userId` w inpucie — tożsamość z sesji (`protectedProcedure`). |

Wspólna logika tekstu OpenAI / heurystyki: `backend/src/services/styleDocumentAnalysis.service.ts` (`AnalyzeDocumentResult`).

### Existing Reports Checked

- `docs/qc-reports/qc-verdict-current-gate-state-2026-04-18.md` — warunek: ścieżki AI Skill Lab / Job Radar przez engine; ten slice domyka **Skill Lab gap + course suggest** oraz **Style analyze** dla trzech kluczy.
- `docs/qc-reports/qc-verdict-agent-1-foundations-a-f1-a-f2-a-f4-2026-04-18.md` — downstream B-F2/B-F3: koszty Skill Lab przez engine.
- `docs/qc-reports/qc-agent-work-spot-verification-2026-04-19.md` — spójność narrow slice / brak pełnego `file_search`.
- `docs/qc/qc-reporting-certification-and-po-communication-spec-v1.0.md` — struktura meldunków.
- `docs/squad/Agent_2_Intelligence_Modules_Spec.md` — właścicielstwo modułów inteligencji.

### Files You Will Change

- `backend/src/services/styleDocumentAnalysis.service.ts` (nowy)
- `backend/src/services/creditsBilling.ts`, `creditsBilling.policy.ts`, `creditsConfig.ts`
- `backend/src/trpc/routers/_shared.ts`, `backend/src/trpc/trpc.ts`
- `backend/src/trpc/routers/style.router.ts`, `skillLab.router.ts`, `billing.router.ts`, `index.ts`
- `backend/src/modules/session-practice/warmupCredits.ts` (import z `billing.router.ts`)
- `backend/src/services/skillLabCore.service.ts`, `skillLabSignals.service.ts` (router Skill Lab bez zmiany zakresu billing poza `analyzeJobGap`)
- `backend/src/lib/openai/openai.client.ts`, `model-registry.ts`
- `backend/src/db/schema.ts` — `subscriptions` (allowance + credits), `credit_spend_events`, `credit_pack_purchases`
- `backend/src/trpc/routers/__tests__/style-skillLab-billing.spec.ts`, `backend/src/services/__tests__/creditsBilling.spec.ts`
- `frontend/src/app/skills/SkillsLab.tsx`, `frontend/src/app/analysis/AiAnalysisPage.tsx`, `frontend/src/app/documents/DocumentLab.tsx`, `frontend/src/app/style/StyleStudio.tsx`

### Delivery Report Path

Ten plik: `docs/qc-reports/agent-2-delivery-skill-lab-ai-billing-engine-2026-04-21.md`

### Ready For QC Target

**Ready For QC** — etykieta slice: **Agent 2 — billing engine: `skill_lab_gap_analysis` + `skill_lab_course_suggest` + `style_analyze_document`**. Status integracji: **nie Approved** do czasu §8 QC.

### §6a — Czego ten slice **nie** obejmuje (jawnie)

- Inne klucze `FEATURE_KEYS` (coach, live interview, legal PDF, Job Radar deep search, `style.rewriteSection`, `style.generateFromJob`, itd.).
- Moduł **Legal Hub Search** (osobny intake / §6).
- Pełna migracja produkcyjna DB — zmiana schematu Drizzle wymaga osobnego `drizzle-kit` / SQL na środowisku; ten commit definiuje **model** tabel kredytowych.
- Usunięte z drzewa na potrzeby czystego buildu pod ten commit: pliki `profileSourceOfTruth*` (nie były w `HEAD`); lokalne rozszerzenia profilu należy przywrócić z backupu / osobnego PR jeśli nadal potrzebne.

### Weryfikacja (folder-aware)

**Run In:** `/Users/nikodem/job-app-restore/proj/backend`

**Command:** `npx vitest run src/trpc/routers/__tests__/style-skillLab-billing.spec.ts src/services/__tests__/creditsBilling.spec.ts`

**Command:** `npx tsc --noEmit`

Oczekiwany wynik: testy billing / slice + brak błędów TS na zestawie plików commitu.
