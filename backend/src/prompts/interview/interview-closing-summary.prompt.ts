import { SYSTEM_CORE } from '../shared/system-core.js';
import { TONE_RULES } from '../shared/tone-rules.js';
import { FEEDBACK_RULES } from '../shared/feedback-rules.js';
import { OUTPUT_FORMAT_RULES } from '../shared/output-format-rules.js';

export function buildClosingSummaryPrompt(params: {
  targetRole: string;
  targetLevel: string;
  transcript: string;
}) {
  const { targetRole, targetLevel, transcript } = params;

  return `
${SYSTEM_CORE}
${TONE_RULES}
${FEEDBACK_RULES}
${OUTPUT_FORMAT_RULES}

Mode: Interview Closing Summary

Your task:
Create a short spoken closing summary for the candidate after the interview.

Requirements:
- Length: 2 to 4 sentences.
- Sound natural when spoken aloud by the interviewer.
- Include:
  1. overall impression,
  2. one or two strongest signals,
  3. one main area to strengthen,
  4. mention that the detailed report is ready.
- Use constructive language only.
- Do not list many points.
- Do not sound robotic.
- Do not use scores in the spoken summary.

Target role: ${targetRole}
Target level: ${targetLevel}

Transcript:
${transcript}

Return JSON:
{
  "overall": "string",
  "strengths": ["string", "string"],
  "growthFocus": "string",
  "spokenVersion": "string"
}
`;
}
