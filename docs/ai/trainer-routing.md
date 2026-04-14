# Trainer Routing — Signal → Coach Module

**Implementacja:** `backend/src/prompts/trainer-routing.ts`

---

## Jak działa routing

Po każdej sesji system wykrywa sygnały z metryk sesji i kieruje użytkownika do konkretnych modułów Coacha.

Każdy sygnał ma:
- warunek wyzwalania (kiedy uznajemy że obszar wymaga pracy)
- moduł główny (priorytetowy)
- opcjonalny moduł dodatkowy
- ludzką rekomendację
- konkretne zadanie treningowe

---

## Tabela routingu

| Sygnał | Warunek | Moduł główny | Moduł dodatkowy |
|---|---|---|---|
| `structure` | Pokrycie STAR < 50% sesji | Behavioral / STAR | — |
| `ownership` | Za dużo "my", za mało "ja" | Ownership Language | — |
| `results` | ≤ 1 turn z mierzalnym wynikiem | Impact & Results | — |
| `conciseness` | Śr. > 200 słów lub ≥ 3 krótkie odpowiedzi | Concise Answering | — |
| `delivery` | ≥ 15 fillerów w sesji | Delivery — Fillers | — |
| `depth` | Średni wynik < 55 | Behavioral / STAR | Technical Depth |
| `problem_solving` | Pokrycie Action < 50% | Behavioral / STAR | Case Study |
| `stakeholder_comm` | Brak wymiaru stakeholder w sesji senior | Stakeholder Communication | — |
| `technical_depth` | Rola techniczna, płytkie rozumowanie | Technical Depth | — |
| `business_thinking` | Rola senior/lead, brak wpływu biznesowego | Leadership Answers | — |

---

## Moduły Coacha

| Moduł | Opis |
|---|---|
| Behavioral / STAR | Struktura: Sytuacja → Zadanie → Akcja → Wynik |
| Tell Me About Yourself | 2-minutowe profesjonalne intro |
| Ownership Language | "Ja zdecydowałem" vs "my trochę popatrzyliśmy" |
| Impact & Results | Mierzalne wyniki w każdej odpowiedzi |
| Concise Answering | Zasada 90 sekund — krótszy wstęp, szybciej do sedna |
| Delivery — Fillers | "Yyy", "no wiesz" → celowa pauza |
| Technical Depth | Decyzje architektoniczne i trade-offy |
| Case Study | Problem biznesowy → framework → rekomendacja |
| Leadership Answers | Zarządzanie ludźmi, konflikty, delegowanie |
| Stakeholder Communication | Wpływ bez formalnej władzy, alignment między teamami |
| Difficult Questions | Porażka, konflikt, presja — z opanowaniem |
| Motivation & Why Role | Autentyczna narracja kariery |
| Salary Expectations | Rozmowy o wynagrodzeniu |
| Closing Questions | 3–5 ostrych pytań do rekrutera |

---

## Handoff Interview → Coach

Po każdej sesji generowany jest obiekt `SessionHandoff`:

```
improvementSignals   → gdzie jakość spadła
strengthSignals      → gdzie kandydat błyszczał
recommendedModules   → moduły Coacha (posortowane priorytetem)
practiceTasks        → top 3 konkretne zadania
weakestSections      → sekcje wymagające pracy
nextSessionDifficulty→ rekomendowany poziom trudności
```

Jeśli średni wynik ≥ 80 → system rekomenduje wyższy poziom trudności w kolejnej sesji.
