# MultivoHub - tracker wykonania głównego planu

Ostatnia aktualizacja: 2026-05-20
Branch roboczy: `gptupdate`

Ten tracker jest nadrzędnym widokiem postępu względem dokumentu **MultivoHub - plan operacyjny i priorytety projektu**.  
Zielone pozycje są ukończone w repo lub wdrożone na tyle, że można je traktować jako zamknięty etap w obecnym strumieniu.  
Żółte są w toku. Szare lub puste nadal czekają na domknięcie. Jak zwykle, ludzie zrobili plan, więc teraz trzeba pilnować, żeby faktycznie coś z niego wynikało.

## Legenda

- <span style="color:#22c55e"><strong>[DONE]</strong></span> ukończone
- <span style="color:#f59e0b"><strong>[IN PROGRESS]</strong></span> w toku
- <span style="color:#94a3b8"><strong>[TODO]</strong></span> nieruszone lub niezamknięte

---

## 1. Nadrzędny cel projektu

<span style="color:#f59e0b"><strong>[IN PROGRESS]</strong></span> Doprowadzić MultivoHub do stanu, w którym 5 kluczowych przepływów działa stabilnie end to end na produkcji.

### Aktualny stan
- <span style="color:#22c55e"><strong>[DONE]</strong></span> Zdefiniowany główny porządek prac: najpierw Source of Truth + Document pipeline + Billing visibility.
- <span style="color:#f59e0b"><strong>[IN PROGRESS]</strong></span> Dashboard został przebudowany w stronę realnego centrum sterowania i onboardingu.
- <span style="color:#94a3b8"><strong>[TODO]</strong></span> Nadal brak pełnego domknięcia 5 głównych flow w jednej smoke-suitcie.

---

## 2. Strumień A - Source of Truth danych użytkownika

### Cel
Jeden spójny model danych użytkownika dla: Profile, Document Hub, Style Studio, Jobs, Job Radar, Applications, Skill Lab i generowania CV.

### Zadania priorytetowe P1
- <span style="color:#f59e0b"><strong>[IN PROGRESS]</strong></span> Ustalić ostateczny kontrakt Profile jako centralnego źródła prawdy.
- <span style="color:#f59e0b"><strong>[IN PROGRESS]</strong></span> Zmapować wszystkie pola z parsera CV do profilu.
- <span style="color:#22c55e"><strong>[DONE]</strong></span> Wprowadzić zasadę: import z CV aktualizuje profil jawnie, nigdy magicznie.
- <span style="color:#94a3b8"><strong>[TODO]</strong></span> Dodać znaczniki pochodzenia danych: `imported_from_cv`, `user_confirmed`, `ai_suggested`.
- <span style="color:#22c55e"><strong>[DONE]</strong></span> Dodać mechanizm review before overwrite dla pól krytycznych.

### Kamienie milowe
- <span style="color:#f59e0b"><strong>[IN PROGRESS]</strong></span> M1: finalny kontrakt danych profilu i mapowanie wszystkich pól.
- <span style="color:#22c55e"><strong>[DONE]</strong></span> M2: CV import aktualizuje profil bez utraty danych.
- <span style="color:#22c55e"><strong>[DONE]</strong></span> M3: użytkownik widzi i zatwierdza różnice przed nadpisaniem.
- <span style="color:#94a3b8"><strong>[TODO]</strong></span> M4: wszystkie moduły czytają z tego samego modelu.

### Notatka wykonawcza
Zamknięte elementy wynikają z wdrożenia preview gate, zatrzymania silent write oraz ekranów review dla importu CV do profilu.

---

## 3. Strumień B - Dokumenty i pipeline CV

### Docelowy przepływ
Upload dokumentu -> parse -> review -> import do Profile -> generate styled doc / CV / cover letter

### Zadania priorytetowe P1
- <span style="color:#f59e0b"><strong>[IN PROGRESS]</strong></span> Ujednolicić nazewnictwo: Document Hub, a w nim Document Intake i Style Studio.
- <span style="color:#f59e0b"><strong>[IN PROGRESS]</strong></span> Zrobić czytelny onboarding: najpierw wgraj CV, potem sprawdź profil, na końcu generuj dokumenty.
- <span style="color:#22c55e"><strong>[DONE]</strong></span> Dopiąć parser PDF, DOCX i TXT oraz ekran review importu.
- <span style="color:#f59e0b"><strong>[IN PROGRESS]</strong></span> Spiąć Style Studio wyłącznie z profilem i dokumentami już zatwierdzonymi.

