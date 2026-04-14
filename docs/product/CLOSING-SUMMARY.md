# Recruiter Closing Summary — Production Spec

## What this is

The final moment of every interview session.  
After the last exchange, the AI recruiter speaks a 30–45 second closing summary aloud,  
while the same content appears on screen in structured form.  
Only then does the user see the full report and PDF download.

---

## Architecture: Option 2 — Deterministic data + GPT narrative

Data is collected **mechanically during the interview** (no GPT needed).  
GPT is called **once at the end** to write only the narrative text from that data.  
The `spokenVersion` is assembled **from structured fields via template** — not generated freeform.

### Why this matters

- Fast: structured data is ready instantly, GPT call is small (< 400 tokens prompt)
- Cheap: one small call per session instead of analysing full transcript
- Accurate: GPT cannot hallucinate scores it was never given — it only narrates what the system already measured
- Flexible: tone/language can change without re-running analysis

---

## Data collected during the session (deterministic)

These are computed locally from the transcript, no GPT:

```ts
interface SessionMetrics {
  // Per-turn scores (already computed by scoreTurnClient())
  turnScores: number[]                    // e.g. [72, 68, 81, 74, 63, 78, 85, 70]
  averageScore: number                    // mean of turnScores

  // STAR coverage per turn (already computed by detectStarClient())
  starCoverage: {
    situation: number   // 0–1, fraction of turns with situation present
    task: number
    action: number
    result: number
  }

  // Filler word count (computed during transcription)
  fillerCount: number                     // total "um", "uh", "like", "you know"

  // Answer length stats
  avgAnswerWords: number                  // average words per answer
  shortAnswers: number                    // turns where answer < 60 words

  // Ownership signal (turns where "I" used clearly vs "we")
  ownershipScore: number                  // 0–100

  // Quantified results (turns with numbers/metrics)
  quantifiedTurns: number                 // count of turns with measurable result

  // Session metadata
  mode: InterviewMode
  difficulty: 'standard' | 'stretch' | 'senior'
  persona: RecruiterPersona
  role: string
  company: string
  durationSeconds: number
  exchangeCount: number
}
```

---

## Signal extraction (pre-GPT, deterministic)

From `SessionMetrics`, the system derives:

```ts
interface SessionSignals {
  // Top strengths (max 3, picked from signal library below)
  strengths: SignalKey[]

  // Improvement areas (max 3, picked from signal library below)
  improvements: SignalKey[]

  // Overall tier
  tier: 'strong' | 'solid' | 'developing'

  // Recruiter perspective flag
  recruiterTakeaway: 'credible-needs-precision' | 'strong-closer' | 'good-base-needs-evidence' | 'confident-needs-structure'
}
```

### Signal library (deterministic rules)

| Signal key | Strength condition | Improvement condition |
|---|---|---|
| `ownership` | ownershipScore ≥ 70 | ownershipScore < 50 |
| `structure` | avg STAR coverage ≥ 0.75 | avg STAR coverage < 0.5 |
| `results` | quantifiedTurns ≥ 3 | quantifiedTurns ≤ 1 |
| `conciseness` | avgAnswerWords 80–160 | avgAnswerWords > 200 or shortAnswers ≥ 3 |
| `delivery` | fillerCount < 8 | fillerCount ≥ 15 |
| `problemSolving` | action STAR coverage ≥ 0.75 | action STAR coverage < 0.5 |
| `depth` | avgScore ≥ 75 | avgScore < 55 |

---

## GPT call — narrative only

### Input to GPT

```
You are writing a closing summary spoken by a recruiter named {persona.name} ({persona.role}).
Tone: {tone}
Keep it under 80 words total.

Session data:
- Overall tier: {tier}
- Top strengths: {strengths} (use human language, not key names)
- Improvement areas: {improvements}
- Recruiter takeaway: {recruiterTakeaway}
- Role: {role} at {company}
- Mode: {mode}

Write exactly 5 sections (1-2 sentences each):
1. overall — one sentence verdict
2. strengths — what stood out
3. improvements — constructive, not critical  
4. recruiterPerspective — how the candidate came across from the interviewer's side
5. nextFocus — 2-3 concrete things for the next session

Language rules:
- Never say "score", "metric", "data", "analysis"
- Never say "you lack" or "you failed" or "you were weak"
- Use "in a few moments", "it would land even stronger if", "the clearest signal was"
- Write as if speaking, not as a report
- Match the tone of {persona.name}: {personaToneDescription}
```

### Tone per persona

| Persona | Name | Tone description |
|---|---|---|
| `hr` | Sarah | warm, encouraging, uses "I noticed", focuses on communication and presence |
| `hiring-manager` | James | direct, practical, focuses on ownership and decision-making |
| `tech-lead` | Alex | concise, analytical, focuses on depth and clarity of reasoning |

### Tone per tier

| Tier | Modifier |
|---|---|
| `strong` | confident and affirming — lead with strength |
| `solid` | balanced — acknowledge what worked before improvement |
| `developing` | encouraging — frame every improvement as an opportunity, not a gap |

---

## The `closingSummary` object

```ts
interface ClosingSummary {
  // Structured data (deterministic)
  tier: 'strong' | 'solid' | 'developing'
  overallScore: number          // 0–100
  strengths: string[]           // 2–3 human-language strings
  improvements: string[]        // 2–3 human-language strings
  recruiterPerspective: string  // 1 short paragraph
  nextInterviewFocus: string[]  // 2–3 actionable items

  // Spoken version (assembled from fields above via template + persona)
  spokenVersion: string         // 60–80 words, read by TTS

  // Session context
  personaName: string
  personaRole: string
  mode: string
  difficulty: string
  role: string
  generatedAt: string           // ISO timestamp
}
```

