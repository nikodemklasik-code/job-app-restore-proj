import { buildUniversalBehaviorLayer } from '../prompts/shared/universal-behavior-layer.js';
import { getUserPlan, planToPromptBehaviorTier } from './billingGuard.js';
import { tryGetOpenAiClient } from '../lib/openai/openai.client.js';
import { getDefaultTextModel } from '../lib/openai/model-registry.js';

const DOC_TYPES = ['cv', 'cover_letter', 'skills', 'references'] as const;
export type StyleDocumentType = (typeof DOC_TYPES)[number];

/** Normalised career-document / gap-analysis JSON returned to clients. */
export interface AnalyzeDocumentResult {
  wordCount: number;
  sentenceCount: number;
  avgSentenceLength: number;
  tone: Record<string, number>;
  topVerbs: string[];
  suggestions: string[];
  score: number;
}

function coerceAnalyzeResult(raw: unknown): AnalyzeDocumentResult {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const toneRaw = o.tone && typeof o.tone === 'object' ? (o.tone as Record<string, unknown>) : {};
  const tone: Record<string, number> = {};
  for (const [k, v] of Object.entries(toneRaw)) {
    if (typeof v === 'number' && !Number.isNaN(v)) tone[k] = v;
  }
  const topVerbs = Array.isArray(o.topVerbs) ? o.topVerbs.filter((v): v is string => typeof v === 'string') : [];
  const suggestions = Array.isArray(o.suggestions)
    ? o.suggestions.filter((v): v is string => typeof v === 'string')
    : [];
  return {
    wordCount: typeof o.wordCount === 'number' ? o.wordCount : 0,
    sentenceCount: typeof o.sentenceCount === 'number' ? o.sentenceCount : 0,
    avgSentenceLength: typeof o.avgSentenceLength === 'number' ? o.avgSentenceLength : 0,
    tone,
    topVerbs,
    suggestions,
    score: typeof o.score === 'number' ? o.score : 0,
  };
}

export async function universalLayerForClerk(clerkId: string): Promise<string> {
  const plan = await getUserPlan(clerkId);
  return buildUniversalBehaviorLayer(planToPromptBehaviorTier(plan));
}

export async function analyzeCareerDocumentText(input: {
  clerkId: string;
  text: string;
  documentType: StyleDocumentType;
}): Promise<AnalyzeDocumentResult> {
  const openai = tryGetOpenAiClient();
  if (!openai) {
    const words = input.text.split(/\s+/).length;
    const sentences = input.text.split(/[.!?]+/).filter(Boolean).length;
    return {
      wordCount: words,
      sentenceCount: sentences,
      avgSentenceLength: sentences > 0 ? Math.round(words / sentences) : 0,
      tone: { professional: 60, confident: 30, formal: 10 },
      topVerbs: ['managed', 'developed', 'led', 'created', 'improved'],
      suggestions: ['Add more quantified achievements', 'Use stronger action verbs', 'Tailor keywords to job descriptions'],
      score: 65,
    };
  }

  const prompt = `Analyse this ${input.documentType.replace('_', ' ')} and respond with JSON only:
{
  "wordCount": number,
  "sentenceCount": number,
  "avgSentenceLength": number,
  "tone": { "professional": 0-100, "confident": 0-100, "formal": 0-100 },
  "topVerbs": ["verb1", "verb2", "verb3", "verb4", "verb5"],
  "suggestions": ["suggestion1", "suggestion2", "suggestion3"],
  "score": 0-100
}

Document text:
${input.text.slice(0, 3000)}`;

  const universalLayer = await universalLayerForClerk(input.clerkId);

  try {
    const resp = await openai.chat.completions.create({
      model: getDefaultTextModel(),
      messages: [
        {
          role: 'system',
          content: `You analyse career documents (CV, cover letter, skills text, employer or character reference letters) and respond with JSON only.\n\n${universalLayer}`,
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 400,
    });
    return coerceAnalyzeResult(JSON.parse(resp.choices[0]?.message?.content ?? '{}'));
  } catch {
    return {
      wordCount: 0,
      sentenceCount: 0,
      avgSentenceLength: 0,
      tone: {},
      topVerbs: [],
      suggestions: ['Analysis unavailable'],
      score: 0,
    };
  }
}

export async function suggestCoursesForSkillText(skill: string): Promise<{
  courses: { title: string; provider: string; url: string; level: string }[];
}> {
  const openai = tryGetOpenAiClient();
  if (!openai) {
    return {
      courses: [
        { title: `${skill} Fundamentals`, provider: 'LinkedIn Learning', url: 'https://www.linkedin.com/learning/', level: 'Beginner' },
        { title: `${skill} in Practice`, provider: 'Coursera', url: 'https://www.coursera.org/', level: 'Intermediate' },
        { title: `Advanced ${skill}`, provider: 'Udemy', url: 'https://www.udemy.com/', level: 'Advanced' },
      ],
    };
  }

  const universalLayer = buildUniversalBehaviorLayer('standard');

  const prompt = `Suggest 3 online courses for someone wanting to improve their "${skill}" skill. Return JSON only:
{
  "courses": [
    { "title": "Course name", "provider": "Provider name", "url": "https://...", "level": "Beginner|Intermediate|Advanced" }
  ]
}
Use real, current courses from Coursera, Udemy, LinkedIn Learning, Pluralsight, freeCodeCamp, or official docs. Always include the actual course URL.`;

  try {
    const resp = await openai.chat.completions.create({
      model: getDefaultTextModel(),
      messages: [
        {
          role: 'system',
          content: `You recommend real, current online courses. Return JSON only.\n\n${universalLayer}`,
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 500,
    });
    const result = JSON.parse(resp.choices[0]?.message?.content ?? '{}') as {
      courses?: { title: string; provider: string; url: string; level: string }[];
    };
    return { courses: result.courses ?? [] };
  } catch {
    return { courses: [] };
  }
}
