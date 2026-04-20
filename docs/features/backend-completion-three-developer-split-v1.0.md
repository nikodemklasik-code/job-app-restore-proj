# Backend completion — podział na 3 agentów (v1.0)

> **Uwaga:** Kanoniczna tablica faz — [`../squad/README.md`](../squad/README.md). Poniżej: **alternatywny widok A/B/C** pod sam backend (merge w `backend/`); dostosuj się do faz Agent 1/2/3 z workboardu.

**Źródło:** [`backend-completion-spec/`](./backend-completion-spec/README.md) (monolit + pliki rozbite).

**Backend:** `cd /Users/nikodem/job-app-restore/proj/backend && npm run build` przed merge do wspólnej gałęzi.

---

## Wspólne polecenie (wklej każdemu — EN)

```text
Complete the backend by prioritizing credits-and-billing, profile as source-of-truth, Skill Lab value logic, Legal Hub Search backend, and the session-boundary cleanup for Warmup, Coach, Interview, and Negotiation, and ensure each module is product-complete rather than only technically runnable.
```

**QC (EN):**

```text
Validate backend work not only for technical correctness but also for product completion, downstream behavioural impact, cost honesty, source restriction integrity, consent enforcement, and deploy safety.
```

Kanoniczna kopia one-linerów: [`backend-completion-spec/developer-qc-one-liners-v1.0.md`](./backend-completion-spec/developer-qc-one-liners-v1.0.md).

---

## Który agent czyta który plik MD

| Agent | Główny zakres implementacji | Lektury obowiązkowe (`docs/features/backend-completion-spec/`) | Wspólne dla wszystkich |
|-------|----------------------------|----------------------------------------------------------------|-------------------------|
| **A** | Kredyty / billing + strażniki deploy | [`credits-billing-engine-v1.0.md`](./backend-completion-spec/credits-billing-engine-v1.0.md) · [`deploy-integrity-guards-v1.0.md`](./backend-completion-spec/deploy-integrity-guards-v1.0.md) | [`current-status-v1.0.md`](./backend-completion-spec/current-status-v1.0.md) · [`priority-order-v1.0.md`](./backend-completion-spec/priority-order-v1.0.md) · [`qc-method-v1.0.md`](./backend-completion-spec/qc-method-v1.0.md) · [`qc-checklist-by-module-v1.0.md`](./backend-completion-spec/qc-checklist-by-module-v1.0.md) · [`definition-of-done-v1.0.md`](./backend-completion-spec/definition-of-done-v1.0.md) · [`developer-qc-one-liners-v1.0.md`](./backend-completion-spec/developer-qc-one-liners-v1.0.md) |
| **B** | Profil jako źródło prawdy + ustawienia / zgody | [`profile-source-of-truth-v1.0.md`](./backend-completion-spec/profile-source-of-truth-v1.0.md) · [`community-settings-consent-v1.0.md`](./backend-completion-spec/community-settings-consent-v1.0.md) | jak wyżej |
| **C** | Skill Lab + Legal Hub + sesje (Warmup/Coach/Interview/Negotiation) + dopięcie Job Radar | [`skill-lab-backend-v1.0.md`](./backend-completion-spec/skill-lab-backend-v1.0.md) · [`legal-hub-search-backend-v1.0.md`](./backend-completion-spec/legal-hub-search-backend-v1.0.md) · [`session-modules-backend-v1.0.md`](./backend-completion-spec/session-modules-backend-v1.0.md) · [`job-radar-backend-note-v1.0.md`](./backend-completion-spec/job-radar-backend-note-v1.0.md) | jak wyżej |

**Pełny monolit:** [`backend-completion-spec/_imported-full-spec-v1.0.md`](./backend-completion-spec/_imported-full-spec-v1.0.md)

**Uwaga:** Kolejność **priorytetu produktu** jest w [`priority-order-v1.0.md`](./backend-completion-spec/priority-order-v1.0.md) (najpierw billing, potem profil, itd.). Podział A/B/C opisuje **właścicielstwo obszarów**; przy konfliktach w schemacie lub API **najpierw** realizuj pkt 1–2 z priority order, potem równolegle 3–7 zgodnie z uzgodnieniem zespołu.

