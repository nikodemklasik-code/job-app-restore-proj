export type JobActionMode = 'auto_candidate' | 'manual_review';

export type JobFitDecisionInput = {
  fitScore: number | null | undefined;
  minFitScore: number;
};

export type JobFitDecision = {
  fitScore: number;
  minFitScore: number;
  actionMode: JobActionMode;
  autoEligible: boolean;
};

export const DEFAULT_JOBS_MIN_FIT_SCORE = 0;

export function normaliseFitPercent(value: number | null | undefined, fallback = DEFAULT_JOBS_MIN_FIT_SCORE): number {
  const source = typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  return Math.min(100, Math.max(0, Math.round(source)));
}

/**
 * DOP: the single decision policy for Jobs fit handling.
 *
 * This is the only place that determines how a backend job fit percentage maps
 * to auto/manual workflow. Other modules may display, persist, sort, or route
 * the returned result, but must not duplicate this rule.
 */
export function decideJobFit(input: JobFitDecisionInput): JobFitDecision {
  const fitScore = normaliseFitPercent(input.fitScore, 60);
  const minFitScore = normaliseFitPercent(input.minFitScore, DEFAULT_JOBS_MIN_FIT_SCORE);
  const actionMode: JobActionMode = fitScore >= minFitScore ? 'auto_candidate' : 'manual_review';

  return {
    fitScore,
    minFitScore,
    actionMode,
    autoEligible: actionMode === 'auto_candidate',
  };
}