### Kamienie milowe
- <span style="color:#22c55e"><strong>[DONE]</strong></span> M1: upload i parse działają stabilnie.
- <span style="color:#22c55e"><strong>[DONE]</strong></span> M2: import do Profile działa przewidywalnie.
- <span style="color:#94a3b8"><strong>[TODO]</strong></span> M3: Style Studio generuje tylko z zatwierdzonych danych.
- <span style="color:#94a3b8"><strong>[TODO]</strong></span> M4: użytkownik może wrócić do poprzednich wersji dokumentów.

---

## 4. Strumień C - Jobs, Job Radar i Applications jako jedna maszyna operacyjna

### Zadania priorytetowe P1
- <span style="color:#f59e0b"><strong>[IN PROGRESS]</strong></span> Dokończyć sekcję Jobs jako jeden obszar z podwidokami: Search, Saved, Radar, Applications.
- <span style="color:#f59e0b"><strong>[IN PROGRESS]</strong></span> Zdefiniować wspólny model job lead i ujednolicić statusy.
- <span style="color:#f59e0b"><strong>[IN PROGRESS]</strong></span> Spiąć Save Job, Open Radar i Create Application Draft w jeden flow.
- <span style="color:#94a3b8"><strong>[TODO]</strong></span> Review queue ustawić jako filtr Applications, nie osobny byt konceptualny.

### Kamienie milowe
- <span style="color:#22c55e"><strong>[DONE]</strong></span> M1: Jobs i Job Radar są jednym obszarem nawigacyjnym.
- <span style="color:#f59e0b"><strong>[IN PROGRESS]</strong></span> M2: zapisanie oferty i przejście do Applications działa zawsze.
- <span style="color:#94a3b8"><strong>[TODO]</strong></span> M3: Radar wzbogaca lead i realnie wpływa na decyzje apply / skip.
- <span style="color:#f59e0b"><strong>[IN PROGRESS]</strong></span> M4: Applications są głównym pipeline wykonawczym.

### Notatka wykonawcza
Nawigacja Jobs została już uporządkowana i zagnieżdżona. Nadal do domknięcia zostaje pełna spójność modelu leada i przepływu statusów.

---

## 5. Strumień D - Skill Lab, Interview, Coach, Case Practice

### Zadania priorytetowe P1
- <span style="color:#94a3b8"><strong>[TODO]</strong></span> Zdefiniować wspólny model evidence.
- <span style="color:#94a3b8"><strong>[TODO]</strong></span> Spiąć Interview z evidence tracking.
- <span style="color:#94a3b8"><strong>[TODO]</strong></span> Spiąć Coach z action plan do profilu jako sugestie, nie ciche nadpisanie.
- <span style="color:#f59e0b"><strong>[IN PROGRESS]</strong></span> Spiąć Skill Lab z realnymi danymi profilu i CV, nie z demem lub symulacją.
- <span style="color:#94a3b8"><strong>[TODO]</strong></span> Dać użytkownikowi widoczny wpływ rozwoju na fit score, CV value i ryzyko odrzucenia.

### Kamienie milowe
- <span style="color:#f59e0b"><strong>[IN PROGRESS]</strong></span> M1: Skill Lab przestaje być izolowanym ekranem.
- <span style="color:#94a3b8"><strong>[TODO]</strong></span> M2: Interview i Coach produkują evidence.
- <span style="color:#94a3b8"><strong>[TODO]</strong></span> M3: Evidence wpływa na Jobs, Radar i CV.
- <span style="color:#94a3b8"><strong>[TODO]</strong></span> M4: użytkownik widzi konkretny wpływ rozwoju na rynek.

---

## 6. Strumień E - Legal, Negotiation, Salary Intelligence

### Zadania priorytetowe P1
- <span style="color:#94a3b8"><strong>[TODO]</strong></span> Osadzić Salary Intelligence w Job Radar, Negotiation i Offer handling.
- <span style="color:#94a3b8"><strong>[TODO]</strong></span> Osadzić Negotiation jako akcję z kontekstu aplikacji, oferty albo maila.
- <span style="color:#f59e0b"><strong>[IN PROGRESS]</strong></span> Osadzić Legal Hub jako wyszukiwarkę oraz kontekstowe CTA z offer / contract / dispute situations.
- <span style="color:#94a3b8"><strong>[TODO]</strong></span> Ujednolicić wejścia: salary, role, company, contract type, benefits, legal concern.
- <span style="color:#94a3b8"><strong>[TODO]</strong></span> Dać structured output: quick answer, strategy, risks, next action.

