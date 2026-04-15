import { randomUUID } from 'crypto';
import OpenAI from 'openai';
import {
  dbCreateSession,
  dbGetSession,
  dbUpdateSession,
  dbAppendTurn,
} from './liveInterviewRepository.js';

// ── Enums ─────────────────────────────────────────────────────────────────────

export const InterviewStatus = {
  CREATED: 'CREATED',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  ABANDONED: 'ABANDONED',
} as const;
export type InterviewStatus = (typeof InterviewStatus)[keyof typeof InterviewStatus];

export const InterviewStage = {
  INTRO: 'INTRO',
  WARMUP: 'WARMUP',
  CORE_EXPERIENCE: 'CORE_EXPERIENCE',
  DEEP_DIVE: 'DEEP_DIVE',
  CANDIDATE_QUESTIONS: 'CANDIDATE_QUESTIONS',
  CLOSING: 'CLOSING',
} as const;
export type InterviewStage = (typeof InterviewStage)[keyof typeof InterviewStage];

export const CandidateIntent = {
  ANSWER: 'ANSWER',
  PARTIAL_ANSWER: 'PARTIAL_ANSWER',
  CLARIFICATION_REQUEST: 'CLARIFICATION_REQUEST',
  CANDIDATE_QUESTION: 'CANDIDATE_QUESTION',
  OFF_TOPIC: 'OFF_TOPIC',
  MIXED: 'MIXED',
  UNKNOWN: 'UNKNOWN',
} as const;
export type CandidateIntent = (typeof CandidateIntent)[keyof typeof CandidateIntent];

export const NextAction = {
  ASK_MAIN_QUESTION: 'ASK_MAIN_QUESTION',
  ASK_FOLLOW_UP: 'ASK_FOLLOW_UP',
  PROVIDE_CLARIFICATION: 'PROVIDE_CLARIFICATION',
  ANSWER_CANDIDATE_QUESTION: 'ANSWER_CANDIDATE_QUESTION',
  REDIRECT_TO_QUESTION: 'REDIRECT_TO_QUESTION',
  CLOSE_INTERVIEW: 'CLOSE_INTERVIEW',
} as const;
export type NextAction = (typeof NextAction)[keyof typeof NextAction];

// ── Domain models ─────────────────────────────────────────────────────────────

export interface RoleContext {
  targetRole: string;
  company?: string;
  seniority?: string;
  description?: string;
}

export interface InterviewConfig {
  maxTurns: number;
  maxFollowUpsPerTopic: number;
  mode: string;
}

export interface InterviewMemory {
  askedQuestions: string[];
  usedExamples: string[];
  claimsCaptured: string[];
  themesCovered: string[];
  positiveSignals: string[];
  negativeSignals: string[];
  openLoops: string[];
  clarificationHistory: string[];
  candidateQuestionsAsked: string[];
  consecutiveFollowUps: number;
}

export interface InterviewTurn {
  id: string;
  speaker: 'assistant' | 'candidate';
  message: string;
  intent?: CandidateIntent;
  nextAction?: NextAction;
  stage: InterviewStage;
  timestamp: Date;
}

export interface InterviewSummary {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  communicationNotes: string;
  nextFocus: string[];
}

export interface LiveInterviewSession {
  id: string;
  userId: string;
  status: InterviewStatus;
  stage: InterviewStage;
  roleContext: RoleContext;
  config: InterviewConfig;
  turnCount: number;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  endedAt?: Date;
  memory: InterviewMemory;
  transcript: InterviewTurn[];
  summary?: InterviewSummary;
}

export interface ProcessTurnResult {
  assistantMessage: string;
  nextAction: NextAction;
  stage: InterviewStage;
  memoryUpdate: {
    claimsCaptured: string[];
    themesCovered: string[];
    openLoops: string[];
    positiveSignals: string[];
    negativeSignals: string[];
  };
  isComplete: boolean;
}

