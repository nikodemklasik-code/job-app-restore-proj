# Squad — jedyny obowiązujący podział prac (fazy + role)

**Wykonanie implementacji — hierarchia prawdy i obowiązki (Agent / QC / PO):** [`IMPLEMENTATION_EXECUTION_RULES.md`](./IMPLEMENTATION_EXECUTION_RULES.md) — **czytaj pierwsze** przed pracą nad zakresem; tam też **§17 przejście**: ponowna weryfikacja zakresów z wcześniejszych zleceń pod nowy obieg.

**„Zrobione”:** wyłącznie **ślad w repo** zgodnie z [`IMPLEMENTATION_EXECUTION_RULES.md`](./IMPLEMENTATION_EXECUTION_RULES.md) — **świeży** raport dostawy agenta (**§6**, w tym sprawdzenie wcześniejszych raportów) **oraz** **świeża** recenzja QC w formacie **§8** (werdykt + status integracji wg **§9**). **Stare** zlecenia bez tej pary dokumentów **nie zamykają** historii zakresu (patrz **Hard Rule 7** w tym pliku).

**Agenci (A/B/C):** Zakres, fazy i obowiązki są w **`docs/squad/`** ([`Squad_Workboard.md`](./Squad_Workboard.md), specy `Agent_*`, [`squad-abc-qc-certificate-gated-work-split-v1.0.md`](./squad-abc-qc-certificate-gated-work-split-v1.0.md)). Wcześniejsze werdykty QC dla Waszego slice’u szukajcie w **`docs/qc-reports/`** oraz w **`docs/qc/`** (fazy / moduły — patrz [`../qc/README.md`](../qc/README.md)).

**QC:** Raporty i werdykty prowadźcie i przeglądajcie w **`docs/qc-reports/`** oraz w **`docs/qc/`**; przed werdyktem dla tego samego zakresu przeszukujcie **oba** katalogi (oraz inne lokalizacje z §4 specyfikacji) i jawnie zapisujcie w bieżącej recenzji status znalezionych plików ([`Quality_Control_Developer_Spec.md`](./Quality_Control_Developer_Spec.md), [`../qc/qc-reporting-certification-and-po-communication-spec-v1.0.md`](../qc/qc-reporting-certification-and-po-communication-spec-v1.0.md)).

**Źródło plików (aktualne):** folder `~/Downloads/repo_ready_squad_files_implementation_enforced/` (lub zip o tej samej treści) — kanoniczna kopia w repo: [`docs/squad/`](./). Wcześniejsza paczka `repo_ready_squad_files(.zip)` = wersja bez **wymuszenia implementacji**; przy konflikcie obowiązuje **implementation enforced**.

**`Squad_Workboard.md`:** utrzymuj **identycznie** z plikiem z powyższego folderu Downloads (bez dopisków tylko-w-repo w treści workboardu).

Ten dokument jest **kanoniczną tablicą wykonawczą** dla kolejności prac, właścicielstwa modułów i bramek QC / PO. Agenci **nie** dostarczają planów zamiast kodu — patrz: *Mandatory Working Mode* / *Enforcement Rule* w specach oraz QC Gate w [`Squad_Workboard.md`](./Squad_Workboard.md) (*repository implementation exists*).

Starsze dokumenty *„podział na 3 deweloperów”* w `docs/features/*-three-developer-split*.md` zostają jako **szczegóły techniczne modułów**; **fazy, agenci 1–3 i globalna kolejność** wynikają stąd.

**Podział w repozytorium:** jeden katalog [`docs/squad/`](./) — [`IMPLEMENTATION_EXECUTION_RULES.md`](./IMPLEMENTATION_EXECUTION_RULES.md), [`Squad_Workboard.md`](./Squad_Workboard.md), pięć speców ról (`Agent_1` … `Product_Owner`), oraz ten `README.md` jako indeks. Osobnego podfolderu (np. `docs/squad/archive/`) nie utrzymujemy domyślnie; jeśli ma powstać archiwum, zlecenie wychodzi od PO.

---

## Role

| Rola | Litera | Zakres |
|------|--------|--------|
| **Agent 1** | **A** | Fundamenty systemu: billing / kredyty, profil jako źródło prawdy, deploy integrity |
| **Agent 2** | **B** | Moduły inteligencji: Skill Lab, Job Radar, Legal Hub Search |
| **Agent 3** | **C** | Praktyka (Warmup, Coach, Interview, Negotiation) + ustawienia / zgody + Community Centre |
| **QC** | — | Ostateczna bramka (funkcja, produkt, ryzyko, implementacja w repo) |
| **Product Owner** | — | Znaczenie produktu, priorytety, granice modułów, końcowy sign-off |

**Domknięcie implementacji dopiero po certyfikacie QC (`Approved For Integration`) i łańcuch A/B/C:** [`squad-abc-qc-certificate-gated-work-split-v1.0.md`](./squad-abc-qc-certificate-gated-work-split-v1.0.md).

