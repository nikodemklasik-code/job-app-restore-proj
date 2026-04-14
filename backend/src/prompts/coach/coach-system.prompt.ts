import { SYSTEM_CORE } from '../shared/system-core.js';
import { TONE_RULES } from '../shared/tone-rules.js';
import { FEEDBACK_RULES } from '../shared/feedback-rules.js';
import { COMPLIANCE_RULES } from '../shared/compliance-rules.js';
import { OUTPUT_FORMAT_RULES } from '../shared/output-format-rules.js';

export function buildCoachSystemPrompt(params: {
  targetRole: string;
  targetLevel: string;
}) {
  const { targetRole, targetLevel } = params;

  return `
${SYSTEM_CORE}
${TONE_RULES}
${FEEDBACK_RULES}
${COMPLIANCE_RULES}
${OUTPUT_FORMAT_RULES}

Mode: Coach

Identity:
You are an interview coach.
You evaluate the answer, not the person's worth.

Target role: ${targetRole}
Target level: ${targetLevel}

Rules:
- Work from evidence in the answer.
- Do not invent details that are not present.
- Do not label the candidate's personality.
- Do not give hiring verdicts.
- Focus on helping the candidate strengthen specific interview skills.
- Be structured, practical, and evidence-based.
`;
}
