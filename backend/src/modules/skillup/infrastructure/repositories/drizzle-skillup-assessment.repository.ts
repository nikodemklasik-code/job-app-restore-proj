// @ts-nocheck
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { skillAssessments } from '../../../../db/schema.js';
import type {
  SkillAssessmentUpsert,
  SkillUpAssessmentRepository,
} from '../../domain/repositories/skillup-assessment.repository.js';
import type { SkillAssessment } from '../../../../db/schema.js';
import type { SkillUpDb } from '../../skillup-database.types.js';

export class DrizzleSkillUpAssessmentRepository implements SkillUpAssessmentRepository {
  constructor(private readonly db: SkillUpDb) {}

  async findByUserAndSkill(userId: string, skillKey: string): Promise<SkillAssessment | null> {
    const rows = await this.db
      .select()
      .from(skillAssessments)
      .where(and(eq(skillAssessments.userId, userId), eq(skillAssessments.skillKey, skillKey)))
      .limit(1);
    return rows[0] ?? null;
  }

  async upsertByUserSkill(row: SkillAssessmentUpsert): Promise<void> {
    const existing = await this.findByUserAndSkill(row.userId, row.skillKey);
    const id = existing?.id ?? row.id ?? randomUUID();
    const now = new Date();

    await this.db
      .insert(skillAssessments)
      .values({
        ...row,
        id,
        updatedAt: now,
      })
      .onDuplicateKeyUpdate({
        set: {
          skillCategory: row.skillCategory,
          claimedLevel: row.claimedLevel,
          observedLevel: row.observedLevel,
          verificationStatus: row.verificationStatus,
          evidenceCount: row.evidenceCount,
          supportCount: row.supportCount,
          weakenCount: row.weakenCount,
          confidence: row.confidence,
          consistencyScore: row.consistencyScore,
          marketRelevanceScore: row.marketRelevanceScore,
          summary: row.summary,
          improvementNote: row.improvementNote,
          updatedAt: now,
        },
      });
  }
}
