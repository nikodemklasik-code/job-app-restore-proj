import { OpenAiLlmClient } from '../../ai/clients/openai-llm.client.js';
import { ClosingSummaryOrchestrator } from '../../ai/orchestrators/closing-summary-orchestrator.js';

export async function interviewSummaryRoute(body: any) {
  const llmClient = new OpenAiLlmClient({
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-5.4-thinking',
  });

  const orchestrator = new ClosingSummaryOrchestrator(llmClient);
  return orchestrator.generate(body);
}
