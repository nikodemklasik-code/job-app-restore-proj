import {
  allowedAssistantSourceTypes,
  assistantIntents,
  assistantModes,
  type AssistantContextRef,
  type AssistantIntent,
  type AssistantResponseMeta,
  type AllowedAssistantSourceType,
  type AssistantMode,
} from '../../../shared/assistant.js';
import {
  buildUniversalBehaviorLayer,
  type BehaviorLayerTier,
} from '../prompts/shared/universal-behavior-layer.js';
import { getOpenAiClient } from '../lib/openai/openai.client.js';
import { getDefaultTextModel } from '../lib/openai/model-registry.js';

const ASSISTANT_INTENT_SET = new Set<AssistantIntent>(assistantIntents);

export const getOpenAIClient = getOpenAiClient;

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

const CASE_PRACTICE_SAFETY_LAYER = `
Case Practice Legal/Safety Rules:
- You are not legal advice, legal representation, or an outcome predictor.
- Never state certainty like "you will win", "this is definitely unlawful", or guaranteed tribunal outcomes.
- Use cautious wording: "This May Raise A Concern", "This May Warrant Qualified Advice".
- If user mentions tribunal, ACAS, discrimination, harassment, retaliation, or grievance, keep guidance practical and non-deterministic.
- For immediate danger or safeguarding risk, prioritise emergency/human support signposting.
`;
const LEGAL_SAFETY_LAYER = `
Legal and Safety Rules:
- Never provide legal advice as fact; provide general informational guidance and suggest consulting a qualified professional.
- Refuse requests involving deception, credential fabrication, discriminatory tactics, harassment, or manipulation.
- If user asks for unsafe or unethical actions, provide a safe alternative within career development scope.
- Keep response calm, non-judgmental, and action-oriented.
`;

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
  const system = `${baseSystem}\n\n${CASE_PRACTICE_SAFETY_LAYER}\n\n${LEGAL_SAFETY_LAYER}\n\n${behaviorLayer}${sourceHint}`;

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
    model: getDefaultTextModel(),
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

function detectIntent(userText: string): AssistantIntent {
  const t = userText.toLowerCase();
  if (/(cv|resume|cover letter)/.test(t)) return 'improve_cv';
  if (/(salary|offer|negotiat|compensation)/.test(t)) return 'salary_negotiation';
  if (/(interview|\bmock\b|question|star)/.test(t)) return 'prepare_for_interview';
  if (/(profile|headline|summary|experience section)/.test(t)) return 'improve_profile';
  if (/(rewrite|rephrase|improve this answer|better wording)/.test(t)) return 'rewrite_answer';
  if (/(review|rate this answer|feedback on answer)/.test(t)) return 'review_answer';
  if (/(fit|match|qualified|good for this role)/.test(t)) return 'explain_fit';
  if (/(job search|where to apply|search strategy)/.test(t)) return 'job_search_help';
  if (/(follow[- ]?up|thank you email)/.test(t)) return 'followup_message';
  if (/(skill gap|verify skill|market value|missing skills)/.test(t)) return 'skill_verification_request';
  if (/(which module|where should i go|route me|what next module)/.test(t)) return 'route_to_module';
  return 'ask_for_advice';
}

/** When client sends explicit mode, it wins over text-only intent heuristics. */
function resolveIntent(userText: string, explicitMode?: AssistantMode): AssistantIntent {
  if (explicitMode === 'cv') return 'improve_cv';
  if (explicitMode === 'salary') return 'salary_negotiation';
  if (explicitMode === 'interview') return 'prepare_for_interview';
  return detectIntent(userText);
}

function inferModeFromText(userText: string): AssistantMode {
  const t = userText.toLowerCase();
  if (/(cv|resume|cover letter|ats)/.test(t)) return 'cv';
  if (/(interview|\bmock\b|question|star)/.test(t)) return 'interview';
  if (/(salary|offer|negotiat|compensation)/.test(t)) return 'salary';
  return 'general';
}

function buildRouteSuggestions(userText: string): AssistantResponseMeta['routeSuggestions'] {
  const t = userText.toLowerCase();
  const suggestions: AssistantResponseMeta['routeSuggestions'] = [];
  if (/(case practice|workplace case|grievance|harassment|discrimination|tribunal|acas|retaliation|victimisation)/.test(t)) {
    suggestions.push({ label: 'Case Practice', route: '/case-practice', reason: 'Practice high-pressure workplace scenarios safely.' });
  }
  if (/(skill|market value|gap|grow)/.test(t)) {
    suggestions.push({ label: 'Skill Lab', route: '/skills', reason: 'Analyze skill gaps and growth direction.' });
  }
  if (/(employer|company risk|benefits|compensation data)/.test(t)) {
    suggestions.push({ label: 'Job Radar', route: '/job-radar', reason: 'Run employer and role-quality checks.' });
  }
  if (/(cv|resume|cover letter|application)/.test(t)) {
    suggestions.push({ label: 'Applications', route: '/applications', reason: 'Work through application readiness and messaging.' });
  }
  if (/(interview|mock interview)/.test(t)) {
    suggestions.push({ label: 'Interview', route: '/interview', reason: 'Practice structured interview responses.' });
  }
  if (/(salary|offer|compensation|negotiat)/.test(t)) {
    suggestions.push({ label: 'Negotiation', route: '/negotiation', reason: 'Prepare salary positioning and pushback responses.' });
  }
  return suggestions.slice(0, 3);
}

