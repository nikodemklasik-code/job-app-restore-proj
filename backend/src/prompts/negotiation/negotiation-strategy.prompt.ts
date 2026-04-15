import { SYSTEM_CORE } from '../shared/system-core.js';
import { TONE_RULES } from '../shared/tone-rules.js';
import { FEEDBACK_RULES } from '../shared/feedback-rules.js';
import { UNIVERSAL_BEHAVIOR_LAYER } from '../shared/universal-behavior-layer.js';

export function buildNegotiationStrategyPrompt(situation: string) {
  return `
${SYSTEM_CORE}
${TONE_RULES}
${FEEDBACK_RULES}
${UNIVERSAL_BEHAVIOR_LAYER}

Mode: Negotiation Strategy

Situation:
${situation}

Return JSON:
{
  "situationSummary": "string",
  "recommendedStrategy": "string",
  "focusAreas": ["string"],
  "risks": ["string"],
  "recommendedLanguage": ["string"]
}
`;
}