**Workboard (narracja faz):** [`Squad_Workboard.md`](./Squad_Workboard.md)

---

## Tablica faz (obowiązująca)

| Faza | Agent 1 | Agent 2 | Agent 3 | Bramka QC (skrót) | Sign-off PO (skrót) |
|------|---------|---------|---------|-------------------|---------------------|
| **1** | Credits & billing engine; monthly free allowance; credit balance / packs / spend / approval | — | Cleanup nazw i routingu modułów praktyki; wspólny shell praktyki | Jak wyżej + **implementacja w repo** (QC Gate w workboardzie) | Granice modułów; filozofia komunikacji kosztów |
| **2** | Profil jako źródło prawdy (work values, próg auto-apply, growth plan, roadmap) | Logika Skill Lab (salary / CV / weryfikacja / mapowanie kursów) | Ustawienia (podstawy) + persystencja zgód (podstawy) | Profil / Skill Lab / zgody + **repo** | Logika wartości, progu, wzrostu; sens Skill Lab |
| **3** | — | Job Radar; Legal Hub Search; eksport PDF; kontrola zakresu źródeł | Community Centre; domknięcie widoczności kosztów w praktyce | Radar / Legal / community + **repo** | UX Radaru; Legal (granice źródeł); rola Community |
| **4** | Deploy integrity guards | Domknięcie Skill Lab; dopracowania Job Radar / Legal w razie potrzeby | Finalny polish praktyki + ustawień / zgód | Deploy + spójność + koszty + **repo** | Spójność produktu; gotowość do integracji / RC |

---

## Reguła globalna

Nic nie jest uznane za **done**, dopóki:

1. właścicielski agent nie domknął zakresu,
2. **QC** nie zaakceptował,
3. **PO** nie podpisał sensu użytkowego tam, gdzie to wymagane.

**Po werdykcie QC:** agenci przechodzą od razu do **implementacji w repo** (wg **Required Next Action** w raporcie QC), a **nie** do przedłużonej dyskusji zamiast kodu — [`IMPLEMENTATION_EXECUTION_RULES.md`](./IMPLEMENTATION_EXECUTION_RULES.md) **§5a**, **Hard Rule 8**.

Szczegóły: [`Squad_Workboard.md`](./Squad_Workboard.md). Zasady wprost (kotwice w workboardzie):

