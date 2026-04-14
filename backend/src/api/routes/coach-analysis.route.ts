import { OpenAiLlmClient } from '../../ai/clients/openai-llm.client.js';
import { buildCoachSystemPrompt } from '../../prompts/coach/coach-system.prompt.js';
import { buildCoachAnalysisPrompt } from '../../prompts/coach/coach-analysis.prompt.js';

export async function coachAnalysisRoute(body: {
  targetRole: string;
  targetLevel: string;
  question: string;
  answer: string;
}) {
  const llmClient = new OpenAiLlmClient({
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-5.4-thinking',
  });

  const system = buildCoachSystemPrompt({
    targetRole: body.targetRole,
    targetLevel: body.targetLevel,
  });

  const analysis = buildCoachAnalysisPrompt({
    question: body.question,
    answer: body.answer,
  });

  return llmClient.completeJson(
    [
      { role: 'system', content: system },
      { role: 'user', content: analysis },
    ],
    {
      schemaName: 'CoachReport',
      schemaDescription: 'Answer-level coach report.',
    },
  );
}
