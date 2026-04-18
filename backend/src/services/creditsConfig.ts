/**
 * Credits & billing engine — feature cost catalogue.
 *
 * Source of truth for "how much does this action cost?" on the backend.
 * Every paid action (fixed or estimated) must route through this map so that:
 *   - costs are visible before spend (estimateActionCost)
 *   - no hidden deduction can happen anywhere else in the codebase
 *   - frontend and backend agree on a single set of feature keys
 *
 * Policy references:
 *   docs/features/backend-completion-spec/credits-billing-engine-v1.0.md (§1)
 *   docs/features/practice-refactor/billing-credits-v1.0.md
 */

export type FeatureCostKind = 'fixed' | 'estimated';

export interface FixedFeatureCost {
  readonly kind: 'fixed';
  readonly feature: FeatureKey;
  /** Credit cost deducted on commit. For free-tier sessions this is 0. */
  readonly cost: number;
  readonly productLabel: string;
}

export interface EstimatedFeatureCost {
  readonly kind: 'estimated';
  readonly feature: FeatureKey;
  /** Lower bound shown to the user in the "Estimated cost" panel. */
  readonly minCost: number;
  /** Upper bound the user must approve before the action runs. */
  readonly maxCost: number;
  readonly productLabel: string;
}

export type FeatureCost = FixedFeatureCost | EstimatedFeatureCost;

/**
 * Feature keys are the single identifier used end-to-end:
 * frontend UI → tRPC estimate/approve/commit → usage history.
 * Keep this list aligned with frontend `creditRules` (practice-shell).
 */
export const FEATURE_KEYS = [
  // Daily Warmup — fixed per duration (see practice-refactor/daily-warmup-v1.0.md)
  'warmup_session_15s',
  'warmup_session_30s',
  'warmup_session_45s',
  'warmup_session_60s',

  // Coach — estimated (depth-dependent)
  'coach_quick_reframe',
  'coach_structured_guidance',
  'coach_deep_coaching',
  // Coach practice session / STAR-style answer evaluation (`coach.evaluateAnswer`) — flat 5 credits, approve→commit.
  'coach_session',

  // Interview — estimated (scenario depth)
  'interview_lite',
  'interview_standard',
  'interview_deep',

  // Negotiation — estimated (mode-dependent)
  'negotiation_reply_draft',
  'negotiation_counter_offer',
  'negotiation_strategy',
  'negotiation_simulation',

  // Skill Lab & style — estimated
  'skill_lab_gap_analysis',
  'skill_lab_course_suggest',
  'style_analyze_document',

  // Legal Hub AI search — estimated
  'legal_hub_ai_answer',
  // Legal Hub — fixed PDF export of catalogue search results
  'legal_hub_search_pdf',

  // AI Analysis page — estimated
  'ai_analysis_compare',
] as const;

export type FeatureKey = (typeof FEATURE_KEYS)[number];