// ── Session store removed — sessions are persisted via liveInterviewRepository ─

function getOpenAI(): OpenAI {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not configured');
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// ── Intent classification (heuristic) ────────────────────────────────────────

export function classifyIntent(message: string): CandidateIntent {
  const s = message.toLowerCase().trim();
  const wordCount = s.split(/\s+/).length;

  const clarificationPatterns = [
    /\bwhat do you mean\b/,
    /\bcan you (clarify|explain|repeat|rephrase|elaborate on the question)\b/,
    /\bi('m| am) not sure (what|how|which)\b/,
    /\bcould you (say|repeat|rephrase|clarify)\b/,
    /\bwhich (part|aspect|area) (do you mean|are you asking)\b/,
    /\bare you asking (about|regarding|whether)\b/,
    /\bsorry,? (what|could you)\b/,
    /\bcan you be more specific\b/,
  ];
  if (clarificationPatterns.some((p) => p.test(s))) {
    return CandidateIntent.CLARIFICATION_REQUEST;
  }

  const candidateQuestionPatterns = [
    /\bwhat (kind|type|sort) of (example|experience|situation)\b/,
    /\bshould i (focus|talk|mention|discuss)\b/,
    /\bdoes (this|the) role\b/,
    /\bwhat are you looking for\b/,
    /\bcan i ask\b/,
    /\bi have a question\b/,
    /\bwould you (like|prefer) (me to)?\b/,
    /\bhow (many|long|much) (years|time|experience)\b.*\?/,
  ];
  if (candidateQuestionPatterns.some((p) => p.test(s)) && s.endsWith('?')) {
    return CandidateIntent.CANDIDATE_QUESTION;
  }

  const hasAnswer =
    wordCount >= 20 ||
    /\b(i (led|built|managed|created|worked|developed|implemented|designed|owned|drove|launched|improved|reduced|increased|handled|supported|collaborated))\b/.test(s) ||
    /\b(my (role|responsibility|task|job|team|project|goal) was)\b/.test(s) ||
    /\b(we (launched|delivered|hit|exceeded|met|completed|achieved|shipped|built|created))\b/.test(s);

  const hasQuestion = s.endsWith('?') || /\bwould (that|it|this) (be|work|help)\b/.test(s);

  if (hasAnswer && hasQuestion) return CandidateIntent.MIXED;
  if (hasAnswer) return wordCount < 25 ? CandidateIntent.PARTIAL_ANSWER : CandidateIntent.ANSWER;
  if (wordCount < 5) return CandidateIntent.UNKNOWN;
  return CandidateIntent.PARTIAL_ANSWER;
}

// ── Next-action decision ──────────────────────────────────────────────────────

export function decideNextAction(
  intent: CandidateIntent,
  session: LiveInterviewSession,
): NextAction {
  const { stage, config, memory, turnCount } = session;
  const remaining = config.maxTurns - turnCount;

  // Always handle immediate conversational needs first
  if (intent === CandidateIntent.CLARIFICATION_REQUEST) {
    return NextAction.PROVIDE_CLARIFICATION;
  }
  if (intent === CandidateIntent.CANDIDATE_QUESTION) {
    return NextAction.ANSWER_CANDIDATE_QUESTION;
  }
  if (intent === CandidateIntent.MIXED) {
    return NextAction.ANSWER_CANDIDATE_QUESTION;
  }
  if (intent === CandidateIntent.OFF_TOPIC) {
    return NextAction.REDIRECT_TO_QUESTION;
  }

  // Check if we should close
  if (remaining <= 1 || stage === InterviewStage.CLOSING) {
    return NextAction.CLOSE_INTERVIEW;
  }

  // In CANDIDATE_QUESTIONS stage, move toward closing
  if (stage === InterviewStage.CANDIDATE_QUESTIONS && remaining <= 2) {
    return NextAction.CLOSE_INTERVIEW;
  }

  // Follow-up if answer is weak/partial and we haven't over-probed
  if (
    (intent === CandidateIntent.PARTIAL_ANSWER || intent === CandidateIntent.UNKNOWN) &&
    memory.consecutiveFollowUps < config.maxFollowUpsPerTopic
  ) {
    return NextAction.ASK_FOLLOW_UP;
  }

  // Follow-up if answer has open loops and we haven't over-probed
  if (
    intent === CandidateIntent.ANSWER &&
    memory.openLoops.length > 0 &&
    memory.consecutiveFollowUps < config.maxFollowUpsPerTopic
  ) {
    return NextAction.ASK_FOLLOW_UP;
  }

  // Otherwise move to next main question
  return NextAction.ASK_MAIN_QUESTION;
}

// ── Stage transition ──────────────────────────────────────────────────────────

export function advanceStageIfNeeded(session: LiveInterviewSession): InterviewStage {
  const { stage, turnCount, config } = session;
  const maxT = config.maxTurns;

  if (stage === InterviewStage.WARMUP && turnCount >= 2) {
    return InterviewStage.CORE_EXPERIENCE;
  }
  if (stage === InterviewStage.CORE_EXPERIENCE && turnCount >= Math.floor(maxT * 0.45)) {
    return InterviewStage.DEEP_DIVE;
  }
  if (stage === InterviewStage.DEEP_DIVE && turnCount >= Math.floor(maxT * 0.75)) {
    return InterviewStage.CANDIDATE_QUESTIONS;
  }
  if (stage === InterviewStage.CANDIDATE_QUESTIONS && turnCount >= maxT - 1) {
    return InterviewStage.CLOSING;
  }
  return stage;
}

// ── Memory update ─────────────────────────────────────────────────────────────

export function updateMemory(
  memory: InterviewMemory,
  userMessage: string,
  nextAction: NextAction,
): Partial<InterviewMemory> {
  const s = userMessage.toLowerCase();

  const newClaims: string[] = [];
  const claimPatterns = [
    /i (led|built|managed|created|implemented|designed|launched|drove|owned|developed|improved)\s+([\w\s]+?)(?:\.|,|and|which|that|$)/g,
    /my (team|project|role|work|responsibility) (?:was|involved|included)\s+([\w\s]+?)(?:\.|,|and|$)/g,
  ];
  for (const pattern of claimPatterns) {
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(s)) !== null) {
      const claim = m[0].trim().slice(0, 100);
      if (claim && !memory.claimsCaptured.includes(claim)) {
        newClaims.push(claim);
      }
    }
  }

  const newThemes: string[] = [];
  const themeMap: Record<string, RegExp> = {
    'process improvement': /\b(process|workflow|efficiency|bottleneck|optimiz|reduc|streamlin)\b/,
    'team leadership': /\b(led|lead|manag|team|direct|coach|mentor)\b/,
    'stakeholder management': /\b(stakeholder|executive|client|partner|collaborat)\b/,
    'technical execution': /\b(built|engineer|implement|architect|code|system|infra|deploy)\b/,
    'product thinking': /\b(product|feature|roadmap|user|metric|kpi|prioriti)\b/,
    'problem solving': /\b(problem|challenge|obstacle|issue|blocker|solv|fix|resolv)\b/,
    'data and metrics': /\b(\d+%|percent|metric|kpi|data|analytic|measur)\b/,
  };
  for (const [theme, pattern] of Object.entries(themeMap)) {
    if (pattern.test(s) && !memory.themesCovered.includes(theme)) {
      newThemes.push(theme);
    }
  }

  const positiveSignals: string[] = [];
  const negativeSignals: string[] = [];
  const newOpenLoops: string[] = [];

  // Positive signals
  if (/\b\d+%|\$\d|\d+ (users|clients|team members|projects|million|thousand)\b/.test(s)) {
    positiveSignals.push('quantified impact');
  }
  if (/\b(i led|i owned|i was responsible|i drove|my decision|i chose)\b/.test(s)) {
    positiveSignals.push('strong ownership language');
  }
  if (/\b(stakeholder|cross-functional|executive|c-suite|board)\b/.test(s)) {
    positiveSignals.push('cross-functional scope');
  }

  // Negative signals / open loops
  if (/\b(we did|the team did|everyone|someone|they)\b/.test(s) && !/\bi\b/.test(s)) {
    negativeSignals.push('diffused ownership — no personal "I" statement');
    newOpenLoops.push('clarify personal contribution');
  }
  if (s.length < 100 && nextAction !== NextAction.ASK_MAIN_QUESTION) {
    negativeSignals.push('short answer — limited depth');
    newOpenLoops.push('probe for more detail');
  }
  if (!/\b\d/.test(s) && memory.askedQuestions.length > 3) {
    newOpenLoops.push('ask for specific metrics or outcomes');
  }

  // Reset consecutive follow-ups if we just asked a main question
  const consecutiveFollowUps =
    nextAction === NextAction.ASK_FOLLOW_UP
      ? memory.consecutiveFollowUps + 1
      : 0;

  const update: Partial<InterviewMemory> = {
    claimsCaptured: [...memory.claimsCaptured, ...newClaims],
    themesCovered: [...memory.themesCovered, ...newThemes],
    positiveSignals: [...memory.positiveSignals, ...positiveSignals],
    negativeSignals: [...memory.negativeSignals, ...negativeSignals],
    openLoops: [...newOpenLoops],
    consecutiveFollowUps,
  };

  return update;
}

