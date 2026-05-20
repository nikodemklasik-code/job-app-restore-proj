# MultivoHub - Execution Progress Tracker (branch gptupdate)

Stan na: 2026-05-20

Ten plik jest roboczym trackerem wykonania glownego planu. Pokazuje, co jest domkniete, co jest czesciowe, czego brakuje i co blokuje integracje.

## Legenda

- zrobione = kodowo wdrozone
- czesciowe = wdrozone tylko dla czesci flow albo bez pelnej walidacji
- brak = niezaimplementowane w tym slice
- blocker = blokuje status integracyjny

## Glowny cel

Doprowadzic produkt do stanu, w ktorym 5 kluczowych przeplywow dziala stabilnie end to end:

1. Document Intake -> CV parse -> review -> approved Profile -> Style Studio / CV output
2. Profile -> Jobs Search / Job Radar -> Save / Apply -> Applications
3. Billing / Credits -> AI action -> credit deduction -> history / visibility
4. Interview / Coach / Skill Lab -> evidence / skill impact -> profile value
5. Deploy -> smoke test -> monitoring -> rollback readiness

## Audyt end-to-end: CV -> review -> approve/reject -> Profile -> downstream

Status: czesciowe / manual verification required.

### Zrobione

- CV upload przez DocumentLab.
- CV parse przez backendowy CV router.
- Latest parsed CV query.
- Review preview przed importem do profilu.
- Diff personal info: current value, parsed value, overwrite/fill/no-change.
- Diff sekcji: skills, experience, education, training.
- Approve/reject dla personal fields.
- Approve/reject dla sekcji.
- Backend importuje tylko zaakceptowane pola i sekcje.
- Rejected parser output nie jest zapisywany.
- Provenance imported_from_cv jest zapisywane dla zatwierdzonych zmian.
- Profile UI pokazuje badges: user_confirmed, imported_from_cv, ai_suggested, unknown.
- Style Studio czyta approved profile state, nie parser state.
- Approved CV PDF path jest oparty o profile data, nie ostatni upload CV.

### Czesciowe

- Profile truth contract jest rozbudowany, ale nie jest jeszcze udowodniony globalnie dla Jobs, Job Radar, Applications i Skill Lab.
- Parser state side-channel audit jest wykonany dla glownego flow Document/Profile/Style, ale wymaga pelnego lokalnego grep/build.
- Operacyjne pola profilu z planu nie sa w pelni mapowane z CV: languages, work values, target role, work setup, target industries.

### Brak

- Wersjonowanie dokumentow i rollback.
- Finalny system approved CV templates.
- Jobs / Job Radar / Applications jako jeden flow.
- Wspolny job lead model i statusy.
- Skill Lab evidence loop.
- Billing global credit visibility.
- Sentry, uptime monitoring i deploy smoke gate.

### Blocker

- Brak lokalnego builda i smoke testu.
- Brak CI statusow dla ostatnich commitow.
- Znane ryzyko backend builda: w backend/src/trpc/routers/cv.router.ts PERSONAL_FIELDS powinno byc const tuple dla Zod enum, a nie zwykla tablica typowana jako PersonalFieldKey[].

## Porownanie z raportem stanu projektu

Raport postepu z 2026-05-20 jest czesciowo nieaktualny wzgledem aktualnego gptupdate.

| Obszar | Status w starym raporcie | Status aktualny |
|---|---|---|
| CV preview gate | zrobione | zrobione |
| No silent overwrite | zrobione | zrobione kodowo, build pending |
| Document Lab review UI | zrobione | zrobione |
| Sekcje CV jako sumy | zrobione | zrobione lepiej: structural diff |
| Provenance danych | niezrobione | zrobione kodowo, build pending |
| Richer diff sekcji | niezrobione | zrobione kodowo |
| Profile truth contract | niezrobione/czesciowe | czesciowe |
| Style Studio sync | niezrobione | zrobione kodowo |
| Jobs/Radar/Applications | niezrobione | brak |
| Credits visibility | niezrobione | brak |
| Build/smoke/deploy gate | niezrobione | blocker |

## Strumien A - Source of Truth danych uzytkownika

Status: czesciowe.

Zrobione:

- Profile snapshot rozszerzony o provenance.
- Backend normalizuje provenance dla approved profile snapshot.
- Profile UI pokazuje provenance badges.
- CV import nie robi silent overwrite w glownej sciezce review.

Braki:

- Pelny mapping CV -> Profile dla wszystkich pol planu.
- Pelna historia zmian profilu.
- Globalne potwierdzenie, ze wszystkie downstream moduly czytaja approved profile.

Blocker:

- Build/smoke niepotwierdzony.

## Strumien B - Dokumenty i pipeline CV

Status: czesciowe / blisko zrobione dla core flow.

Zrobione:

- Upload dokumentu.
- Parse CV.
- Review diff.
- Approve/reject.
- Import tylko zatwierdzonych zmian.
- Style Studio z approved profile.

Braki:

- Wersjonowanie dokumentow.
- Powrot do poprzednich wersji.
- Finalne approved CV templates.

Blocker:

- Backend schema typing risk i brak build/smoke.

## Strumien C - Jobs, Job Radar, Applications

Status: brak.

Braki:

- Jobs jako jeden obszar z podwidokami Search/Saved/Radar/Applications.
- Wspolny model job lead.
- Unified statuses.
- Save Job -> Open Radar -> Create Application Draft.
- Draft applications loading/success/error/retry states.
- Review queue jako filtr Applications.

## Strumien D - Skill Lab, Interview, Coach, Case Practice

Status: brak.

Braki:

- Wspolny model evidence.
- Interview -> evidence tracking.
- Coach -> controlled save jako sugestie, nie silent write.
- Skill Lab na real approved profile data.
- Widoczny wplyw evidence na Jobs, Radar i CV.

## Strumien E - Legal, Negotiation, Salary Intelligence

Status: brak.

Braki:

- Salary Intelligence osadzone w Job Radar / Negotiation / Offer handling.
- Negotiation z kontekstu aplikacji albo oferty.
- Legal Hub jako kontekstowe CTA.
- Structured output: quick answer, strategy, risks, next action.

## Strumien F - Billing, visibility, deploy, monitoring

Status: brak.

Braki:

- Globalna widocznosc kredytow.
- Before-action cost preview.
- Transaction history.
- Low balance warning.
- Toasty zamiast alert we wszystkich modulach.
- Sentry frontend/backend.
- Uptime monitoring.
- Deploy smoke gate.

## Wymagana walidacja przed integracja

Manual build/test required:

- npm install
- npm run build
- npm run test:backend
- npm run test:frontend
- npm run smoke:local
- npm run build:backend
- npm run build:frontend

## Decyzja integracyjna

Not Approved For Integration until:

1. backend typing risk in CV import decision schema is patched,
2. manual build passes,
3. backend and frontend tests pass,
4. local smoke for CV -> review -> approve/reject -> Profile -> Style Studio passes.

## Kolejnosc dalszej egzekucji

1. Patch backend CV import decision schema typing.
2. Run manual build/test/smoke.
3. If green, mark Stream A/B core as zrobione.
4. Implement Jobs/Radar/Applications unification.
5. Implement Billing visibility and deploy gate.
6. Implement Skill Lab evidence loop.
