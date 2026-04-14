export type SkillState = 'declared' | 'observed' | 'strengthening' | 'verified' | 'strong_signal';

export interface SkillEvidence {
  sourceModule: 'assistant' | 'warmup' | 'interview' | 'coach' | 'negotiation';
  note: string;
  createdAt: string;
}

export interface SkillRecord {
  skill: string;
  state: SkillState;
  evidence: SkillEvidence[];
}
