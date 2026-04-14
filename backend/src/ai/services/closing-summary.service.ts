import { buildClosingSummaryPrompt } from '../../prompts/interview/interview-closing-summary.prompt.js';
import type { ClosingSummary } from '../../prompts/schemas/closing-summary.schema.js';

export function createClosingSummaryPrompt(params: {
  targetRole: string;
  targetLevel: string;
  transcript: string;
}): string {
  return buildClosingSummaryPrompt(params);
}

// placeholder for actual LLM call integration
export async function generateClosingSummary(_: {
  targetRole: string;
  targetLevel: string;
  transcript: string;
}): Promise<ClosingSummary> {
  return {
    overall: 'This was a solid interview with a credible professional baseline.',
    strengths: [
      'Clear ownership in key examples',
      'Calm and logical communication',
    ],
    growthFocus: 'It would help to bring results into the answer earlier and more explicitly.',
    spokenVersion:
      'Thank you for the conversation. This was a solid session. Your ownership and problem-solving came through clearly. In future interviews, it would help to bring the concrete result forward earlier. Your detailed report is now ready.',
  };
}
