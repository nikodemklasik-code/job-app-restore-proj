import type { NewSkillEvidence, SkillEvidence } from '../../../../db/schema.js';

export interface SkillUpEvidenceRepository {
  insert(evidence: NewSkillEvidence): Promise<void>;
  listForUserSkill(userId: string, skillKey: string): Promise<SkillEvidence[]>;
  listDistinctSkillKeysForUser(userId: string): Promise<string[]>;
}