### Kamienie milowe
- <span style="color:#94a3b8"><strong>[TODO]</strong></span> M1: Salary Intelligence jest używane w Job Radar.
- <span style="color:#94a3b8"><strong>[TODO]</strong></span> M2: Negotiation jest odpalane z realnego kontekstu aplikacji.
- <span style="color:#94a3b8"><strong>[TODO]</strong></span> M3: Legal Hub wspiera decyzje, a nie jest samotną wyszukiwarką.

---

## 7. Strumień F - Billing, visibility, deploy, monitoring i jakość operacyjna

### Zadania priorytetowe P1
- <span style="color:#f59e0b"><strong>[IN PROGRESS]</strong></span> Dodać credit balance visibility globalnie: header / sidebar, before-action cost preview, transaction history, low balance warning.
- <span style="color:#94a3b8"><strong>[TODO]</strong></span> Zamienić wszystkie `alert()` na toasty.
- <span style="color:#94a3b8"><strong>[TODO]</strong></span> Dodać loading / error / success states dla głównych akcji.
- <span style="color:#94a3b8"><strong>[TODO]</strong></span> Dodać Sentry frontend + backend.
- <span style="color:#94a3b8"><strong>[TODO]</strong></span> Dodać podstawowy uptime monitoring i smoke test po deployu.
- <span style="color:#94a3b8"><strong>[TODO]</strong></span> Dopisać checklisty deploy gate.

### Kamienie milowe
- <span style="color:#f59e0b"><strong>[IN PROGRESS]</strong></span> M1: użytkownik zawsze widzi kredyty i koszt akcji.
- <span style="color:#94a3b8"><strong>[TODO]</strong></span> M2: znikają alerty i martwe kliknięcia.
- <span style="color:#94a3b8"><strong>[TODO]</strong></span> M3: każdy deploy ma smoke gate.
- <span style="color:#94a3b8"><strong>[TODO]</strong></span> M4: błędy produkcyjne są widoczne i śledzone.

### Notatka wykonawcza
Zrobione częściowo: globalny indicator kredytów w headerze, widoczność salda na Dashboardzie, niski stan kredytów oznaczony ostrzeżeniem. Nadal brakuje preview kosztu przed akcjami premium i pełnej historii transakcji jako flow operacyjnego.

---

## 8. Kolejność realizacji globalnej

### Faza 1 - stabilizacja rdzenia
- <span style="color:#f59e0b"><strong>[IN PROGRESS]</strong></span> Strumień A: Source of Truth
- <span style="color:#f59e0b"><strong>[IN PROGRESS]</strong></span> Strumień B: Document pipeline
- <span style="color:#f59e0b"><strong>[IN PROGRESS]</strong></span> Strumień F: Billing visibility + UX states + monitoring minimum

### Faza 2 - egzekucja poszukiwania pracy
- <span style="color:#f59e0b"><strong>[IN PROGRESS]</strong></span> Strumień C: Jobs / Radar / Applications
- <span style="color:#94a3b8"><strong>[TODO]</strong></span> Domknięcie review queue i Auto Apply jako ustawienia

### Faza 3 - rozwój i przewaga AI
- <span style="color:#94a3b8"><strong>[TODO]</strong></span> Strumień D: Skill Lab + Interview + Coach + Case Practice
- <span style="color:#94a3b8"><strong>[TODO]</strong></span> Strumień E: Salary + Negotiation + Legal

### Faza 4 - hardening i porządki
- <span style="color:#94a3b8"><strong>[TODO]</strong></span> Test coverage, repo cleanup, docs consolidation, dashboards operacyjne

---

## 9. Sprinty wykonawcze

### Sprint 1
- <span style="color:#f59e0b"><strong>[IN PROGRESS]</strong></span> Final schema i contract dla Profile.
- <span style="color:#22c55e"><strong>[DONE]</strong></span> CV import review + overwrite rules.
- <span style="color:#f59e0b"><strong>[IN PROGRESS]</strong></span> Credit balance widget.
- <span style="color:#94a3b8"><strong>[TODO]</strong></span> Replace alert with toast everywhere.
- <span style="color:#94a3b8"><strong>[TODO]</strong></span> Loading / error / success states dla głównych akcji.
- <span style="color:#94a3b8"><strong>[TODO]</strong></span> Sentry basic setup.

### Sprint 2
- <span style="color:#f59e0b"><strong>[IN PROGRESS]</strong></span> Document Intake -> Profile full flow.
- <span style="color:#94a3b8"><strong>[TODO]</strong></span> Style Studio only from approved profile / document state.
- <span style="color:#22c55e"><strong>[DONE]</strong></span> Jobs unified navigation.
- <span style="color:#f59e0b"><strong>[IN PROGRESS]</strong></span> Shared job lead model.
- <span style="color:#f59e0b"><strong>[IN PROGRESS]</strong></span> Draft application flow repair.
- <span style="color:#94a3b8"><strong>[TODO]</strong></span> Applications review queue integration.

