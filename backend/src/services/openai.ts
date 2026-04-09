import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;

let _client: OpenAI | null = null;

export const getOpenAIClient = (): OpenAI => {
  if (!_client) {
    if (!apiKey) throw new Error('Missing OPENAI_API_KEY');
    _client = new OpenAI({ apiKey });
  }
  return _client;
};

const BOUNDARY =
  'Scope: career, job search, CV/cover letters, interviews, salary, workplace skills, learning paths for those topics. If the user asks for something outside that (e.g. doing homework, illegal acts, medical/legal diagnosis), briefly refuse and suggest a career-related angle instead.';

export const generateCareerResponse = async (
  userMessage: string,
  mode: string,
  history?: { role: 'user' | 'assistant'; content: string }[],
): Promise<string> => {
  const client = getOpenAIClient();
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
  const system = systemPrompts[mode] ?? systemPrompts.general;

  const prior = (history ?? []).slice(-24).map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content.slice(0, 12000),
  }));

  const completion = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'system', content: system }, ...prior, { role: 'user', content: userMessage.slice(0, 12000) }],
    max_tokens: mode === 'system_design' ? 2200 : mode === 'onboarding' ? 1200 : 1400,
  });

  return completion.choices[0]?.message?.content ?? 'I was unable to generate a response. Please try again.';
};
