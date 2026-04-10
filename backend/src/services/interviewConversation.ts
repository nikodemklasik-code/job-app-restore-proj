import OpenAI from 'openai';
import type { CandidateInsights } from './adaptiveInterviewer.js';

function getOpenAI(): OpenAI {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not configured');
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface InterviewMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface JobContext {
  title: string;
  company: string;
  description?: string;
  requirements?: string[];
}

const MODE_CONTEXT: Record<string, string> = {
  behavioral: 'Focus entirely on STAR-format behavioral questions about real past experiences.',
  technical: 'Focus on technical depth: system design, architecture decisions, debugging approaches, and trade-offs. Ask follow-up questions to probe understanding.',
  general: 'Focus on motivations, career story, culture fit, and growth mindset. Keep the tone conversational.',
  hr: 'Cover practical screening: availability, salary expectations, current interviews, management style, and expectations. Be friendly but efficient.',
  'case-study': 'Present business problems or estimation questions. Guide the candidate through structured problem-solving. Probe assumptions and push for quantified conclusions.',
  'language-check': 'Assess fluency, clarity, vocabulary range, and ability to explain complex topics simply. Gently note if phrasing is unclear or overly formal/informal.',
};

export function buildInterviewerSystemPrompt(job: JobContext, mode?: string): string {
  const reqList = job.requirements?.slice(0, 8).join(', ') ?? 'relevant technical and soft skills';
  const modeInstruction = mode && MODE_CONTEXT[mode] ? `\nInterview mode instruction: ${MODE_CONTEXT[mode]}` : '';
  return `You are a senior hiring manager at ${job.company} interviewing a candidate for the ${job.title} role.

Your personality: professional, warm, curious, direct. You listen carefully and ask intelligent follow-ups.

Interview context:
- Role: ${job.title} at ${job.company}
- Key requirements: ${reqList}
${job.description ? `- Role description: ${job.description.slice(0, 400)}` : ''}${modeInstruction}

Rules:
- Keep each response to 2-3 sentences MAX. Be concise.
- Ask ONE question at a time. Never list multiple questions.
- React naturally to what the candidate says before asking the next question.
- Start with a brief warm welcome and your first question in the SAME message.
- After 6-8 exchanges, wrap up naturally and thank the candidate.
- Never break character. You ARE the interviewer.
- If the candidate's answer is vague, ask a follow-up to get specifics.
- Use the candidate's actual words when reflecting back.`;
}

export async function* streamInterviewResponse(
  messages: InterviewMessage[],
  job: JobContext,
  mode?: string,
): AsyncGenerator<string> {
  const openai = getOpenAI();

  const systemMessage: InterviewMessage = {
    role: 'system',
    content: buildInterviewerSystemPrompt(job, mode),
  };

  const stream = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
    messages: [systemMessage, ...messages],
    stream: true,
    temperature: 0.7,
    max_tokens: 200, // Keep responses SHORT for natural conversation
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) yield content;
  }
}

export function countExchanges(messages: InterviewMessage[]): number {
  return messages.filter(m => m.role === 'user').length;
}

export function buildAdaptiveInterviewerSystemPrompt(
  job: JobContext,
  insights: CandidateInsights,
  mode?: string,
): string {
  const base = buildInterviewerSystemPrompt(job, mode);

  const adaptiveSection = [
    '',
    'Candidate performance context:',
    insights.sessionCount === 0
      ? '- First interview session ever. Be welcoming and set them at ease.'
      : `- Has completed ${insights.sessionCount} previous session(s). Average score: ${insights.averageScore}/100.`,
    insights.weakAreas.length > 0
      ? `- Historically weak on: ${insights.weakAreas.join(', ')} type questions — pay attention here.`
      : '',
    insights.strongAreas.length > 0
      ? `- Strong performer on: ${insights.strongAreas.join(', ')} type questions.`
      : '',
    `- Coaching directive: ${insights.adaptationNote}`,
    `- Suggested challenge level: ${insights.suggestedDifficulty}.`,
  ].filter(Boolean).join('\n');

  return base + adaptiveSection;
}
