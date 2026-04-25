/**
 * Credits & billing engine — feature cost catalogue.
 *
 * Backend source of truth for product credit pricing. The catalogue deliberately
 * separates three concerns that humans keep mixing together because apparently
 * ledgers were not annoying enough already:
 *   1. user-visible credit cost,
 *   2. approval semantics (fixed vs estimated),
 *   3. profitability guardrails (tier, model tier, margin multiplier).
 *
 * Every paid action must route through this map so that there is no hidden spend
 * path with a cute button and a terrible invoice.
 */

export type FeatureCostKind = 'fixed' | 'estimated';
export type CreditActionTier = 'micro' | 'standard' | 'deep';
export type CreditModelTier = 'mini' | 'standard' | 'better';

export interface FeatureEconomics {
  /** Pricing bucket used by audit/QC and model-routing policy. */
  readonly tier: CreditActionTier;
  /** Highest default model class this action should use without a separate override. */
  readonly modelTier: CreditModelTier;
  /** Minimum gross margin multiplier expected before the action is considered safe. */
  readonly minGrossMarginMultiplier: number;
  /** Estimated flows with variable context/retrieval/session length require approval caps. */
  readonly requiresDynamicApproval: boolean;
  /** Soft policy cap for implementation adapters. Enforced by model callers, not this catalogue. */
  readonly maxInputTokens?: number;
  /** Soft policy cap for implementation adapters. Enforced by model callers, not this catalogue. */
  readonly maxOutputTokens?: number;
}

export interface FixedFeatureCost {
  readonly kind: 'fixed';
  readonly feature: FeatureKey;
  /** Credit cost deducted on commit. For free sessions this is 0. */
  readonly cost: number;
  readonly productLabel: string;
  readonly economics: FeatureEconomics;
}

export interface EstimatedFeatureCost {
  readonly kind: 'estimated';
  readonly feature: FeatureKey;
  /** Lower bound shown to the user in the Estimated Cost panel. */
  readonly minCost: number;
  /** Default upper bound the user must approve before the action runs. */
  readonly maxCost: number;
  readonly productLabel: string;
  readonly economics: FeatureEconomics;
}

export type FeatureCost = FixedFeatureCost | EstimatedFeatureCost;

function micro(modelTier: CreditModelTier = 'mini'): FeatureEconomics {
  return {
    tier: 'micro',
    modelTier,
    minGrossMarginMultiplier: 2.5,
    requiresDynamicApproval: false,
    maxInputTokens: 8_000,
    maxOutputTokens: 1_200,
  };
}

function standard(modelTier: CreditModelTier = 'mini'): FeatureEconomics {
  return {
    tier: 'standard',
    modelTier,
    minGrossMarginMultiplier: 3,
    requiresDynamicApproval: false,
    maxInputTokens: 20_000,
    maxOutputTokens: 3_000,
  };
}

function deep(modelTier: CreditModelTier = 'standard'): FeatureEconomics {
  return {
    tier: 'deep',
    modelTier,
    minGrossMarginMultiplier: 4,
    requiresDynamicApproval: true,
    maxInputTokens: 50_000,
    maxOutputTokens: 6_000,
  };
}

/**
 * Feature keys are the single identifier used end-to-end:
 * frontend UI → tRPC estimate/approve/commit → usage history.
 */
export const FEATURE_KEYS = [
  'warmup_session_15s',
  'warmup_session_30s',
  'warmup_session_45s',
  'warmup_session_60s',

  'coach_quick_reframe',
  'coach_structured_guidance',
  'coach_deep_coaching',
  'coach_session',

  'interview_lite',
  'interview_standard',
  'interview_deep',

  'negotiation_reply_draft',
  'negotiation_counter_offer',
  'negotiation_strategy',
  'negotiation_simulation',

  'skill_lab_gap_analysis',
  'skill_lab_course_suggest',
  'style_analyze_document',

  'legal_hub_ai_answer',
  'legal_hub_search_pdf',

  'ai_analysis_compare',
] as const;

