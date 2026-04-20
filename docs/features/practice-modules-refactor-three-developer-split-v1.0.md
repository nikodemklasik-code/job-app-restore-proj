# Practice modules refactor — podział pracy na 3 deweloperów (**wersja dokumentu v1.1**)

> **Uwaga:** Globalna kolejność i właścicielstwo modułów — [`../squad/README.md`](../squad/README.md). Poniższy podział **A/B/C** dotyczy **równoległej pracy nad plikami `practice-refactor/`** (szczegół implementacji), nie zastępuje faz squadu.

**Gdzie to jest (ścieżki w repo):**

| Co | Ścieżka |
|----|---------|
| **Ten plik** — tabela A/B/C → `.md`, nagłówki Deweloper A/B/C z linkami, wspólne polecenie **EN**, §8 QC | `docs/features/practice-modules-refactor-three-developer-split-v1.0.md` *(nazwa pliku zostaje `*-v1.0.md` dla linków wstecznych; wersja treści = **v1.1**.)* |
| **Skrót + indeks modułowych speców** | `docs/features/practice-refactor/README.md` — sekcja *Jak to się układa (dwa poziomy — bez duplikacji treści)* opisuje stosunek tego pliku do folderu `practice-refactor/` |
| **Kolejność plików, merge, reguły QC** | `docs/features/practice-refactor/files-order-qc-v1.0.md` |
| **One-linery dev + QC** | `docs/features/practice-refactor/developer-qc-one-liners-v1.0.md` |

Ten dokument przekazuje **ten sam cel produktowy** trzem osobom, dzieląc **konflikty merge** i **kolejność zależności**. Bazuje na stanie repo opisanym w planie (m.in. pliki: `DailyWarmupPage.tsx`, `CoachPage.tsx`, `InterviewPractice.tsx`, `NegotiationPage.tsx`, routing, billing).

**Szczegółowe specyfikacje per moduł + billing + shell + QC:** folder [`practice-refactor/`](./practice-refactor/README.md) (import z `Warmup_Coach_Interview_Negotiation_Refactor_Spec.md`, rozbite na pliki). **Dwa poziomy bez duplikacji:** ten plik = brief procesu + polecenie EN; [`practice-refactor/README.md`](./practice-refactor/README.md) sekcja *Jak to się układa* = wejście do folderu i skrót A/B/C do tych samych `.md`.

### Który deweloper czyta który plik specyfikacji

| Deweloper | Obowiązkowe lektury (`docs/features/practice-refactor/`) | Wspólne dla wszystkich |
|-----------|------------------------------------------------------------|-------------------------|
| **A** | [`daily-warmup-v1.0.md`](./practice-refactor/daily-warmup-v1.0.md) · [`shared-shell-routing-v1.0.md`](./practice-refactor/shared-shell-routing-v1.0.md) · [`files-order-qc-v1.0.md`](./practice-refactor/files-order-qc-v1.0.md) | [`developer-qc-one-liners-v1.0.md`](./practice-refactor/developer-qc-one-liners-v1.0.md) |
| **B** | [`coach-v1.0.md`](./practice-refactor/coach-v1.0.md) · [`interview-v1.0.md`](./practice-refactor/interview-v1.0.md) · [`shared-shell-routing-v1.0.md`](./practice-refactor/shared-shell-routing-v1.0.md) | jak wyżej |
| **C** | [`negotiation-v1.0.md`](./practice-refactor/negotiation-v1.0.md) · [`billing-credits-v1.0.md`](./practice-refactor/billing-credits-v1.0.md) · [`files-order-qc-v1.0.md`](./practice-refactor/files-order-qc-v1.0.md) | jak wyżej |

**QC (kolejność plików, lista zmian, reguły jakości):** zawsze [`files-order-qc-v1.0.md`](./practice-refactor/files-order-qc-v1.0.md) — A, B i C mają go w swojej ścieżce lektury, żeby merge i przegląd były spójne.

**Pełny monolit (opcjonalnie):** [`practice-refactor/_imported-full-spec-v1.0.md`](./practice-refactor/_imported-full-spec-v1.0.md)

---

## Wspólne polecenie (wklej każdemu deweloperowi na start)

**Refactor Warmup, Coach, Interview, and Negotiation into four clearly separated modules with shared visual shell but distinct product purpose. Rename InterviewWarmup to DailyWarmupPage, rename NegotiationCoach to NegotiationPage, keep Interview as realistic interview practice, keep Coach as strategic guidance, add visible credit cost logic, and update routing plus Billing to match the new credits-first model.**

