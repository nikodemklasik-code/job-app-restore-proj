/**
 * Maps product AI actions → preferred model tier (then resolve via model-registry).
 * Credit amounts remain in creditsConfig / FEATURE_COSTS — this file is model-routing only.
 * @see docs/squad/Agent_OpenAI_Models_And_Secrets_Spec.md
 */

import {
  getDefaultTextModel,
  getLegalDeepModel,
  getLegalSearchModel,
  getPremiumTextModel,
  getRealtimeModelId,
  getRoutingModel,
} from './model-registry.js';

export type AiModelTierKey =
  | 'defaultText'
  | 'premiumText'
  | 'routing'
  | 'realtime'
  | 'legalSearch'
  | 'legalDeep';

export type ProductAiAction =
  | 'assistant_quick'
  | 'assistant_deep'
  | 'warmup_15'
  | 'warmup_30'
  | 'warmup_45'
  | 'warmup_60'
  | 'interview_lite'
  | 'interview_standard'
  | 'interview_deep'
  | 'interview_voice'
  | 'legal_core'
  | 'legal_deep'
  | 'coach_quick'
  | 'coach_structured'
  | 'coach_deep'
  | 'skill_lab_default'
  | 'job_radar_default'
  | 'ai_analysis_default';

const TIER_BY_ACTION: Record<ProductAiAction, AiModelTierKey> = {
  assistant_quick: 'defaultText',
  assistant_deep: 'premiumText',
  warmup_15: 'defaultText',
  warmup_30: 'defaultText',
  warmup_45: 'defaultText',
  warmup_60: 'defaultText',
  interview_lite: 'defaultText',
  interview_standard: 'defaultText',
  interview_deep: 'premiumText',
  interview_voice: 'realtime',
  legal_core: 'legalSearch',
  legal_deep: 'legalDeep',
  coach_quick: 'defaultText',
  coach_structured: 'defaultText',
  coach_deep: 'premiumText',
  skill_lab_default: 'defaultText',
  job_radar_default: 'routing',
  ai_analysis_default: 'premiumText',
};

function modelForTier(tier: AiModelTierKey): string {
  switch (tier) {
    case 'premiumText':
      return getPremiumTextModel();
    case 'routing':
      return getRoutingModel();
    case 'realtime':
      return getRealtimeModelId();
    case 'legalSearch':
      return getLegalSearchModel();
    case 'legalDeep':
      return getLegalDeepModel();
    case 'defaultText':
    default:
      return getDefaultTextModel();
  }
}

export function getTierForProductAction(action: ProductAiAction): AiModelTierKey {
  return TIER_BY_ACTION[action];
}

export function resolveModelIdForProductAction(action: ProductAiAction): string {
  return modelForTier(getTierForProductAction(action));
}
