Completed Work
- Ujednolicono backend Assistant do jednego kanonicznego źródła meta (`buildAssistantResponseMeta`) dla `intent`, `actions`, `routes`, `safetyNotes`, `complianceFlags`, `nextBestStep`.
- Usunieto zduplikowane sciezki inferencji z `assistant.router` (lokalna inferencja intent/actions/routes/safety nie jest juz wykorzystywana).
- Utrzymano kontrakt odpowiedzi dla `sendMessage` i `getHistory` (`aiRecord.meta` + `structured`) oraz spojny ksztalt danych zgodny z `shared/assistant.ts`.
- Domknieto legal/safety layer dla Case Practice w prompt policy i runtime behavior (prefix safety note dla poziomow `warning`/`block`).
- Naprawiono deterministyczna walidacje intentu w `buildAssistantResponseMeta` przez lokalny `Set` (unika runtime drift miedzy ESM a test runnerem).
- Dodano testy Vitest dla kontraktu meta i safety (`assistant-meta.spec.ts`).

Changed Files / Modules
- `backend/src/trpc/routers/assistant.router.ts`
- `backend/src/services/openai.ts`
- `shared/assistant.ts`
- `backend/src/services/__tests__/assistant-meta.spec.ts`

Result
- `sendMessage` zwraca deterministyczny payload:
  - `aiRecord.meta.detectedIntent`
  - `aiRecord.meta.suggestedActions`
  - `aiRecord.meta.routeSuggestions`
  - `aiRecord.meta.contextRefs`
  - `aiRecord.meta.safetyNotes`
  - `aiRecord.meta.complianceFlags`
  - `aiRecord.meta.nextBestStep`
  - `structured` (`conversation`, `relevantContext`, `suggestedActions`, `nextBestStep`, `routeSuggestions`, `safetyNotes`)
- `getHistory` zwraca `meta` dla rekordow assistant w tym samym modelu kontraktu bez dryfu pol.
- Safety dla promptow wrazliwych (`tribunal`, `ACAS`, `discrimination`, `harassment`, `emergency`) jest widoczne i egzekwowane.

How To Verify
- `cd /Users/nikodem/job-app-restore/proj && npm run build:backend`
- `cd /Users/nikodem/job-app-restore/proj && npm run build:frontend`
- `cd /Users/nikodem/job-app-restore/proj/backend && npm test`
- Wyslij przez `assistant.sendMessage` zapytanie z frazami:
  - `employment tribunal`, `ACAS`, `discrimination`, `harassment`, `emergency`
  - zweryfikuj obecne `meta.safetyNotes` i `meta.complianceFlags`
- Wyslij zapytania standardowe:
  - `help me improve cv`, `mock interview`, `salary negotiation`
  - zweryfikuj `detectedIntent`, `suggestedActions`, `routeSuggestions`, `nextBestStep`
- Wywolaj `assistant.getHistory` i potwierdz spojny ksztalt `meta` dla rekordow assistant po reloadzie.

Known Limitations / Follow-Up
- Kontekst `contextRefs` nadal zawiera czesc domenowa (mode/source) dopinana w routerze, co jest celowe dla kontekstu runtime i nie zmienia kanonicznego buildera dla inferencji meta.
- Do pelnej akceptacji produkcyjnej wymagany jest pass integracyjny Agent C (A+B E2E) po stronie UI.

Status
- READY FOR QC
