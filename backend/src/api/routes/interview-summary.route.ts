import { OpenAiLlmClient } from '../../ai/clients/openai-llm.client.js';
import { ClosingSummaryOrchestrator } from '../../ai/orchestrators/closing-summary-orchestrator.js';

export async function interviewSummaryRoute(body: any) {
  const llmClient = new OpenAiLlmClient({});

  const orchestrator = new ClosingSummaryOrchestrator(llmClient);
  return orchestrator.generate(body);
}
