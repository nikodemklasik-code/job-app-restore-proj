/**
 * Pure SkillUp Verification Engine helpers (v1.0 MVP).
 * No I/O — safe for unit tests and reuse from ingestion / assessment services.
 */

export type SkillLevel = 'basic' | 'intermediate' | 'advanced' | 'expert';
export type EvidenceDirection = 'supports' | 'weakens' | 'neutral';
export type Confidence = 'low' | 'medium' | 'high';
export type EvidenceStrength = Confidence;
export type SkillCategory = 'hard' | 'soft' | 'language' | 'domain' | 'tool';
export type VerificationStatus =
  | 'self_declared'
  | 'lightly_evidenced'
  | 'partially_verified'
  | 'strongly_verified'
  | 'inconsistent';

const LEVEL_RANK: Record<SkillLevel, number> = {
  basic: 1,
  intermediate: 2,
  advanced: 3,
  expert: 4,
};

const RANK_TO_LEVEL: Record<number, SkillLevel> = {
  1: 'basic',
  2: 'intermediate',
  3: 'advanced',
  4: 'expert',
};

function strengthScore(s: EvidenceStrength): number {
  if (s === 'high') return 3;
  if (s === 'medium') return 2;
  return 1;
}

function confidenceScore(c: Confidence): number {
  if (c === 'high') return 3;
  if (c === 'medium') return 2;
  return 1;
}

/** Maps optional DB freshness score (0–100) to a decay factor. */
export function freshnessFactorFromScore(freshnessScore: number | null | undefined): number {
  if (freshnessScore == null) return 1;
  if (freshnessScore >= 80) return 1;
  if (freshnessScore >= 40) return 0.8;
  return 0.5;
}

export function evidenceContribution(input: {
  direction: EvidenceDirection;
  strength: EvidenceStrength;
  confidence: Confidence;
  freshnessFactor: number;
}): number {
  const directionScore = input.direction === 'supports' ? 1 : input.direction === 'weakens' ? -1 : 0;
  const s = strengthScore(input.strength);
  const c = confidenceScore(input.confidence);
  return directionScore * s * c * input.freshnessFactor;
}

/**
 * Soft-skill observations are capped unless corroborated across multiple evidence rows
 * (proxy for “independent samples”, not identity judgment).
 */
export function effectiveConfidenceForEvidence(
  skillCategory: SkillCategory,
  statedConfidence: Confidence,
  corroboratingRowCount: number,
): Confidence {
  if (skillCategory !== 'soft') return statedConfidence;
  if (statedConfidence === 'high' && corroboratingRowCount >= 2) return 'high';
  if (statedConfidence === 'high') return 'medium';
  return statedConfidence;
}

export function deriveObservedLevelSimple(levels: SkillLevel[]): SkillLevel | null {
  if (levels.length === 0) return null;
  const avg = Math.round(levels.reduce((sum, level) => sum + LEVEL_RANK[level], 0) / levels.length);
  return RANK_TO_LEVEL[avg] ?? null;
}

export type EvidenceLevelInput = {
  observedLevel: SkillLevel | null | undefined;
  strength: EvidenceStrength;
  confidence: Confidence;
  direction: EvidenceDirection;
  skillCategory: SkillCategory;
  /** Distinct source types for this skill (used for soft-skill ceiling). */
  corroboratingSourceTypeCount: number;
};

/** Weighted by strength × effective confidence; only non-null observed levels; prefers supporting direction. */
export function deriveObservedLevelWeighted(evidences: EvidenceLevelInput[]): SkillLevel | null {
  const weighted: Array<{ rank: number; weight: number }> = [];
  for (const e of evidences) {
    if (!e.observedLevel) continue;
    const w = e.direction === 'supports' ? 1 : e.direction === 'neutral' ? 0.5 : 0;
    if (w <= 0) continue;
    const eff = effectiveConfidenceForEvidence(
      e.skillCategory,
      e.confidence,
      e.corroboratingSourceTypeCount,
    );
    const weight = strengthScore(e.strength) * confidenceScore(eff) * w;
    weighted.push({ rank: LEVEL_RANK[e.observedLevel], weight });
  }
  if (weighted.length === 0) return null;
  const sumW = weighted.reduce((a, b) => a + b.weight, 0);
  if (sumW <= 0) return null;
  const avgRank = weighted.reduce((a, b) => a + b.rank * b.weight, 0) / sumW;
  const rounded = Math.min(4, Math.max(1, Math.round(avgRank)));
  return RANK_TO_LEVEL[rounded] ?? null;
}