export type FeatureKey = (typeof FEATURE_KEYS)[number];

export const FEATURE_COSTS: Record<FeatureKey, FeatureCost> = {
  // ── Daily Warmup: fixed, tightly time-boxed ──────────────────────────────
  warmup_session_15s: {
    kind: 'fixed',
    feature: 'warmup_session_15s',
    cost: 0,
    productLabel: 'Daily Warmup · 15 s',
    economics: micro(),
  },
  warmup_session_30s: {
    kind: 'fixed',
    feature: 'warmup_session_30s',
    cost: 1,
    productLabel: 'Daily Warmup · 30 s',
    economics: micro(),
  },
  warmup_session_45s: {
    kind: 'fixed',
    feature: 'warmup_session_45s',
    cost: 2,
    productLabel: 'Daily Warmup · 45 s',
    economics: micro(),
  },
  warmup_session_60s: {
    kind: 'fixed',
    feature: 'warmup_session_60s',
    cost: 3,
    productLabel: 'Daily Warmup · 60 s',
    economics: micro(),
  },

  // ── Coach: cheap reframe, capped guidance, deep requires approval ────────
  coach_quick_reframe: {
    kind: 'fixed',
    feature: 'coach_quick_reframe',
    cost: 2,
    productLabel: 'Coach · Quick reframe',
    economics: micro(),
  },
  coach_structured_guidance: {
    kind: 'estimated',
    feature: 'coach_structured_guidance',
    minCost: 4,
    maxCost: 5,
    productLabel: 'Coach · Structured guidance',
    economics: standard(),
  },
  coach_deep_coaching: {
    kind: 'estimated',
    feature: 'coach_deep_coaching',
    minCost: 7,
    maxCost: 9,
    productLabel: 'Coach · Deep coaching',
    economics: deep(),
  },
  coach_session: {
    kind: 'fixed',
    feature: 'coach_session',
    cost: 5,
    productLabel: 'Coach · Session',
    economics: standard(),
  },

  // ── Interview: session actions are bounded; deep keeps an approval band ──
  interview_lite: {
    kind: 'fixed',
    feature: 'interview_lite',
    cost: 4,
    productLabel: 'Interview · Lite (7 min)',
    economics: standard(),
  },
  interview_standard: {
    kind: 'fixed',
    feature: 'interview_standard',
    cost: 4,
    productLabel: 'Interview · Standard',
    economics: standard(),
  },
  interview_deep: {
    kind: 'estimated',
    feature: 'interview_deep',
    minCost: 6,
    maxCost: 8,
    productLabel: 'Interview · Deep practice',
    economics: deep(),
  },

  // ── Negotiation: drafts are fixed; strategy/simulation are variable ──────
  negotiation_reply_draft: {
    kind: 'fixed',
    feature: 'negotiation_reply_draft',
    cost: 2,
    productLabel: 'Negotiation · Reply draft',
    economics: micro(),
  },
  negotiation_counter_offer: {
    kind: 'fixed',
    feature: 'negotiation_counter_offer',
    cost: 3,
    productLabel: 'Negotiation · Counter-offer',
    economics: standard(),
  },
  negotiation_strategy: {
    kind: 'estimated',
    feature: 'negotiation_strategy',
    minCost: 5,
    maxCost: 7,
    productLabel: 'Negotiation · Strategy',
    economics: deep(),
  },
  negotiation_simulation: {
    kind: 'estimated',
    feature: 'negotiation_simulation',
    minCost: 7,
    maxCost: 9,
    productLabel: 'Negotiation · Simulation',
    economics: deep(),
  },

  // ── Skill Lab / Style ────────────────────────────────────────────────────
  skill_lab_gap_analysis: {
    kind: 'estimated',
    feature: 'skill_lab_gap_analysis',
    minCost: 3,
    maxCost: 5,
    productLabel: 'Skill Lab · Gap analysis',
    economics: standard(),
  },
  skill_lab_course_suggest: {
    kind: 'fixed',
    feature: 'skill_lab_course_suggest',
    cost: 1,
    productLabel: 'Skill Lab · Course suggestions',
    economics: micro(),
  },
  style_analyze_document: {
    kind: 'estimated',
    feature: 'style_analyze_document',
    minCost: 3,
    maxCost: 5,
    productLabel: 'Style · Analyze document',
    economics: standard(),
  },

  // ── Legal / AI Analysis: retrieval or comparative context stays capped ───
  legal_hub_ai_answer: {
    kind: 'estimated',
    feature: 'legal_hub_ai_answer',
    minCost: 2,
    maxCost: 4,
    productLabel: 'Legal Hub · AI answer',
    economics: standard(),
  },
  legal_hub_search_pdf: {
    kind: 'fixed',
    feature: 'legal_hub_search_pdf',
    cost: 1,
    productLabel: 'Legal Hub · Save search as PDF',
    economics: micro(),
  },
  ai_analysis_compare: {
    kind: 'estimated',
    feature: 'ai_analysis_compare',
    minCost: 4,
    maxCost: 8,
    productLabel: 'AI Analysis · Compare',
    economics: deep(),
  },
};

