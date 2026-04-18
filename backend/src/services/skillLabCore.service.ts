import type { SkillState } from '../ai/skills-engine/skill-record.types.js';
import { suggestedNextVerificationAction } from './skillLabSignals.service.js';
import type { SkillRecord } from '../ai/skills-engine/skill-record.types.js';

export type SkillValueBand = 'foundational' | 'role_relevant' | 'differentiating';

export type SalaryImpactTier = 'unknown' | 'supporting' | 'strong_anchor';

export interface SkillLabClaimInput {
  skillKey: string;
  claimedLevel: string;
  claimSource: string | null;
}

export interface SkillLabProfileSliceInput {
  summaryPresent: boolean;
  experienceCount: number;
  educationCount: number;
  profileSkillNames: string[];
  trainingTitles: Array<{ title: string; providerName?: string | null }>;
  /** Recent role titles (no salary) — used only for seniority-style hints. */
  recentJobTitles?: string[];
}

export interface SkillLabCoreSignalsInput {
  profile: SkillLabProfileSliceInput;
  claims: SkillLabClaimInput[];
  /** Optional demo state for a highlighted skill (Skill Lab UI). */
  highlightSkill?: { skill: string; state: SkillState; evidenceNotes: string[] };
}

export interface SkillLabCoreSignals {
  skillValueByClaim: Array<{ skillKey: string; band: SkillValueBand; rationale: string }>;
  salaryImpact: { tier: SalaryImpactTier; rationale: string };
  cvValueSignals: string[];
  verificationHints: Array<{ skillKey: string; nextAction: string }>;
  courseToSkillMappings: Array<{ courseTitle: string; matchedSkills: string[]; confidence: 'high' | 'medium' | 'low' }>;
  growthHooks: string[];
  highlightVerification?: { skill: string; state: SkillState; suggestedNextVerificationAction: string };
}

const LEVEL_RANK: Record<string, number> = {
  basic: 1,
  intermediate: 2,
  advanced: 3,
  expert: 4,
};

function skillValueBand(claim: SkillLabClaimInput, profileSkills: Set<string>): { band: SkillValueBand; rationale: string } {
  const key = claim.skillKey.toLowerCase();
  const inProfile = profileSkills.has(key);
  const rank = LEVEL_RANK[claim.claimedLevel] ?? 1;
  if (rank >= 3 && inProfile) {
    return { band: 'differentiating', rationale: 'Higher claimed level appears on your profile skills list.' };
  }
  if (inProfile || claim.claimSource === 'cv') {
    return { band: 'role_relevant', rationale: 'Backed by profile or CV-sourced claim.' };
  }
  return { band: 'foundational', rationale: 'Declared claim without strong profile anchor yet.' };
}

function seniorityHintFromTitles(titles: string[]): 'ic' | 'lead' | 'unknown' {
  const blob = titles.join(' ').toLowerCase();
  if (/(head|director|vp|chief|principal|lead|manager)/.test(blob)) return 'lead';
  if (/(junior|graduate|intern|entry)/.test(blob)) return 'ic';
  if (titles.length > 0) return 'ic';
  return 'unknown';
}

function salaryImpactTier(
  profile: SkillLabProfileSliceInput,
  claims: SkillLabClaimInput[],
): { tier: SalaryImpactTier; rationale: string } {
  const advancedClaims = claims.filter((c) => c.claimedLevel === 'expert' || c.claimedLevel === 'advanced').length;
  const evidenceHeavy = claims.filter((c) => c.claimSource === 'cv' || c.claimSource === 'linkedin').length;
  const seniority = seniorityHintFromTitles(profile.recentJobTitles ?? []);
  if (advancedClaims >= 2 || evidenceHeavy >= 4) {
    return {
      tier: 'strong_anchor',
      rationale:
        'Several claims are evidence-backed or at advanced/expert levels; use them in negotiation prep (no numeric salary promise).',
    };
  }
  if (profile.summaryPresent && claims.length >= 2) {
    return {
      tier: 'supporting',
      rationale: 'Summary plus multiple claims give recruiters clearer anchors; still add measurable outcomes where possible.',
    };
  }
  if (seniority === 'lead' && claims.length > 0) {
    return { tier: 'supporting', rationale: 'Leadership-oriented titles pair better with verified strengths—capture wins in Assistant or Coach.' };
  }
  return {
    tier: 'unknown',
    rationale: 'Not enough structured evidence yet to infer negotiation strength—add outcomes and verification notes.',
  };
}

