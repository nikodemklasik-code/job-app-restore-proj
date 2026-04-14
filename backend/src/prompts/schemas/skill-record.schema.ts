export type SkillState = 'declared' | 'observed' | 'strengthening' | 'verified' | 'strong_signal';

export interface SkillRecord {
  skill: string;
  state: SkillState;
  sourceModules: string[];
  evidenceCount: number;
  lastUpdatedAt: string;
  notes?: string;
}
