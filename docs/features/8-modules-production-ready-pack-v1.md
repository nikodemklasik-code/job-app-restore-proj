# 8 Modules — Production-Ready Pack v1

Ten pakiet domyka osiem wskazanych modułów w formie repo-ready:
- Legal Hub
- Skill Lab
- Case Practice
- Interview
- Coach
- Daily Warmup
- Negotiation
- Job Search

## Co jest w środku
Dla każdego modułu jest osobny plik z:
- celem i granicą modułu,
- definicją production-ready,
- brakami do domknięcia,
- cross-flowami,
- pierwszymi bounded slice’ami,
- testami do QC,
- DoD.

## Ważna zasada
Production-ready nie znaczy:
- route się renderuje,
- coś odpowiada,
- agent napisał "done".

Production-ready znaczy:
- realne dane,
- trwały zapis stanu,
- billing jeśli dotyczy,
- reportability / auditability jeśli dotyczy,
- edge-case handling,
- sensowny next step,
- domknięte cross-flowy dla deklarowanego slice'a.

## Pliki
- `docs/features/legal-hub-production-ready-v1.md`
- `docs/features/skill-lab-production-ready-v1.md`
- `docs/features/case-practice-production-ready-v1.md`
- `docs/features/interview-production-ready-v1.md`
- `docs/features/coach-production-ready-v1.md`
- `docs/features/daily-warmup-production-ready-v1.md`
- `docs/features/negotiation-production-ready-v1.md`
- `docs/features/job-search-production-ready-v1.md`
- `docs/squad/8-MODULES_FIRST_PRODUCTION_SLICES.tsv`

## Pozostałe screeny (osobny pakiet)

Dashboard, Profile, Applications, Billing, Settings i pozostałe powierzchnie produktowe są w [`remaining-screens-production-ready-pack-v1.md`](./remaining-screens-production-ready-pack-v1.md) + TSV `REMAINING-SCREENS_*` — zobacz [`../squad/remaining-screens-production-ready-bundle/README.md`](../squad/remaining-screens-production-ready-bundle/README.md).

## Uwaga o "Case Practice"
W aktualnych materiałach repo nie było jawnie opisanego modułu `Case Practice`.
Ten pakiet traktuje go jako osobny moduł Practice do case-based sessions:
- case prompt
- structured answer
- timed response
- evaluator feedback
- report
- handoff do Coach / Reports.