function buildSafetyNotes(userText: string): AssistantResponseMeta['safetyNotes'] {
  const t = userText.toLowerCase();
  const notes: AssistantResponseMeta['safetyNotes'] = [];
  if (/(tribunal|acas|et1|employment tribunal|legal claim)/.test(t)) {
    notes.push({ level: 'warning', text: 'This Is Practice Support, Not Legal Advice Or Outcome Prediction.' });
  }
  if (/(discrimination|harassment|victimisation|retaliation|bullying)/.test(t)) {
    notes.push({ level: 'warning', text: 'This May Raise A Formal Concern. Document Facts And Consider Qualified Advice.' });
  }
  if (/(threat|unsafe|violence|self harm|suicide|emergency)/.test(t)) {
    notes.push({ level: 'block', text: 'If There Is Immediate Risk, Contact Emergency Or Human Support Now.' });
  }
  if (/(lie|fake|fabricate|invent experience|false credential)/.test(t)) {
    notes.push({ level: 'block', text: 'Fabricating experience or credentials is not supported.' });
  }
  if (/(legal advice|lawsuit|sue|contract law)/.test(t)) {
    notes.push({ level: 'warning', text: 'Guidance is informational only and not legal advice.' });
  }
  if (!notes.length) {
    notes.push({ level: 'info', text: 'Advice is guidance, not a hiring or legal decision.' });
  }
  return notes;
}

function buildActionSuggestions(userText: string, intent: AssistantIntent): AssistantResponseMeta['suggestedActions'] {
  const basePrompt = userText.trim().slice(0, 180);
  const map: Record<AssistantIntent, AssistantResponseMeta['suggestedActions']> = {
    ask_for_advice: [
      { id: 'advice-next-step', label: 'Get A 3-Step Plan', prompt: `Give me a 3-step plan for: ${basePrompt}` },
      { id: 'advice-risk-check', label: 'Run Risk Check', prompt: `What are the top risks in this approach: ${basePrompt}` },
    ],
    review_answer: [
      { id: 'review-score', label: 'Score My Answer', prompt: `Score this answer and explain why: ${basePrompt}` },
      { id: 'review-upgrade', label: 'Upgrade Answer', prompt: `Improve this answer while keeping my tone: ${basePrompt}` },
    ],
    rewrite_answer: [
      { id: 'rewrite-concise', label: 'Rewrite Concise', prompt: `Rewrite this in a concise way: ${basePrompt}` },
      { id: 'rewrite-impact', label: 'Rewrite With Impact', prompt: `Rewrite with stronger impact and clarity: ${basePrompt}` },
    ],
    prepare_for_interview: [
      { id: 'interview-mock', label: 'Start Mock Questions', prompt: 'Give me 5 realistic interview questions for this role.' },
      { id: 'interview-star', label: 'Create STAR Answers', prompt: 'Help me draft STAR-based interview answers for my profile.' },
    ],
    salary_negotiation: [
      { id: 'salary-script', label: 'Build Negotiation Script', prompt: 'Create a salary negotiation script for my situation.' },
      { id: 'salary-counter', label: 'Prepare Counter Offer', prompt: 'Prepare a respectful counter-offer response.' },
    ],
    improve_cv: [
      { id: 'cv-bullets', label: 'Rewrite CV Bullets', prompt: 'Rewrite my CV bullets with measurable impact.' },
      { id: 'cv-ats', label: 'ATS Optimization', prompt: 'Optimize my CV for ATS screening.' },
    ],
    improve_profile: [
      { id: 'profile-summary', label: 'Improve Profile Summary', prompt: 'Rewrite my profile summary for clarity and impact.' },
      { id: 'profile-experience', label: 'Improve Experience Section', prompt: 'Improve my experience section with stronger outcomes.' },
    ],
    explain_fit: [
      { id: 'fit-gap', label: 'Explain Fit Gaps', prompt: 'Explain my fit gaps for this role and how to close them.' },
      { id: 'fit-strengths', label: 'Highlight Strengths', prompt: 'Highlight my strongest signals for this role.' },
    ],
    job_search_help: [
      { id: 'search-weekly', label: 'Weekly Search Plan', prompt: 'Build a focused weekly job search plan.' },
      { id: 'search-priority', label: 'Prioritize Opportunities', prompt: 'Help me prioritize which opportunities to pursue first.' },
    ],
    followup_message: [
      { id: 'followup-draft', label: 'Draft Follow-Up', prompt: 'Draft a concise post-interview follow-up email.' },
      { id: 'followup-strong', label: 'Stronger Follow-Up', prompt: 'Rewrite my follow-up message to sound more confident.' },
    ],
    skill_verification_request: [
      { id: 'skill-gap-map', label: 'Map Skill Gaps', prompt: 'Map my key skill gaps for my target role.' },
      { id: 'skill-proof-plan', label: 'Build Proof Plan', prompt: 'Build an evidence plan to prove my critical skills.' },
    ],
    route_to_module: [
      { id: 'route-best', label: 'Recommend Best Module', prompt: 'Recommend the best module for my current goal and explain why.' },
      { id: 'route-fastest', label: 'Fastest Next Step', prompt: 'What is the fastest useful next step in product modules?' },
    ],
  };
  const suggestions = map[intent].slice(0, 3).map((item) => ({ ...item }));
  for (const suggestion of suggestions) {
    const label = suggestion.label.toLowerCase();
    if (label.includes('interview')) {
      suggestion.route = '/interview';
      suggestion.mode = 'interview';
    } else if (label.includes('salary') || label.includes('negotiation') || label.includes('offer')) {
      suggestion.route = '/negotiation';
      suggestion.mode = 'salary';
    } else if (label.includes('cv')) {
      suggestion.route = '/applications';
      suggestion.mode = 'cv';
    } else if (label.includes('profile')) {
      suggestion.route = '/profile';
      suggestion.mode = 'cv';
    } else if (label.includes('skill')) {
      suggestion.route = '/skills';
      suggestion.mode = 'general';
    } else {
      suggestion.route = '/assistant';
      suggestion.mode = 'general';
    }
  }
  return suggestions;
}

