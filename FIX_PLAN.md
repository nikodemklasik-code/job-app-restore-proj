# Plan Naprawy - May 2, 2026

## Problemy do naprawienia:

### 1. Job Radar Report - Flip Cards ze Score Drivers ✅
**Problem:** Używamy prostych kart zamiast flip cards z detalami
**Rozwiązanie:** 
- Zamienić `ScoreCard` na `ScoreCardsGrid` 
- Przekazać `scoreDrivers` z backendu
- Backend już zwraca `scoreDrivers` w `getReport`

### 2. Przyciski Aplikacji Nie Działają ⚠️
**Problem:** "Aplikuj", "Create Resume", "Tailor Resume" nie przekierowują
**Lokalizacja:** `JobCardExpanded.tsx`, `JobsDiscovery.tsx`
**Handlery:**
- `handleCreateDraft` - tworzy draft i nawiguje do `/applications`
- `handleTailorResume` - tworzy draft + generuje dokumenty, nawiguje do `/applications`
- `handleStartRadarScan` - startuje scan, nawiguje do `/jobs/radar/:scanId`

**Do sprawdzenia:**
- Czy mutacje się wykonują
- Czy nawigacja działa
- Czy toast notifications pokazują się

### 3. Fit Score Modal - Wyjaśnienie Dlaczego Pasuje ✅
**Problem:** Modal pokazuje tylko score, brak wyjaśnienia
**Rozwiązanie:**
- Modal `ExplainFitModal` już istnieje w `JobsDiscovery.tsx`
- Pokazuje: strengths, gaps, advice, scam warning
- Trzeba dodać kliknięcie na fit score badge w `JobCardCompact`

### 4. Saved Jobs - Gdzie Trafiają ❌
**Problem:** Brak strony z zapisanymi ofertami
**Rozwiązanie:**
- Stworzyć `/jobs/saved` route
- Komponent `SavedJobs.tsx`
- Query `api.jobs.getSavedJobs` już istnieje
- Dodać link w nawigacji

### 5. Email Sending - Nielogiczne ❌
**Problem:** Wysyłanie email z aplikacji jest nielogiczne
**Lokalizacja:** `backend/src/trpc/routers/applications.router.ts` - `sendByEmail`
**Do sprawdzenia:**
- Co jest w emailu
- Jaki jest flow UX
- Co użytkownik widzi

### 6. Job Radar Report - Lepsze Wyróżnienie Opisu Pracy ❌
**Problem:** Opis pracy nie ma struktury jak na oryginalnej stronie
**Rozwiązanie:**
- Parsować opis na sekcje (Requirements, Responsibilities, Benefits)
- Wyświetlać w zorganizowanych sekcjach
- Dodać do `JobRadarReport.tsx`

## Kolejność naprawy:

1. ✅ Job Radar Report - flip cards (PRIORYTET 1)
2. ✅ Fit score modal - dodać onClick (PRIORYTET 1)
3. ⚠️ Przyciski aplikacji - sprawdzić i naprawić (PRIORYTET 1)
4. ❌ Saved jobs page (PRIORYTET 2)
5. ❌ Email sending review (PRIORYTET 2)
6. ❌ Job description structure (PRIORYTET 3)
