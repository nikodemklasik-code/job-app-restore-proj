/** Browser-local minimum fit % for Jobs discovery list (Profile slider writes the same key). */
export const MIN_JOB_FIT_LOCAL_KEY = 'mvh.minJobFitPercent';

export function readMinJobFitPercent(): number {
  if (typeof window === 'undefined') return 50;
  const v = Number.parseInt(window.localStorage.getItem(MIN_JOB_FIT_LOCAL_KEY) ?? '50', 10);
  return Number.isFinite(v) ? Math.min(100, Math.max(0, v)) : 50;
}
