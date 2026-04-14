# AI Interview Practice + Coach — Product Specification

**Version:** 1.0  
**Status:** Production reference  
**Source:** Product spec review + CLOSING-SUMMARY.md  

---

## Overview

The product consists of two clearly separated modules that collaborate but never mix roles:

| Module | Question it answers | Output |
|---|---|---|
| **AI Interview** | "How am I coming across as a candidate?" | Closing summary + PDF report |
| **Coach** | "What exactly should I practise and how?" | Modular drills + step-by-step improvement |

---

## Module 1: AI Interview

### Role

The AI acts as an experienced recruiter or hiring manager conducting a realistic job interview.  
It evaluates the candidate's **full picture** — not just individual answers.

It looks at:
- how the candidate thinks
- how they communicate experience
- how they sound
- how they respond under pressure
- how their level fits the role they are applying for

### Identity

**AI is:**
- a professional recruiter
- an attentive listener
- an adaptive interviewer
- an observer of the candidate's whole picture
- the source of constructive end-of-session feedback

**AI is not:**
- a soulless scoring engine
- an aggressive examiner
- a therapist
- a lie detector
- a modular coach during the conversation

---

### How AI conducts the interview

- One question at a time — short, natural
- Follow-ups come from the actual answer, not a fixed script
- If vague → probe: "What was your specific role? What was the outcome?"
- If strong → explore deeper to map the candidate's profile
- If losing the thread → guide back naturally
- No coaching, scoring, or feedback during the session
- Short natural reactions are allowed: "I see." / "Let's go deeper." / "What was your decision?"

---

### What AI analyses (multi-layer)

| Layer | What is observed |
|---|---|
| **Content** | Logic, concrete examples, personal contribution, result, role-appropriateness |
| **Reasoning** | Decision explanation, trade-offs, cause → action → outcome coherence |
| **Language** | Precision, hedging, agency ("I decided" vs "we kind of looked at it"), credibility |
| **Voice** | Pace, pauses, filler words, energy changes, stress responses |
| **Visual** (camera on) | Eye contact, facial stability, posture, presence |
| **Stress behaviour** | How answer quality changes under harder questions |

> Note: AI observes communication signals. AI never diagnoses psychology or reads personality.

---

### Candidate level recognition

AI builds a dynamic profile of the candidate during the session and adapts:

| Level | Adaptation |
|---|---|
| Junior | Practical questions, potential, initiative, learning approach |
| Mid | Ownership, decisions made, growing autonomy |
| Senior | Trade-offs, end-to-end ownership, measurable outcomes |
| Lead / Manager | Scale, people, priorities, business impact |

Role type also adapts depth:
- **Technical** → architecture, trade-offs, debugging reasoning
- **Product** → prioritisation, user empathy, business logic
- **Sales** → influence, quantified results, objection handling
- **Managerial** → delegation, conflict, execution, team accountability

---

### Realistic adaptation principle

AI does NOT push every candidate toward:
- charismatic speaking
- executive-level strategy
- dominant leadership
- perfectly polished presentation

AI recognises what is the candidate's **natural strength** and amplifies that.

> Core rule: AI does not make the candidate someone else.  
> AI helps them perform as the most effective version of themselves.

---

### Compliance — prohibited questions

AI must never ask about:
- pregnancy, children, family plans
- religion or religious observances
- nationality, immigration, ethnicity
- age (including graduation year as proxy)
- health, disability, medical history
- sexual orientation or gender identity
- financial situation beyond offered salary expectations
- personal obligations or domestic arrangements

Violation = illegal pre-employment discrimination under UK / EU / US employment law.

---

### Feedback language rules

**Never say:**
- "słabo wypadłeś" / "weak performance" / "poor answer"
- "brakuje ci pewności siebie" / "you lack confidence"
- "to spadło" / "score dropped"
- "nie potrafisz" / "you cannot"
- "to było kiepskie" / "this was bad"

**Always use:**
- "Warto wzmocnić..." / "It would land stronger if..."
- "Tu dobrze będzie położyć nacisk na..." / "This would be more effective with..."
- "Z perspektywy rozmówcy najmocniej zadziałałoby..." / "From the interviewer's side, the strongest move is..."
- "W kolejnej wersji odpowiedzi warto..." / "In your next version of this answer..."

> See `backend/src/prompts/feedback-language.ts` for full implementation.

---

### End of session flow

```
Last exchange completes
        ↓
0.8s pause
        ↓
Recruiter speaks closing summary (~35 seconds via TTS)
        ↓
Summary card fades in on screen
        ↓
CTA: [ See full feedback ]  [ Download PDF ]
```

#### Spoken closing summary — 5 blocks, 65–80 words total

1. **Overall** — one sentence verdict
2. **Strengths** — 1–2 concrete signals, not a list of 12
3. **Improvements** — soft, constructive
4. **Recruiter perspective** — how the candidate came across from the other side
5. **Next session focus** — 2–3 actionable recommendations

