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

export const generateCareerResponse = async (userMessage: string, mode: string): Promise<string> => {
  const client = getOpenAIClient();
  const systemPrompts: Record<string, string> = {
    general: 'You are a world-class career strategist. Help the user with job search, CV improvement, interview preparation, and career decisions. Be direct, specific, and actionable.',
    cv: 'You are an expert CV writer and ATS optimization specialist. Analyze and improve CVs for maximum impact.',
    interview: 'You are an expert interview coach. Help candidates prepare with STAR method, technical questions, and delivery techniques.',
    salary: 'You are a salary negotiation expert. Provide data-driven advice on compensation negotiation.',
  };
  const system = systemPrompts[mode] ?? systemPrompts.general;

  const completion = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: userMessage },
    ],
    max_tokens: 1000,
  });

  return completion.choices[0]?.message?.content ?? 'I was unable to generate a response. Please try again.';
};
