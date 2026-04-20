# Job Search — Production Ready v1

## Route
`/jobs`

## Cel modułu
Praktyczne job discovery z profile-driven matching, source transparency i downstream actions.

## Czym ten moduł nie jest
- losowy feed ofert
- lista bez saved/hide/add-to-applications

## Co jeszcze musi być domknięte, żeby moduł był produkcyjny
- provider/source transparency
- deduplication across providers
- saved/hidden/applied persistence
- partial failure handling
- basic fit/relevance note
- clear downstream actions: Radar / Applications / Documents
- filters zsynchronizowane z profilem i job sources settings

## Cross-flowy do domknięcia
- Profile -> Job Search
- Settings/Job Sources -> Job Search
- Job Search -> Job Radar
- Job Search -> Applications
- Job Search -> Documents
- Job Search -> Assistant

## Pierwsze bounded slice'y produkcyjne
| ID | Slice | Zakres |
|---|---|---|
| J1 | Results snapshot + source badges | stable DTO and provider badges |
| J2 | Save/hide/add-to-applications | durable actions |
| J3 | Dedup + relevance note | provider aggregation hardening |
| J4 | Radar handoff + filter/profile sync | cross-flow closure |

## QC — minimalne testy akceptacyjne
- save/hide persists after refresh
- add to applications tworzy pipeline item
- dedup nie pokazuje duplikatów tej samej oferty
- partial provider failure nie zabija całości
- Radar handoff przenosi właściwy job id

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
