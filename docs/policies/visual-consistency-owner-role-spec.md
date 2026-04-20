# Visual Consistency Owner — rola i odpowiedź na wątek „motywy / www zepsute”

**Data:** 2026-04-16  
**Powiązane:** [`unified-app-layout-and-theme-standard-v1.0.md`](./unified-app-layout-and-theme-standard-v1.0.md), `frontend/src/stores/themeStore.ts`, `frontend/src/index.css`.

**Przydział w repo (2026-04-16):** **Visual Consistency Owner = Agent C** (*alias procesowy **Vo*** — ten sam co w integracji Assistant w `docs/qc-reports/`). Agent A nadal wykonuje typową implementację UI; Agent C **pilnuje zgodności PR z normą v1.0** (checklista motywów / AppShell) i **eskaluje** regresje do PO/QC. Zmiana osoby Ownera = nowy wpis w `docs/qc-reports/qc-live-status.md` przez PO / właściciela procesu.

---

## 1. Odpowiedź na pytanie: „Czy da radę ogarnąć motywy na www?”

**Tak — da radę**, pod warunkiem że nie traktujemy tego jako „jednorazowej magii”, tylko jako **krótki program prac** oparty o normę v1.0:

| Warunek | Opis |
|--------|------|
| **Norma** | Istnieje już pisany kontrakt: `docs/policies/unified-app-layout-and-theme-standard-v1.0.md` — bez niego naprawa motywów znowu się rozjeżdża. |
| **Zakres** | Motywy są „zepsute” głównie przez **niespójne klasy Tailwind + inline kolory + różne max-width / puste layouty** — to się **systemowo** poprawia iteracją (strona po stronie lub moduł po module), nie jednym commitem na całą aplikację. |
| **Umiejętności** | Nie trzeba „nadludzkiego designu” — trzeba **dyscypliny FE**: tokeny, brak losowych hexów, test na 3 motywach z checklisty w normie. Brak skillsów **nie zwalnia** z trzymania normy — wtedy **Owner** eskaluje do zewnętrznego design dev lub zmniejsza zakres sprintu. |

**Czego to nie obiecuje:** że jedna osoba „w weekend” naprawi 30 ekranów bez priorytetu PO — bez listy ekranów i kolejności i tak wróci chaos.

---

## 2. Rola: **Visual Consistency Owner** (właściciel spójności wizualno-estetycznej)

### Cel roli

Utrzymanie **jednej** estetyki i zachowania motywów w całej aplikacji web (AppShell + strony), zgodnie z **normą v1.0** i ustaleniami PO (Title Case, hierarchia, brak „czarnej dziury”).

### Obowiązki

1. **Priorytety** — z PO: które ekrany są P0 (np. Dashboard, Assistant, Profile, Skill Lab, Job Radar landing).  
2. **Audyt zgodności** — przy każdym większym PR dotykającym UI: checklista z §7 normy v1.0 (min. 3 motywy).  
3. **Tokeny / motyw** — dążenie do usunięcia inline hexów; współpraca z kimś, kto edytuje `index.css` / `themeStore` przy nowych motywach.  
4. **Regresje** — jeśli nowy ekran łamie layout (brak `max-w-*`, inny sidebar) → **blokada merge** lub ticket „follow-up w 48h”.  
5. **Komunikacja** — jedna notatka w `docs/qc-reports/` lub w PR (krótko: co naprawiono, na których motywach przetestowano).

### Nie jest obowiązkiem Ownera

- Pisanie całej logiki biznesowej backendu.  
- Zastępowanie PO w decyzjach produktowych — Owner **egzekwuje spójność**, PO ustala **co** ma być na ekranie.

### RACI (skrót)

| Działanie | PO | Owner wizualny | FE implementacja | QC |
|-----------|----|----------------|------------------|-----|
| Kolejność ekranów / IA | A | C | I | I |
| Norma layout + motyw | A | R | R | C |
| Merge UI bez regresji motywu | I | A | R | C |

*(R = Responsible, A = Accountable, C = Consulted, I = Informed — dostosujcie nazwiska pod swój zespół.)*

---

## 3. Co zrobić teraz (dla PO — 3 kroki)

1. ~~**Wyznacz imię / rolę**~~ **Zrobione w repo (2026-04-16):** Owner = **Agent C (Vo)** — zapis w [`qc-live-status.md`](../qc-reports/qc-live-status.md).  
2. **Norma v1.0** jest już w `docs/policies/`; broadcast w `qc-live-status.md` wskazuje Ownera.  
3. **Pierwszy sprint motywów** — np. 5 ekranów P0; koniec sprintu = krótki raport w `docs/qc-reports/` (Owner: Agent C) z listą napraw + zrzutami na 3 motywach (opcjonalnie).

---

## 4. Uwaga o „autorze” z Git

Commit szkieletu `/ai-analysis` ma autora z `git config` lokalnego — **to nie definiuje roli Ownera wizualnego**. Owner to **decyzja organizacyjna** (PO / właściciel procesu), nie wynik `git log`. Obecny zapis w repo: **Agent C (Vo)** — można zmienić tylko świadomym wpisem w `qc-live-status.md`.
