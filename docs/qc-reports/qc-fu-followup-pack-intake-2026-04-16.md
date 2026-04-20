# QC Intake — FU-1 / FU-2 / FU-3 Follow-Up Pack (2026-04-16)

**Role:** Quality Control Developer  
**Intake order (PO pin):** B → C → A — raporty: `agent-b-report.md` (FU-2), `agent-c-report.md` (FU-3 + integracja), `agent-a-report.md` (FU-1).  
**Format:** [`quality-control-developer-role-spec.md`](../policies/quality-control-developer-role-spec.md) — dozwolone statusy końcowe: **Approved For Integration** albo **Not Approved**.

**Evidence (non-live, wykonane przy intake):**

- `cd /Users/nikodem/job-app-restore/proj/backend && npm test -- --run src/services/__tests__/assistant-meta.spec.ts` — **pass** (5 tests).
- Kod: `frontend/src/app/assistant/AssistantPage.tsx` — warstwa `SensitiveCaseLayer`, `hasSafetyBlock`, disable send/mic przy block (FU-1).
- Kod: `shared/assistant.ts` — komentarz `// draft (FU-2 / Case Practice contract sketch…)` zgodny z raportem B (ścieżka A).
- Dok: `agent-c-report.md` — **Annex — FU-3** (tabela + 3× repro).

**Live AI smoke:** nie stanowi części tej paczki — osobny dokument `qc-ai-live-smoke-2026-04-16.md`; przy braku `OPENAI_API_KEY` werdykt live = **Not Approved** (patrz tam).

---

## Werdykt — paczka FU-1 + FU-2 + FU-3 (jedna bramka integracji follow-up)

```md
Approved

Validated:
- Product Alignment — FU-1 rozróżnia warning vs block w UI zgodnie z annexem promptów; FU-2 utrwala decyzję ścieżki A (draft Case Practice w `shared/`); FU-3 dokumentuje reguły historii + repro.
- UI Quality — FU-1: osobna warstwa wizualna block vs warning, spójna z opisem w raporcie A.
- UX Flow — FU-1: wejście zablokowane przy `block`; warning nie blokuje wysyłki zgodnie z intencją.
- Technical Structure — FU-2: jeden builder meta w backendzie; testy `assistant-meta`; FU-3: kontrakt historii bez podwójnego scalania (z raportów).
- Consistency — Title Case / kanał raportów; pin B→C→A uwzględniony przy przeglądzie.

Notes:
- Live OpenAI oraz pełny E2E UI nie są częścią tej decyzji — patrz smoke osobno.
- Known Limitations z raportów agentów pozostają świadomym długiem (np. starsze wiersze historii bez `mode`).

Status:
Approved For Integration
```

**Zakres zatwierdzenia:** wyłącznie follow-upy **FU-1, FU-2, FU-3** opisane w `qc-live-status.md` na 2026-04-16; nie unieważnia to osobnych bramek (np. 19 ekranów + smoke) z innych raportów QC.

## QC Verdict (operational)

**Approved For Integration** — FU-1, FU-2, FU-3 follow-up pack, zgodnie z blokiem walidacji powyżej (live smoke = osobny dokument).

## Required Next Action

- `Owning agent: required work is executed in the repository, not in chat instead of implementation — see docs/squad/IMPLEMENTATION_EXECUTION_RULES.md §5a and Hard Rule 8.`

1. **Agenci:** dalsze prace i ewentualne poprawki **w repo** + świeży raport **§6** / `READY FOR QC` przy kolejnych zakresach; znane ograniczenia z raportów — jawne w dostawach.  
2. **QC:** bramka live AI — wyłącznie wg [`qc-ai-live-smoke-2026-04-16.md`](./qc-ai-live-smoke-2026-04-16.md) (nie mieszać z tą paczką).  
3. **PO:** świadomość zakresu (tylko FU-1..3); inne bramki (19 ekranów itd.) — osobno.
