import { AI_BOUNDARY_RULE_CORE } from './ai-boundary-rule-core.js';
import { ABUSE_RESISTANCE_RULES } from './abuse-resistance-rules.js';
import { PERSONA_STABILITY_RULES } from './persona-stability-rules.js';
import { CAPACITY_ADAPTATION_RULES } from './capacity-adaptation-rules.js';
import { SKILL_GROWTH_RULES } from './skill-growth-rules.js';
import { POSITIVE_MOTIVATION_RULES } from './positive-motivation-rules.js';
import { NEURODIVERSITY_AWARE_COACHING_RULES } from './neurodiversity-aware-coaching-rules.js';
import { MODULE_ROLE_INTEGRITY_RULES } from './module-role-integrity-rules.js';
import { FEEDBACK_STYLE_INTEGRITY_RULES } from './feedback-style-integrity-rules.js';

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
  const roleIntegrity = MODULE_ROLE_INTEGRITY_RULES;
  const feedbackStyle = FEEDBACK_STYLE_INTEGRITY_RULES;

  let body: string;
  switch (tier) {
    case 'minimal':
      body = [abuse, persona, roleIntegrity].join('\n\n');
      break;
    case 'standard':
      body = [abuse, persona, roleIntegrity, feedbackStyle, capacity, positive].join('\n\n');
      break;
    case 'full':
    default:
      body = [abuse, persona, roleIntegrity, feedbackStyle, capacity, skill, positive, neuro].join('\n\n');
      break;
  }
  return `${AI_BOUNDARY_RULE_CORE}\n\n${body}`;
}

/**
 * Full stack — same as `buildUniversalBehaviorLayer('full')`. Appended to Coach,
 * Interview, Warmup, Negotiation, and other module system prompts.
 */
export const UNIVERSAL_BEHAVIOR_LAYER = buildUniversalBehaviorLayer('full');
