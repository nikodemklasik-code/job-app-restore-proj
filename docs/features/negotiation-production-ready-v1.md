# Negotiation — Production Ready v1

## Route
`/negotiation`

## Cel modułu
Osobny moduł do strategii, draftów odpowiedzi i roleplay negocjacyjnego.

## Czym ten moduł nie jest
- Coach z etykietą negotiation
- Interview question loop

## Co jeszcze musi być domknięte, żeby moduł był produkcyjny
- route/module identity i własne DTO
- offer context, expectations, constraints
- mode separation: strategy / draft / roleplay
- cost handling per mode
- save to application notes/documents
- structured outputs: position, counter, fallback, risks
- powiązanie z offer stage

## Cross-flowy do domknięcia
- Applications (offer stage) -> Negotiation
- Profile salary values -> Negotiation
- Negotiation -> Reports
- Negotiation -> Documents for reply draft
- Billing -> Negotiation

## Pierwsze bounded slice'y produkcyjne
| ID | Slice | Zakres |
|---|---|---|
| N1 | Negotiation setup + mode selector | context form and modes |
| N2 | Structured output contract | strategy, counter, fallback |
| N3 | Save to application notes/documents | downstream persistence |
| N4 | Billing hardening + offer stage handoff | if paid |

## QC — minimalne testy akceptacyjne
- każdy mode renderuje właściwy output
- offer context wpływa na odpowiedź
- save do applications/documents działa
- if paid: cost visible and ledgered
- unsupported/no-offer state ma sensowny fallback

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