export function deriveConsistencyScore(input: {
  claimLevel: SkillLevel | null | undefined;
  observedLevel: SkillLevel | null | undefined;
  weakenCount: number;
  supportCount: number;
}): number {
  let score = 100;
  score -= input.weakenCount * 12;
  if (input.claimLevel && input.observedLevel) {
    const gap = LEVEL_RANK[input.claimLevel] - LEVEL_RANK[input.observedLevel];
    if (gap > 0) score -= gap * 18;
    if (gap < 0) score -= Math.abs(gap) * 6;
  }
  if (input.supportCount >= 3) score += 4;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export type EvidenceRecord = {
  direction: EvidenceDirection;
  strength: EvidenceStrength;
  confidence: Confidence;
  observedLevel?: SkillLevel | null;
  skillCategory?: SkillCategory;
  sourceType?: string;
};

/** Majority vote on confidence tier from evidence rows. */
export function deriveAggregateConfidence(evidences: EvidenceRecord[]): Confidence {
  if (evidences.length === 0) return 'low';
  let h = 0;
  let m = 0;
  let l = 0;
  for (const e of evidences) {
    if (e.confidence === 'high') h += 1;
    else if (e.confidence === 'medium') m += 1;
    else l += 1;
  }
  if (h >= m && h >= l) return 'high';
  if (m >= l) return 'medium';
  return 'low';
}

export type VerificationStatusInput = {
  hasClaim: boolean;
  claimLevel?: SkillLevel | null;
  observedLevel?: SkillLevel | null;
  supportCount: number;
  weakenCount: number;
  evidenceCount: number;
  /** Evidence rows with stated confidence medium or high. */
  mediumOrHighConfidenceCount: number;
  highConfidenceEvidenceCount: number;
  consistencyScore: number;
  /** Sum of positive evidenceContribution scores (supports only, for gating strong status). */
  positiveWeightedEvidenceSum: number;
};

const INCONSISTENCY_CONSISTENCY_THRESHOLD = 48;

/**
 * Rule: low sample size must not yield harsh inconsistency.
 * Inconsistent only with claim, strictly lower observed level, ≥2 evidences,
 * ≥2 medium/high-confidence observations, and consistency below threshold.
 */
export function getVerificationStatus(input: VerificationStatusInput): VerificationStatus {
  const {
    hasClaim,
    claimLevel,
    observedLevel,
    supportCount,
    weakenCount,
    evidenceCount,
    mediumOrHighConfidenceCount,
    highConfidenceEvidenceCount,
    consistencyScore,
    positiveWeightedEvidenceSum,
  } = input;

  if (
    hasClaim &&
    claimLevel &&
    observedLevel &&
    evidenceCount >= 2 &&
    mediumOrHighConfidenceCount >= 2 &&
    LEVEL_RANK[observedLevel] < LEVEL_RANK[claimLevel] &&
    consistencyScore < INCONSISTENCY_CONSISTENCY_THRESHOLD
  ) {
    return 'inconsistent';
  }

  if (evidenceCount === 0) {
    return hasClaim ? 'self_declared' : 'lightly_evidenced';
  }

  if (evidenceCount === 1 || mediumOrHighConfidenceCount < 2) {
    if (supportCount >= 1 && highConfidenceEvidenceCount >= 1) return 'partially_verified';
    return 'lightly_evidenced';
  }

  if (
    supportCount >= 2 &&
    highConfidenceEvidenceCount >= 1 &&
    weakenCount === 0 &&
    consistencyScore >= 72 &&
    positiveWeightedEvidenceSum >= 12
  ) {
    return 'strongly_verified';
  }

  if (supportCount >= 1 && evidenceCount >= 2) {
    return 'partially_verified';
  }

  return 'lightly_evidenced';
}

export type AggregateSkillAssessmentResult = {
  supportCount: number;
  weakenCount: number;
  evidenceCount: number;
  weightedScore: number;
  observedLevel: SkillLevel | null;
  aggregateConfidence: Confidence;
  consistencyScore: number;
  verificationStatus: VerificationStatus;
  positiveWeightedEvidenceSum: number;
  mediumOrHighConfidenceCount: number;
  highConfidenceEvidenceCount: number;
};

function countDistinctSourceTypes(evidences: Array<{ sourceType?: string }>): number {
  return new Set(evidences.map((e) => e.sourceType ?? 'unknown')).size;
}

export function aggregateSkillAssessment(input: {
  skillCategory: SkillCategory;
  claimLevel?: SkillLevel | null;
  evidences: Array<{
    direction: EvidenceDirection;
    strength: EvidenceStrength;
    confidence: Confidence;
    observedLevel?: SkillLevel | null;
    freshnessScore?: number | null;
    sourceType?: string;
  }>;
}): AggregateSkillAssessmentResult {
  const corroborating = countDistinctSourceTypes(input.evidences);
  const enriched = input.evidences.map((e) => ({
    ...e,
    effectiveConfidence: effectiveConfidenceForEvidence(input.skillCategory, e.confidence, corroborating),
  }));

  let weightedScore = 0;
  let positiveWeightedEvidenceSum = 0;
  for (const e of enriched) {
    const contrib = evidenceContribution({
      direction: e.direction,
      strength: e.strength,
      confidence: e.effectiveConfidence,
      freshnessFactor: freshnessFactorFromScore(e.freshnessScore),
    });
    weightedScore += contrib;
    if (e.direction === 'supports' && contrib > 0) positiveWeightedEvidenceSum += contrib;
  }

  const supportCount = input.evidences.filter((e) => e.direction === 'supports').length;
  const weakenCount = input.evidences.filter((e) => e.direction === 'weakens').length;
  const evidenceCount = input.evidences.length;

  const levelInputs: EvidenceLevelInput[] = enriched.map((e) => ({
    observedLevel: e.observedLevel,
    strength: e.strength,
    confidence: e.effectiveConfidence,
    direction: e.direction,
    skillCategory: input.skillCategory,
    corroboratingSourceTypeCount: corroborating,
  }));
  const observedLevel = deriveObservedLevelWeighted(levelInputs);

  const aggregateConfidence = deriveAggregateConfidence(
    enriched.map((e) => ({
      direction: e.direction,
      strength: e.strength,
      confidence: e.effectiveConfidence,
      observedLevel: e.observedLevel,
      skillCategory: input.skillCategory,
    })),
  );

  const consistencyScore = deriveConsistencyScore({
    claimLevel: input.claimLevel,
    observedLevel,
    weakenCount,
    supportCount,
  });

  const mediumOrHighConfidenceCount = input.evidences.filter(
    (e) => e.confidence === 'medium' || e.confidence === 'high',
  ).length;
  const highConfidenceEvidenceCount = input.evidences.filter((e) => e.confidence === 'high').length;

  const verificationStatus = getVerificationStatus({
    hasClaim: Boolean(input.claimLevel),
    claimLevel: input.claimLevel,
    observedLevel,
    supportCount,
    weakenCount,
    evidenceCount,
    mediumOrHighConfidenceCount,
    highConfidenceEvidenceCount,
    consistencyScore,
    positiveWeightedEvidenceSum,
  });

  return {
    supportCount,
    weakenCount,
    evidenceCount,
    weightedScore,
    observedLevel,
    aggregateConfidence,
    consistencyScore,
    verificationStatus,
    positiveWeightedEvidenceSum,
    mediumOrHighConfidenceCount,
    highConfidenceEvidenceCount,
  };
}

export function buildAssessmentCopy(input: {
  skillKey: string;
  verificationStatus: VerificationStatus;
  observedLevel: SkillLevel | null;
  claimLevel: SkillLevel | null | undefined;
  evidenceCount: number;
}): { summary: string; improvementNote: string | null } {
  const claim = input.claimLevel ? `Declared level: ${input.claimLevel}. ` : '';
  const obs = input.observedLevel ? `Observed level from evidence: ${input.observedLevel}. ` : 'No stable observed level yet. ';

  let summary = `${claim}${obs}Verification: ${input.verificationStatus.replace(/_/g, ' ')} (${input.evidenceCount} evidence row(s) for ${input.skillKey}).`;

  let improvementNote: string | null = null;
  if (input.verificationStatus === 'inconsistent') {
    improvementNote =
      'Current evidence suggests a lower demonstrated level than your declaration. Add stronger, recent proof (e.g. work samples, structured interview practice) rather than changing goals overnight.';
  } else if (input.verificationStatus === 'lightly_evidenced') {
    improvementNote =
      'Evidence volume is still limited. One more independent check (interview, task, or reference with specifics) will materially improve confidence.';
  } else if (input.verificationStatus === 'self_declared') {
    improvementNote = 'No evidence rows yet — consider a short verification session or portfolio link.';
  }

  return { summary, improvementNote };
}
