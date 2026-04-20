# Case Practice — Production Ready v1

## Route
`/case-practice`

## Cel modułu
Case-based practice module: analiza case promptu, odpowiedź użytkownika, timed session, evaluator feedback, report i handoff.

## Czym ten moduł nie jest
- wariant Interview bez odrębnej logiki
- luźny chat bez struktury

## Co jeszcze musi być domknięte, żeby moduł był produkcyjny
- jawny route i module identity
- case session state machine: draft/active/completed/abandoned/failed
- case prompt catalog lub generator z bounded domains
- structured evaluator output: framing, structure, reasoning, risks, recommendation
- billing policy jeśli sesja jest płatna
- report persistence i handoff do Coach/Reports
- clear distinction od Interview i Warmup

## Cross-flowy do domknięcia
- Dashboard -> Case Practice jako next skill drill
- Skill Lab -> Case Practice gdy wykryto gap reasoning/structuring
- Case Practice -> Coach dla pogłębionego feedbacku
- Case Practice -> Reports dla historii postępu
- Billing -> Case Practice jeśli kosztuje

## Pierwsze bounded slice'y produkcyjne
| ID | Slice | Zakres |
|---|---|---|
| C1 | Case setup + session shell | route, setup, start session, state machine |
| C2 | Evaluator output contract | structured feedback sections |
| C3 | Report persistence + Reports handoff | save/open report |
| C4 | Coach handoff + billing hardening | optional if paid |

## QC — minimalne testy akceptacyjne
- session start/complete/abandon
- structured feedback render
- report zapisuje się i otwiera z Reports
- jasny empty/error/loading state
- jeśli płatne: approve/commit/reject działa

## Definition of Done
- route działa stabilnie,
- moduł ma realne dane i zapisuje stan,
- deklarowany cross-flow działa end-to-end,
- billing/report/audit są domknięte tam, gdzie slice to deklaruje,
- empty/error/loading/populated są obsłużone,
- next step jest sensowny i prowadzi do realnej akcji.

## Wymagane sekcje w RFQ dla slice'a
- `Production readiness (this slice)`
- `Cross-flows touched`
- `In scope`
- `Out of scope`
- `Report path`
- `QC acceptance checks`

## Minimalny verdict QC
QC nie pyta "czy coś działało raz".
QC sprawdza:
- czy route działa,
- czy akcja trafia do backendu,
- czy stan przeżywa refresh,
- czy deklarowany cross-flow działa,
- czy billing/report/audit są domknięte tam, gdzie slice to deklaruje,
- czy agent nie rozszerzył scope'u poza bounded slice.
