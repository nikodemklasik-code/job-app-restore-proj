# Delivery report — implementation slices (Agent 2 intelligence + related) — 2026-04-18

**Certyfikat QC:** nie został wydany w tej sesji. Ten dokument jest **materiałem wejściowym** dla QC zgodnie z *Required Delivery Format* w [`docs/squad/Squad_Workboard.md`](../squad/Squad_Workboard.md) oraz §6 w [`docs/squad/IMPLEMENTATION_EXECUTION_RULES.md`](../squad/IMPLEMENTATION_EXECUTION_RULES.md). Werdykt normatywny wyłącznie: **`Approved For Integration`** lub **`Not Approved`**.

---

## Scope Implemented

- **Legal Hub Search (backend):** indeks GOV.UK / ACAS / HMRC + procedura `search` / `scopeSummary`; brak scrapingu, tylko ranking po katalogu.
- **Legal Hub (frontend):** wyniki „Official sources” z tRPC przy zapytaniu ≥2 znaki.
- **Skill Lab (backend):** persystencja `skill_claims` — `listClaims`, `upsertClaim`, `syncFromProfileSkills` (SkillUp schema).
- **Skill Lab (frontend):** odznaki z DB + przycisk synchronizacji z profilem.
- **Job Radar (backend + frontend):** `listMyReports` (join raport + skan, filtr po użytkowniku); landing z listą i linkiem do raportu.
- **Profil / community (wcześniejszy slice, Agent B):** rozszerzenie `career_goals` + `user_preference_flags`, snapshot profilu, mutacje, downstream (discovery / auto-apply próg) — szczegóły w testach `profileSourceOfTruth.spec.ts` i migracji SQL w repo (jeśli dotyczy recenzji).

---

## Files Changed (skrót — pełna lista w git diff)

- `backend/src/modules/legal-hub-search/*` (catalog, service, types, test)
- `backend/src/trpc/routers/legalHub.router.ts`, `backend/src/trpc/routers/index.ts`
- `backend/src/trpc/routers/skillLab.router.ts`
- `backend/src/trpc/routers/jobRadar.router.ts`
- `backend/src/modules/job-radar/domain/repositories/radar-report.repository.ts`
- `backend/src/modules/job-radar/infrastructure/repositories/drizzle-radar-report.repository.ts`
- `frontend/src/app/legal/LegalHub.tsx`
- `frontend/src/app/skills/SkillsLab.tsx`
- `frontend/src/app/job-radar/JobRadarLandingPage.tsx`
- (Profil B) `backend/src/trpc/routers/profile.router.ts`, `backend/src/db/schema.ts`, `shared/profile.ts`, migracje pod `scripts/`, `frontend/src/app/jobs/JobsDiscovery.tsx`, `backend/src/services/emailAutoApply.ts`, `backend/src/worker.ts`, itd.

---

## Routes / APIs / Schemas Changed

| Obszar | Zmiana |
|--------|--------|
| tRPC `legalHub` | `scopeSummary` (query), `search` (query) |
| tRPC `skillLab` | `listClaims`, `upsertClaim`, `syncFromProfileSkills` (protected); istniejące public query bez zmiany kontraktu |
| tRPC `jobRadar` | `listMyReports` (protected query) |
| tRPC `profile` | `saveCareerGoals`, `saveSocialConsents`, `savePreferenceFlags`; rozszerzony `getProfile` / mutacje zwracające snapshot |
| DB | Kolumny `career_goals`, tabela `user_preference_flags` (migracja `scripts/migrate-agent-b-profile-community-v1.sql`); tabele SkillUp / Job Radar muszą istnieć na środowisku |

---

## Tests Added Or Updated

- `backend/src/modules/legal-hub-search/__tests__/legal-hub-search.service.spec.ts`
- `backend/src/services/__tests__/profileSourceOfTruth.spec.ts` (oraz pozostałe istniejące testy backendu — **107** testów `vitest run` OK w momencie sporządzenia raportu).

---

## Existing Reports Checked

- Przeszukano `docs/qc-reports/` (m.in. `qc-ai-live-smoke-2026-04-16.md`, wcześniejsze smoke) — brak werdyktu **Approved For Integration** dla tego samego zakresu przed tą dostawą.
- Przeszukano `docs/qc/` — brak sprzecznego obowiązku względem dostarczonych endpointów.
- Przeszukano `docs/squad/` (README, Workboard, spec Agent 2) — zakres zgodny z fazą / właścicielstwem modułów inteligencji.

---

## Existing QC Reports Checked

- Tak — ścieżki i status wymienione w sekcji **Existing Reports Checked** powyżej; brak otwartego **Rejected** dla identycznego diffu (nie znaleziono).

---

## Integration Notes

1. **MySQL:** przed produkcyjnym użyciem `skillLab.*` upewnić się, że tabele SkillUp (`skill_claims`, …) są wdrożone. Przed pełnym profilem B — uruchomić migrację kolumn / `user_preference_flags` tam, gdzie baza powstała ze starego `migrate-v2-new-tables.sql`.
2. **Job Radar:** `listMyReports` zakłada istniejące tabele `job_radar_reports` / `job_radar_scans` i poprawne `input_payload` (employerName, jobTitle, sourceUrl).
3. **Frontend:** wymaga wygenerowanych typów tRPC po deployu backendu (standardowy flow monorepo).

---

## Blockers

- Brak **ręcznego** werdyktu QC i (gdzie wymagane) sign-off PO — poza zakresem kodu.
- Środowiska bez migracji / bez tabel modułowych zwrócą błędy runtime na odpowiednich procedurach (nie blokuje recenzji kodu, blokuje **Approved** na produkcji do czasu DB).

---

## Ready For QC

**Tak** — pod warunkiem sprawdzenia **git diff** + **migracji DB** na docelowym środowisku + krótkiego smoke (Legal Hub search, Skill Lab sync, Job Radar lista po zalogowaniu).  
**Certyfikowanie:** wyłącznie po formalnym przeglądzie przez rolę QC wg `Quality_Control_Developer_Spec.md`.

---

## Historia

| Data | Opis |
|------|------|
| 2026-04-18 | Utworzono raport dostawy pod bramkę QC (implementacja w repo; brak samodzielnego certyfikatu). |
