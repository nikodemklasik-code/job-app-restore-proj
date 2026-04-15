import { ABUSE_RESISTANCE_RULES } from './abuse-resistance-rules.js';
import { PERSONA_STABILITY_RULES } from './persona-stability-rules.js';
import { CAPACITY_ADAPTATION_RULES } from './capacity-adaptation-rules.js';
import { SKILL_GROWTH_RULES } from './skill-growth-rules.js';
import { POSITIVE_MOTIVATION_RULES } from './positive-motivation-rules.js';
import { NEURODIVERSITY_AWARE_COACHING_RULES } from './neurodiversity-aware-coaching-rules.js';

/** How much universal policy text to inject (token cost vs coaching depth). */
export type BehaviorLayerTier = 'minimal' | 'standard' | 'full';

/**
 * Builds the shared policy block for a tier. Interview/coach module prompts use
 * `full` via `UNIVERSAL_BEHAVIOR_LAYER`; high-volume routes (Assistant, Style) may
 * pass a lower tier based on subscription.
 */
export function buildUniversalBehaviorLayer(tier: BehaviorLayerTier): string {
  const abuse = ABUSE_RESISTANCE_RULES;
  const persona = PERSONA_STABILITY_RULES;
  const capacity = CAPACITY_ADAPTATION_RULES;
  const skill = SKILL_GROWTH_RULES;
  const positive = POSITIVE_MOTIVATION_RULES;
  const neuro = NEURODIVERSITY_AWARE_COACHING_RULES;

  switch (tier) {
    case 'minimal':
      return [abuse, persona].join('\n\n');
    case 'standard':
      return [abuse, persona, capacity, positive].join('\n\n');
    case 'full':
    default:
      return [abuse, persona, capacity, skill, positive, neuro].join('\n\n');
  }
}

/**
 * Full stack — same as `buildUniversalBehaviorLayer('full')`. Appended to Coach,
 * Interview, Warmup, Negotiation, and other module system prompts.
 */
export const UNIVERSAL_BEHAVIOR_LAYER = buildUniversalBehaviorLayer('full');
