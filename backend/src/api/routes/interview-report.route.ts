import { OpenAiLlmClient } from '../../ai/clients/openai-llm.client.js';
import { ClosingSummaryOrchestrator } from '../../ai/orchestrators/closing-summary-orchestrator.js';
import { CoachHandoffOrchestrator } from '../../ai/orchestrators/coach-handoff-orchestrator.js';
import { ReportOrchestrator } from '../../ai/orchestrators/report-orchestrator.js';
import { PdfGeneratorService } from '../../ai/services/pdf-generator.service.js';

export async function interviewReportRoute(body: any) {
  const llmClient = new OpenAiLlmClient({});

  const reportOrchestrator = new ReportOrchestrator(
    new ClosingSummaryOrchestrator(llmClient),
    new CoachHandoffOrchestrator(llmClient),
    new PdfGeneratorService(),
  );

  return reportOrchestrator.generate(body);
}
