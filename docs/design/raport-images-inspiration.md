# Raport images — inspiration index

**Source folder (local, not in git):** `/Users/nikodem/Downloads/raport/images/`  
**Related wireframe (HTML in raport):** `/Users/nikodem/Downloads/raport/screen-previews.txt` — rename to `.html` and open in a browser for interactive screen picker.

Files in `images/` are mostly **WebP** payloads with a `.png` extension (VP8). Use local preview (Finder, VS Code, browser) for pixel review.

## Mock catalogue → product direction

| Asset | Inspiration for product / UI |
|-------|------------------------------|
| `multivohub-ui-01-cv-generation.png` | Document **workspace**: preview + generation actions, not form-only. |
| `multivohub-ui-02-fit-score.png` | One **dominant fit** signal + short context — avoid text walls. |
| `multivohub-ui-03-interview-practice.png` | **Session flow**: setup → live practice → summary; exam pressure, not flat Q&A. |
| `multivohub-ui-04-auto-apply.png` | **Risk transparency** (what runs, what is blocked) aligned with thresholds. |
| `multivohub-ui-05-fit-analytics.png` | Comparative **analytics layer** — Job Radar, tiles, employer story. |
| `multivohub-ui-06-scam-detection.png` | **Trust states** (“why this warning”) shared language with Job Radar. |
| `multivohub-ui-07-negotiation-coach.png` | **Script + next move** under pushback; matches Negotiation module. |
| `multivohub-ui-08-email-integration.png` | **First-class integration** panel: status, errors, retry — Applications. |
| `multivohub-ui-09-daily-warmup.png` | Short **ritual** + light streak — Case Practice anti-hollow gamification. |
| `multivohub-ui-10-skills-lab.png` | **Skill + evidence + course** tiles — Growth Plan / milestones. |
| `multivohub-ui-11-outcome-learning.png` | **Outcome bridge** — AI Analysis ↔ “what changed after action”. |
| `multivohub-ui-12-accessibility.png` | **Contrast / typography / focus** — tie to app themes (e.g. visually impaired). |
| `fit-score-visualization.png` | Marketing / dashboard **hero metric** treatment. |
| `interview-preparation.png` | Onboarding or Interview entry **story frame**. |
| `ai-features-illustration.png` | Landing / **AI capability map** one-pager. |
| `hero-background.png` | Marketing hero **atmosphere** (do not ship 1:1 as app chrome without PO decision). |

## Values and philosophy (in repo)

Decks committed for **copy, positioning, and philosophy alignment** (not pixel mocks):

- `docs/design/inspiration/multivohub-values/` — see `README.md` there for `Multivohub_katalog_wartosci_i_filozofii.pptx` (PL) and `Multivohub_values_philosophy_EN_edited.pptx` (EN).

## Wireframe tokens (`screen-previews.txt`)

Useful defaults to align mocks with the live shell (if PO chooses this direction):

- App canvas background: `#f0f2f5`
- Sidebar width: `200px`
- Primary: `#378add`
- Card + soft shadow pattern for “workspace” feel

Current MultivoHub app leans **indigo**; converging to mock blue is a **single PO decision** (tokens in `frontend/src/index.css` / theme store).

## Komposo HTML bundle (local)

**Folder:** `/Users/nikodem/Downloads/raport/komposo-2026-04-09T21-13-21-848Z/`  
**What it is:** statyczne strony HTML z klasami Tailwind — szkielet **AppShell** (sidebar + treść), wiele ekranów (`1-auth-page.html` …) oraz osobne pliki **specyfikacji motywów** (`24-visually-impaired-…` … `29-dark-…`). W katalogu są też `setup.md` i `tailwind-imports-best-practice.md` (reminder pod Vite: `@tailwind` w `index.css`, `content` w config).

**Kierunek wizualny (do spięcia z kodem):**

- **Powłoka:** `flex h-screen`, tło canvas `bg-slate-50`, tekst `text-slate-900`, sidebar ~`w-72`, `bg-white`, `border-slate-200`, subtelny cień — spójne z normą [`unified-app-layout-and-theme-standard-v1.0.md`](../policies/unified-app-layout-and-theme-standard-v1.0.md) (max-width treści, jeden chrome).
- **Akcent produktowy:** **indigo** (np. aktywny nav, gradient marki) — zgodne z obecną linią aplikacji; nie mieszać losowo z `blue-*` z innych plików eksportu bez decyzji tokenowej.
- **Uwaga na niespójności eksportu:** część plików motywów używa innych skal (`gray-*`, placeholder typu „Bez” w nawigacji) — traktować jako **eksplorację**, a kanoniczne zachowanie motywów utrzymywać w `themeStore` + `.theme-*` w repo.

## Decki PPTX (local — treść „dlaczego”, nie siatka pikseli)

Ścieżki względem `Downloads/raport/` (sprawdzone na dysku użytkownika):

- `Multivohub_katalog_wartosci_i_filozofii.pptx` — **PL:** wartości i filozofia → ton komunikacji, hierarchia przekazów, co jest „święte” w brandzie.
- `Multivohub_values_philosophy_EN_edited.pptx` — **EN:** to samo dla rynków anglojęzycznych i spójności copy z UI EN.
- `mitigation_investor_partner_deck.pptx` — **nie znaleziono** w `Downloads/raport/` przy przeglądzie katalogu; może być w innym folderze — po dodaniu ścieżki można tu dopisać jedną linię (mitigation / partner / investor = **narracja ryzyka i partnerstwa**, nie styl komponentów).

**Jak używać decków przy produkcie www:** ustalenie **priorytetów modułów** i języka wartości (np. zaufanie, neuroróżnorodność, przejrzystość ryzyka) → potem **Visual Consistency Owner** tłumaczy to na tokeny, typografię i checklistę motywów; nie kopiować slajdów 1:1 jako layoutu aplikacji bez PO.

## Pisownia marki

**Kanonicznie w UI i nowych materiałach:** **MultivoHub** (wielka litera **V** w „Vo”, **H** w „Hub”). W nazwach historycznych plików (`Multivohub_…`) nie trzeba zmieniać nazw dyskowych; w treści produktu unikać losowych wariantów (`MultiVoHub`, `multivohub` w nagłówkach) — Owner + copy QA.

## Next steps (optional)

1. Export 3–5 key mocks as **true PNG/JPG** for design review in PRs.  
2. Map each mock to a **route + checklist row** in `docs/features/19-screens-for-users-and-agents.md` or a QC matrix.  
3. Do **not** commit large binaries to git unless the repo policy allows an `assets/` pack with LFS.
