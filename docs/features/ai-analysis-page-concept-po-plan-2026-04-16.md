# AI Analysis — koncepcja strony, motywy, autorstwo, lista prac, szablon rozmowy z PO (2026-04-16)

## 1. Kto zrobił zakładkę „AI Analysis”

| Pole | Wartość |
|------|---------|
| **Trasa** | `/ai-analysis` |
| **Plik UI** | `frontend/src/app/analysis/AiAnalysisPage.tsx` |
| **Nawigacja** | `frontend/src/router.tsx`, link w `frontend/src/components/layout/Sidebar.tsx` (sekcja Tools & Insights, ikona `LineChart`) |
| **Commit (szkielet)** | `605aaad` — `feat(frontend): add AI Analysis shell with demo charts at /ai-analysis` |
| **Wykonanie** | Szkieplet strony (layout + wykresy SVG **demo** + copy roboczy) dodany w repozytorium przez **agenta implementującego (Cursor / Claude track)** na gałęzi roboczej, **nie** jako gotowy produkt z danymi z backendu. |
| **Właściciel produktowy** | **PO** — zakres danych, priorytety metryk, zgoda na „brak fabrykowanych widełek”, integracja z Profile / Skill Lab. |
| **Właściciel techniczny (propozycja)** | **Agent B** — endpoint(y) lub procedura tRPC pod agregację analizy; **Agent A** — dopięcie wizualne pod wszystkie motywy; **QC** — DoD przed „Approved”. |

Spec nadrzędny ekranu: `docs/features/19-screens-for-users-and-agents.md` §9 + `docs/features/product-screens-spec-v1.0.md` (odnośnik dodany przy commicie szkieletu).

---

## 2. Koncepcja strony (jak ma wyglądać — docelowo)

**Cel ekranu:** warstwa **interpretacji** (mocne / słabe strony, luki, rekomendacje, propozycja przepisania, wykryte sygnały) — **nie** duplikat Assistanta i **nie** surowe „Reports” aplikacji.

### 2.1 Układ (kolejność pionowa, desktop)

1. **Nagłówek** — tytuł + jedno zdanie value proposition (EN, Title Case zgodnie z polityką produktu).
2. **Disclaimer** — `SupportingMaterialsDisclaimer` w wariancie **zwijanym** (gwiazdka), domyślnie zwinięty; treść EN (już w komponencie bazowym).
3. **Rząd wykresów (3 kolumny ≥ lg)**  
   - **Donut / mix sygnałów** (np. udział: strengths / gaps / growth — etykiety zgodne z copy produktu).  
   - **Słupki** — top N umiejętności / sygnałów (0–100 lub skala znormalizowana — **do decyzji PO**).  
   - **Linia czasu** — np. gotowość / jakość odpowiedzi w czasie (tydzień / sesja — **do decyzji PO**).
4. **Dwie kolumny** — **Strengths** | **Gaps** (listy + krótkie „dlaczego”).
5. **Rekomendacje** — numerowana lista, każda z linkiem CTA do modułu (`/skills`, `/negotiation`, `/documents`, …).
6. **Suggested rewrite** — jeden blok „przed/po” lub jeden akapit + przyciski **Apply** (gdy backend gotowy) / **Copy**.
7. **Signals detected** — chipy / badge (spójne z `SignalBadge` z specu, jeśli istnieje w DS).

**Mobile:** wykresy jeden pod drugim; kolumny Strengths/Gaps stack.

### 2.2 Czego unikamy (zgodnie z §9 i feedbackiem PO)

- Fałszywych **„market %”** i salary bez źródła — dopóki nie ma uczciwego modelu danych, wykresy pokazują tylko to, co pochodzi z profilu / sesji / jawnego importu.
- Polskiego disclaimera na produkcji EN-first — jeden komponent, jedna treść EN.

---

## 3. Motywy (jak strona ma się zachować wizualnie)

Źródło motywów aplikacji: `frontend/src/stores/themeStore.ts` + `frontend/src/index.css` (m.in. `light`, `dark`, `noir`, `visually-impaired`, …).

