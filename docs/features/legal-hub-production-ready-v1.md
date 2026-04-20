# Legal Hub — Production Ready v1

## Route
`/legal lub /legal/search`

## Cel modułu
Source-restricted legal research layer oparty o approved sources, jawny scope, transparent answer i PDF export.

## Czym ten moduł nie jest
- otwarty legal chatbot
- open web search by default
- gwarancja outcome prawnego

## Co jeszcze musi być domknięte, żeby moduł był produkcyjny
- jawna kontrola source scope per source group
- visible active source pills i mode badge
- structured answer contract: Short Answer / What The Sources Say / How This May Apply / What Is Still Unclear / When To Seek Formal Advice / Sources Used / Search Scope
- backend retrieval path oparty o approved sources, nie fallback na open web
- PDF export z disclaimerem i bez wewnętrznych identyfikatorów
- obsługa unsupported scope i jawne komunikaty o ograniczeniach
- test prompt guards przeciw invented certainty

## Cross-flowy do domknięcia
- Dashboard -> Legal Hub jako entry point do trust/legal support
- Legal Hub -> PDF export / personal records
- Legal Hub -> Reports tylko jeśli zapis wyników jest jawnie wspierany
- Legal Hub -> Billing tylko jeśli deep mode / cięższa analiza jest realnie płatna

## Pierwsze bounded slice'y produkcyjne
| ID | Slice | Zakres |
|---|---|---|
| L1 | Source scope UI + search scope summary | toggle core/optional groups, active pills, mode badge, bez pełnego deep retrieval |
| L2 | Structured answer contract + sources used panel | backend/FE mapper do sekcji odpowiedzi |
| L3 | PDF export + disclaimer | eksport zgodny ze specem |
| L4 | Approved retrieval hardening | source-registry mapping, no-open-web default, unsupported scope guard |

## QC — minimalne testy akceptacyjne
- zmiana toggla zmienia Search Scope
- odpowiedź zawsze renderuje wymagane sekcje
- active sources są widoczne przed i po searchu
- PDF zawiera disclaimer i scope, nie zawiera debug/meta ids
- unsupported query nie udaje pewności

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
