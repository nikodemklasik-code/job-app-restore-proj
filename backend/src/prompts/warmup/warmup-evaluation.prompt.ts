import { SYSTEM_CORE } from '../shared/system-core.js';
import { TONE_RULES } from '../shared/tone-rules.js';
import { FEEDBACK_RULES } from '../shared/feedback-rules.js';
import { MULTIMODAL_RULES } from '../shared/multimodal-rules.js';
import { UNIVERSAL_BEHAVIOR_LAYER } from '../shared/universal-behavior-layer.js';

export function buildWarmupEvaluationPrompt(question: string, answer: string) {
  return `
${SYSTEM_CORE}
${TONE_RULES}
${FEEDBACK_RULES}
${MULTIMODAL_RULES}
${UNIVERSAL_BEHAVIOR_LAYER}

Mode: Daily Warmup

Question:
${question}

Answer:
${answer}

Return JSON:
{
  "status": "keep_building | solid | strong | interview_ready",
  "whatWorked": ["string"],
  "strengthen": ["string"],
  "retryRecommended": true,
  "retryPrompt": "string",
  "skillSignals": [
    {
      "skill": "string",
      "signalType": "observed | strengthening"
    }
  ]
}
`;
}
