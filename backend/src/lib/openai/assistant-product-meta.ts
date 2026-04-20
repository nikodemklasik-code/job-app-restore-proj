import type { AssistantAiProductMeta, AssistantMode } from '../../../../shared/assistant.js';
import { assistantModes } from '../../../../shared/assistant.js';

const MODE_LABELS: Record<AssistantMode, string> = {
  general: 'General career guidance',
  cv: 'CV and applications',
  interview: 'Interview preparation',
  salary: 'Salary and negotiation',
};

/** Conservative credit hint for a single assistant turn (no billing key in creditsConfig yet). */
const ASSISTANT_TURN_CREDITS = { min: 1, max: 5, maxApproved: 8 };

export function buildAssistantAiProductMeta(
  mode: string | undefined,
  opts?: { legalSourceRestricted?: boolean; usesPremiumTier?: boolean; usesRealtimeVoice?: boolean },
): AssistantAiProductMeta {
  const safe = mode && assistantModes.includes(mode as AssistantMode) ? (mode as AssistantMode) : 'general';
  return {
    interactionModeLabel: MODE_LABELS[safe],
    estimatedCredits: { min: ASSISTANT_TURN_CREDITS.min, max: ASSISTANT_TURN_CREDITS.max },
    maxApprovedCredits: ASSISTANT_TURN_CREDITS.maxApproved,
    usesPremiumTier: opts?.usesPremiumTier ?? false,
    usesRealtimeVoice: opts?.usesRealtimeVoice ?? false,
    legalSourceRestricted: opts?.legalSourceRestricted ?? false,
  };
}