### Sprint 3
- <span style="color:#94a3b8"><strong>[TODO]</strong></span> Job Radar -> Applications handoff.
- <span style="color:#94a3b8"><strong>[TODO]</strong></span> Saved / shortlist / lead statuses normalization.
- <span style="color:#f59e0b"><strong>[IN PROGRESS]</strong></span> Skill Lab on real data only.
- <span style="color:#94a3b8"><strong>[TODO]</strong></span> Evidence schema and viewer.
- <span style="color:#94a3b8"><strong>[TODO]</strong></span> Interview -> evidence integration.
- <span style="color:#94a3b8"><strong>[TODO]</strong></span> Coach -> action plan with controlled save.

### Sprint 4
- <span style="color:#94a3b8"><strong>[TODO]</strong></span> Salary intelligence inside Job Radar.
- <span style="color:#94a3b8"><strong>[TODO]</strong></span> Negotiation from application / offer context.
- <span style="color:#94a3b8"><strong>[TODO]</strong></span> Legal Hub contextual entry points.
- <span style="color:#94a3b8"><strong>[TODO]</strong></span> Save expert outputs into pipeline.
- <span style="color:#94a3b8"><strong>[TODO]</strong></span> Deploy gate + smoke suite for 5 main flows.
- <span style="color:#94a3b8"><strong>[TODO]</strong></span> Repo cleanup + docs consolidation.

---

## 10. Reguły architektoniczne - stan zgodności

- <span style="color:#22c55e"><strong>[DONE]</strong></span> Żadna akcja AI nie może być silent write do profilu.
- <span style="color:#f59e0b"><strong>[IN PROGRESS]</strong></span> Każdy moduł premium musi pokazywać koszt przed uruchomieniem.
- <span style="color:#f59e0b"><strong>[IN PROGRESS]</strong></span> Każdy zapisujący moduł musi mieć loading, success i error state.
- <span style="color:#94a3b8"><strong>[TODO]</strong></span> Każde dane użytkownika muszą mieć source provenance.
- <span style="color:#f59e0b"><strong>[IN PROGRESS]</strong></span> Job Radar, Applications i Jobs muszą korzystać ze wspólnego modelu leadu.
- <span style="color:#f59e0b"><strong>[IN PROGRESS]</strong></span> Najpierw 5 głównych flow, potem dodatki.

---

## 11. Co zamrożone na teraz

- <span style="color:#22c55e"><strong>[DONE]</strong></span> Community Centre - nie rozwijać, dopóki rdzeń nie jest domknięty.
- <span style="color:#22c55e"><strong>[DONE]</strong></span> Auto Apply jako osobny duży feature - zostawić jako ustawienia nad Applications.
- <span style="color:#f59e0b"><strong>[IN PROGRESS]</strong></span> Nowe warianty ekranów i ozdobne AI moduliki bez wpływu na główny pipeline - aktywnie wygaszane podczas porządków.

---

## 12. Ostatnio domknięte elementy

### Zrealizowane i oznaczone na zielono
- <span style="color:#22c55e"><strong>[DONE]</strong></span> CV import nie nadpisuje profilu po cichu.
- <span style="color:#22c55e"><strong>[DONE]</strong></span> Review before overwrite dla pól krytycznych działa.
- <span style="color:#22c55e"><strong>[DONE]</strong></span> Upload + parse + import do Profile działają przewidywalnie.
- <span style="color:#22c55e"><strong>[DONE]</strong></span> Jobs i Job Radar zostały zebrane w jeden obszar nawigacyjny.
- <span style="color:#22c55e"><strong>[DONE]</strong></span> Dashboard został przeorganizowany pod onboarding, newsroom, kredyty i priorytety informacji.

### Zrobione częściowo w ostatnim etapie
- <span style="color:#f59e0b"><strong>[IN PROGRESS]</strong></span> Globalna widoczność kredytów: header + dashboard + low balance warning.
- <span style="color:#f59e0b"><strong>[IN PROGRESS]</strong></span> Dashboard jako centrum sterowania zamiast przypadkowej siatki widoków.
- <span style="color:#f59e0b"><strong>[IN PROGRESS]</strong></span> Strumień A i B spięte logicznie w roadmapie branchowej i w aktualnym trackerze.
