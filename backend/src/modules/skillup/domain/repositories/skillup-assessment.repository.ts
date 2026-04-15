import type { NewSkillAssessment, SkillAssessment } from '../../../../db/schema.js';

export type SkillAssessmentUpsert = Omit<NewSkillAssessment, 'id'> & { id?: string };

export interface SkillUpAssessmentRepository {
  findByUserAndSkill(userId: string, skillKey: string): Promise<SkillAssessment | null>;
  upsertByUserSkill(row: SkillAssessmentUpsert): Promise<void>;
}
