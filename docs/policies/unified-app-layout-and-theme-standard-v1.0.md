# Unified App Layout And Theme Standard (v1.0)

**Status:** Normative for frontend changes.  
**Problem it solves:** „Skakanie” między motywami i chaosem layoutu bez jednego kontraktu dla stron.  
**Single source of theme:** `frontend/src/stores/themeStore.ts` + `applyThemeToDocument` + `frontend/src/index.css` (klasy `.theme-*` + `dark`).

**Kto pilnuje wdrożenia tej normy:** decyzja PO — opis roli w [`visual-consistency-owner-role-spec.md`](./visual-consistency-owner-role-spec.md).

---

## 1. Obowiązkowa powłoka (chrome)

| Zasada | Wymaganie |
|--------|-----------|
| **Powłoka** | Wszystkie ekrany po zalogowaniu renderują się **wyłącznie** wewnątrz `AppShell` (`frontend/src/components/layout/AppShell.tsx`) — **bez** drugiego, równoległego layoutu pełnoekranowego z innym tłem/sidebarem. |
| **Lewy sidebar** | Jeden komponent `Sidebar.tsx` — **nie** duplikować listy tras w podstronach. Nowa trasa = **wpis w Sidebar** + `router.tsx`. |
| **Główna treść** | `Outlet` w obszarze z nagłówkiem (`Header`) — treść strony **nie** renderuje własnego „drugiego headera systemowego” (logo, credits, theme) — tylko **tytuł strony** i akcje kontekstowe. |
| **Kontener treści** | Domyślny wzorzec: `mx-auto max-w-6xl` lub `max-w-7xl` + `px-4` + `space-y-6` (lub `py-8` tam gdzie potrzeba). **Zakaz** pełnej szerokości surowego `<div>` bez max-width na „dashboardowych” stronach — to powoduje „czarną pustkę” i uciekanie treści do góry. |
| **Minimalna wysokość sensu** | Jeśli sekcja ma mało danych — **empty state** lub **skeleton** zamiast pustego tła na połowę viewportu. |

---

## 2. Motyw — jedna prawda, zero magii per strona

| Zasada | Wymaganie |
|--------|-----------|
| **Przełącznik motywu** | Tylko przez `useThemeStore` / `applyThemeToDocument` — **nigdy** `document.documentElement.style.background = …` z poziomu pojedynczej strony. |
| **Klasy Tailwind** | Preferuj **semantyczne** tła: `bg-slate-50 dark:bg-slate-900/60`, obramowania `border-slate-200 dark:border-white/10`, tekst `text-slate-900 dark:text-white`. **Zakaz** sztywnych `#0d0f14` / `#1a1a1a` w komponentach produktowych (wyjątek: ilustracje marketingowe poza AppShell). |
| **Akcent** | Akcent interakcji (aktywny nav, primary CTA) = **indigo** w całej aplikacji, chyba że motyw w `index.css` **jawnie** nadpisuje token (np. high contrast) — wtedy stosujemy klasy warunkowe `theme-visually-impaired:` itd. |
| **Komponenty „plwające”** | Przyciski fixed (np. TTS) muszą używać **tokenów motywu** lub klas `dark:` — **zakaz** stałego `#6366f1` bez wariantu dla `theme-noir` / `light`. |

---

## 3. Nawigacja lewa — IA (Information Architecture)

Kolejność sekcji **jest kontraktem produktowym**. Zmiana kolejności = decyzja PO + PR z uzasadnieniem.

| Sekcja (label w UI) | Zawartość (logiczny sens) |
|---------------------|---------------------------|
| **Main Flow** | Orientacja dnia → tożsamość → pipeline pracy: **Dashboard**, **Profile**, **Jobs**, **Applications**, **Applications Review**. |
| **AI & Growth** | Moduły wspierane modelem: Assistant, Interview, Coach, Daily Warmup, Negotiation, Skill Lab, Case Practice, Job Radar. |
| **Documents** | **Document Lab** — jeden punkt wejścia do plików / generacji (bez duplikacji „CV w profilu” jako osobnej apki). |
| **Tools & Insights** | Narzędzia analityczne / kalkulatory / prawo / raporty / **AI Analysis**. |
| **Automation** | Auto Apply. |
| **Technical & Account** | Settings, Security, Billing, FAQ. |

**Nazewnictwo:** **Title Case** w labelach nawigacji (`Daily Warmup`, nie `daily warmup`). To samo dla tytułów sekcji na stronach.

---

## 4. Czym jest Dashboard (żeby nie „skakał” sens)

**Dashboard** to wyłącznie:

- **Skrót stanu** (liczby, które mają źródło w API — z komunikatem błędu + Retry, nie pustka).
- **Następne akcje** (wektory do modułów).
- **Wejścia** do Job Radar / Applications — **nie** pełna implementacja tych modułów.

**Zakaz:** przebudowywania Dashboardu na „drugi Skill Lab” albo drugi Assistant — to rozjeżdża hierarchię i motyw (nadmiar customowych kart).

---

## 5. Karty, siatki, „kafelki”

| Element | Standard |
|---------|----------|
| **Karta** | `rounded-2xl border … bg … p-4|p-5|p-6` — **jeden** poziom cienia lub border, bez losowej kombinacji `shadow-2xl` + `ring` na każdej podstronie inaczej. |
| **Siatka** | Preferuj `grid gap-4 sm:grid-cols-2 lg:grid-cols-3` zamiast poziomych karuzel wewnątrz „monitorów” — **czytelność > efekt**. |
| **Kafelek CTA** | Ikona + tytuł + **jedna** linia opisu; wysokość min. spójna w obrębie jednej strony. |

---

## 6. Język i disclaimery

| Zasada | Wymaganie |
|--------|-----------|
| **Copy produktowy** | **EN-first** w UI AppShell (zgodnie z ustaleniami produktu). Komponent `SupportingMaterialsDisclaimer` — **nie** forkować treści na PL w osobnych stronach. |
| **Umiejscowienie** | Disclaimer: **zwijany** (gwiazdka), domyślnie zwinięty; **nie** zajmuje miejsca między nagłówkiem a pierwszą akcją użytkownika w pół ekranu. |

---

## 7. Definition of Done (PR musi spełnić przed merge)

- [ ] Strona działa w **co najmniej trzech** motywach: `light`, `dark` lub `noir`, `visually-impaired` (lub inny wskazany przez PO) — bez złamanego kontrastu i bez „zgubionego” tła.  
- [ ] Brak **inline** kolorów hex w nowym kodzie UI (wyjątki: wykresy SVG z paletą zdefiniowaną w jednym helperze).  
- [ ] Treść w **max-width** kontenerze; brak pustego „dołu” bez komunikatu / skeletonu.  
- [ ] Nawigacja: nowa trasa dodana do **Sidebar** + **router**.  
- [ ] **Title Case** dla nowych labeli użytkownika.

---

## 8. Known violations (do naprawy iteracyjnie)

- Przycisk TTS w `AppShell.tsx` używa stałych hex — należy spiąć z tokenami motywu.  
- Część stron historycznie używa różnych `max-w-*` — migrować przy dotykanych plikach do sekcji 1.

---

## 9. Powiązane dokumenty

- Motywy (lista): `frontend/src/stores/themeStore.ts`  
- Ekrany (intencja): `docs/features/19-screens-for-users-and-agents.md`  
- Inspire (mocki, nie norma funkcjonalna): `docs/design/raport-images-inspiration.md`

**QC / PO:** brak zgodności z tym dokumentem = **„Do poprawy”** w review layoutu, nawet jeśli logika biznesowa jest OK.