// ── OpenAI response generation ────────────────────────────────────────────────

function buildActionInstruction(nextAction: NextAction, memory: InterviewMemory): string {
  const openLoopContext =
    memory.openLoops.length > 0
      ? `Open loops to probe: ${memory.openLoops.slice(0, 2).join(', ')}.`
      : '';
  const themeContext =
    memory.themesCovered.length > 0
      ? `Themes already covered: ${memory.themesCovered.slice(0, 4).join(', ')}.`
      : '';

  switch (nextAction) {
    case NextAction.ASK_MAIN_QUESTION:
      return `Ask the next main interview question appropriate for the current stage. Avoid repeating themes that have been fully covered. ${themeContext}`;
    case NextAction.ASK_FOLLOW_UP:
      return `The candidate's last answer needs more depth. Ask a targeted follow-up question to probe further. ${openLoopContext} Do NOT repeat generic phrases like "can you elaborate?" — ask about a specific aspect of what they said.`;
    case NextAction.PROVIDE_CLARIFICATION:
      return `The candidate asked for clarification. Briefly clarify what your previous question meant (one or two sentences), then restate the original question concisely.`;
    case NextAction.ANSWER_CANDIDATE_QUESTION:
      return `The candidate asked you a question about the role or process. Answer it concisely in one or two sentences, then redirect back to the interview with: "With that in mind, let's continue..." and restate or ask the next question.`;
    case NextAction.REDIRECT_TO_QUESTION:
      return `The candidate went off-topic. Politely redirect them back to the interview question you last asked.`;
    case NextAction.CLOSE_INTERVIEW:
      return `The interview is coming to a close. Thank the candidate warmly, give a brief genuine remark about the conversation, explain that the team will be in touch, and say goodbye professionally.`;
    default:
      return `Ask the next appropriate interview question.`;
  }
}

