import { SYSTEM_CORE } from '../shared/system-core.js';
import { FEEDBACK_RULES } from '../shared/feedback-rules.js';
import { OUTPUT_FORMAT_RULES } from '../shared/output-format-rules.js';

export function buildInterviewHandoffPrompt(params: {
  targetRole: string;
  targetLevel: string;
  transcript: string;
}) {
  const { targetRole, targetLevel, transcript } = params;

  return `
${SYSTEM_CORE}
${FEEDBACK_RULES}
${OUTPUT_FORMAT_RULES}

Mode: Interview -> Coach Handoff

Your task:
Analyze the full interview and produce structured handoff data for the Coach module.

Requirements:
- Focus on overall interview performance, not hiring recommendation.
- Identify:
  - top strengths,
  - top areas to strengthen,
  - weakest interview sections,
  - communication patterns worth improving,
  - recommended coach modules.
- Use constructive wording.
- Do not shame or label the candidate.
- Do not diagnose emotion or personality.

Target role: ${targetRole}
Target level: ${targetLevel}

Transcript:
${transcript}

Return JSON:
{
  "topStrengths": ["string", "string", "string"],
  "areasToStrengthen": ["string", "string", "string"],
  "weakestSections": ["string", "string"],
  "communicationPatterns": ["string", "string"],
  "recommendedCoachModules": ["string", "string", "string"]
}
`;
}
