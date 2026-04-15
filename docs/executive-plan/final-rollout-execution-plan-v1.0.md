# Finalny plan wykonawczy (v1.0)

Wersja do działania, nie do kontemplowania. Minimalny zakres MVP, kolejność, definicje *done*, ryzyka.

---

## 0. Kolejność prac, żeby nic się nie rozjechało

Najpierw trzeba ustawić porządek — bez tego zwykle kończy się równoległym grzebaniem w pięciu warstwach i zdziwieniem, że nic nie jest naprawdę gotowe.

**Kolejność właściwa:**

1. Deploy i środowisko produkcyjne  
2. Job Radar production readiness  
3. Skill Lab MVP end-to-end  
4. Assistant: configuration → spec → kontrakty  
5. Repo / process cleanup  
6. Dopiero potem nice-to-have  

To jest ważne, bo Assistant bez ustalonego kontekstu i stabilnych modułów bazowych będzie tylko ładnie gadającym generatorem chaosu.

---

## 1. Deploy i produkcja

### 1.1 Upewnić się, że na VPS jest aktualny build

**Cel:** Na serwerze ma działać dokładnie to, co jest na `claude/improvements`, a nie półżywa wersja sprzed kilku commitów.

**Co sprawdzić**

- branch wdrożony na VPS  
- ostatni commit SHA  
- build timestamp  
- status GitHub Actions  
- czy na serwerze jest najnowszy `dist` / `.next` / runtime build (zależnie od stacku)  

**Definition of done**

- VPS wskazuje na commit z `claude/improvements`  
- workflow deploy/run jest zielony  
- app działa pod `jobs.multivohub.com`  
- wersja na serwerze zgadza się z repo  

**Minimalne polecenia kontrolne**

```bash
git rev-parse HEAD
git log -1 --oneline
pm2 status
pm2 logs --lines 100
```

Jeśli jest Docker: `docker ps`, `docker images`, `docker logs <container>`.

---

### 1.2 MySQL: migracje / Drizzle push dla Job Radar i SkillUp

**Cel:** Schemat produkcyjny ma odpowiadać temu, co ustalono dla Job Radar oraz Skill Lab / SkillUp.

**Zakres obowiązkowy — Job Radar**

- scan tables  
- report tables  
- sources  
- signals / findings / scores  
- outbox  
- complaint / trust tables — jeśli już wchodzą do produkcji  

**Zakres obowiązkowy — SkillUp**

- skill profiles  
- claims  
- evidence  
- assessments  
- language assessments  
- gaps  
- value snapshots  
- milestones  
- verification sessions  

**Decyzja wdrożeniowa:** Jeśli SkillUp nie jest jeszcze spięty z UI i API na produkcji — można wypchnąć schema już teraz, ale **feature-flagować** warstwę produktową. Baza gotowa, feature jeszcze nie odsłonięty.

**Definition of done**

- tabele istnieją na produkcji  
- indeksy istnieją  
- brak błędów przy starcie backendu  
- read/write smoke queries działają  

**Ryzyko:** Jeżeli `drizzle-kit push` robi zmiany nieprzewidywalne — lepiej wygenerować jawne SQL, przejrzeć, dopiero puścić na produkcję.

---

### 1.3 Env na VPS

**Wymagane minimum**

- `CLERK_PUBLISHABLE_KEY`  
- `FRONTEND_URL`  
- `APP_URL`  
- backend URL jeśli osobny  
- DB credentials  
- wszystkie wymagane pola z `lib/envSchema.mjs`  
- zgodność z `.env.example`  

**Wartość docelowa**

- `FRONTEND_URL=https://jobs.multivohub.com`  
- `APP_URL=https://jobs.multivohub.com`  

Jeśli frontend i API są rozdzielone — jawnie ustawić: public app URL, API base URL, CORS allowed origin.

**Definition of done**

- app startuje bez env validation errors  
- auth działa  
- callbacki Clerk działają  
- wszystkie public URL-e wskazują na właściwy host  

**Typowy problem:** Clerk lub frontend patrzą na localhost / stary domain → logowanie „prawie” działa, callback lub assety się wysypują.

---

## 2. Job Radar: domknięcie produkcyjne

### 2.1 Potwierdzić działanie outboxa na serwerze

**Cel:** Skany nie mogą wisieć w `processing`, bo worker nie wstał, cron nie chodzi albo nikt nie konsumuje outboxa.

