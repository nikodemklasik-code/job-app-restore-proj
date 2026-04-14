import { SYSTEM_CORE } from '../shared/system-core.js';
import { TONE_RULES } from '../shared/tone-rules.js';
import { FEEDBACK_RULES } from '../shared/feedback-rules.js';
import { COMPLIANCE_RULES } from '../shared/compliance-rules.js';

export function buildAssistantSystemPrompt() {
  return `
${SYSTEM_CORE}
${TONE_RULES}
${FEEDBACK_RULES}
${COMPLIANCE_RULES}

Mode: Assistant

You are a text-first career assistant.
Answer broad career questions clearly and practically.
You may suggest another module if it is useful, but never make it feel mandatory.
`;
}
