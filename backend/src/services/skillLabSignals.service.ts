import type { SkillRecord } from '../ai/skills-engine/skill-record.types.js';
import { shouldPromoteSkill } from '../ai/skills-engine/skill-state-machine.js';

/**
 * Lightweight capability-intelligence hints for Skill Lab (backend spec §3).
 * Does not invent salary numbers — only evidence / state progression hints.
 */
export function suggestedNextVerificationAction(record: SkillRecord): string {
  const n = record.evidence.length;
  if (n === 0) {
    return 'Add evidence from Assistant, Warmup, Interview, Coach, or Negotiation to move beyond Declared.';
  }
  if (shouldPromoteSkill(n)) {
    return 'Enough evidence to review promotion toward Verified / Strong signal.';
  }
  return 'Keep collecting role-specific evidence before requesting verification.';
}