**Co musi istnieć (jedno z trzech)**

- worker process  
- cron loop  
- background poller z retry  

**Minimalny flow do potwierdzenia**

1. `scan_requested`  
2. resolver / collectors  
3. parser  
4. benchmark  
5. scoring  
6. report compose  
7. status → `ready` lub `partial_report`  

**Co sprawdzić**

- czy outbox rows są konsumowane  
- czy status eventów się zmienia  
- czy są retry  
- czy nie ma martwych eventów zalegających godzinami  
- czy worker startuje po deployu  

**Definition of done**

- nowy scan przechodzi przez pipeline  
- nie zostaje w `processing` bez końca  
- eventy w outboxie są przetwarzane  
- logi pokazują pełny lifecycle  

**Must-have:** Jeśli worker padnie — widać to: log error, restart policy, alert lub przynajmniej health check.

---

### 2.2 Smoke test po deployu

**Cel:** Nie „wydaje się, że działa”, tylko szybkie potwierdzenie najważniejszych ścieżek.

**Minimalny smoke test**

1. home / app boot  
2. auth / session  
3. start Job Radar scan  
4. scan status polling  
5. report fetch  
6. SkillUp profile fetch — jeśli endpoint już istnieje  
7. Assistant endpoint health — jeśli już stoi  

**Definition of done**

- skrypt przechodzi bez krytycznych błędów  
- endpointy zwracają sensowne statusy  
- żadna kluczowa ścieżka nie jest martwa  

**Dobra praktyka:** Smoke po deployu, po migracjach, po zmianach env.

---

## 3. Skill Lab / SkillUp: od „spec + schema” do produktu

### 3.1 Spięcie SkillUp z API

**Cel:** SkillUp przestaje być tylko klasami i schema — żywe endpointy i przepływ z UI.

**MVP — write**

- ingest CV  
- update target role  
- create verification session  
- complete verification session  

**MVP — read**

- profile snapshot  
- claims  
- assessments  
- language assessments  
- gaps  
- market value  
- roadmap  

**Decyzja techniczna:** Jeśli projekt stoi na tRPC — SkillUp dostaje **tRPC router** jako główny kontrakt. REST pomocniczo tylko jeśli naprawdę potrzebny (worker / zewnętrzny interfejs).

**Definition of done**

- UI pobiera cały SkillUp read model  
- UI odpala ingest CV  
- UI odpala verification session  
- backend przelicza assessment / gaps / value / roadmap  

---

### 3.2 UI Skill Lab

**Cel:** Pierwszy vertical slice zgodny z finalnym specem — nie całe imperium.

**MVP ekranów**

1. **Current Position** — target role, current market value, strongest verified skills, skills needing proof, next milestone  
2. **Skill Verification** — lista skilli: declared, observed, verification status, confidence, improvement note  
3. **Language Verification** — language, declared, observed, confidence, what to improve  
4. **Skill Gaps** — severity, importance, role target, recommended action  
5. **Growth Roadmap** — milestones, duration, impact, status  

**Nie w MVP:** pełna gamifikacja, skomplikowany portfolio graph, rozbudowane wizualizacje trendów, „certification badges”.

**Definition of done**

- user widzi własny stan  
- user rozumie co ma, czego brakuje, co robić dalej  

---

### 3.3 Silnik weryfikacji: claim / evidence → assessment

**Cel:** Właściwy engine SkillUp. Bez tego tylko formularz udający inteligencję.

**Wejścia MVP**

- CV  
- mock interview / verification session  
- manual target role  
- ewentualnie LinkedIn jeśli dostępny  

**Co musi robić silnik**

1. wyciągać claimy  
2. wyciągać evidence  
3. agregować skill assessment  
4. aktualizować language assessment  
5. wyliczać skill gaps  
6. aktualizować market value  
7. generować roadmapę  

**Minimalne triggery:** `cv_uploaded`, `verification_session_completed`, `target_role_updated`

**Minimalna logika gotowości:** brak niespójności z jednego słabego sygnału; verified > declared; observed > stale claim; niskie confidence capped.

**Definition of done**

- po CV: claims + evidence + assessment  
- po verification session: zmiana observed  
- po zmianie target role: gaps + roadmap  
- market value się aktualizuje  

---

## 4. Assistant: produkt, nie „chat”

### 4.1 Wypełnić Assistant configuration sheet decyzjami

**Cel:** Formularz nie jest pustym rytuałem — zamrożony source of truth.