function buildInterviewerSystemPrompt(session: LiveInterviewSession): string {
  const { roleContext, stage, memory, config } = session;
  const role = roleContext.targetRole;
  const company = roleContext.company ?? 'the company';
  const seniority = roleContext.seniority ? ` (${roleContext.seniority})` : '';
  const description = roleContext.description
    ? `\nRole context: ${roleContext.description.slice(0, 300)}`
    : '';

  const memoryContext = [
    memory.themesCovered.length > 0
      ? `Topics covered so far: ${memory.themesCovered.slice(0, 5).join(', ')}.`
      : '',
    memory.claimsCaptured.length > 0
      ? `Key claims from candidate: ${memory.claimsCaptured.slice(0, 3).join('; ')}.`
      : '',
    memory.openLoops.length > 0
      ? `Open loops worth probing: ${memory.openLoops.slice(0, 2).join(', ')}.`
      : '',
    memory.positiveSignals.length > 0
      ? `Strong signals: ${memory.positiveSignals.slice(0, 3).join(', ')}.`
      : '',
  ]
    .filter(Boolean)
    .join(' ');

  const modeContext: Record<string, string> = {
    behavioral:
      'Focus on STAR-format behavioral questions. Probe for Situation, Task, Action, Result in each answer.',
    technical:
      'Focus on technical depth: system design, architecture decisions, debugging approaches, and trade-offs.',
    general:
      'Cover motivations, career story, growth mindset, and cultural alignment.',
    hr: 'Cover practical aspects: availability, salary expectations, management style, and interpersonal skills.',
    'case-study':
      'Present business problems or estimation challenges. Ask the candidate to walk through their reasoning.',
    'language-check':
      'Assess fluency, vocabulary range, and ability to explain complex topics clearly.',
  };
  const modeInstruction = modeContext[config.mode] ?? modeContext['general'];

  return `You are an experienced professional interviewer conducting a ${config.mode} interview for the role of ${role}${seniority} at ${company}.${description}

INTERVIEW MODE: ${modeInstruction}
CURRENT STAGE: ${stage}

YOUR BEHAVIOR RULES:
- You are INTERVIEWING, not coaching. NEVER give feedback, scores, tips, or coaching advice.
- Ask ONE question at a time. Keep your messages concise and natural.
- React authentically to what the candidate says — acknowledge briefly, then move forward.
- If an answer is vague, probe deeper with a specific follow-up question.
- Stay in interviewer mode throughout. Do not break character.
- Maintain a professional but warm tone — challenging but not hostile.
- Vary your question phrasing naturally. Avoid formulaic openers.

SESSION MEMORY:
${memoryContext || 'No previous context yet.'}

Respond ONLY with the interviewer's next message. No headers, no labels, no coaching, no feedback. Just the interviewer speaking.`;
}