| Motyw | Zachowanie AI Analysis |
|-------|-------------------------|
| **Noir / dark** | Tło sekcji jak reszta appki (`slate` / granice `white/10`); wykresy: jasne linie na ciemnym tle, etykiety `text-slate-300`. |
| **Light** | Karty `bg-white`, obramowanie `slate-200`; osie wykresów ciemniejsze dla kontrastu. |
| **Visually impaired** | Priorytet: kontrast tekstu i obramowań; animacje subtelne lub wyłączone zgodnie z globalnymi regułami motywu. |
| **Pozostałe** | Dopasowanie do istniejących tokenów (bez osobnej „skórki” tylko dla AI Analysis — **jeden kod**, CSS z klas Tailwind per `html[data-theme=…]` jeśli już tak działa globalnie). |

**Decyzja do PO:** czy wykresy mają używać **kolory semantyczne globalne** (emerald / amber / indigo), czy **palety per motyw** zdefiniowane w jednym miejscu (np. `chartTheme.ts`) — rekomendacja: druga opcja przy >4 motywach.

---

## 4. Lista prac (konkretna backlog — kolejność sugerowana)

| # | Zadanie | Owner | DoD |
|---|---------|-------|-----|
| 1 | PO akceptuje układ sekcji z §2.1 (+ ewentualne zmiany nazw) | PO | Zapis w `### PO note` w handoff lub tutaj w annex |
| 2 | Podłączenie danych: źródła (profil, aplikacje, skill lab, ostatnie sesje?) | PO + B | Jedna tabela „źródło → metryka” w specu |
| 3 | API / tRPC: agregacja + cache + limity | B | Testy + brak N+1 na profilu |
| 4 | Zamiana demo SVG na dane rzeczywiste + empty state | A + B | Brak hardcoded liczb w produkcji |
| 5 | Disclaimer zwijany wszędzie spójnie (Assistant, Coach, Skills, …) | A | Jedno zachowanie UX |
| 6 | Dostępność (focus, aria-label wykresów) | A | Przejście podstawowego a11y check |
| 7 | QC: smoke + zgodność z §9 | QC | Werdykt w `docs/qc-reports/` |

---

## 5. Szablon rozmowy z PO (agenda + notatki — wypełniać na spotkaniu)

**Czas:** 25–35 min.  
**Uczestnicy:** PO, Tech lead / Agent B, Frontend / Agent A, (opcjonalnie) QC.

### A. Cel (2 min)

- Potwierdzenie: AI Analysis = **interpretacja**, nie chat i nie surowe KPI bez kontekstu.

### B. Dane (10 min) — pytania PO

1. Z jakich **obowiązkowych** źródeł składamy „Analysis Summary”? (profil tylko / + aplikacje / + ostatni CV text / + Skill Lab)  
2. Czy pokazujemy **widełki płacowe** na tym ekranie, czy tylko w Profilu po ustaleniu modelu? (**Tak/Nie + warunki**)  
3. Jak definiujemy **„skill confidence”** — skala, częstotliwość odświeżania, kto może „zresetować”?  
4. Czy **Rewrite** jest generowany online (koszt tokenów) czy z cache?

### C. UI / motywy (8 min)

1. Akceptacja układu §2.1.  
2. Decyzja: **kolory wykresów** globalne vs `chartTheme.ts`.  
3. Czy sekcja wykresów jest **zawsze widoczna**, czy zwijana gdy brak danych?

### D. Wdrożenie i ownership (5 min)

1. Kto **merge**uje backend + frontend (sprint boundary)?  
2. Kryterium **„done”** dla pierwszej wersji produkcyjnej (bez demo)?

### E. Notatki z spotkania (wklej po spotkaniu)

```
Data:
Obecni:
Decyzje:
Otwarte punkty:
Następny krok:
```

---

## 6. Annex — linki

- Szkieplet: `frontend/src/app/analysis/AiAnalysisPage.tsx`  
- Spec ekranu 9: `docs/features/19-screens-for-users-and-agents.md`  
- Indeks mocków wizualnych (inspiracja, nie źródło prawdy funkcjonalnej): `docs/design/raport-images-inspiration.md`
