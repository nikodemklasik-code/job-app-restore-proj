export type Driver = {
  label: string;
  impact: number;
  confidence: 'low' | 'medium' | 'high';
  driverType: 'positive' | 'negative' | 'neutral';
  sourceId?: string | null;
  sourceRef?: string | null;
};

export type MetricScoreResult = {
  score: number;
  drivers: Driver[];
};

export type FullScoringResult = {
  employerScore: MetricScoreResult;
  offerScore: MetricScoreResult;
  marketPayScore: MetricScoreResult;
  benefitsScore: MetricScoreResult;
  cultureFitScore: MetricScoreResult;
  riskScore: MetricScoreResult;
  recommendation: 'Strong Match' | 'Good Option' | 'Mixed Signals' | 'High Risk';
  confidenceOverall: 'low' | 'medium' | 'high';
};
