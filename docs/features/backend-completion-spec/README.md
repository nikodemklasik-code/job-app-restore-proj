# Backend completion — roadmap + QC (modular specs)

**Obowiązujący podział prac (fazy, agenci 1–3):** [`../../squad/README.md`](../../squad/README.md) — mapowanie: Agent **1** (foundations), **2** (intelligence), **3** (practice + prefs); ten folder = **roadmap techniczny backendu** i checklisty QC, uzupełnienie pod implementację.

**Gdzie to jest**

| Co | Ścieżka |
|----|---------|
| **Ten folder** | `docs/features/backend-completion-spec/` |
| **Pełny monolit (§1–14)** | [`_imported-full-spec-v1.0.md`](./_imported-full-spec-v1.0.md) |
| **Podział na 3 agentów (zakres + merge + lektury)** | [`../backend-completion-three-developer-split-v1.0.md`](../backend-completion-three-developer-split-v1.0.md) |

**Spójność z frontendem / produktem:** [`../practice-refactor/billing-credits-v1.0.md`](../practice-refactor/billing-credits-v1.0.md), [`../practice-refactor/README.md`](../practice-refactor/README.md), [`../skill-lab-job-radar-refactor/README.md`](../skill-lab-job-radar-refactor/README.md).

---

## Jak to się układa (dwa poziomy)

1. **Dokument podziału** — [`backend-completion-three-developer-split-v1.0.md`](../backend-completion-three-developer-split-v1.0.md): trzy agenty (A/B/C), kolejność prac zgodna z [`priority-order-v1.0.md`](./priority-order-v1.0.md), DoD, wspólne polecenie (EN).
2. **Ten folder** — modułowe specyfikacje + monolit; **kanoniczne one-linery** w [`developer-qc-one-liners-v1.0.md`](./developer-qc-one-liners-v1.0.md).

---

## Skrót — który agent czyta które pliki

**Pełny podział:** [`../backend-completion-three-developer-split-v1.0.md`](../backend-completion-three-developer-split-v1.0.md)

| Agent | Główne specyfikacje (`backend-completion-spec/`) |
|-------|---------------------------------------------------|
| **A** | [`credits-billing-engine-v1.0.md`](./credits-billing-engine-v1.0.md), [`deploy-integrity-guards-v1.0.md`](./deploy-integrity-guards-v1.0.md) |
| **B** | [`profile-source-of-truth-v1.0.md`](./profile-source-of-truth-v1.0.md), [`community-settings-consent-v1.0.md`](./community-settings-consent-v1.0.md) |
| **C** | [`skill-lab-backend-v1.0.md`](./skill-lab-backend-v1.0.md), [`legal-hub-search-backend-v1.0.md`](./legal-hub-search-backend-v1.0.md), [`session-modules-backend-v1.0.md`](./session-modules-backend-v1.0.md), [`job-radar-backend-note-v1.0.md`](./job-radar-backend-note-v1.0.md) |
| **Wszyscy** | [`current-status-v1.0.md`](./current-status-v1.0.md), [`priority-order-v1.0.md`](./priority-order-v1.0.md), [`qc-method-v1.0.md`](./qc-method-v1.0.md), [`qc-checklist-by-module-v1.0.md`](./qc-checklist-by-module-v1.0.md), [`definition-of-done-v1.0.md`](./definition-of-done-v1.0.md), [`developer-qc-one-liners-v1.0.md`](./developer-qc-one-liners-v1.0.md) + polecenie (**EN**) w [dokumencie podziału](../backend-completion-three-developer-split-v1.0.md) |

---

## Indeks plików

| Plik | Treść |
|------|--------|
| [`current-status-v1.0.md`](./current-status-v1.0.md) | Stan ok. 60–70% tech / 35–45% produkt |
| [`credits-billing-engine-v1.0.md`](./credits-billing-engine-v1.0.md) | §1 — silnik kredytów i billing |
| [`profile-source-of-truth-v1.0.md`](./profile-source-of-truth-v1.0.md) | §2 — profil jako źródło prawdy |
| [`skill-lab-backend-v1.0.md`](./skill-lab-backend-v1.0.md) | §3 — logika Skill Lab |
| [`legal-hub-search-backend-v1.0.md`](./legal-hub-search-backend-v1.0.md) | §4 — Legal Hub search |
| [`session-modules-backend-v1.0.md`](./session-modules-backend-v1.0.md) | §5 — Warmup / Coach / Interview / Negotiation |
| [`community-settings-consent-v1.0.md`](./community-settings-consent-v1.0.md) | §6 — community, ustawienia, zgody |
| [`deploy-integrity-guards-v1.0.md`](./deploy-integrity-guards-v1.0.md) | §7 — strażniki deploy |
| [`job-radar-backend-note-v1.0.md`](./job-radar-backend-note-v1.0.md) | §8 — Job Radar (najsilniejszy obszar, przypomnienie QC) |
| [`priority-order-v1.0.md`](./priority-order-v1.0.md) | §9 — kolejność priorytetów |
| [`qc-method-v1.0.md`](./qc-method-v1.0.md) | §10 — metoda QC (3 warstwy) |
| [`qc-checklist-by-module-v1.0.md`](./qc-checklist-by-module-v1.0.md) | §11 — checklista moduł po module |
| [`definition-of-done-v1.0.md`](./definition-of-done-v1.0.md) | §12 — Definition of Done |
| [`developer-qc-one-liners-v1.0.md`](./developer-qc-one-liners-v1.0.md) | §13–14 — one-linery dev + QC |
| [`_imported-full-spec-v1.0.md`](./_imported-full-spec-v1.0.md) | Pełny dokument §1–14 |
