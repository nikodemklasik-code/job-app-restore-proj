# MultivoHub — Execution Progress Tracker (branch `gptupdate`)

Stan na: 2026-05-20

Ten plik jest roboczym trackerem wykonania głównego planu. Nie jest marketingiem ani raportem „wszystko super”. Ma pokazywać, co jest naprawdę domknięte, co jest w toku i co dalej blokuje przepływy end to end.

## Legenda statusów

- 🟩 Zrobione
- 🟨 W toku
- 🟥 Niezrobione / zablokowane
- ⬜ Jeszcze nieruszone

---

## Główny cel

Doprowadzić produkt do stanu, w którym 5 kluczowych przepływów działa stabilnie end to end:

1. Document Intake -> CV parse -> Profile sync -> Style Studio / CV output
2. Profile -> Jobs Search / Job Radar -> Save / Apply -> Applications
3. Billing / Credits -> AI action -> credit deduction -> history / visibility
4. Interview / Coach / Skill Lab -> evidence / skill impact -> profile value
5. Deploy -> smoke test -> monitoring -> rollback readiness

---

# Strumień A — Source of Truth danych użytkownika

## Cel
Jeden spójny model danych użytkownika dla Profile, Document Hub, Style Studio, Jobs, Job Radar, Applications i Skill Lab.

## Zadania
- 🟨 Finalny kontrakt `Profile` jako centralnego źródła prawdy
- 🟨 Mapowanie pól z parsera CV do profilu
- 🟩 Import z CV nie robi już cichego overwrite profilu
- ⬜ Znaczniki pochodzenia danych: `imported_from_cv`, `user_confirmed`, `ai_suggested`
- 🟨 Review-before-overwrite dla pól krytycznych

## Kamienie milowe
- 🟨 M1: finalny kontrakt danych profilu i mapowanie pól
- 🟨 M2: CV import aktualizuje profil bez utraty danych
- 🟨 M3: użytkownik widzi i zatwierdza różnice przed nadpisaniem
- ⬜ M4: wszystkie moduły czytają z tego samego modelu

## Notatka operacyjna
Najważniejsza zmiana już wykonana: CV nie powinno już po cichu rozwalać profilu. Nadal brakuje provenance i pełnego downstream contract.

---

# Strumień B — Dokumenty i pipeline CV

## Cel
Upload dokumentu -> parse -> review -> import do profile -> generate styled doc / CV / cover letter

## Zadania
- 🟨 Ujednolicenie nazewnictwa: Document Hub + Document Intake + Style Studio
- 🟨 Onboarding: najpierw CV, potem Profile, potem generowanie
- 🟨 Parser + ekran review importu
- 🟩 Style Studio nie syncuje już profilu bokiem
- ⬜ Wersjonowanie / powrót do poprzednich wersji dokumentów
- ⬜ Odpowiednie szablony CV oparte o zatwierdzone dane

## Kamienie milowe
- 🟨 M1: upload i parse działają stabilnie
- 🟨 M2: import do Profile działa przewidywalnie
- 🟨 M3: Style Studio generuje tylko z zatwierdzonych danych
- ⬜ M4: użytkownik może wrócić do poprzednich wersji dokumentów
- ⬜ M5: CV templates są spójne, czytelne i oparte na approved profile state

## Notatka operacyjna
Style Studio zostało odcięte od bezpośredniego „import to profile”. To ważne, bo ten skrót psuł cały spine danych jak tania rurka odpływowa.

---

# Strumień C — Jobs, Job Radar i Applications jako jedna maszyna operacyjna

## Cel
Profile -> Jobs Search -> save / shortlist -> Job Radar deep scan -> apply / prepare draft -> Applications tracking -> review queue

## Zadania
- 🟥 Jobs jako jeden obszar z podwidokami: Search / Saved / Radar / Applications
- 🟥 Wspólny model `job lead`
- 🟥 Spięcie Save Job -> Open Radar -> Create Application Draft
- 🟥 Naprawa draft applications flow: toasty / loading / success / retry
- 🟥 Review queue jako filtr Applications, nie osobny byt

