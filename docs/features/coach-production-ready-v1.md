# Coach — Production Ready v1

## Route
`/coach`

## Cel modułu
Strategiczny feedback i action plan, odrębny od Assistant i Interview.

## Czym ten moduł nie jest
- Assistant z innym promptem
- symulacja rozmowy

## Co jeszcze musi być domknięte, żeby moduł był produkcyjny
- oddzielny output schema
- jawne wejścia: interview summary, warmup result, case report, user concern
- depth modes i cost exposure
- action plan z next drills
- save to Reports
- clear route-outs do Skill Lab / Documents / next practice

## Cross-flowy do domknięcia
- Interview -> Coach
- Warmup -> Coach
- Case Practice -> Coach
- Coach -> Reports
- Coach -> Skill Lab
- Coach -> Documents

## Pierwsze bounded slice'y produkcyjne
| ID | Slice | Zakres |
|---|---|---|
| CO1 | Structured coach output v1 | sections + action plan |
| CO2 | Handoff from Interview/Warmup/Case Practice | context adapters |
| CO3 | Estimated cost + billing visibility | if paid |
| CO4 | Reports save + route-outs | history and next actions |

## QC — minimalne testy akceptacyjne
- coach output ma stałe sekcje
- handoff z upstream modułu działa
- if paid: estimated cost visible
- report zapisany i otwieralny
- route-outs prowadzą do realnych modułów

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