- [Global Execution Rules](./Squad_Workboard.md#global-execution-rules)
- [Enforcement Rule](./Squad_Workboard.md#enforcement-rule) (workboard — uzupełnienie do *Enforcement Rule* w specu QC)
- [Final Rule](./Squad_Workboard.md#final-rule)

---

## Specyfikacje per rola

| Plik | Treść |
|------|--------|
| [`IMPLEMENTATION_EXECUTION_RULES.md`](./IMPLEMENTATION_EXECUTION_RULES.md) | **SoT wykonania** — szukanie raportów, format dostawy agenta, format recenzji QC, mapowanie werdyktów → integracja, flow fazowy, reguły PO; **§17** ponowna certyfikacja starych zakresów |
| [`Agent_1_Foundations_Spec.md`](./Agent_1_Foundations_Spec.md) | Agent 1 — tryb pracy, *Delivery Format*, billing / profil / deploy |
| [`Agent_2_Intelligence_Modules_Spec.md`](./Agent_2_Intelligence_Modules_Spec.md) | Agent 2 — implementacja Skill Lab, Job Radar, Legal |
| [`Agent_3_Practice_And_Preferences_Spec.md`](./Agent_3_Practice_And_Preferences_Spec.md) | Agent 3 — praktyka, settings/consent, Community |
| [`Quality_Control_Developer_Spec.md`](./Quality_Control_Developer_Spec.md) | QC — *Enforcement Rule*, *implementation reality*, format przeglądu dostawy, **Handoff to PO** → [`Product_Owner_Spec.md`](./Product_Owner_Spec.md); pełny model raportów / certyfikacji / PO: [`../qc/qc-reporting-certification-and-po-communication-spec-v1.0.md`](../qc/qc-reporting-certification-and-po-communication-spec-v1.0.md) |
| [`Product_Owner_Spec.md`](./Product_Owner_Spec.md) | PO — priorytety, §5 *Implementation Phase Enforcement*, **Review order**, **PO approval gate** (5 warunków), §6 *Final Signoff* (QC → PO → dowód w repo), *Product Owner Review Format*, one-liner |
| [`Agent_OpenAI_Models_And_Secrets_Spec.md`](./Agent_OpenAI_Models_And_Secrets_Spec.md) | **OpenAI (przekrojowe)** — centralny klient, rejestr modeli / kosztów, env + sekrety, Responses + Realtime, Legal `file_search`, bezpieczny frontend; implementacja wg [`IMPLEMENTATION_EXECUTION_RULES.md`](./IMPLEMENTATION_EXECUTION_RULES.md) |
| [`QC_OpenAI_Models_And_Secrets_Spec.md`](./QC_OpenAI_Models_And_Secrets_Spec.md) | **QC OpenAI** — sekrety, centralizacja, registry, helpery, Legal, ekspozycja UI, mapowanie kredytów; format wyjścia + **Integration Status** |
| [`Product_Owner_OpenAI_Models_And_Secrets_Spec.md`](./Product_Owner_OpenAI_Models_And_Secrets_Spec.md) | **PO OpenAI** — strategia modeli, kredyty-first, UX zaufania (Legal), sign-off po QC |
| [`squad-abc-qc-certificate-gated-work-split-v1.0.md`](./squad-abc-qc-certificate-gated-work-split-v1.0.md) | **A = Agent 1, B = Agent 2, C = Agent 3**; domknięcie implementacji tylko po **`Approved For Integration`**; wymóg **uprzedniego** certyfikatu dla zależności między fazami |

---

## Dokumentacja modułowa (pomocnicza, nie zastępuje fazy squadu)

- Practice (pliki `.md` per moduł): [`../features/practice-refactor/README.md`](../features/practice-refactor/README.md)
- Skill Lab & Job Radar: [`../features/skill-lab-job-radar-refactor/README.md`](../features/skill-lab-job-radar-refactor/README.md)
- Backend completion (roadmap techniczny + QC): [`../features/backend-completion-spec/README.md`](../features/backend-completion-spec/README.md)
- 19 ekranów (kontekst produktu): [`../features/19-screens-for-users-and-agents.md`](../features/19-screens-for-users-and-agents.md)

---

## Historia

| Data | Zmiana |
|------|--------|
| 2026-04-18 | Pierwszy import paczki squadu do `docs/squad/` + `README.md` jako tablica (paczka **bez** wymuszenia implementacji względem obecnego standardu *implementation enforced*). |
| 2026-04-18 | `Squad_Workboard.md` zsynchronizowany **1:1** z `~/Downloads/repo_ready_squad_files/` (`cp`; bez dopisków tylko-w-repo w treści workboardu). |
| 2026-04-18 | Import **`repo_ready_squad_files_implementation_enforced`** (`cp` z Downloads): workboard + specy Agent 1–3 + QC; `Product_Owner_Spec.md` = treść z paczki **oraz** zachowane z repo: *Review order*, *PO approval gate* (5 warunków), §6 *Final Signoff* (QC → PO → dowód w repo). `README.md`: kolumna QC = funkcja/produkt/ryzyko **+ implementacja w repo** (zgodnie z QC Gate w workboardzie), jawne linki do *Global Execution Rules* / *Enforcement Rule* / *Final Rule*, opis jednego katalogu `docs/squad/` (bez `archive/` domyślnie). Przy konflikcie z wcześniejszą paczką obowiązuje **implementation enforced**. |
| 2026-04-18 | [`squad-abc-qc-certificate-gated-work-split-v1.0.md`](./squad-abc-qc-certificate-gated-work-split-v1.0.md) — litera **A/B/C** = Agent 1/2/3; zamknięcie implementacji wyłącznie po certyfikacie QC + łańcuch **uprzednich** `Approved` dla zależności. |
| 2026-04-18 | Katalog [`../qc/`](../qc/README.md) + [`../qc/qc-reporting-certification-and-po-communication-spec-v1.0.md`](../qc/qc-reporting-certification-and-po-communication-spec-v1.0.md) — model raportów QC, pamięć, eskalacja PO; `docs/review/` = opcjonalny. |
| 2026-04-18 | [`IMPLEMENTATION_EXECUTION_RULES.md`](./IMPLEMENTATION_EXECUTION_RULES.md) — kanoniczna hierarchia SoT dla fazy implementacji; jednolity flow i obowiązkowe lokalizacje raportów; §17 przejście / ponowna weryfikacja wcześniejszych zakresów. |
| 2026-04-19 | **„Zrobione”** = ślad w repo wg `IMPLEMENTATION_EXECUTION_RULES.md` (świeży raport §6 + świeża recenzja QC §8); stare zlecenia bez tej pary nie zamykają historii — **Hard Rule 7**; akapit w nagłówku `README.md`. |
| 2026-04-19 | Specyfikacje OpenAI (modele + sekrety): [`Agent_OpenAI_Models_And_Secrets_Spec.md`](./Agent_OpenAI_Models_And_Secrets_Spec.md), [`QC_OpenAI_Models_And_Secrets_Spec.md`](./QC_OpenAI_Models_And_Secrets_Spec.md), [`Product_Owner_OpenAI_Models_And_Secrets_Spec.md`](./Product_Owner_OpenAI_Models_And_Secrets_Spec.md) — import z paczki *openai_model_and_secrets_repo_ready*. |

## Archived Boards

All previous boards, task cards, and live status files moved to `docs/archive/old-boards/` are archival only.

They are not an active source of truth.
They must not be used for current execution, ownership, intake, or QC decisions.

Current active execution source:
- docs/squad/TODAY_EXECUTION_BOARD.md
