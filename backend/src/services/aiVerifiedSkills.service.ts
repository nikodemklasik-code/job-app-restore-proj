import { randomUUID } from 'crypto';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  skillAssessments,
  skillClaims,
  skillEvidence,
  verificationSessionResults,
  verificationSessions,
} from '../db/schemas/skillup.js';

type SkillCategory = 'hard' | 'soft' | 'language' | 'domain' | 'tool';
type SkillLevel = 'basic' | 'intermediate' | 'advanced' | 'expert';
type EvidenceSourceType =
  | 'mock_interview'
  | 'assistant_conversation'
  | 'coding_task'
  | 'writing_sample'
  | 'portfolio'
  | 'certificate'
  | 'job_history';
type Confidence = 'low' | 'medium' | 'high';
type VerificationStatus =
  | 'self_declared'
  | 'lightly_evidenced'
  | 'partially_verified'
  | 'strongly_verified'
  | 'inconsistent';

export type AiObservedSkillInput = {
  skillKey: string;
  category: SkillCategory;
  observedLevel?: SkillLevel;
  confidence?: Confidence;
  evidenceText: string;
};

export type RecordAiSkillEvidenceInput = {
  userId: string;
  sourceType: EvidenceSourceType;
  sourceRefId?: string | null;
  sessionType?: 'mock_interview' | 'language_check' | 'coding_challenge' | 'portfolio_review' | 'case_study_review' | 'writing_assessment';
  summary: string;
  observedSkills: AiObservedSkillInput[];
};

function normalizeSkillKey(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 128);
}

function verificationStatusForSupportCount(supportCount: number, confidence: Confidence): VerificationStatus {
  if (supportCount >= 5 && confidence === 'high') return 'strongly_verified';
  if (supportCount >= 3) return 'partially_verified';
  if (supportCount >= 1) return 'lightly_evidenced';
  return 'self_declared';
}

function strongestConfidence(values: Confidence[]): Confidence {
  if (values.includes('high')) return 'high';
  if (values.includes('medium')) return 'medium';
  return 'low';
}

function levelFromEvidence(levels: Array<SkillLevel | null>): SkillLevel | null {
  const order: SkillLevel[] = ['basic', 'intermediate', 'advanced', 'expert'];
  const present = levels.filter((level): level is SkillLevel => Boolean(level));
  if (present.length === 0) return null;
  return present.sort((a, b) => order.indexOf(b) - order.indexOf(a))[0] ?? null;
}

