import OpenAI from 'openai';

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

export function buildInterviewerSystemPrompt(job: JobContext): string {
  const reqList = job.requirements?.slice(0, 8).join(', ') ?? 'relevant technical and soft skills';
  return `You are a senior hiring manager at ${job.company} interviewing a candidate for the ${job.title} role.

Your personality: professional, warm, curious, direct. You listen carefully and ask intelligent follow-ups.

Interview context:
- Role: ${job.title} at ${job.company}
- Key requirements: ${reqList}
${job.description ? `- Role description: ${job.description.slice(0, 400)}` : ''}

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
): AsyncGenerator<string> {
  const openai = getOpenAI();

  const systemMessage: InterviewMessage = {
    role: 'system',
    content: buildInterviewerSystemPrompt(job),
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
