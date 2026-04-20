# Developer → QC — wiadomość synchroniczna (2026-04-17)

Cześć **QC**,

Ten plik to **ogólny kanał „porozmawiaj z QC”**: proszę o przeczytanie, decyzję lub dopiski w repo (najlepiej **pod tą treścią** jako nowa sekcja **„Odpowiedź QC”** w commicie albo kontynuacja w tym samym pliku).

Wątek **Job Radar OpenAPI v1.1 contract** nadal ma **kanoniczny** opis, komendy i miejsce na **QC Verdict** tutaj:

- [`qc-job-radar-openapi-contract-dev-handoff-2026-04-16.md`](./qc-job-radar-openapi-contract-dev-handoff-2026-04-16.md)

Tam proszę o **Approved for integration** / **Not approved** zgodnie z polityką QC — bez przenoszenia werdyktu tylko na czat.

**Tip-top www (19 ekranów + kolory + glow / dynamika):** osobna checklista dla QC — proszę przechodzić ją przy review produktu:

- [`qc-19-screens-visual-parity-checklist.md`](./qc-19-screens-visual-parity-checklist.md)

---

## 1. Co konkretnie proszę zweryfikować (Job Radar — contract)

1. Czy test kontraktu czyta **wyłącznie** `docs/job-radar/job-radar-openapi-v1.1.yaml` i **nie wymyśla** pól ani kodów odpowiedzi?
2. Czy `OPENAPI_V1_1_GAPS_VS_REPO` jest **uczciwym** opisem rozjazdów (REST / `getScanStatus`), a nie obejściem asercji?
3. Czy **DTO + preprocess + mapper + tRPC + frontend** są spójne wokół **`saved_job_id` / `savedJobId`** i **snake_case** dla `ScanAcceptedResponse`?

Komendy weryfikacyjne są w pliku handoff Job Radar (folder-aware).

---

## 2. Równoległy pakiet UX / produkt (poza wątkiem OpenAPI Job Radar)

Te zmiany **nie są** częścią specyfikacji OpenAPI Job Radar; to reakcja na uwagi PO (layout, język, progi, nawigacja). Proszę o **świadomą decyzję**: osobny zakres review vs. ten sam PR.

| Obszar | Krótko co się zmieniło |
|--------|-------------------------|
| Dashboard | Przy błędzie analityki: placeholdery + Retry; mniejsze kafelki. |
| Sidebar | Profile zaraz po Dashboard; Document Lab w „Documents”. |
| Disclaimer | EN copy; tryb **collapsible** (★); użycie m.in. na Negotiation / Assistant (dół). |
| Profil | Growth vs Roadmap na górze z wyjaśnieniem; suwak **min. fit %** (`mvh.minJobFitPercent`); Skills \| Work values; cienki pas Document Lab; usunięty duplikat długich bloków Growth/Roadmap na dole. |
| Jobs | Filtrowanie po min. fit + suwak; sync z Profile przez `localStorage` + event. |
| Negotiation Pro gate | Usunięty redirect „Upgrade → billing”; copy o braku włączenia Pro tutaj. |
| Assistant | `max-h` / `min-h-0` zamiast sztywnego `100vh`; disclaimer na dole, collapsible. |

**Pytanie do QC:** Czy ten pakiet ma dostać **osobny** „Approved / Not approved” (np. krótka sekcja poniżej), czy **tylko** notatka „poza bramką Job Radar”?

---

## 3. Świadome kompromisy / dług (nie „tajemnicze ryzyka” — do decyzji QC lub PO)

Te dwa punkty **nie są bugami w kodzie**; opisują **co wiemy**, żeby QC nie szukał „ukrytej usterki tam, gdzie jej nie ma”.

### A) Próg dopasowania ofert (suwak min. fit %) — tylko w tej przeglądarce

- Wartość jest zapisana w **`localStorage`** pod kluczem `mvh.minJobFitPercent` (Profil + Jobs czytają to samo **na tym urządzeniu**).
- **Nie ma** jeszcze zapisu w bazie ani w profilu użytkownika na serwerze → inna przeglądarka, telefon lub wyczyszczenie danych = **inny próg lub domyślne 50%**.
- **Dlaczego tak:** szybka odpowiedź na prośbę o suwak bez nowej kolumny API i migracji.
- **Pytanie do QC/PO:** czy na ten etap **MVP w przeglądarce jest OK**, czy **Not approved** dopóki nie będzie persystencji po `userId` (wtedy osobny task backend + schema).

### B) Negotiation (Pro gate) — bez przycisku „Upgrade” do `/billing`

- Z **prośby PO** usunięto przekierowanie do billing („nie ma mnie przerzucać”, upgrade ma być omówiony osobno).
- Skutek uboczny: osoba **bez Pro** widzi komunikat, ale **nie ma jednego oczywistego przycisku „kup / upgrade”** na tej stronie.
- **Pytanie do QC/PO:** czy tak ma zostać, czy wymagany jest **inny CTA** (np. link do **FAQ** / **Settings** / krótka linia „kontakt z administratorem planu”) — bez powrotu do starego złego redirectu.

### C) Reszta

- **Duplikat importu** w `ProfilePage` był już usuwany — jeśli po rebase pojawią się podobne resztki, proszę **Not approved** ze ścieżką pliku.

---

## 4. Prośba o odpowiedź QC

Proszę dopisać poniżej (w kolejnym commicie od roli QC):

### Odpowiedź QC

- Data:
- Job Radar contract (`…handoff-2026-04-16.md`): **Approved** / **Not approved** (+ link czy ten sam plik zaktualizowany)
- Pakiet UX (sekcja 2): **Approved** / **Not approved** / **Poza zakresem tego review**
- Uwagi blokujące (jeśli są):

---

*Dev: wiadomość do QC; zgodnie z `docs/policies/execution-reporting-standard.md` oczekiwany jest jawny werdykt, nie sam czat.*
