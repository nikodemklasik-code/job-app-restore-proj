# Case Practice — Game Mechanics Layer

## Zasada nadrzędna

Motywy gry w Case Practice muszą wzmacniać realne uczenie się, a nie zastępować je.
Żaden element gamifikacji nie może tworzyć poczucia postępu bez rzeczywistego postępu.
Żaden element nie może nagradzać aktywności zamiast jakości.

---

## 1. STREAK — Seria Aktywności

### Definicja
Streak to liczba kolejnych dni, w których użytkownik ukończył co najmniej jeden przypadek.

### Zasady
- Streak rośnie tylko po ukończeniu pełnej sesji (nie po samym otwarciu)
- Streak nie rośnie po sesji "Prepare For Tomorrow" bez dostarczenia odpowiedzi
- Streak nie jest resetowany jeśli użytkownik miał zaplanowaną sesję i ją ukończył w ciągu 24h od planowanego terminu
- Streak pokazuje się subtelnie — nie dominuje nad treścią

### Komunikacja
- "3 dni z rzędu. Twoja struktura argumentacji jest coraz szybsza."
- "7-dniowa seria. Zauważamy, że Twoje granice są teraz wyraźniejsze."
- Nie: "Brawo! Jesteś niesamowity!" — zawsze powiązane z konkretną obserwacją wzrostu

---

## 2. PRESSURE RANK — Ranga Presji

### Definicja
Ranga określa, na jakim poziomie presji użytkownik regularnie radzi sobie skutecznie.

### Poziomy
| Ranga | Opis | Odblokowanie |
|---|---|---|
| Grounded | Skuteczny przy niskiej presji | Start |
| Steady | Skuteczny przy średniej presji | 5 ukończonych sesji Medium |
| Resilient | Skuteczny przy wysokiej presji | 3 sesje High z wynikiem pozytywnym |
| Pressure-Proof | Skuteczny przy wszystkich typach presji | 10 sesji High, różne typy presji |
| Under Fire | Mistrzowska stabilność pod presją wielowymiarową | Specjalne przypadki wielopresyjne |

### Zasady
- Ranga nie spada po jednej słabej sesji
- Ranga spada dopiero po wzorcu słabych sesji (3+ z rzędu poniżej rangi)
- Ranga jest widoczna w profilu, nie w trakcie sesji

---

## 3. SKILL SIGNALS — Sygnały Umiejętności

### Definicja
Każda sesja aktualizuje 10 sygnałów umiejętności w profilu użytkownika.
Sygnały są widoczne jako "poziom pewności" w danej kompetencji, nie jako punkty.

### Stany sygnału
- **Emerging** — umiejętność pojawia się, ale niespójna
- **Developing** — umiejętność widoczna w większości sesji
- **Consistent** — umiejętność stabilna pod presją
- **Strong** — umiejętność niezawodna nawet w najtrudniejszych przypadkach

### Zasady
- Sygnał rośnie tylko po sesji, w której dana umiejętność była aktywnie ćwiczona
- Sygnał nie rośnie automatycznie z czasem
- Cofnięcie sygnału jest możliwe, ale opisywane jako "obszar do wzmocnienia", nie jako "utrata"

---

## 4. CASE UNLOCKS — Odblokowywanie Przypadków

### Definicja
Część przypadków jest zablokowana do momentu, gdy użytkownik wykaże gotowość.

### Logika odblokowywania
- Przypadki "High Pressure" odblokowane po 3 ukończonych sesjach Medium
- Przypadki "Discrimination Concern" i "Victimisation Concern" odblokowane po ukończeniu "Fair Treatment Concern"
- Przypadki "Under Fire" (wielopresyjne) odblokowane po osiągnięciu rangi Resilient
- Przypadki "Joint Call" odblokowane po 2 ukończonych sesjach solo w tej samej kategorii

### Komunikacja odblokowywania
- "Nowy przypadek dostępny. Twoja stabilność pod presją jest wystarczająca."
- Nie: "Zdobyłeś nowy poziom!" — zawsze powiązane z konkretną obserwacją

---

## 5. CASE STREAKS — Serie Kategorii

### Definicja
Seria w obrębie konkretnej kategorii przypadków.

### Przykłady
- "3 przypadki Boundary Setting z rzędu — Twoje granice są teraz wyraźniejsze."
- "5 przypadków Defend Your Decision — Twoja obrona decyzji pod presją jest stabilna."

### Zasady
- Serie kategorii nie są wymagane — to obserwacja, nie obowiązek
- Sugestia kolejnego przypadku z tej samej kategorii pojawia się po sesji, nie przed nią

---

## 6. GROWTH MOMENTS — Momenty Wzrostu

### Definicja
Specjalne powiadomienia pojawiające się gdy system wykryje realny postęp w czasie.

### Przykłady
- "Twoje pierwsze zdanie jest teraz silniejsze niż 2 tygodnie temu."
- "Zauważamy, że rzadziej unikasz sedna problemu."
- "Twoja struktura pod presją czasową poprawiła się w ostatnich 4 sesjach."

### Zasady
- Growth Moment pojawia się maksymalnie raz na 3 sesje
- Growth Moment nigdy nie pojawia się po słabej sesji
- Growth Moment jest zawsze konkretny — nigdy ogólne "Świetna robota!"

---

## 7. POSITION RECORD — Rekord Pozycji

### Definicja
Najsilniejsza sesja użytkownika w każdej kategorii — zachowana jako punkt odniesienia.

### Zastosowanie
- "Twój rekord w Boundary Setting: 'Ochroniłeś swoją pozycję' przy presji High."
- Użytkownik może wrócić do swojego rekordu i zobaczyć, co zadziałało
- Rekord nie jest pokazywany innym użytkownikom (prywatny)

---

## 8. JOINT CALL MATCHMAKING — Dopasowanie do Sesji Live

### Definicja
System dopasowuje użytkowników do sesji live na podstawie:
- Podobnego poziomu presji
- Podobnej kategorii przypadku
- Podobnego sygnału umiejętności (żeby sesja była wartościowa dla obu stron)

### Zasady
- Dopasowanie nigdy nie blokuje trybu solo
- Zaproszenie do sesji live jest zawsze opcjonalne
- Sesja live nie jest "lepsza" niż solo — to inny tryb, nie nagroda

---

## 9. TOMORROW STREAK — Seria Przygotowań

### Definicja
Specjalny streak dla użytkowników, którzy regularnie korzystają z trybu "Prepare For Tomorrow".

### Komunikacja
- "3 razy z rzędu przygotowałeś się przed trudną rozmową."
- "Twoje pierwsze zdanie w trybie Prepare jest teraz konkretniejsze."

---

## 10. ANTI-PATTERNS — Czego NIE robimy

| Czego unikamy | Dlaczego |
|---|---|
| Punkty liczbowe (XP, score) | Tworzą poczucie postępu bez postępu |
| Leaderboardy | Uczenie się nie jest sportem widowiskowym |
| Odznaki za aktywność | Nagradzają klikanie, nie jakość |
| Animacje świętowania po każdej sesji | Infantylizują produkt |
| Presja na codzienne logowanie | Tworzy lęk, nie motywację |
| "Poziomy" bez znaczenia | Puste poczucie postępu |
| Porównywanie z innymi użytkownikami | Demotywuje słabszych, nie pomaga mocniejszym |