**Decyzje do zapisania:** rola, zakres tematów, routing rules, tone, feedback policy, skill signal behavior, safety/compliance, memory policy, CTA policy, telemetry.

**Definition of done**

- config sheet kompletny, bez pól „TBD”  
- product, design i backend używają tego samego dokumentu  

---

### 4.2 Wyprowadzić finalny spec Assistanta

Z config sheet wychodzą **4 artefakty:**

1. AI Assistant Final Spec v1.0 (kanoniczny: `docs/assistant/ai-assistant-final-spec-v1.0.md`)  
2. Prompt / behavior policy  
3. Routing matrix  
4. API contract + telemetry  

**Definition of done**

- jedna definicja roli  
- jawny routing  
- jawne output structures  
- API implementowalne  
- telemetry pod KPI  

---

## 5. Repo i proces

### 5.1 Zacommitować i wypchnąć lokalne zmiany

**Cel:** Jedna prawda — lokalnie, origin, VPS.

**Co zrobić:** `git status`, brak blokujących niecommitniętych zmian, push brancha roboczego, sensowne commity.

**Definition of done**

- lokalne repo czyste (w sensie: zmiany są na origin)  
- branch z aktualnym stanem na origin  
- VPS deployuje z właściwego źródła  

---

### 5.2 Merge do `main`

**Decyzja:** Nie od razu, jeśli produkcja leci z `claude/improvements` i wszystko nie zostało sprawdzone.

**Merge do `main` dopiero gdy**

- deploy stabilny  
- smoke test przechodzi  
- Job Radar nie wisi  
- migracje siedzą  
- env czysty  
- SkillUp MVP nie rozwala startu aplikacji  

**Definition of done**

- `main` znowu stabilną bazą  
- brak rozjazdu branchy  
- przyszłe deploye nie są rosyjską ruletką  

---

## 6. Nice-to-have / dłuższe rzeczy

### 6.1 CI/CD rozszerzenia

Warto: testy przed deployem, smoke po deployu, osobny staging, deploy lock przy czerwonych testach. **Nie blokuje obecnego rolloutu** — ważne, ale mniej niż żeby produkt w ogóle działał.

---

### 6.2 TODO z CLAUDE.md (przykład: avatar w rozmowie kwalifikacyjnej)

**Status:** Nie jest blockerem dla produkcji, Job Radar, SkillUp, Assistant foundation — **odłożyć**, nie mieszać w krytycznej ścieżce.

---

## 7. Ostateczny plan sprintowy

| Sprint | Zakres |
|--------|--------|
| **1** | Produkcja i stabilność: aktualny build VPS, env fix, migracje MySQL, outbox worker check, smoke test |
| **2** | Job Radar production readiness: pełen pipeline, report generation, monitoring stuck scans, partial/ready flow |
| **3** | SkillUp MVP backend + API: router/API, ingest + recompute, read model |
| **4** | SkillUp UI MVP: current position, verification, gaps, market value, roadmap |
| **5** | Assistant foundation: configuration sheet completed, final spec, prompt / routing / API / telemetry |
| **6** | Stabilization: repo cleanup, merge to main, CI/CD hardening |

---

## 8. Definition of overall success

**Produkcja:** najnowszy build na VPS, env poprawny, migracje wdrożone, smoke test przechodzi.

**Job Radar:** scan nie wisi bez końca, report dochodzi do `ready` albo `partial_report`, outbox działa.

**Skill Lab:** user wrzuca CV, system liczy claims/evidence/assessment, pokazuje gaps, market value, roadmapę.

**Assistant:** jedna definicja roli, routing, kontrakt API, telemetry — nie tylko „chat”.

---

## 9. Finalna decyzja operacyjna

**Najważniejsza kolejność teraz:**

1. Produkcja i outbox  
2. SkillUp API + recompute  
3. SkillUp UI MVP  
4. Assistant configuration → final spec  

Nie odwrotnie. Nie „najpierw super Assistant, potem może backend”.

---

## Powiązane dokumenty

- Skill Lab: `docs/skill-lab/skill-lab-final-spec-v1.0.md`  
- AI Assistant (final spec): `docs/assistant/ai-assistant-final-spec-v1.0.md`  
- AI Assistant (configuration sheet): `docs/ai/assistant/ai-assistant-configuration-sheet-v1.0.md`  
- Indeks AI docs: `docs/ai/README.md`  
