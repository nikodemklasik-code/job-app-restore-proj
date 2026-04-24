import { tryGetOpenAiClient } from '../lib/openai/openai.client.js';
import { getDefaultTextModel } from '../lib/openai/model-registry.js';

export interface CasePracticeScenarioInput {
  title: string;
  summary: string;
  roleBrief: string;
  prep: string[];
  mode: 'solo' | 'joint-call' | 'private-session' | 'tomorrow';
  includePushback?: boolean;
}

export interface CasePracticePack {
  briefing: string;
  openingResponse: string;
  pushbackResponse?: string;
  verdict: string;
  reflection: string;
}

function clean(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function modeHint(mode: CasePracticeScenarioInput['mode']): string {
  switch (mode) {
    case 'joint-call':
      return 'Assume several people are present. Responses should be calm, concise and suitable for a live call.';
    case 'private-session':
      return 'Assume the conversation is private. Responses can be a little more direct, but still measured.';
    case 'tomorrow':
      return 'Assume the user is preparing for a conversation tomorrow. Emphasise planning, sequencing and calm wording.';
    default:
      return 'Assume a solo rehearsal. Focus on one clear first response and one safe follow-up.';
  }
}

function fallbackPack(input: CasePracticeScenarioInput): CasePracticePack {
  const prep = input.prep.slice(0, 3);
  const firstPrep = prep[0] ?? 'Start with facts before interpretation.';
  const secondPrep = prep[1] ?? 'Name your request clearly.';
  const thirdPrep = prep[2] ?? 'Close with one next step.';

  return {
    briefing: `This case is about staying factual under pressure. ${firstPrep} ${secondPrep} ${thirdPrep}`,
    openingResponse: `From my side, the key point is this: ${clean(input.summary)} I want to explain the facts clearly, outline my reasoning, and agree the most useful next step.` ,
    pushbackResponse: input.includePushback
      ? 'I understand the concern. I am raising it again because the core issue is still unresolved, and I want to keep this focused on the facts, the impact, and what we should do next.'
      : undefined,
    verdict: 'Best move: stay calm, avoid motive-reading, and make one concrete request. Weak move: becoming defensive or adding too much history before stating the point.',
    reflection: 'After practising, check whether your wording shows facts, ownership and a next step. If the response sounds vague or emotional before it sounds clear, tighten the opening two sentences.',
  };
}

export async function generateCasePracticePack(input: CasePracticeScenarioInput): Promise<CasePracticePack> {
  const openai = tryGetOpenAiClient();
  if (!openai) {
    return fallbackPack(input);
  }

  const prompt = `You are a workplace case-practice coach. Generate practical rehearsal support for a difficult work conversation.

Case title: ${input.title}
Case summary: ${clean(input.summary)}
Role brief: ${clean(input.roleBrief)}
Preparation notes: ${input.prep.map((item) => clean(item)).join(' | ')}
Mode: ${input.mode}
Mode hint: ${modeHint(input.mode)}
Include pushback round: ${input.includePushback ? 'yes' : 'no'}

Return valid JSON only:
{
  "briefing": "2-3 sentence calm briefing",
  "openingResponse": "first response the user could actually say",
  "pushbackResponse": "follow-up response to resistance, if requested",
  "verdict": "short practical verdict on what makes the response strong or weak",
  "reflection": "short reflection prompt for the user after practice"
}

Rules:
- British English.
- Practical and emotionally steady.
- No legal advice.
- No theatrical language.
- No invented facts beyond the case summary and role brief.
- openingResponse and pushbackResponse must sound like something a professional could actually say aloud.
- Keep each field concise and useful.`;

  try {
    const response = await openai.chat.completions.create({
      model: getDefaultTextModel(),
      messages: [
        { role: 'system', content: 'You write realistic workplace case-practice guidance. Stay concrete, measured and professional.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.35,
      max_tokens: 700,
    });

    const raw = JSON.parse(response.choices[0]?.message?.content ?? '{}') as Partial<CasePracticePack>;
    const fallback = fallbackPack(input);

    return {
      briefing: clean(raw.briefing ?? fallback.briefing),
      openingResponse: clean(raw.openingResponse ?? fallback.openingResponse),
      pushbackResponse: input.includePushback ? clean(raw.pushbackResponse ?? fallback.pushbackResponse ?? '') : undefined,
      verdict: clean(raw.verdict ?? fallback.verdict),
      reflection: clean(raw.reflection ?? fallback.reflection),
    };
  } catch {
    return fallbackPack(input);
  }
}
