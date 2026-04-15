import type { NewSkillClaim, SkillClaim } from '../../../../db/schema.js';

export interface SkillUpClaimRepository {
  insert(claim: NewSkillClaim): Promise<void>;
  /** Sets isActive=false for matching user+skillKey (optional scope by source). */
  deactivateClaimsForUserSkill(userId: string, skillKey: string, claimSources?: SkillClaimSource[]): Promise<void>;
  findActiveClaimForUserSkill(userId: string, skillKey: string): Promise<SkillClaim | null>;
}

export type SkillClaimSource = 'cv' | 'linkedin' | 'profile_form' | 'manual_edit';