Każdy deweloper pracuje tylko w swoim zakresie poniżej; przed merge: `npm run build` w `frontend/`, brak regresji na trasach `/warmup`, `/coach`, `/interview`, `/negotiation`, `/billing`.

---

## Kolejność faz (dla całego zespołu)

| Etap | Treść | Kto |
|------|--------|-----|
| **1** | Routing, nazwy plików, nav/sidebar/etykiety | **Deweloper A** (kontrakt dla B/C) |
| **2** | Wspólny layout shell (`practice-shell`) | **A + B** (A szkielet + Warmup; B reszta komponentów) |
| **3** | Refactor 4 ekranów pod nową definicję | **A** Warmup · **B** Coach + Interview · **C** Negotiation |
| **4** | Billing + widoczność kredytów | **C** (typy kosztów uzgodnione z A/B w PR) |
| **5** | QC pass tylko tych modułów | Wszyscy + QC wg §8 poniżej |

---

## Deweloper A — fundament, routing, Daily Warmup, start `practice-shell`

**Specyfikacje (folder `practice-refactor/`) — czytaj w tej kolejności**

| Moduł / obszar | Plik |
|----------------|------|
| Daily Warmup | [`daily-warmup-v1.0.md`](./practice-refactor/daily-warmup-v1.0.md) |
| Shell + routing + nav | [`shared-shell-routing-v1.0.md`](./practice-refactor/shared-shell-routing-v1.0.md) |
| Kolejność implementacji + QC | [`files-order-qc-v1.0.md`](./practice-refactor/files-order-qc-v1.0.md) |

Coach, Interview, Negotiation i Billing **nie** są lekturą obowiązkową A (chyba że krzyżowy przegląd w PR).

### Zakres

1. **Etap 1 — routing i nazwy (priorytet pierwszy)**  
   - `frontend/src/router.tsx`: lazy importy i ścieżki `/warmup` → `DailyWarmupPage`, `/negotiation` → `NegotiationPage` (komponent z nowego pliku).  
   - `frontend/src/components/layout/Sidebar.tsx` (oraz `Header` / `navigationCopy` jeśli trzeba): etykiety **Daily Warmup**, **Coach**, **Interview**, **Negotiation** — bez „InterviewWarmup” / „NegotiationCoach” w UI.  
   - **Rename pliku i eksportu:**  
     - `frontend/src/app/warmup/DailyWarmupPage.tsx` (już zrename’owany z `InterviewWarmup.tsx`; utrzymaj importy).  
     - `frontend/src/app/negotiation/NegotiationPage.tsx` (już zrename’owany z `NegotiationCoach.tsx`; utrzymaj importy).  
   - Opcjonalnie: krótki `index` re-export jeśli macie konwencję — nie duplikujcie starych nazw w ścieżkach publicznych.

2. **Daily Warmup — definicja produktowa**  
   - Tylko: szybka rozgrzewka, rytuał, **15 / 30 / 45 / 60 s**, koszt z góry, szybki start, liczba pytań zależna od czasu, progres.  
   - **Bez:** banków interview, narracji coach, strategii, negocjacji, „interview session setup”.  
   - **Kredyty (stałe):** 15 s = **0** (Free), 30 s = **1**, 45 s = **2**, 60 s = **3** — widocznie przed startem.

3. **`practice-shell` — część wspólna (minimum pod Warmup)**  
   Utwórz szkielet:

   ```
   frontend/src/features/practice-shell/
     components/
       PracticeHeroHeader.tsx
       PracticeCostCard.tsx
       PracticeProgressBadge.tsx
     types/
       practice.types.ts
   ```

   Podłącz **DailyWarmupPage** do tych trzech + placeholder pod resztę (żeby B mógł dospawać karty/rail bez konfliktu w Warmup).  
   Zgodnie z planem docelowo dojdą jeszcze: `PracticeModeCard`, `PracticeSessionPanel`, `PracticeSupportRail`, `PracticeActionBar` (**Deweloper B**).

### Pliki (główne)

- `frontend/src/app/warmup/DailyWarmupPage.tsx`  
- `frontend/src/router.tsx`  
- `frontend/src/components/layout/Sidebar.tsx`  
- `frontend/src/lib/navigationCopy.ts` (jeśli tytuły shell)  
- `frontend/src/features/practice-shell/**` (utworzone przez A)

### Zależności

- **Przed** rozpoczęciem pracy przez B na pełnym shell: A merge’uje Etap 1 (rename + router), żeby B nie walczył ze starymi nazwami plików.

### Definition of Done (A)