async function generateInterviewerResponse(
  session: LiveInterviewSession,
  nextAction: NextAction,
): Promise<string> {
  const openai = getOpenAI();

  const actionInstruction = buildActionInstruction(nextAction, session.memory);
  const systemPrompt = buildInterviewerSystemPrompt(session);

  // Build conversation history (last 10 turns to control token usage)
  const recentTurns = session.transcript.slice(-10);
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...recentTurns.map((t) => ({
      role: t.speaker === 'assistant' ? ('assistant' as const) : ('user' as const),
      content: t.message,
    })),
    {
      role: 'system' as const,
      content: `NEXT ACTION: ${actionInstruction}`,
    },
  ];

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
    messages,
    temperature: 0.75,
    max_tokens: 400,
  });

  return response.choices[0]?.message?.content?.trim() ?? 'Let me ask you something about your experience.';
}

// ── Summary generation ────────────────────────────────────────────────────────

async function generateSummary(session: LiveInterviewSession): Promise<InterviewSummary> {
  const openai = getOpenAI();
  const { memory, roleContext, config } = session;

  const transcriptText = session.transcript
    .filter((t) => t.speaker === 'candidate')
    .map((t) => t.message)
    .join('\n\n');

  const prompt = `You are summarizing a completed ${config.mode} interview for ${roleContext.targetRole}${roleContext.company ? ` at ${roleContext.company}` : ''}.

CANDIDATE ANSWERS:
${transcriptText.slice(0, 3000)}

SIGNALS DETECTED:
- Positive: ${memory.positiveSignals.join(', ') || 'none detected'}
- Negative: ${memory.negativeSignals.join(', ') || 'none detected'}
- Themes covered: ${memory.themesCovered.join(', ') || 'none'}
- Claims: ${memory.claimsCaptured.slice(0, 5).join('; ') || 'none captured'}

Produce a JSON object with this exact shape:
{
  "summary": "2-3 sentence overall assessment of the candidate's interview performance",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "communicationNotes": "One sentence about communication style and clarity",
  "nextFocus": ["practice area 1", "practice area 2"]
}

Be honest and specific. Do not invent achievements. Base everything on the answers provided.`;

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      max_tokens: 600,
      response_format: { type: 'json_object' },
    });

    const raw = response.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw) as Partial<InterviewSummary>;
    return {
      summary: parsed.summary ?? 'Interview completed.',
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
      communicationNotes: parsed.communicationNotes ?? '',
      nextFocus: Array.isArray(parsed.nextFocus) ? parsed.nextFocus : [],
    };
  } catch {
    // Deterministic fallback if OpenAI fails
    return {
      summary: `${roleContext.targetRole} interview completed with ${session.turnCount} exchanges.`,
      strengths:
        memory.positiveSignals.length > 0
          ? memory.positiveSignals.slice(0, 3)
          : ['Completed the interview session'],
      weaknesses:
        memory.negativeSignals.length > 0
          ? memory.negativeSignals.slice(0, 2)
          : ['Limited data available for assessment'],
      communicationNotes: 'Communication style could not be fully assessed in this session.',
      nextFocus: ['Practice with more specific examples', 'Focus on quantified outcomes'],
    };
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function createSession(
  userId: string,
  mode: string,
  roleContext: RoleContext,
  config?: Partial<InterviewConfig>,
): Promise<LiveInterviewSession> {
  const session: LiveInterviewSession = {
    id: randomUUID(),
    userId,
    status: InterviewStatus.CREATED,
    stage: InterviewStage.INTRO,
    roleContext,
    config: {
      maxTurns: config?.maxTurns ?? 12,
      maxFollowUpsPerTopic: config?.maxFollowUpsPerTopic ?? 2,
      mode,
    },
    turnCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    memory: {
      askedQuestions: [],
      usedExamples: [],
      claimsCaptured: [],
      themesCovered: [],
      positiveSignals: [],
      negativeSignals: [],
      openLoops: [],
      clarificationHistory: [],
      candidateQuestionsAsked: [],
      consecutiveFollowUps: 0,
    },
    transcript: [],
  };

  await dbCreateSession(session);
  return session;
}

export async function startSession(sessionId: string): Promise<{
  assistantMessage: string;
  session: LiveInterviewSession;
}> {
  const session = await dbGetSession(sessionId);
  if (!session) throw new Error('SESSION_NOT_FOUND');
  if (session.status !== InterviewStatus.CREATED) throw new Error('SESSION_ALREADY_STARTED');

  session.status = InterviewStatus.ACTIVE;
  session.stage = InterviewStage.WARMUP;
  session.startedAt = new Date();
  session.updatedAt = new Date();

  // Generate opening message
  const openingMessage = await generateInterviewerResponse(session, NextAction.ASK_MAIN_QUESTION);

  const turn: InterviewTurn = {
    id: randomUUID(),
    speaker: 'assistant',
    message: openingMessage,
    nextAction: NextAction.ASK_MAIN_QUESTION,
    stage: session.stage,
    timestamp: new Date(),
  };
  session.transcript.push(turn);
  session.turnCount += 1;
  session.updatedAt = new Date();

  await dbUpdateSession(session);
  await dbAppendTurn(turn, session.id);
  return { assistantMessage: openingMessage, session };
}

export async function processTurn(
  sessionId: string,
  userMessage: string,
): Promise<ProcessTurnResult> {
  const session = await dbGetSession(sessionId);
  if (!session) throw new Error('SESSION_NOT_FOUND');
  if (session.status !== InterviewStatus.ACTIVE) throw new Error('SESSION_NOT_ACTIVE');
  if (!userMessage.trim()) throw new Error('EMPTY_MESSAGE');

  // Append candidate turn
  const candidateTurn: InterviewTurn = {
    id: randomUUID(),
    speaker: 'candidate',
    message: userMessage,
    stage: session.stage,
    timestamp: new Date(),
  };

  // Classify intent
  const intent = classifyIntent(userMessage);
  candidateTurn.intent = intent;
  session.transcript.push(candidateTurn);
  session.turnCount += 1;

  // Track candidate questions
  if (intent === CandidateIntent.CANDIDATE_QUESTION || intent === CandidateIntent.MIXED) {
    session.memory.candidateQuestionsAsked.push(userMessage.slice(0, 120));
  }

  // Decide next action
  const nextAction = decideNextAction(intent, session);

  // Update memory from candidate answer
  const memoryUpdate = updateMemory(session.memory, userMessage, nextAction);
  Object.assign(session.memory, memoryUpdate);

  // Advance stage if needed
  const newStage = advanceStageIfNeeded(session);
  session.stage = newStage;

  // Check if closing
  const isComplete = nextAction === NextAction.CLOSE_INTERVIEW;

  // Generate response
  const assistantMessage = await generateInterviewerResponse(session, nextAction);

  // Append assistant turn
  const assistantTurn: InterviewTurn = {
    id: randomUUID(),
    speaker: 'assistant',
    message: assistantMessage,
    nextAction,
    stage: session.stage,
    timestamp: new Date(),
  };
  session.transcript.push(assistantTurn);
  session.turnCount += 1;
  session.updatedAt = new Date();

  if (isComplete) {
    session.status = InterviewStatus.COMPLETED;
    session.endedAt = new Date();
    session.summary = await generateSummary(session);
  }

  await dbUpdateSession(session);
  await dbAppendTurn(candidateTurn, session.id);
  await dbAppendTurn(assistantTurn, session.id);

  return {
    assistantMessage,
    nextAction,
    stage: session.stage,
    memoryUpdate: {
      claimsCaptured: memoryUpdate.claimsCaptured ?? session.memory.claimsCaptured,
      themesCovered: memoryUpdate.themesCovered ?? session.memory.themesCovered,
      openLoops: memoryUpdate.openLoops ?? session.memory.openLoops,
      positiveSignals: memoryUpdate.positiveSignals ?? session.memory.positiveSignals,
      negativeSignals: memoryUpdate.negativeSignals ?? session.memory.negativeSignals,
    },
    isComplete,
  };
}

export async function completeSession(sessionId: string): Promise<{
  summary: InterviewSummary;
  session: LiveInterviewSession;
}> {
  const session = await dbGetSession(sessionId);
  if (!session) throw new Error('SESSION_NOT_FOUND');
  if (session.status === InterviewStatus.CREATED) throw new Error('SESSION_NOT_STARTED');

  if (session.status !== InterviewStatus.COMPLETED) {
    session.status = InterviewStatus.COMPLETED;
    session.endedAt = new Date();
    session.updatedAt = new Date();
    session.summary = await generateSummary(session);
    await dbUpdateSession(session);
  }

  return {
    summary: session.summary!,
    session,
  };
}

export async function getSession(sessionId: string): Promise<LiveInterviewSession | undefined> {
  return dbGetSession(sessionId);
}

export async function abandonSession(sessionId: string): Promise<void> {
  const session = await dbGetSession(sessionId);
  if (session && session.status === InterviewStatus.ACTIVE) {
    session.status = InterviewStatus.ABANDONED;
    session.endedAt = new Date();
    session.updatedAt = new Date();
    await dbUpdateSession(session);
  }
}