async function ensureSkillClaim(input: {
  userId: string;
  skillKey: string;
  category: SkillCategory;
  observedLevel?: SkillLevel | null;
  evidenceText: string;
}) {
  const existing = await db
    .select({ id: skillClaims.id })
    .from(skillClaims)
    .where(and(eq(skillClaims.userId, input.userId), eq(skillClaims.skillKey, input.skillKey)))
    .limit(1);

  if (existing[0]) {
    await db
      .update(skillClaims)
      .set({
        skillCategory: input.category,
        claimedLevel: input.observedLevel ?? 'intermediate',
        claimSource: 'manual_edit',
        claimText: `AI observed evidence: ${input.evidenceText.slice(0, 500)}`,
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(skillClaims.id, existing[0].id));
    return;
  }

  await db.insert(skillClaims).values({
    id: randomUUID(),
    userId: input.userId,
    skillKey: input.skillKey,
    skillCategory: input.category,
    claimedLevel: input.observedLevel ?? 'intermediate',
    claimSource: 'manual_edit',
    claimText: `AI observed evidence: ${input.evidenceText.slice(0, 500)}`,
    isActive: true,
  });
}

async function recomputeSkillAssessment(userId: string, skillKey: string, category: SkillCategory) {
  const rows = await db
    .select({
      evidenceDirection: skillEvidence.evidenceDirection,
      evidenceStrength: skillEvidence.evidenceStrength,
      observedLevel: skillEvidence.observedLevel,
      confidence: skillEvidence.confidence,
    })
    .from(skillEvidence)
    .where(and(eq(skillEvidence.userId, userId), eq(skillEvidence.skillKey, skillKey)));

  const supportCount = rows.filter((row) => row.evidenceDirection === 'supports').length;
  const weakenCount = rows.filter((row) => row.evidenceDirection === 'weakens').length;
  const confidence = strongestConfidence(rows.map((row) => row.confidence as Confidence));
  const observedLevel = levelFromEvidence(rows.map((row) => row.observedLevel as SkillLevel | null));
  const verificationStatus = weakenCount > supportCount ? 'inconsistent' : verificationStatusForSupportCount(supportCount, confidence);
  const consistencyScore = Math.max(0, Math.min(100, supportCount * 20 - weakenCount * 25));
  const summary = supportCount > 0
    ? `AI observed ${skillKey} in ${supportCount} practice interaction${supportCount === 1 ? '' : 's'}.`
    : `${skillKey} has no supporting AI evidence yet.`;

  const existing = await db
    .select({ id: skillAssessments.id })
    .from(skillAssessments)
    .where(and(eq(skillAssessments.userId, userId), eq(skillAssessments.skillKey, skillKey)))
    .limit(1);

  if (existing[0]) {
    await db
      .update(skillAssessments)
      .set({
        skillCategory: category,
        observedLevel,
        verificationStatus,
        evidenceCount: rows.length,
        supportCount,
        weakenCount,
        confidence,
        consistencyScore,
        summary,
        improvementNote: verificationStatus === 'strongly_verified' ? null : 'Use this skill in more AI practice sessions to increase verification confidence.',
        updatedAt: new Date(),
      })
      .where(eq(skillAssessments.id, existing[0].id));
    return;
  }

  await db.insert(skillAssessments).values({
    id: randomUUID(),
    userId,
    skillKey,
    skillCategory: category,
    claimedLevel: null,
    observedLevel,
    verificationStatus,
    evidenceCount: rows.length,
    supportCount,
    weakenCount,
    confidence,
    consistencyScore,
    marketRelevanceScore: null,
    summary,
    improvementNote: verificationStatus === 'strongly_verified' ? null : 'Use this skill in more AI practice sessions to increase verification confidence.',
  });
}

export async function recordAiVerifiedSkillEvidence(input: RecordAiSkillEvidenceInput) {
  const observedSkills = input.observedSkills
    .map((skill) => ({ ...skill, skillKey: normalizeSkillKey(skill.skillKey) }))
    .filter((skill) => skill.skillKey.length > 0)
    .slice(0, 20);

  if (observedSkills.length === 0) return { recorded: 0 };

  let verificationSessionId: string | null = null;
  if (input.sessionType) {
    verificationSessionId = randomUUID();
    await db.insert(verificationSessions).values({
      id: verificationSessionId,
      userId: input.userId,
      sessionType: input.sessionType,
      targetSkills: observedSkills.map((skill) => skill.skillKey),
      status: 'completed',
      transcriptRef: input.sourceRefId ?? null,
      resultSummary: input.summary,
      confidence: strongestConfidence(observedSkills.map((skill) => skill.confidence ?? 'medium')),
      completedAt: new Date(),
    });
  }

  for (const skill of observedSkills) {
    const confidence = skill.confidence ?? 'medium';
    const observedLevel = skill.observedLevel ?? 'intermediate';

    await ensureSkillClaim({
      userId: input.userId,
      skillKey: skill.skillKey,
      category: skill.category,
      observedLevel,
      evidenceText: skill.evidenceText,
    });

    await db.insert(skillEvidence).values({
      id: randomUUID(),
      userId: input.userId,
      skillKey: skill.skillKey,
      sourceType: input.sourceType,
      sourceRefId: input.sourceRefId ?? null,
      evidenceDirection: 'supports',
      evidenceStrength: confidence,
      observedLevel,
      evidenceText: skill.evidenceText,
      structuredPayload: {
        summary: input.summary,
        category: skill.category,
        sourceType: input.sourceType,
      },
      freshnessScore: 100,
      confidence,
    });

    if (verificationSessionId) {
      await db.insert(verificationSessionResults).values({
        id: randomUUID(),
        sessionId: verificationSessionId,
        userId: input.userId,
        skillKey: skill.skillKey,
        observedLevel,
        confidence,
        summary: skill.evidenceText,
        structuredPayload: {
          category: skill.category,
          sourceType: input.sourceType,
        },
      });
    }

    await recomputeSkillAssessment(input.userId, skill.skillKey, skill.category);
  }

  await db.execute(sql`select 1`);
  return { recorded: observedSkills.length };
}