- [ ] Build frontendu przechodzi.  
- [ ] `/warmup` ładuje `DailyWarmupPage`; w UI nie ma starych nazw modułów.  
- [ ] `/negotiation` wskazuje na `NegotiationPage` (nawet jeśli C wypełni treść w następnym PR — plik i route muszą istnieć).  
- [ ] Warmup ma widoczny koszt per duration i nie zawiera flow coach/interview/negocjacji.

---

## Deweloper B — `practice-shell` (reszta), Coach, Interview

**Specyfikacje (folder `practice-refactor/`) — czytaj w tej kolejności**

| Moduł / obszar | Plik |
|----------------|------|
| Coach | [`coach-v1.0.md`](./practice-refactor/coach-v1.0.md) |
| Interview | [`interview-v1.0.md`](./practice-refactor/interview-v1.0.md) |
| Shell + routing + nav | [`shared-shell-routing-v1.0.md`](./practice-refactor/shared-shell-routing-v1.0.md) |

*Billing / [`billing-credits-v1.0.md`](./practice-refactor/billing-credits-v1.0.md):* wyłącznie **C** — B nie zmienia UI billingu; stałe kosztów uzgadniaj z A/C w PR.

### Zakres

1. **Dokończenie `practice-shell`** (po merge A: typy + pierwsze komponenty już są):

   ```
   frontend/src/features/practice-shell/components/
     PracticeModeCard.tsx
     PracticeSessionPanel.tsx
     PracticeSupportRail.tsx
     PracticeActionBar.tsx
   ```

   Uspójnij tokeny (spacing, typografia) z **Daily Warmup** jako wzorcem wizualnym, ale **bez wspólnej logiki domenowej** — tylko layout / prezentacja.

2. **Coach — `CoachPage.tsx`**  
   - Produkt: strategiczny, narracyjny, rozwój, framing, confidence, next steps.  
   - Sekcje docelowe: **Current challenge**, **Choose coaching depth**, **Estimated cost**, **Coach guidance**, **Reframing**, **Action plan**, **Growth direction**.  
   - Tryby kosztowe z widoczną ceną przed startem: **Quick reframe**, **Structured guidance**, **Deep coaching**.  
   - **Usuń/wyprowadź:** wygląd „bank pytań / guided interview / quick tiles odpowiadania jak na interview”.

3. **Interview — `InterviewPractice.tsx`**  
   - Zostaje realistyczna praktyka: mock, tury, processing, summary, voice/live/timed.  
   - Warianty z kosztem z góry: **Interview Lite · 7 min**, **Interview Standard**, **Interview Deep practice**.  
   - **Bez:** daily ritual vibe, bloków coach reframing, negocjacji.

### Pliki (główne)

- `frontend/src/features/practice-shell/components/PracticeModeCard.tsx`  
- `frontend/src/features/practice-shell/components/PracticeSessionPanel.tsx`  
- `frontend/src/features/practice-shell/components/PracticeSupportRail.tsx`  
- `frontend/src/features/practice-shell/components/PracticeActionBar.tsx`  
- `frontend/src/app/coach/CoachPage.tsx`  
- `frontend/src/app/interview/InterviewPractice.tsx`  

### Zależności

- Potrzebuje **merge Etapu 1 od A** (rename + router + pierwsze pliki `practice-shell`).

### Definition of Done (B)

- [ ] Coach nie wygląda jak ukryty interview bank.  
- [ ] Interview ma wyraźne tryby Lite/Standard/Deep z kosztem przed sesją.  
- [ ] Wszystkie cztery moduły mogą importować gotowe klocki z `practice-shell` (Warmup już z A; Negotiation zrobi C).

---

## Deweloper C — Negotiation, Billing, kredyty (spójność z czterema modułami)

**Specyfikacje (folder `practice-refactor/`) — czytaj w tej kolejności**

| Moduł / obszar | Plik |
|----------------|------|
| Negotiation | [`negotiation-v1.0.md`](./practice-refactor/negotiation-v1.0.md) |
| Billing + kredyty | [`billing-credits-v1.0.md`](./practice-refactor/billing-credits-v1.0.md) |
| Kolejność implementacji + QC | [`files-order-qc-v1.0.md`](./practice-refactor/files-order-qc-v1.0.md) |

Warmup, Coach i Interview: tylko odsyłacz krzyżowy przy konflikcie nazewnictwa kosztów lub shell — pełne specy u A/B.

### Zakres

