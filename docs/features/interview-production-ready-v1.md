# Interview — Production Ready v1

## Route
`/interview`

## Cel modułu
Realistyczna sesja interview z hermetycznym billingiem, review odpowiedzi i summary report.

## Czym ten moduł nie jest
- ogólny coach chat
- warmup o wydłużonym czasie

## Co jeszcze musi być domknięte, żeby moduł był produkcyjny
- pełna state machine sesji i reconnect/failure handling
- jawny koszt przed startem
- approve/commit/reject na każdym kosztownym flow
- powiązanie z application/job context
- per-answer review i session summary
- report persistence + Reports handoff
- guard against hidden debits

## Cross-flowy do domknięcia
- Applications -> Interview dla stage interview
- Dashboard -> Interview jako recommended next step
- Interview -> Coach
- Interview -> Reports
- Interview -> Skill Lab
- Billing -> Interview preflight/ledger

## Pierwsze bounded slice'y produkcyjne
| ID | Slice | Zakres |
|---|---|---|
| I1 | Session lifecycle hardening | state machine + abandon/failure |
| I2 | Billing preflight and ledger parity | approve/commit/reject + visible cost |
| I3 | Report persistence + Reports handoff | summary saved and reopenable |
| I4 | Application context handoff | start from application/job |

## QC — minimalne testy akceptacyjne
- start session z kosztem
- abandon robi reject/rollback
- complete robi commit i zapis raportu
- start from application przenosi kontekst
- refresh nie gubi aktywnej sesji lub pokazuje recovery

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