---

## `spokenVersion` assembly

The spoken text is **not generated freeform** — it is assembled from the 5 GPT sections:

```ts
function assembleSpokenVersion(summary: ClosingSummary): string {
  return [
    summary.overall,
    summary.strengths.length > 0
      ? `The clearest strengths were: ${summary.strengths.join(' and ')}.`
      : '',
    summary.improvements.length > 0
      ? summary.improvements[0]
      : '',
    summary.recruiterPerspective,
    `For your next session, focus on: ${summary.nextInterviewFocus.join(', ')}.`
  ].filter(Boolean).join(' ')
}
```

Target: **65–80 words**, **25–40 seconds at natural speech pace**.

---

## Example output per persona

### Sarah (HR) · solid tier

> "Thank you for this conversation. This was a solid session — you came across as genuine and thoughtful. Your communication style and the way you described taking ownership were the strongest signals. In a few moments it would land even better if the result came through more clearly. From my side, you felt credible and prepared. For next time: shorter opening, one measurable outcome, and name your role in the decision earlier."

---

### James (Hiring Manager) · strong tier

> "Good session. You showed clear ownership and solid problem-solving across most of the conversation. The strongest moments were when you named your decision and described the outcome directly. A couple of answers ran a little long — tightening those would make the impact sharper. From a hiring manager's perspective, the foundation is strong. Next time: get to the decision faster, add one number where you can, and close every answer with the result."

---

### Alex (Tech Lead) · developing tier

> "Thanks for the session. There were some good moments, especially when you described your approach to the problem. The area with the most room to grow is being more specific about outcomes and your personal contribution. That's very buildable. From a technical perspective, the thinking is there — the next step is showing it more precisely. Focus on: naming your decision clearly, adding one concrete result, and keeping the context shorter so the action stands out."

---

## UX flow

```
[Last AI exchange completes]
        ↓
[0.8s pause]
        ↓
[Recruiter avatar: state → "speaking"]
[TTS plays spokenVersion — ~35 seconds]
[Screen fades in: closing summary card]
        ↓
[spokenVersion finishes]
        ↓
[CTA appears:]
  [ See full feedback ]   [ Download PDF report ]
```

### Closing summary card layout (on-screen)

```
┌─────────────────────────────────────────────────────┐
│  Session summary · [mode] · [difficulty]            │
│  [persona name] · [role] at [company]               │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Overall                                            │
│  "This was a solid session..."                      │
│                                                     │
│  Strengths                  What to strengthen      │
│  · Ownership                · Close with result     │
│  · Communication            · Shorter openings      │
│  · Problem-solving          · Name your impact      │
│                                                     │
│  Recruiter's perspective                            │
│  "You came across as credible and prepared..."      │
│                                                     │
│  For your next session                              │
│  1. Shorter opening                                 │
│  2. One measurable result                           │
│  3. Name your role in the decision earlier          │
│                                                     │
├─────────────────────────────────────────────────────┤
│  [ See full feedback ]    [ Download PDF report ]   │
└─────────────────────────────────────────────────────┘
```

---

## PDF structure (v1 scope)

| Page | Content | Source |
|---|---|---|
| 1 | Session overview: date, mode, difficulty, persona, role, overall score, tier verdict | SessionMetrics + closingSummary |
| 2 | Strengths — 2-3 with short explanation | closingSummary.strengths |
| 3 | What to strengthen — 2-3 constructive items | closingSummary.improvements |
| 4 | Answer analysis — 3 best/worst turns: question → answer summary → what worked → what to improve | per-turn data |
| 5 | Practice plan — 3 concrete exercises | closingSummary.nextInterviewFocus + signalKeys → Trainer map |
| 6 | Next steps — recommended Trainer modules, suggested question types, next session difficulty | signal → Trainer routing table |

### Language rule for PDF (same as spoken)

Never: "score", "metric", "gap detected", "you lack", "weak performance"  
Always: descriptive, evidence-based, written as coaching not grading

---

## Trainer routing table (from signals to modules)

| Signal improvement area | Recommended Trainer module |
|---|---|
| `structure` (low STAR) | Behavioral — STAR practice |
| `results` (no metrics) | Impact & Results module |
| `ownership` (we vs I) | Ownership language drill |
| `conciseness` (too long) | Concise answers — 90-second rule |
| `delivery` (fillers) | Delivery — filler word reduction |
| `depth` (low score) | Technical depth or case study |

---

## Implementation order

1. `extractSessionSignals(metrics)` — deterministic, no GPT
2. `generateClosingSummary(signals, persona, tone)` — one GPT call, ~400 tokens
3. `assembleSpokenVersion(summary)` — template assembly
4. TTS via existing `/api/interview/tts` endpoint
5. Closing summary card UI (shown while TTS plays)
6. PDF generation from `closingSummary` + per-turn data
7. Trainer routing from signal keys

---

## What does NOT change

- Interview flow during the session — unchanged
- Per-turn STAR scoring — already exists, now feeds `SessionMetrics`
- TTS endpoint — reused as-is
- Avatar states — `speaking` state already exists

The closing summary is an **additive layer on top of what already works**.