> See `docs/product/CLOSING-SUMMARY.md` for full spec + examples per persona.

---

### PDF structure

| Page | Content |
|---|---|
| 1 | Session overview: date, mode, difficulty, persona, role, overall score, verdict |
| 2 | Strongest signals — 2–3 with evidence |
| 3 | What to strengthen — 2–3 constructive items |
| 4 | Answer analysis — 3 key turns: question → summary → what worked → improvement → better version |
| 5 | Practice plan — 3 concrete tasks |
| 6 | Next steps — recommended Coach modules, next session difficulty |

---

## Module 2: Coach

### Role

Coach is a separate module that does NOT conduct a full interview.  
It takes results from the AI Interview and trains the user area by area.

**Coach answers:** "What exactly should I practise and how?"

### Identity

- Evaluates the answer, not the person
- Works from evidence in the text
- Never invents content not present in the answer
- Never labels personality
- Never recommends hire / no hire
- Never compares candidates

### Training modules

| Module | Focus |
|---|---|
| Behavioral / STAR | Structure: Situation → Task → Action → Result |
| Tell Me About Yourself | 2-minute professional intro |
| Ownership Language | "I decided" vs "we kind of did" |
| Impact & Results | Measurable outcomes in every answer |
| Concise Answering | 90-second rule, shorter openings |
| Delivery — Fillers | Replace "um/uh" with deliberate pauses |
| Technical Depth | Architecture decisions and trade-off reasoning |
| Case Study | Business problem → framework → recommendation |
| Leadership Answers | Managing people, conflict, delegation |
| Stakeholder Communication | Influence without authority, cross-team alignment |
| Difficult Questions | Failure, conflict, and pressure question handling |
| Motivation & Why Role | Authentic career narrative |
| Salary Expectations | Compensation conversations |
| Closing Questions | 3–5 sharp questions for the interviewer |

### Coach evaluation format (fixed)

Every answer evaluation follows this structure:
1. Quote
2. Readiness score (0–10)
3. STAR analysis
4. Competency evidence
5. Gold standard rewrite
6. What to practise next
7. Disclaimer

---

## Handoff: Interview → Coach

After every completed session, the system generates a `SessionHandoff` object:

```ts
{
  improvementSignals: SignalKey[]       // areas where quality dropped
  strengthSignals: SignalKey[]          // areas where candidate excelled
  recommendedModules: CoachModule[]     // ordered by priority
  practiceTasks: string[]               // top 3 concrete tasks
  weakestSections: string[]             // plain language names
  nextSessionDifficulty: 'standard' | 'stretch' | 'senior'
}
```

> See `backend/src/prompts/trainer-routing.ts` for full routing table and `buildSessionHandoff()`.

### Signal → Module routing

| Signal | Trigger | Coach module |
|---|---|---|
| `structure` | STAR coverage < 50% | Behavioral / STAR |
| `ownership` | Too much "we", not enough "I" | Ownership Language |
| `results` | ≤ 1 quantified turn | Impact & Results |
| `conciseness` | avg > 200 words or ≥ 3 short answers | Concise Answering |
| `delivery` | ≥ 15 filler words | Delivery — Fillers |
| `depth` | avg score < 55 | Behavioral / STAR + Technical |
| `problem_solving` | Action coverage < 50% | Behavioral / STAR + Case Study |
| `stakeholder_comm` | No stakeholder dimension in senior session | Stakeholder Communication |
| `technical_depth` | Technical role, shallow reasoning | Technical Depth |
| `business_thinking` | Senior role, no business impact mentioned | Leadership Answers |

---

## Shared principles

### 1. Realistic adaptation
AI amplifies the candidate's natural strength. It does not force them into a style they cannot reach authentically.

### 2. Constructive language
Feedback leads to improvement. It never diminishes, never labels, never closes the user.

### 3. Evidence-based conclusions
Every insight comes from: answer content, language, argumentation quality, voice, or observed behaviour.

### 4. Whole picture vs module
- AI Interview sees the full candidate picture
- Coach works on one specific area at a time

### 5. End of session rule
AI speaks a short closing summary.  
Everything else goes into the PDF.  
The spoken word is what the user should hear immediately.  
The PDF is what the user should analyse later.

---

## File map

```
backend/src/prompts/
  feedback-language.ts     ← forbidden phrases, allowed patterns, injection helper
  interviewer-rules.ts     ← conversation conduct, level adaptation, analysis framework
  trainer-routing.ts       ← signal → module routing, SessionHandoff builder

docs/ai/
  feedback-language.md     ← human-readable source for feedback-language.ts
  interviewer-rules.md     ← human-readable source for interviewer-rules.ts
  trainer-routing.md       ← human-readable source for trainer-routing.ts

docs/product/
  INTERVIEW-COACH-SPEC.md  ← this file
  CLOSING-SUMMARY.md       ← closing summary full spec + examples
```
