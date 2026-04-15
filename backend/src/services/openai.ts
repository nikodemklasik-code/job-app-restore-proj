import OpenAI from 'openai';
import {
  allowedAssistantSourceTypes,
  assistantModes,
  type AllowedAssistantSourceType,
  type AssistantMode,
} from '../../../shared/assistant.js';
import {
  buildUniversalBehaviorLayer,
  type BehaviorLayerTier,
} from '../prompts/shared/universal-behavior-layer.js';

const apiKey = process.env.OPENAI_API_KEY;

let _client: OpenAI | null = null;

export const getOpenAIClient = (): OpenAI => {
  if (!_client) {
    if (!apiKey) throw new Error('Missing OPENAI_API_KEY');
    _client = new OpenAI({ apiKey });
  }
  return _client;
};

// ── Source-type policy ────────────────────────────────────────────────────────

const forbiddenSourceTypes = new Set([
  'linkedin_inmail_thread',
  'facebook_messenger_thread',
  'instagram_dm_thread',
  'raw_private_messages',
]);

export function assertAllowedAssistantSourceType(sourceType: string): AllowedAssistantSourceType {
  if (forbiddenSourceTypes.has(sourceType)) {
    throw new Error('Private social-platform messages are not allowed as AI input.');
  }
  if (allowedAssistantSourceTypes.includes(sourceType as AllowedAssistantSourceType)) {
    return sourceType as AllowedAssistantSourceType;
  }
  throw new Error(`Unsupported assistant source type: ${sourceType}`);
}

// ── PII redaction ─────────────────────────────────────────────────────────────

export function redactSensitiveText(input: string): string {
  return input
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[redacted-email]')
    .replace(/(?<!\w)(?:\+?\d[\d\s().-]{6,}\d)(?!\w)/g, '[redacted-phone]')
    .replace(/https?:\/\/\S+/gi, '[redacted-url]')
    .replace(
      /\b\d{1,5}\s+[A-ZÀ-ÿ0-9][A-ZÀ-ÿ0-9\s.'-]{2,}(?:Street|St|Road|Rd|Avenue|Ave|Lane|Ln|Drive|Dr|Boulevard|Blvd)\b/gi,
      '[redacted-address]',
    );
}

// ── Career response generation ────────────────────────────────────────────────

const BOUNDARY =
  'Scope: career, job search, CV/cover letters, interviews, salary, workplace skills, learning paths for those topics. If the user asks for something outside that (e.g. doing homework, illegal acts, medical/legal diagnosis), briefly refuse and suggest a career-related angle instead.';

const systemPrompts: Record<string, string> = {
  general: `You are a world-class career strategist. ${BOUNDARY} Be direct, specific, and actionable. When the user wants depth, use structure (headings/bullets) but stay conversational.`,
  cv: `You are an expert CV writer and ATS optimization specialist. ${BOUNDARY}`,
  interview: `You are an expert interview coach. Use STAR where helpful, behavioral and technical angles, and delivery tips. ${BOUNDARY}`,
  salary: `You are a salary negotiation expert. ${BOUNDARY}`,
  system_design: `You are a senior hiring manager running a system design interview prep session. ${BOUNDARY}
Do NOT dump a generic checklist unless they ask for an overview. Prefer: (1) one clarifying question if the goal is vague, (2) a sample problem or drill (e.g. "Design URL shortener / feed / chat") when appropriate, (3) step-by-step reasoning: requirements, capacity, API, data model, scaling, trade-offs. Challenge assumptions briefly. Keep each reply focused; offer "go deeper on X?" options.`,
  onboarding: `You are an onboarding coach for a career workspace app. ${BOUNDARY}
Guide the user step by step to a complete profile: CV upload, personal summary, target roles, skills, email for applications. One clear next action per message; ask if they completed the previous step.`,
};

interface GenerateCareerInput {
  mode: AssistantMode | string;
  sourceType: AllowedAssistantSourceType;
  messages: { role: 'user' | 'assistant'; content: string }[];
  /** When omitted, full policy stack (interview/coach parity). */
  behaviorTier?: BehaviorLayerTier;
}

export const generateCareerResponse = async (input: GenerateCareerInput): Promise<string> => {
  const client = getOpenAIClient();

  // Validate mode — fall back to 'general' if not in the allowed list
  const safeMode = (assistantModes as readonly string[]).includes(input.mode) ? input.mode : 'general';
  const baseSystem = systemPrompts[safeMode] ?? systemPrompts.general!;

  // Source-type context hint in system message
  const sourceHint =
    input.sourceType !== 'manual_user_input'
      ? `\n\nContext source: ${input.sourceType.replace(/_/g, ' ')} (public data — no private messages).`
      : '';

  const behaviorLayer = buildUniversalBehaviorLayer(input.behaviorTier ?? 'full');
  const system = `${baseSystem}\n\n${behaviorLayer}${sourceHint}`;

  const prior = input.messages.slice(-24).map((m) => ({
    role: m.role,
    content: m.content.slice(0, 12000),
  }));

  // The last message in prior is the user's latest turn; pass it as the user role
  const lastMsg = prior.pop();
  if (!lastMsg) {
    return 'I was unable to generate a response. Please try again.';
  }

  const completion = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: system },
      ...prior,
      { role: 'user', content: lastMsg.content },
    ],
    max_tokens: safeMode === 'system_design' ? 2200 : safeMode === 'onboarding' ? 1200 : 1400,
  });

  return (
    completion.choices[0]?.message?.content ??
    'I was unable to generate a response. Please try again.'
  );
};