---

## Agent A — Credits / billing + deploy integrity

### Zakres

- Implementacja wymagań z [`credits-billing-engine-v1.0.md`](./backend-completion-spec/credits-billing-engine-v1.0.md) (allowance, balance, spend, approval, historia, reset).
- Spójność z dokumentacją frontend / practice: [`practice-refactor/billing-credits-v1.0.md`](./practice-refactor/billing-credits-v1.0.md) — jedno źródło prawdy dla kosztów akcji tam, gdzie to możliwe (np. wspólne typy / stałe).
- [`deploy-integrity-guards-v1.0.md`](./backend-completion-spec/deploy-integrity-guards-v1.0.md) — skrypty / marker / walidacje ścieżek (w uzgodnieniu z `scripts/deploy.sh` i polityką repo).

### Definition of Done (A)

- [ ] Checklista billing z [`qc-checklist-by-module-v1.0.md`](./backend-completion-spec/qc-checklist-by-module-v1.0.md) (sekcja Credits) + warstwy A/B/C z [`qc-method-v1.0.md`](./backend-completion-spec/qc-method-v1.0.md).
- [ ] `npm run build` w `backend/` OK.

---

## Agent B — Profil + community / settings / consent

### Zakres

- Rozszerzenie schematu i API profilu wg [`profile-source-of-truth-v1.0.md`](./backend-completion-spec/profile-source-of-truth-v1.0.md); pola muszą mieć **efekt downstream** (nie „martwe” kolumny).
- [`community-settings-consent-v1.0.md`](./backend-completion-spec/community-settings-consent-v1.0.md) — persystencja i egzekwowanie preferencji w API / procedurach.

### Zależności

- Silnik kredytów (**A**) powinien być dostępny lub uzgodniony interfejs przed podpinaniem **Credit Purchase Linkage** w ustawieniach.

### Definition of Done (B)

- [ ] Checklista Profile + Community z `qc-checklist-by-module`.
- [ ] `npm run build` w `backend/` OK.

---

## Agent C — Skill Lab, Legal Hub, sesje, Job Radar

### Zakres

- [`skill-lab-backend-v1.0.md`](./backend-completion-spec/skill-lab-backend-v1.0.md) — logika wartości / weryfikacji / mapowań kursów.
- [`legal-hub-search-backend-v1.0.md`](./backend-completion-spec/legal-hub-search-backend-v1.0.md) — moduł `legal-hub-search`, źródła, PDF.
- [`session-modules-backend-v1.0.md`](./backend-completion-spec/session-modules-backend-v1.0.md) — rozdzielenie typów sesji, cen, trybów Warmup / Coach / Interview / Negotiation.
- [`job-radar-backend-note-v1.0.md`](./backend-completion-spec/job-radar-backend-note-v1.0.md) — domknięcie luk względem OpenAPI / kontraktów, bez regresji „najsilniejszego” obszaru.

### Zależności

- **A:** kredyty i allowance dla akcji sesyjnych i Legal.
- **B:** pola profilu sterujące rekomendacjami / progiem (tam gdzie spec wymaga profilu).

### Definition of Done (C)

- [ ] Checklisty Skill Lab, Legal, Sessions z `qc-checklist-by-module`.
- [ ] `npm run build` w `backend/` OK.

---

## Kolejność merge (zalecana, zgodna z priority order)

1. **A** — szkielet modelu / serwisu billing + podstawowe procedury (zgodnie z §1).
2. **B** — profil + consent na interfejsach uzgodnionych z (1).
3. **C** — równolegle po stabilnym kontrakcie z (1) dla spend: Skill Lab, Legal, sesje; rebase względem (2) gdy logika zależy od profilu.
4. Deploy guards (**A**) mogą wejść jako osobny PR po uzgodnieniu z infra, bez blokowania (1)–(3), o ile nie zmieniają krytycznie ścieżki build.

---

## Historia

| Data | Zmiana |
|------|--------|
| 2026-04-16 | v1.0 — podział na agentów A/B/C, modularne specyfikacje w `backend-completion-spec/`. |
