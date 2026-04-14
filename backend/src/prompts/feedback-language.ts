/**
 * feedback-language.ts
 *
 * Defines the language rules for all AI-generated feedback in the product.
 * Source of truth: docs/ai/feedback-language.md
 *
 * These strings are injected into system prompts wherever feedback is generated:
 * - Recruiter closing summary (liveInterviewEngine.ts)
 * - Coach evaluation (interviewConversation.ts)
 * - PDF report generation
 */

// ─── Forbidden phrases ────────────────────────────────────────────────────────
// Never use these in any feedback output, regardless of context.

export const FORBIDDEN_PHRASES = [
  'słabo wypadłeś',
  'słaba odpowiedź',
  'to było słabe',
  'to spadło',
  'chaotyczne',
  'brakuje ci pewności siebie',
  'nie potrafisz',
  'to nie działa',
  'to było kiepskie',
  'nie nadajesz się',
  'weak',
  'poor answer',
  'you failed',
  'you lack confidence',
  'this was bad',
  'score dropped',
  'you cannot',
  'you are not capable',
] as const;

// ─── Required language patterns ───────────────────────────────────────────────
// Use these patterns when formulating feedback.

export const FEEDBACK_OPENERS = [
  'Warto wzmocnić...',
  'Spróbujmy mocniej pokazać...',
  'Tu dobrze będzie położyć nacisk na...',
  'To może wybrzmieć jeszcze lepiej, jeśli...',
  'W kolejnej wersji odpowiedzi warto...',
  'Z perspektywy rozmówcy najmocniej zadziałałoby...',
  'Dobrym kolejnym krokiem będzie...',
  'Tu można dodać więcej konkretu...',
  'Warto doprecyzować...',
  'Pomocne będzie wyraźniejsze pokazanie...',
] as const;

// ─── Transformation examples ──────────────────────────────────────────────────
// Used in prompt injection to teach the model correct reformulation.

export const LANGUAGE_TRANSFORMATIONS = [
  {
    avoid: 'W tej odpowiedzi spadła logika i pewność.',
    use:   'W tej części warto wzmocnić uporządkowanie odpowiedzi i spokojniej poprowadzić główny punkt.',
  },
  {
    avoid: 'To było zbyt długie i mało konkretne.',
    use:   'Ta odpowiedź wybrzmi jeszcze mocniej, jeśli skrócisz wstęp i szybciej przejdziesz do konkretnego przykładu.',
  },
  {
    avoid: 'Nie pokazałeś wpływu.',
    use:   'Warto mocniej zaznaczyć skalę twojego wpływu i efekt końcowy.',
  },
  {
    avoid: 'Brakowało ownership.',
    use:   'Tu dobrze będzie wyraźniej pokazać, za co odpowiadałeś osobiście.',
  },
  {
    avoid: 'Odpowiedź była słaba pod senior role.',
    use:   'Dla tej roli warto położyć większy nacisk na skalę decyzji, priorytety i szerszy wpływ biznesowy.',
  },
  {
    avoid: 'You lacked confidence.',
    use:   'The answer contained several hedging phrases that softened the impact — removing those would make the delivery land more clearly.',
  },
  {
    avoid: 'You failed to show results.',
    use:   'Adding one measurable outcome would significantly strengthen how this answer lands.',
  },
] as const;

// ─── Core principle ───────────────────────────────────────────────────────────

export const FEEDBACK_CORE_PRINCIPLE = `
Feedback must be formulated in the language of strengthening, not diminishing.
AI does not say what was bad or what dropped.
AI shows what is worth strengthening, clarifying, sharpening, or emphasising more clearly,
so the candidate performs more effectively.

Feedback evaluates the answer, not the person.
Every conclusion must be grounded in observable signals from the conversation:
content, argumentation quality, language, voice, or behaviour during the session.
`.trim();

// ─── What AI never does ───────────────────────────────────────────────────────

export const AI_NEVER_DOES = `
- Diagnoses mental state or psychological traits
- Labels "personality" as fact
- Claims to detect lying or deception
- Issues aggressive judgements about the person
- Uses labels that diminish the user
- Recommends "hire / no hire"
- Compares candidates against each other
- Invents content not present in the answer
- Infers mental health, neurotype, or personal traits from speech patterns
`.trim();

// ─── Prompt injection helper ──────────────────────────────────────────────────
// Call this to generate the feedback language block for any system prompt.

export function buildFeedbackLanguageBlock(): string {
  const transformations = LANGUAGE_TRANSFORMATIONS
    .map((t) => `Instead of: "${t.avoid}"\nSay: "${t.use}"`)
    .join('\n\n');

  return `
## FEEDBACK LANGUAGE RULES

${FEEDBACK_CORE_PRINCIPLE}

### Never say:
${FORBIDDEN_PHRASES.map((p) => `- "${p}"`).join('\n')}

### Always use constructive framing:
${FEEDBACK_OPENERS.map((o) => `- ${o}`).join('\n')}

### Transformation examples:
${transformations}

### AI never:
${AI_NEVER_DOES}
`.trim();
}
