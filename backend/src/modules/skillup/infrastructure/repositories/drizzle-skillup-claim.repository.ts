import { and, desc, eq, inArray } from 'drizzle-orm';
import { skillClaims } from '../../../../db/schema.js';
import type {
  SkillClaimSource,
  SkillUpClaimRepository,
} from '../../domain/repositories/skillup-claim.repository.js';
import type { NewSkillClaim, SkillClaim } from '../../../../db/schema.js';
import type { SkillUpDb } from '../../skillup-database.types.js';

export class DrizzleSkillUpClaimRepository implements SkillUpClaimRepository {
  constructor(private readonly db: SkillUpDb) {}

  async insert(claim: NewSkillClaim): Promise<void> {
    await this.db.insert(skillClaims).values(claim);
  }

  async deactivateClaimsForUserSkill(
    userId: string,
    skillKey: string,
    claimSources?: SkillClaimSource[],
  ): Promise<void> {
    const cond =
      claimSources && claimSources.length > 0
        ? and(
            eq(skillClaims.userId, userId),
            eq(skillClaims.skillKey, skillKey),
            inArray(skillClaims.claimSource, claimSources),
          )
        : and(eq(skillClaims.userId, userId), eq(skillClaims.skillKey, skillKey));

    await this.db.update(skillClaims).set({ isActive: false, updatedAt: new Date() }).where(cond);
  }

  async findActiveClaimForUserSkill(userId: string, skillKey: string): Promise<SkillClaim | null> {
    const rows = await this.db
      .select()
      .from(skillClaims)
      .where(and(eq(skillClaims.userId, userId), eq(skillClaims.skillKey, skillKey), eq(skillClaims.isActive, true)))
      .orderBy(desc(skillClaims.updatedAt))
      .limit(1);

    return rows[0] ?? null;
  }
}