function tokenizeCourseText(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 2);
}

export function mapCoursesToSkills(
  trainings: SkillLabProfileSliceInput['trainingTitles'],
  profileSkillNames: string[],
): SkillLabCoreSignals['courseToSkillMappings'] {
  const skillsLc = profileSkillNames.map((s) => s.toLowerCase());
  return trainings.map((tr) => {
    const tokens = new Set([...tokenizeCourseText(tr.title), ...tokenizeCourseText(tr.providerName ?? '')]);
    const matched = skillsLc.filter((sk) => tokens.has(sk) || [...tokens].some((t) => sk.includes(t) || t.includes(sk)));
    const confidence: 'high' | 'medium' | 'low' =
      matched.length >= 2 ? 'high' : matched.length === 1 ? 'medium' : 'low';
    return {
      courseTitle: tr.title,
      matchedSkills: matched.slice(0, 6),
      confidence,
    };
  });
}

export function buildSkillLabCoreSignals(input: SkillLabCoreSignalsInput): SkillLabCoreSignals {
  const profileSkills = new Set(input.profile.profileSkillNames.map((s) => s.toLowerCase()));
  const skillValueByClaim = input.claims.map((c) => {
    const { band, rationale } = skillValueBand(c, profileSkills);
    return { skillKey: c.skillKey, band, rationale };
  });

  const salaryImpact = salaryImpactTier(input.profile, input.claims);

  const cvValueSignals: string[] = [];
  if (input.profile.summaryPresent) cvValueSignals.push('Professional summary present — good hook for capability story.');
  if (input.profile.experienceCount > 0) {
    cvValueSignals.push(`${input.profile.experienceCount} role(s) on CV — use bullets with metrics in Skill Lab evidence.`);
  }
  if (input.profile.educationCount > 0) {
    cvValueSignals.push('Education entries add credibility for early-career or regulated domains.');
  }
  if (input.profile.profileSkillNames.length >= 5) {
    cvValueSignals.push('Broad skill list — prioritize 5–7 headline skills to avoid dilution.');
  }

  const verificationHints = input.claims.map((c) => {
    const record: SkillRecord = {
      skill: c.skillKey,
      state: 'declared',
      evidence: [],
    };
    return { skillKey: c.skillKey, nextAction: suggestedNextVerificationAction(record) };
  });

  const courseToSkillMappings = mapCoursesToSkills(input.profile.trainingTitles, input.profile.profileSkillNames);

  const growthHooks: string[] = [];
  if (input.claims.length < 3) {
    growthHooks.push('Add at least three concrete skills you want to be known for this quarter.');
  }
  if (!input.profile.summaryPresent) {
    growthHooks.push('Write a 2–3 sentence summary tying your top skills to target roles.');
  }
  if (input.profile.trainingTitles.length > 0 && courseToSkillMappings.some((m) => m.matchedSkills.length === 0)) {
    growthHooks.push('Link trainings to profile skills (names) so Course→Skill mapping strengthens verification.');
  }
  growthHooks.push('Run Daily Warmup or Interview blocks on your headline skill to accumulate evidence.');

  let highlightVerification: SkillLabCoreSignals['highlightVerification'];
  if (input.highlightSkill) {
    const record: SkillRecord = {
      skill: input.highlightSkill.skill,
      state: input.highlightSkill.state,
      evidence: input.highlightSkill.evidenceNotes.map((note, i) => ({
        sourceModule: 'assistant',
        note,
        createdAt: new Date(Date.now() - i * 60_000).toISOString(),
      })),
    };
    highlightVerification = {
      skill: input.highlightSkill.skill,
      state: input.highlightSkill.state,
      suggestedNextVerificationAction: suggestedNextVerificationAction(record),
    };
  }

  return {
    skillValueByClaim,
    salaryImpact,
    cvValueSignals,
    verificationHints,
    courseToSkillMappings,
    growthHooks,
    highlightVerification,
  };
}