export function isKnownFeature(key: string): key is FeatureKey {
  return (FEATURE_KEYS as readonly string[]).includes(key);
}

export function getFeatureCost(feature: FeatureKey): FeatureCost {
  return FEATURE_COSTS[feature];
}

export function getFeatureEconomics(feature: FeatureKey): FeatureEconomics {
  return FEATURE_COSTS[feature].economics;
}

export function requiresDynamicApproval(feature: FeatureKey): boolean {
  return FEATURE_COSTS[feature].economics.requiresDynamicApproval;
}

/**
 * Gross catalogue floor. Provider fees, VAT/tax handling, promos and free
 * allowance reduce this in real life, because apparently money enjoys having
 * footnotes. Packs must stay above this floor before finance-specific fees.
 */
export const MIN_GROSS_PRICE_PER_CREDIT_GBP = 0.15;

/**
 * Plan-level monthly free allowance (credits).
 * Allowance is spent first, credit balance second.
 */
export const MONTHLY_ALLOWANCE_BY_PLAN = {
  free: 20,
  pro: 500,
  autopilot: 2000,
} as const;

export type AllowancePlanKey = keyof typeof MONTHLY_ALLOWANCE_BY_PLAN;

export function monthlyAllowanceFor(plan: string): number {
  if (plan === 'pro' || plan === 'autopilot' || plan === 'free') {
    return MONTHLY_ALLOWANCE_BY_PLAN[plan];
  }
  return MONTHLY_ALLOWANCE_BY_PLAN.free;
}

export interface CreditPack {
  readonly id: string;
  readonly credits: number;
  readonly priceGbp: number;
  readonly label: string;
  readonly description: string;
}

export const CREDIT_PACKS: readonly CreditPack[] = [
  {
    id: 'pack_small',
    credits: 50,
    priceGbp: 9.99,
    label: 'Starter pack',
    description: '50 credits for light AI actions, warmups, drafts, and quick reviews.',
  },
  {
    id: 'pack_medium',
    credits: 150,
    priceGbp: 27.99,
    label: 'Regular pack',
    description: '150 credits for weekly coaching, interview practice, and analysis.',
  },
  {
    id: 'pack_large',
    credits: 400,
    priceGbp: 64.99,
    label: 'Power pack',
    description: '400 credits for heavy users running deeper AI sessions.',
  },
];

export type CreditPackId = (typeof CREDIT_PACKS)[number]['id'];

export function getCreditPack(id: string): CreditPack | undefined {
  return CREDIT_PACKS.find((pack) => pack.id === id);
}