export const FEATURE_COSTS: Record<FeatureKey, FeatureCost> = {
  // ── Daily Warmup (fixed) ────────────────────────────────────────────────
  warmup_session_15s: {
    kind: 'fixed',
    feature: 'warmup_session_15s',
    cost: 0,
    productLabel: 'Daily Warmup · 15 s',
  },
  warmup_session_30s: {
    kind: 'fixed',
    feature: 'warmup_session_30s',
    cost: 1,
    productLabel: 'Daily Warmup · 30 s',
  },
  warmup_session_45s: {
    kind: 'fixed',
    feature: 'warmup_session_45s',
    cost: 2,
    productLabel: 'Daily Warmup · 45 s',
  },
  warmup_session_60s: {
    kind: 'fixed',
    feature: 'warmup_session_60s',
    cost: 3,
    productLabel: 'Daily Warmup · 60 s',
  },

  // ── Coach (estimated) ───────────────────────────────────────────────────
  coach_quick_reframe: {
    kind: 'estimated',
    feature: 'coach_quick_reframe',
    minCost: 2,
    maxCost: 4,
    productLabel: 'Coach · Quick reframe',
  },
  coach_structured_guidance: {
    kind: 'estimated',
    feature: 'coach_structured_guidance',
    minCost: 5,
    maxCost: 9,
    productLabel: 'Coach · Structured guidance',
  },
  coach_deep_coaching: {
    kind: 'estimated',
    feature: 'coach_deep_coaching',
    minCost: 10,
    maxCost: 18,
    productLabel: 'Coach · Deep coaching',
  },
  coach_session: {
    kind: 'estimated',
    feature: 'coach_session',
    minCost: 5,
    maxCost: 5,
    productLabel: 'Coach · Session',
  },

  // ── Interview (estimated) ───────────────────────────────────────────────
  interview_lite: {
    kind: 'estimated',
    feature: 'interview_lite',
    minCost: 4,
    maxCost: 7,
    productLabel: 'Interview · Lite (7 min)',
  },
  interview_standard: {
    kind: 'estimated',
    feature: 'interview_standard',
    minCost: 8,
    maxCost: 14,
    productLabel: 'Interview · Standard',
  },
  interview_deep: {
    kind: 'estimated',
    feature: 'interview_deep',
    minCost: 15,
    maxCost: 25,
    productLabel: 'Interview · Deep practice',
  },

  // ── Negotiation (estimated) ─────────────────────────────────────────────
  negotiation_reply_draft: {
    kind: 'estimated',
    feature: 'negotiation_reply_draft',
    minCost: 3,
    maxCost: 6,
    productLabel: 'Negotiation · Reply draft',
  },
  negotiation_counter_offer: {
    kind: 'estimated',
    feature: 'negotiation_counter_offer',
    minCost: 4,
    maxCost: 8,
    productLabel: 'Negotiation · Counter-offer',
  },
  negotiation_strategy: {
    kind: 'estimated',
    feature: 'negotiation_strategy',
    minCost: 6,
    maxCost: 12,
    productLabel: 'Negotiation · Strategy',
  },
  negotiation_simulation: {
    kind: 'estimated',
    feature: 'negotiation_simulation',
    minCost: 8,
    maxCost: 16,
    productLabel: 'Negotiation · Simulation',
  },

  // ── Skill Lab / Style (estimated) ───────────────────────────────────────
  skill_lab_gap_analysis: {
    kind: 'estimated',
    feature: 'skill_lab_gap_analysis',
    minCost: 3,
    maxCost: 6,
    productLabel: 'Skill Lab · Gap analysis',
  },
  skill_lab_course_suggest: {
    kind: 'estimated',
    feature: 'skill_lab_course_suggest',
    minCost: 1,
    maxCost: 3,
    productLabel: 'Skill Lab · Course suggestions',
  },
  style_analyze_document: {
    kind: 'estimated',
    feature: 'style_analyze_document',
    minCost: 3,
    maxCost: 6,
    productLabel: 'Style · Analyze document',
  },

  // ── Legal Hub AI search (estimated) ─────────────────────────────────────
  legal_hub_ai_answer: {
    kind: 'estimated',
    feature: 'legal_hub_ai_answer',
    minCost: 2,
    maxCost: 4,
    productLabel: 'Legal Hub · AI answer',
  },
  legal_hub_search_pdf: {
    kind: 'fixed',
    feature: 'legal_hub_search_pdf',
    cost: 1,
    productLabel: 'Legal Hub · Save search as PDF',
  },

  // ── AI Analysis page (estimated) ────────────────────────────────────────
  ai_analysis_compare: {
    kind: 'estimated',
    feature: 'ai_analysis_compare',
    minCost: 4,
    maxCost: 8,
    productLabel: 'AI Analysis · Compare',
  },
};

export function isKnownFeature(key: string): key is FeatureKey {
  return (FEATURE_KEYS as readonly string[]).includes(key);
}

export function getFeatureCost(feature: FeatureKey): FeatureCost {
  return FEATURE_COSTS[feature];
}

/**
 * Plan-level monthly free allowance (credits) — product policy:
 * "full product access for all + monthly free allowance + credits-first usage".
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

/**
 * Credit pack catalog — "Buy Credits" surface.
 *
 * Packs are one-off credit top-ups. They never touch the monthly allowance;
 * purchased credits sit in `subscriptions.credits` and are spent only after
 * the allowance has been consumed, matching the "allowance-first" policy
 * in `creditsBilling.policy.ts`.
 *
 * Pricing is deliberately round GBP so PayPal/Stripe amounts don't need
 * locale-specific rounding. Update amounts in lockstep with product.
 */
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
    priceGbp: 4.99,
    label: 'Starter pack',
    description: '50 credits — ~5 Coach sessions or ~3 Interview deep practices.',
  },
  {
    id: 'pack_medium',
    credits: 150,
    priceGbp: 11.99,
    label: 'Regular pack',
    description: '150 credits — best value for weekly users.',
  },
  {
    id: 'pack_large',
    credits: 400,
    priceGbp: 27.99,
    label: 'Power pack',
    description: '400 credits — for power users running multiple sessions a day.',
  },
];

export type CreditPackId = (typeof CREDIT_PACKS)[number]['id'];

export function getCreditPack(id: string): CreditPack | undefined {
  return CREDIT_PACKS.find((pack) => pack.id === id);
}
