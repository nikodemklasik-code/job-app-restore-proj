# Skill Lab — Production Ready v1

## Route
`/skills`

## Cel modułu
Warstwa sygnałów kompetencyjnych, wartości rynkowej i planu wzrostu użytkownika.

## Czym ten moduł nie jest
- losowe LLM summary bez evidence
- motywacyjny ekran bez danych

## Co jeszcze musi być domknięte, żeby moduł był produkcyjny
- evidence model łączący profil, CV, jobs i practice outcomes
- jawne value bands i salary impact
- underused skills z uzasadnieniem
- verification hints i evidence hints
- powiązanie z growth actions i course mapping
- route-out do Documents / Jobs / Practice
- stabilne DTO dla sygnałów i rekomendacji

## Cross-flowy do domknięcia
- Profile/Documents/Jobs/Practice -> Skill Lab jako inputs
- Skill Lab -> Documents dla wzmocnienia CV
- Skill Lab -> Job Search dla targetowania rynku
- Skill Lab -> Case Practice / Interview dla drills opartych o skill gaps
- Skill Lab -> Reports jeśli wynik ma być historyzowany

## Pierwsze bounded slice'y produkcyjne
| ID | Slice | Zakres |
|---|---|---|
| S1 | Signals snapshot v1 | skills, bands, salary impact, evidence hints |
| S2 | Underused skills + recommendations | wyjaśnialne rekomendacje i route-outs |
| S3 | Course mapping + growth actions | powiązania skills -> actions |
| S4 | Practice handoff | drill recommendation do Case Practice / Interview |

## QC — minimalne testy akceptacyjne
- każdy skill signal ma source/evidence hint
- rekomendacja prowadzi do realnego route
- brak danych wejściowych daje sensowny empty state
- zmiana profilu/CV odświeża signals snapshot

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
