# Skill Lab & Job Radar — refactor specs

**Obowiązujący podział prac (fazy):** [`../../squad/README.md`](../../squad/README.md) — Agent **2** (intelligence) obejmuje Skill Lab i Job Radar wg workboardu; ten folder = **specyfikacja produktowa** modułów.

**Gdzie to jest**

| Co | Ścieżka |
|----|---------|
| **Ten folder** (modułowe `.md` + QC) | `docs/features/skill-lab-job-radar-refactor/` |
| **Pełny import (verbatim z Downloads `Skill_Lab_And_Job_Radar_Refactor_Spec 2.md`)** | [`_imported-full-spec-v1.0.md`](./_imported-full-spec-v1.0.md) |
| **Podział na 3 deweloperów (polecenia + merge)** | [`../skill-lab-job-radar-refactor-three-developer-split-v1.0.md`](../skill-lab-job-radar-refactor-three-developer-split-v1.0.md) — tabela *Który deweloper czyta który plik MD*; sekcje Deweloper A / B / C; QC przez [`qc-files-instructions-v1.0.md`](./qc-files-instructions-v1.0.md) + [`developer-qc-one-liners-v1.0.md`](./developer-qc-one-liners-v1.0.md) |

---

## Jak to się układa (dwa poziomy)

1. **Dokument podziału** (poziom `docs/features/`) — [`skill-lab-job-radar-refactor-three-developer-split-v1.0.md`](../skill-lab-job-radar-refactor-three-developer-split-v1.0.md): brief zespołowy, wspólne polecenie (EN), tabela lektur, DoD, kolejność merge.
2. **Ten folder** — treść produktowa: Skill Lab, Job Radar, billing alignment, QC + pliki; **monolit** tylko jako kopia importu w [`_imported-full-spec-v1.0.md`](./_imported-full-spec-v1.0.md).

**One-linery dev + QC** są kanonicznie w [`developer-qc-one-liners-v1.0.md`](./developer-qc-one-liners-v1.0.md) (i w sekcjach 6–7 monolitu).

---

## Obowiązek pracy

**Macie pracować według tych dokumentów** — to jest źródło prawdy dla refaktoru Skill Lab i Job Radar (produkt, UI, kredyty, QC). Nie wdrażajcie „z głowy” sprzecznego layoutu z innymi modułami; granice modułów są w sekcjach *What must never be mixed*.

---

## Skrót (lektury w tym folderze)

**Pełny podział (3 dev):** [`../skill-lab-job-radar-refactor-three-developer-split-v1.0.md`](../skill-lab-job-radar-refactor-three-developer-split-v1.0.md)

| Deweloper | Specyfikacje (`skill-lab-job-radar-refactor/`) |
|-----------|------------------------------------------------|
| **A** | [`skill-lab-v1.0.md`](./skill-lab-v1.0.md), [`credits-billing-alignment-v1.0.md`](./credits-billing-alignment-v1.0.md), [`qc-files-instructions-v1.0.md`](./qc-files-instructions-v1.0.md) |
| **B** | [`job-radar-v1.0.md`](./job-radar-v1.0.md), [`credits-billing-alignment-v1.0.md`](./credits-billing-alignment-v1.0.md), [`qc-files-instructions-v1.0.md`](./qc-files-instructions-v1.0.md) |
| **C** | Wszystkie pliki `.md` w tym folderze + [`../practice-refactor/billing-credits-v1.0.md`](../practice-refactor/billing-credits-v1.0.md) |
| **Wszyscy** | [`developer-qc-one-liners-v1.0.md`](./developer-qc-one-liners-v1.0.md) + wspólne polecenie (**EN**) w [dokumencie podziału](../skill-lab-job-radar-refactor-three-developer-split-v1.0.md) |

---

## Rozbite specyfikacje

| Plik | Treść |
|------|--------|
| [`_imported-full-spec-v1.0.md`](./_imported-full-spec-v1.0.md) | Pełny monolit (verbatim `Skill_Lab_And_Job_Radar_Refactor_Spec 2.md`) — sekcje 1–7 |
| [`skill-lab-v1.0.md`](./skill-lab-v1.0.md) | Skill Lab — cel, sekcje, logika, kredyty, komponenty, granice |
| [`job-radar-v1.0.md`](./job-radar-v1.0.md) | Job Radar — widoki, karty, routing, kredyty, komponenty, granice |
| [`credits-billing-alignment-v1.0.md`](./credits-billing-alignment-v1.0.md) | Wspólne zasady credits-first z resztą produktu |
| [`qc-files-instructions-v1.0.md`](./qc-files-instructions-v1.0.md) | QC checklist, pliki do przeglądu (bez duplikacji one-linerów) |
| [`developer-qc-one-liners-v1.0.md`](./developer-qc-one-liners-v1.0.md) | Jednolinijkowe polecenie dev + QC |

---

## Powiązanie z innym refaktorem

Model kredytów i Billing: spójnie z [`../practice-refactor/billing-credits-v1.0.md`](../practice-refactor/billing-credits-v1.0.md) oraz wdrożeniem `BillingPage` / `billingStore` z tracku **practice-modules** — uzgodnijcie stałe kosztów w jednym miejscu (np. `lib/creditsConfig.ts`), żeby nie rozjechać liczb między zespołami.
