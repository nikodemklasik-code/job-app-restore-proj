import type { SkillState } from './skill-record.types.js';

export function promoteSkillState(current: SkillState): SkillState {
  switch (current) {
    case 'declared':
      return 'observed';
    case 'observed':
      return 'strengthening';
    case 'strengthening':
      return 'verified';
    case 'verified':
      return 'strong_signal';
    case 'strong_signal':
      return 'strong_signal';
  }
}

export function shouldPromoteSkill(evidenceCount: number): boolean {
  return evidenceCount >= 3;
}
