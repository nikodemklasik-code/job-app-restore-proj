/**
 * liveInterviewEnhanced.ts
 *
 * Enhanced live interview service with:
 * - Realistic video call simulation
 * - Real-time transcription
 * - Adaptive questioning based on candidate level
 * - Multi-layer analysis (content, reasoning, language, behavior)
 * - Realistic feedback generation
 * - Session memory management
 */

import { randomUUID } from 'crypto';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { getOpenAiClient } from '../lib/openai/openai.client.js';
import { getDefaultTextModel } from '../lib/openai/model-registry.js';
import { UNIVERSAL_BEHAVIOR_LAYER } from '../prompts/shared/universal-behavior-layer.js';
import { CONVERSATION_CONDUCT, CANDIDATE_LEVEL_RECOGNITION, LEVEL_ADAPTATION, ROLE_TYPE_ADAPTATION, REALISTIC_ADAPTATION_PRINCIPLE } from '../prompts/interviewer-rules.js';
import { FEEDBACK_OPENERS, LANGUAGE_TRANSFORMATIONS, FORBIDDEN_PHRASES } from '../prompts/feedback-language.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CandidateProfile {
  level: 'junior' | 'mid' | 'senior' | 'lead-manager';
  communicationStyle: 'analytical' | 'operational' | 'strategic' | 'relational';
  strengths: string[];
  weaknesses: string[];
  signals: {
    positive: string[];
    negative: string[];
  };
}

export interface InterviewAnalysis {
  candidateProfile: CandidateProfile;
  contentQuality: number; // 0-100
  reasoningQuality: number; // 0-100
  communicationQuality: number; // 0-100
  confidenceLevel: number; // 0-100
  overallScore: number; // 0-100
  feedback: {
    strengths: string[];
    improvements: string[];
    nextFocus: string[];
  };
}

// ─── Candidate Level Detection ────────────────────────────────────────────────

export function detectCandidateLevel(
  transcript: string,
  roleContext: { targetRole: string; seniority?: string },
): CandidateProfile['level'] {
  const text = transcript.toLowerCase();

  // Senior indicators
  const seniorIndicators = [
    /\b(trade.?off|priorit|strategic|business impact|scale|architecture|system design|led|managed|owned)\b/,
    /\b(decided|chose|recommended|proposed|influenced|drove)\b/,
    /\b(measurable|quantified|metric|kpi|roi|impact)\b/,
  ];

  // Mid indicators
  const midIndicators = [
    /\b(implemented|built|developed|created|fixed|resolved)\b/,
    /\b(responsible|tasked|assigned|collaborated|worked with)\b/,
    /\b(improved|optimized|enhanced|reduced|increased)\b/,
  ];

  // Junior indicators
  const juniorIndicators = [
    /\b(learned|helped|assisted|supported|contributed)\b/,
    /\b(first|new|started|began|introduced to)\b/,
    /\b(under guidance|with help|supervised|mentored)\b/,
  ];

  const seniorMatches = seniorIndicators.filter((r) => r.test(text)).length;
  const midMatches = midIndicators.filter((r) => r.test(text)).length;
  const juniorMatches = juniorIndicators.filter((r) => r.test(text)).length;

  if (seniorMatches >= 2) return 'senior';
  if (midMatches >= 2) return 'mid';
  return 'junior';
}

// ─── Communication Style Detection ────────────────────────────────────────────

export function detectCommunicationStyle(
  transcript: string,
): CandidateProfile['communicationStyle'] {
  const text = transcript.toLowerCase();

  const analyticalScore = (text.match(/\b(data|metric|analysis|reason|logic|because|therefore|however)\b/g) ?? []).length;
  const operationalScore = (text.match(/\b(process|step|execute|implement|deliver|timeline|milestone)\b/g) ?? []).length;
  const strategicScore = (text.match(/\b(goal|vision|strategy|impact|business|market|competitive)\b/g) ?? []).length;
  const relationalScore = (text.match(/\b(team|people|stakeholder|communication|influence|relationship)\b/g) ?? []).length;

  const scores = { analytical: analyticalScore, operational: operationalScore, strategic: strategicScore, relational: relationalScore };
  const style = Object.entries(scores).sort(([, a], [, b]) => b - a)[0][0] as CandidateProfile['communicationStyle'];

  return style;
}

