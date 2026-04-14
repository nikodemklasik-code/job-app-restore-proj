import { LlmClient } from '../clients/llm-client.interface.js';
import { CoachHandoffOutput, InterviewSessionContext } from '../models/interview.types.js';
import { renderTranscript } from '../services/transcript-renderer.service.js';
import { buildInterviewHandoffPrompt } from '../../prompts/interview/interview-handoff-to-coach.prompt.js';

export class CoachHandoffOrchestrator {
  constructor(private readonly llmClient: LlmClient) {}

  async generate(session: InterviewSessionContext): Promise<CoachHandoffOutput> {
    const prompt = buildInterviewHandoffPrompt({
      targetRole: session.targetRole,
      targetLevel: String(session.targetLevel),
      transcript: renderTranscript(session.transcript),
    });

    return this.llmClient.completeJson<CoachHandoffOutput>(
      [{ role: 'system', content: prompt }],
      {
        schemaName: 'CoachHandoffOutput',
        schemaDescription: 'Structured handoff from interview to coach.',
      },
    );
  }
}
