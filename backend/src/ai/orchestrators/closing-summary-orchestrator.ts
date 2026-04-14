import { LlmClient } from '../clients/llm-client.interface.js';
import { ClosingSummaryOutput, InterviewSessionContext } from '../models/interview.types.js';
import { renderTranscript } from '../services/transcript-renderer.service.js';
import { buildClosingSummaryPrompt } from '../../prompts/interview/interview-closing-summary.prompt.js';

export class ClosingSummaryOrchestrator {
  constructor(private readonly llmClient: LlmClient) {}

  async generate(session: InterviewSessionContext): Promise<ClosingSummaryOutput> {
    const prompt = buildClosingSummaryPrompt({
      targetRole: session.targetRole,
      targetLevel: String(session.targetLevel),
      transcript: renderTranscript(session.transcript),
    });

    return this.llmClient.completeJson<ClosingSummaryOutput>(
      [{ role: 'system', content: prompt }],
      {
        schemaName: 'ClosingSummaryOutput',
        schemaDescription: 'Short spoken interview closing summary.',
      },
    );
  }
}