// ─── Multi-Layer Analysis ─────────────────────────────────────────────────────

export async function analyzeInterviewTurn(
  candidateMessage: string,
  recruiterQuestion: string,
  sessionMemory: { askedQuestions: string[]; claimsCaptured: string[] },
): Promise<InterviewAnalysis> {
  const openai = getOpenAiClient();

  const analysisPrompt = `Analyse this interview turn across multiple dimensions:

RECRUITER QUESTION: "${recruiterQuestion}"

CANDIDATE ANSWER: "${candidateMessage}"

Analyse:
1. Content Quality (0-100): Does the answer address the question? Is it specific? Are there examples?
2. Reasoning Quality (0-100): Is the logic clear? Are trade-offs explained? Is the thinking transparent?
3. Communication Quality (0-100): Is the answer clear? Is it concise? Does it flow well?
4. Confidence Level (0-100): Does the candidate sound confident? Are there hedging phrases?

Return JSON:
{
  "contentQuality": number,
  "reasoningQuality": number,
  "communicationQuality": number,
  "confidenceLevel": number,
  "strengths": ["strength1", "strength2"],
  "improvements": ["improvement1", "improvement2"],
  "signals": {
    "positive": ["signal1"],
    "negative": ["signal2"]
  }
}`;

  try {
    const response = await openai.chat.completions.create({
      model: getDefaultTextModel(),
      messages: [{ role: 'user', content: analysisPrompt }],
      response_format: { type: 'json_object' },
      max_tokens: 500,
      temperature: 0.3,
    });

    const analysis = JSON.parse(response.choices[0]?.message?.content ?? '{}') as {
      contentQuality?: number;
      reasoningQuality?: number;
      communicationQuality?: number;
      confidenceLevel?: number;
      strengths?: string[];
      improvements?: string[];
      signals?: { positive?: string[]; negative?: string[] };
    };

    const overallScore = Math.round(
      (analysis.contentQuality ?? 50 + analysis.reasoningQuality ?? 50 + analysis.communicationQuality ?? 50 + analysis.confidenceLevel ?? 50) / 4,
    );

    return {
      candidateProfile: {
        level: detectCandidateLevel(candidateMessage, {}),
        communicationStyle: detectCommunicationStyle(candidateMessage),
        strengths: analysis.strengths ?? [],
        weaknesses: analysis.improvements ?? [],
        signals: analysis.signals ?? { positive: [], negative: [] },
      },
      contentQuality: analysis.contentQuality ?? 50,
      reasoningQuality: analysis.reasoningQuality ?? 50,
      communicationQuality: analysis.communicationQuality ?? 50,
      confidenceLevel: analysis.confidenceLevel ?? 50,
      overallScore,
      feedback: {
        strengths: analysis.strengths ?? [],
        improvements: analysis.improvements ?? [],
        nextFocus: [],
      },
    };
  } catch (err) {
    console.error('Analysis error:', err);
    return {
      candidateProfile: {
        level: 'mid',
        communicationStyle: 'analytical',
        strengths: [],
        weaknesses: [],
        signals: { positive: [], negative: [] },
      },
      contentQuality: 50,
      reasoningQuality: 50,
      communicationQuality: 50,
      confidenceLevel: 50,
      overallScore: 50,
      feedback: { strengths: [], improvements: [], nextFocus: [] },
    };
  }
}

// ─── Adaptive Question Generation ──────────────────────────────────────────────