interface BuildAssistantResponseMetaInput {
  userText: string;
  mode?: AssistantMode;
  sourceType?: AllowedAssistantSourceType;
}

function buildContextRefs(
  routeSuggestions: AssistantResponseMeta['routeSuggestions'],
  mode: AssistantMode,
  sourceType: AllowedAssistantSourceType,
): AssistantContextRef[] {
  const refs: AssistantContextRef[] = [
    { type: 'assistant', label: 'Mode', value: mode.toUpperCase() },
    { type: 'assistant', label: 'Source Type', value: sourceType.replace(/_/g, ' ') },
  ];
  if (sourceType === 'job_listing_table') {
    refs.push({ type: 'applications', label: 'Active Job Context', value: 'Job Listing Context Available' });
  }
  if (mode === 'cv') refs.push({ type: 'documents', label: 'Document Context', value: 'CV Improvement Focus' });
  if (mode === 'interview') refs.push({ type: 'skills', label: 'Practice Context', value: 'Interview Readiness Focus' });
  const routeRefs: AssistantContextRef[] = routeSuggestions.map((item): AssistantContextRef => ({
    type: item.route === '/skills'
      ? 'skills'
      : item.route === '/applications'
        ? 'applications'
        : item.route === '/job-radar'
          ? 'job_radar'
          : item.route === '/profile'
            ? 'profile'
            : item.route === '/documents'
              ? 'documents'
              : 'assistant',
    label: 'Suggested Route',
    value: item.label,
  }));
  return [...refs, ...routeRefs].slice(0, 6);
}

export function buildAssistantResponseMeta(input: BuildAssistantResponseMetaInput): AssistantResponseMeta {
  const { userText } = input;
  const mode = input.mode ?? inferModeFromText(userText);
  const sourceType = input.sourceType ?? 'manual_user_input';
  const detectedIntent = resolveIntent(userText, input.mode);
  const safeIntent = ASSISTANT_INTENT_SET.has(detectedIntent) ? detectedIntent : 'ask_for_advice';
  const routeSuggestions = buildRouteSuggestions(userText);
  const suggestedActions = buildActionSuggestions(userText, safeIntent);
  const safetyNotes = buildSafetyNotes(userText);
  const contextRefs = buildContextRefs(routeSuggestions, mode, sourceType);

  const complianceFlags = [
    /(tribunal|acas|et1|employment tribunal|legal claim)/.test(userText.toLowerCase()) ? 'Case Practice Legal Caution' : null,
    /(discrimination|harassment|victimisation|retaliation|bullying)/.test(userText.toLowerCase()) ? 'Sensitive Workplace Concern' : null,
    /(threat|unsafe|violence|self harm|suicide|emergency)/.test(userText.toLowerCase()) ? 'Urgent Safeguarding' : null,
  ].filter((f): f is string => Boolean(f));
  const nextBestStep = routeSuggestions[0]?.label ?? suggestedActions[0]?.label ?? 'Open Coach';

  return {
    detectedIntent: safeIntent,
    suggestedActions,
    routeSuggestions,
    contextRefs,
    safetyNotes,
    nextBestStep,
    complianceFlags,
  };
}