## Kamienie milowe
- 🟥 M1: Jobs i Job Radar są jednym obszarem nawigacyjnym
- 🟥 M2: zapisanie oferty i przejście do Applications działa zawsze
- 🟥 M3: Radar wzbogaca lead i wpływa na decyzję apply / skip
- 🟥 M4: Applications są głównym pipeline wykonawczym

## Notatka operacyjna
Ten strumień jest nadal częściowo rozgrzebany. Bez domknięcia Source of Truth naprawianie go do końca byłoby polerowaniem błędnych danych, czyli klasyczna ludzka rozrywka.

---

# Strumień D — Skill Lab, Interview, Coach, Case Practice

## Cel
Profile -> Skill Lab gap -> Interview / Coach / Case Practice -> evidence -> updated profile signals -> better Jobs / CV / Radar

## Zadania
- 🟥 Wspólny model `evidence`
- 🟥 Interview -> evidence tracking
- 🟥 Coach -> action plan jako controlled save, nie silent write
- 🟥 Skill Lab tylko na real data
- 🟥 Pokazanie wpływu rozwoju na fit score / CV value / market value

## Kamienie milowe
- 🟥 M1: Skill Lab przestaje być izolowanym ekranem
- 🟥 M2: Interview i Coach produkują evidence
- 🟥 M3: Evidence wpływa na Jobs, Radar i CV
- 🟥 M4: użytkownik widzi wpływ rozwoju na rynek

---

# Strumień E — Legal, Negotiation, Salary Intelligence

## Cel
Job / Application / Offer -> Salary Intelligence / Negotiation / Legal Hub -> recommended action

## Zadania
- ⬜ Salary Intelligence osadzone w Job Radar / Negotiation / Offer handling
- ⬜ Negotiation odpalane z kontekstu aplikacji lub oferty
- ⬜ Legal Hub jako wyszukiwarka i kontekstowe CTA
- ⬜ Ujednolicone wejścia: salary / role / company / contract / benefits / legal concern
- ⬜ Structured output: quick answer / strategy / risks / next action

## Kamienie milowe
- ⬜ M1: Salary Intelligence używane w Job Radar
- ⬜ M2: Negotiation odpalane z realnego kontekstu
- ⬜ M3: Legal Hub wspiera decyzje, a nie jest samotną wyszukiwarką

---

# Strumień F — Billing, visibility, deploy, monitoring i jakość operacyjna

## Cel
Widoczne koszty, przewidywalne mutacje, monitoring i bezpieczny deploy.

## Zadania
- 🟥 Globalna widoczność kredytów
- 🟥 Zamiana `alert()` na toasty
- 🟥 Loading / pending / error / success states dla głównych mutacji
- ⬜ Sentry frontend + backend
- ⬜ Uptime monitoring + smoke test po deployu
- ⬜ Deploy gate checklist

## Kamienie milowe
- 🟥 M1: użytkownik zawsze widzi kredyty i koszt akcji
- 🟥 M2: znikają alerty i martwe kliknięcia
- ⬜ M3: każdy deploy ma smoke gate
- ⬜ M4: błędy produkcyjne są widoczne i śledzone

---

# Ostatnio wykonane

## 2026-05-20
- 🟩 Dodany review gate dla CV -> Profile zamiast cichego nadpisania
- 🟩 Dodane ostrzeżenia o ryzyku parsowania / overwrite
- 🟩 Style Studio odcięte od bezpośredniego syncu do profilu
- 🟩 Style Studio kieruje teraz użytkownika do Document Hub review flow
- 🟩 Utrwalony tracker postępu na branchu `gptupdate`

---

# Najbliższe kroki

1. Dokończyć rozszerzony kontrakt profilu
2. Dodać provenance dla pól importowanych z CV
3. Rozbudować structural diff dla experience / education / training
4. Ustalić approved CV templates oparte o zatwierdzone dane
5. Dopiero potem wrócić do unifikacji Jobs / Job Radar / Applications

---

# Reguły egzekucji

- Żadna akcja AI nie robi silent write do profilu
- Każdy moduł premium pokazuje koszt przed uruchomieniem
- Każdy zapisujący moduł ma loading / success / error state
- Każde dane użytkownika mają docelowo source provenance
- Najpierw domykamy główne flow, potem ozdoby i poboczne gadżety