export async function generateAdaptiveQuestion(
  candidateProfile: CandidateProfile,
  sessionMemory: { askedQuestions: string[]; themesCovered: string[] },
  roleContext: { targetRole: string; seniority?: string },
  mode: string,
): Promise<string> {
  const openai = getOpenAiClient();

  const levelGuidance = LEVEL_ADAPTATION[candidateProfile.level];
  const styleGuidance = ROLE_TYPE_ADAPTATION[roleContext.seniority === 'senior' ? 'technical' : 'general'];

  const prompt = `Generate the next interview question based on:

CANDIDATE LEVEL: ${candidateProfile.level}
COMMUNICATION STYLE: ${candidateProfile.communicationStyle}
ROLE: ${roleContext.targetRole}
MODE: ${mode}

LEVEL GUIDANCE:
${levelGuidance}

STYLE GUIDANCE:
${styleGuidance}

PREVIOUS THEMES: ${sessionMemory.themesCovered.slice(0, 3).join(', ') || 'None yet'}

Generate ONE natural, open-ended question that:
1. Matches the candidate's level (don't ask senior questions to juniors)
2. Explores a new theme or goes deeper on a previous one
3. Is phrased naturally (not formulaic)
4. Takes 30-60 seconds to answer

Return ONLY the question, no explanation.`;

  try {
    const response = await openai.chat.completions.create({
      model: getDefaultTextModel(),
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content?.trim() ?? 'Tell me about your most recent project.';
  } catch (err) {
    console.error('Question generation error:', err);
    return 'Tell me about your most recent project.';
  }
}

// ─── Realistic Feedback Generation ────────────────────────────────────────────

export async function generateRealisticFeedback(
  candidateMessage: string,
  analysis: InterviewAnalysis,
): Promise<string> {
  const openai = getOpenAiClient();

  const forbiddenPhrasesStr = FORBIDDEN_PHRASES.join(', ');
  const transformationsStr = LANGUAGE_TRANSFORMATIONS.map((t) => `Avoid: "${t.avoid}" → Use: "${t.use}"`).join('\n');

  const prompt = `Generate constructive feedback for this interview answer:

ANSWER: "${candidateMessage}"

ANALYSIS:
- Content Quality: ${analysis.contentQuality}/100
- Reasoning Quality: ${analysis.reasoningQuality}/100
- Communication Quality: ${analysis.communicationQuality}/100
- Confidence: ${analysis.confidenceLevel}/100

RULES:
1. NEVER use these phrases: ${forbiddenPhrasesStr}
2. Use constructive openers: ${FEEDBACK_OPENERS.slice(0, 3).join(', ')}
3. Transform feedback like this:
${transformationsStr}

Generate 2-3 sentences of constructive, actionable feedback that:
- Acknowledges what worked
- Suggests one specific improvement
- Is grounded in observable signals
- Uses positive, forward-looking language

Return ONLY the feedback, no labels.`;

  try {
    const response = await openai.chat.completions.create({
      model: getDefaultTextModel(),
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
      temperature: 0.5,
    });

    return response.choices[0]?.message?.content?.trim() ?? 'Good answer. Consider adding more specific examples next time.';
  } catch (err) {
    console.error('Feedback generation error:', err);
    return 'Good answer. Consider adding more specific examples next time.';
  }
}

// ─── Session Summary Generation ───────────────────────────────────────────────

export async function generateSessionSummary(
  transcript: Array<{ speaker: 'assistant' | 'candidate'; message: string }>,
  memory: { askedQuestions: string[]; claimsCaptured: string[]; positiveSignals: string[]; negativeSignals: string[] },
  overallScore: number,
): Promise<{
  summary: string;
  strengths: string[];
  weaknesses: string[];
  communicationNotes: string;
  nextFocus: string[];
}> {
  const openai = getOpenAiClient();

  const candidateAnswers = transcript.filter((t) => t.speaker === 'candidate').map((t) => t.message).join('\n\n');

  const prompt = `Generate a professional interview summary:

CANDIDATE ANSWERS:
${candidateAnswers.slice(0, 2000)}

POSITIVE SIGNALS: ${memory.positiveSignals.join(', ') || 'None'}
NEGATIVE SIGNALS: ${memory.negativeSignals.join(', ') || 'None'}
OVERALL SCORE: ${overallScore}/100

Generate JSON:
{
  "summary": "2-3 sentence overall impression",
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["area1", "area2"],
  "communicationNotes": "1-2 sentences on communication style",
  "nextFocus": ["focus1", "focus2"]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: getDefaultTextModel(),
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 500,
      temperature: 0.4,
    });

    return JSON.parse(response.choices[0]?.message?.content ?? '{}');
  } catch (err) {
    console.error('Summary generation error:', err);
    return {
      summary: 'Interview completed successfully.',
      strengths: [],
      weaknesses: [],
      communicationNotes: '',
      nextFocus: [],
    };
  }
}
