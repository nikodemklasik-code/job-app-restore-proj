# Daily Warmup — Production Ready v1

## Route
`/warmup`

## Cel modułu
Lekka, szybka, rytualna praktyka o stałym koszcie i niskim friction.

## Czym ten moduł nie jest
- mini-interview z ciężkim setupem
- chat disguised as practice

## Co jeszcze musi być domknięte, żeby moduł był produkcyjny
- start w 1-2 klikach
- fixed cost by duration widoczny przed startem
- wynik z krótkim podsumowaniem i follow-up CTA
- bounded prompt/session logic
- handoff do Coach/Interview/Reports
- stabilna historia ukończeń

## Cross-flowy do domknięcia
- Dashboard -> Warmup
- Warmup -> Coach
- Warmup -> Interview
- Warmup -> Reports
- Billing -> Warmup fixed cost

## Pierwsze bounded slice'y produkcyjne
| ID | Slice | Zakres |
|---|---|---|
| W1 | Tier cards + fixed cost display | 15/30/45/60 sec |
| W2 | Quick result persistence | summary + streak/history if supported |
| W3 | Follow-up route-outs | Coach / Interview / repeat |
| W4 | Reports handoff | if warmup results are stored as reports |

## QC — minimalne testy akceptacyjne
- start w maks 2 klikach
- fixed cost widoczny
- warmup result zapisany
- follow-up CTA działa
- refresh nie gubi ostatniego wyniku

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
