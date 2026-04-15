import { and, eq } from 'drizzle-orm';
import { skillEvidence } from '../../../../db/schema.js';
import type { SkillUpEvidenceRepository } from '../../domain/repositories/skillup-evidence.repository.js';
import type { NewSkillEvidence, SkillEvidence } from '../../../../db/schema.js';
import type { SkillUpDb } from '../../skillup-database.types.js';

export class DrizzleSkillUpEvidenceRepository implements SkillUpEvidenceRepository {
  constructor(private readonly db: SkillUpDb) {}

  async insert(evidence: NewSkillEvidence): Promise<void> {
    await this.db.insert(skillEvidence).values(evidence);
  }

  async listForUserSkill(userId: string, skillKey: string): Promise<SkillEvidence[]> {
    return this.db
      .select()
      .from(skillEvidence)
      .where(and(eq(skillEvidence.userId, userId), eq(skillEvidence.skillKey, skillKey)));
  }

  async listDistinctSkillKeysForUser(userId: string): Promise<string[]> {
    const rows = await this.db
      .selectDistinct({ skillKey: skillEvidence.skillKey })
      .from(skillEvidence)
      .where(eq(skillEvidence.userId, userId));
    return rows.map((r) => r.skillKey);
  }
}
