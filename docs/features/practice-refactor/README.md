# Practice refactor — modular specs (Warmup · Coach · Interview · Negotiation)

**Obowiązujący podział prac (fazy, agenci 1–3):** [`../../squad/README.md`](../../squad/README.md) — ten folder to **specyfikacja modułów praktyki** pod Agenta **3** (fazy wg workboardu).

**Gdzie to jest**

| Co | Ścieżka |
|----|---------|
| **Ten folder** (modułowe `.md` + QC) | `docs/features/practice-refactor/` |
| **Podział na 3 deweloperów (wersja treści v1.1)** | [`../practice-modules-refactor-three-developer-split-v1.0.md`](../practice-modules-refactor-three-developer-split-v1.0.md) — sekcja *Który deweloper czyta który plik specyfikacji*; pod **Deweloper A / B / C** linki do speców (Warmup, Coach, Interview, Negotiation, shell+routing, billing); **QC:** [`files-order-qc-v1.0.md`](./files-order-qc-v1.0.md) |

**Imported:** content split from `Warmup_Coach_Interview_Negotiation_Refactor_Spec.md` (canonical full copy: [`_imported-full-spec-v1.0.md`](./_imported-full-spec-v1.0.md)).

## Jak to się układa — dwa poziomy, jeden podział (bez duplikacji treści)

**1. Dokument podziału** — [`practice-modules-refactor-three-developer-split-v1.0.md`](../practice-modules-refactor-three-developer-split-v1.0.md) (ścieżka: `docs/features/…`, **poza** folderem `practice-refactor/`).  
To **brief zespołowy**: proces, merge, **DoD**, tabela *Który deweloper czyta który plik specyfikacji*, rozbudowane sekcje **Deweloper A / B / C** z linkami do modułowych speców w tym folderze (Warmup, Coach, Interview, Negotiation, shell+routing, billing), QC z linkiem do [`files-order-qc-v1.0.md`](./files-order-qc-v1.0.md), oraz **kanoniczne polecenie po angielsku** dla wszystkich.

**2. Ten plik (`README.md`)** — **wejście do folderu** z samymi plikami specyfikacji (`practice-refactor/`).  
Tabela **Skrót** / kolumna *Specyfikacje (folder `practice-refactor/`)* to **ten sam układ A/B/C**, tylko jako **szybka lista plików** do otwarcia bez przewijania całego dokumentu podziału.

**Dwa celowe wejścia w ten sam plik podziału:** linia **„Pełny podział (3 dev, v1.1)”** poniżej **oraz** pierwszy wiersz tabeli *Gdzie to jest* (kolumna z linkiem do dokumentu podziału) — możesz zacząć od **procesu** (dokument podziału) albo od **listy modułów** (README).

**Wszyscy:** one-linery w [`developer-qc-one-liners-v1.0.md`](./developer-qc-one-liners-v1.0.md); **dłuższe wspólne polecenie EN** zostaje **tylko** w dokumencie podziału — jedna wersja źródłowa, bez dublowania w README.

**Podsumowanie:** jedna prawda o *kto co robi* = dokument podziału; ten README = **mapa folderu** + skrót do tych samych plików `.md`.

## Skrót

**Pełny podział (3 dev, v1.1):** [`../practice-modules-refactor-three-developer-split-v1.0.md`](../practice-modules-refactor-three-developer-split-v1.0.md)

| Deweloper | Specyfikacje (folder `practice-refactor/`) |
|-----------|-----------------------------------------------|
| **A** | [`daily-warmup-v1.0.md`](./daily-warmup-v1.0.md), [`shared-shell-routing-v1.0.md`](./shared-shell-routing-v1.0.md), [`files-order-qc-v1.0.md`](./files-order-qc-v1.0.md) |
| **B** | [`coach-v1.0.md`](./coach-v1.0.md), [`interview-v1.0.md`](./interview-v1.0.md), [`shared-shell-routing-v1.0.md`](./shared-shell-routing-v1.0.md) |
| **C** | [`negotiation-v1.0.md`](./negotiation-v1.0.md), [`billing-credits-v1.0.md`](./billing-credits-v1.0.md), [`files-order-qc-v1.0.md`](./files-order-qc-v1.0.md) |
| **Wszyscy** | [`developer-qc-one-liners-v1.0.md`](./developer-qc-one-liners-v1.0.md) + wspólne polecenie (**EN**) w [dokumencie podziału](../practice-modules-refactor-three-developer-split-v1.0.md) |

**Równoległy track:** Skill Lab + Job Radar — [`../skill-lab-job-radar-refactor/README.md`](../skill-lab-job-radar-refactor/README.md). Uzgodnijcie `creditsConfig` / Billing z Deweloperem **C** w obu trackach.

| Document | Scope |
|----------|--------|
| [`daily-warmup-v1.0.md`](./daily-warmup-v1.0.md) | Daily Warmup — rename, purpose, sections, credits, components, states |
| [`coach-v1.0.md`](./coach-v1.0.md) | Coach — purpose, modes, credits, components, states |
| [`interview-v1.0.md`](./interview-v1.0.md) | Interview — modes, credits, components, states |
| [`negotiation-v1.0.md`](./negotiation-v1.0.md) | Negotiation — rename, modes, credits, components, states |
| [`shared-shell-routing-v1.0.md`](./shared-shell-routing-v1.0.md) | Shared `practice-shell` + routing / nav naming |
| [`billing-credits-v1.0.md`](./billing-credits-v1.0.md) | Billing philosophy, allowance, screen, credit rules |
| [`files-order-qc-v1.0.md`](./files-order-qc-v1.0.md) | File list, implementation order, QC rules |
| [`developer-qc-one-liners-v1.0.md`](./developer-qc-one-liners-v1.0.md) | One-line dev + QC instructions |