1. **Negotiation — `NegotiationPage.tsx`** (plik zrename’owany przez A; dalszy refactor produktowy u C)  
   - **Bez** nazwy „Coach” w module negocjacji.  
   - Tryby czytelne dla użytkownika (zamiast jednego `AppMode = 'coach' | 'simulator'`): m.in. **Reply draft**, **Counter-offer**, **Strategy**, **Simulation** (symulacja jako *jeden* z trybów, nie „połowa innego bytu”).  
   - Sekcje: **Negotiation context**, **Mode**, **Estimated cost**, **Suggested positioning**, **Reply drafts**, **Boundary support**, **Counter strategy**.  
   - Każdy tryb: **koszt z góry**.  
   - **Bez:** generycznego tonu coach, banku pytań interview, mechaniki timera warmup.

2. **Billing — credits-first**  
   - `frontend/src/app/billing/BillingPage.tsx`  
   - `frontend/src/stores/billingStore.ts`  
   - Model: **Monthly free allowance**, **Credit balance**, **Buy credits**, **Cost per action**, **Usage history** — zamiast głównego doświadczenia „Free / Pro / Autopilot matrix”.  
   - UI: saldo, allowance, pakiety, reguły kosztów, zużycie w miesiącu, ostatnie użycie, CTA **Buy credits**.  
   - Uzgodnij z A/B **stałe i etykiety kosztów** (Warmup stałe, Coach/Interview/Negotiation estymacje) — można wspólny plik `frontend/src/features/practice-shell/creditRules.ts` lub `lib/creditsConfig.ts` (wtedy C tworzy, A/B tylko importują).

3. **Integracja widoczności kredytów**  
   - Upewnij się, że w **Coach**, **Interview**, **Negotiation** (i ewentualnie Warmup jeśli C dotyka) jest **Estimate + kontynuacja za X kredytów** / potwierdzenie tam gdzie dynamiczne.

### Pliki (główne)

- `frontend/src/app/negotiation/NegotiationPage.tsx`  
- `frontend/src/app/billing/BillingPage.tsx`  
- `frontend/src/stores/billingStore.ts`  
- (opcjonalnie) `frontend/src/lib/creditsConfig.ts` lub `frontend/src/features/practice-shell/creditRules.ts`

### Zależności

- Rename `NegotiationPage` i route z **A**.  
- Typy / komponenty shell z **A/B** dla spójnego „Estimated cost panel”.

### Definition of Done (C)

- [ ] Negotiation nie jest „coach + simulator + chat w jednym wiadrze”.  
- [ ] Billing centruje kredyty, nie stare plany jako główna narracja.  
- [ ] Brak ukrytego zużycia kredytów: zawsze widać koszt albo estymatę przed akcją kosztowną.

---

## §8 — Checklista QC (wszyscy przed „done”)

**Źródło prawdy dla QC:** [`files-order-qc-v1.0.md`](./practice-refactor/files-order-qc-v1.0.md) (kolejność plików, lista zakresu, sekcja Quality control). Deweloperzy A / B / C — każdy ma ten plik w swojej ścieżce lektury powyżej.

| Moduł | Pytanie QC |
|--------|------------|
| **Warmup** | Czy to naprawdę szybka rozgrzewka, a nie „interview lite” pod inną nazwą? |
| **Coach** | Czy to coaching (strategia, narracja), a nie ukryty bank pytań interview? |
| **Interview** | Czy nadal realistyczna rozmowa, a nie spłaszczone do warmupu? |
| **Negotiation** | Czy to negocjacje, a nie mix coach + symulator + czat? |
| **Billing** | Czy koszt jest widoczny z góry; czy dynamiczne akcje mają estimate + confirmation; czy nie ma ukrytego zdejmowania kredytów? |

---

## Uwagi merge (krótko)

- **A** merge pierwszy: renames + router + szkielet `practice-shell` + Warmup.  
- **B** rebase na `main`/branch integracyjny po A; potem Coach + Interview + reszta shell.  
- **C** rebase po A+B lub po shell gotowym do użycia w Negotiation; Billing może iść równolegle z B jeśli nie dotyka tych samych linii co Coach — przy konflikcie pierwszeństwo spójności **kredytów** (C).

---

## Historia dokumentu

| Data | Zmiana |
|------|--------|
| 2026-04-18 | v1.0 — podział na 3 deweloperów + wspólne polecenie + pliki i QC. |
| 2026-04-18 | v1.1 — tabela „deweloper → pliki MD”; B bez `billing-credits` w lekturach startowych (billing = C); A/C z `files-order-qc`; tabele linków pod Deweloper A/B/C; blok QC → `files-order-qc-v1.0.md`; wspólne one-linery + polecenie EN. |
| 2026-04-18 | v1.1 (etykieta) — ujednolicono nagłówek do **v1.1**; sekcja **Gdzie to jest** (ścieżki repo). |
