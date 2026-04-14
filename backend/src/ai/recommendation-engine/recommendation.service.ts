import type { ModuleRecommendation } from './recommendation.types.js';

export function recommendCoachForImpact(): ModuleRecommendation {
  return {
    suggestedModule: 'coach',
    reason: 'A focused practice module could help strengthen measurable impact and answer structure.',
    ctaLabel: 'Practice this in Coach',
  };
}
