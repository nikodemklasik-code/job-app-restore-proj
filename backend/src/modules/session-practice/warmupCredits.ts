/** Allowed debit amounts for Daily Warmup paid tiers (seconds 30 / 45 / 60). Free tier does not call deduct. */
export const DAILY_WARMUP_PAID_CREDIT_AMOUNTS = [1, 2, 3] as const;

export type DailyWarmupPaidCredits = (typeof DAILY_WARMUP_PAID_CREDIT_AMOUNTS)[number];

export function isValidWarmupSessionDebit(feature: string | undefined, amount: number): boolean {
  if (feature !== 'warmup_session') return true;
  return (DAILY_WARMUP_PAID_CREDIT_AMOUNTS as readonly number[]).includes(amount);
}
