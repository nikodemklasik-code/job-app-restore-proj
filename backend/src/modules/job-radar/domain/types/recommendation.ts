export const RECOMMENDATION = {
  STRONG_MATCH: 'Strong Match',
  GOOD_OPTION: 'Good Option',
  MIXED_SIGNALS: 'Mixed Signals',
  HIGH_RISK: 'High Risk',
} as const;

export type Recommendation = (typeof RECOMMENDATION)[keyof typeof RECOMMENDATION];
