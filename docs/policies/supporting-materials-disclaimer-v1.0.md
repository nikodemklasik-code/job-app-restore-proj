# Materiały wspierające — disclaimer produktowy (v1.0)

## Gdzie obowiązuje

Tekst ma być widoczny (UI lub dokumentacja modułu) przy m.in.:

- **AI Career Assistant**
- **Coach**
- **Interview / AI Interview Coach**
- **Negotiation Coach**
- **Case Practice**
- **Skills Lab**
- **plan rozwoju / roadmap / Growth Plan** na profilu (patrz też `docs/features/profile-growth-and-roadmap-spec-v1.0.md`)

## Tekst kanoniczny (PL, UI — pełna wersja)

**★ Materiały wspierające** — moduły i treści AI pokazują **kierunek** i nadają **rytm** pracy. **Nie stanowią jedynej możliwej drogi** ani **nie gwarantują powodzenia** (np. rozmowy, awansu, wynagrodzenia). To **propozycja** dopasowana do typowych potrzeb użytkownika; **efekt zależy od wielu czynników**, m.in. Twojego zaangażowania, przygotowania, kontekstu ofert, organizacji pracy i sytuacji rynkowej.

## Tekst kanoniczny (PL, UI — wersja zwięzła)

**★** Materiały wspierające: **kierunek** i **rytm** — nie jedyna droga, **brak gwarancji sukcesu**; wynik zależy od **wielu czynników**.

## Tekst pomocniczy (EN, opcjonalnie w UI)

Supporting tools suggest **direction** and **rhythm**; they are **not** the only path and **do not** guarantee outcomes. Results depend on many factors including your effort, context, and market conditions.

## Zasady redakcyjne

- Nie usuwać gwiazdki (★) z wersji „propozycja” bez decyzji PO.
- Nie obiecywać w tym samym ekranie sprzecznych twierdzeń (np. „gwarantowany wynik” obok tego disclaimeru).
- Zmiana copy: PO + krótka notka w changelog / task card.

## Implementacja w kodzie

Komponent: `frontend/src/components/SupportingMaterialsDisclaimer.tsx` (props: `compact`, `className`).

## Zachowanie AI (granice, ton, feedback)

Pełna specyfikacja warunków brzegowych modułów (Coach, Interview, Negotiation, Case Practice) oraz zasady wspólne po angielsku:  
[`docs/ai/principles/ai-boundaries-and-feedback-rules.md`](../ai/principles/ai-boundaries-and-feedback-rules.md)
