export type SaveRadarScoresInput = {
  scanId: string;
  employerScore: number;
  offerScore: number;
  marketPayScore: number;
  benefitsScore: number;
  cultureFitScore: number;
  riskScore: number;
  recommendation: 'Strong Match' | 'Good Option' | 'Mixed Signals' | 'High Risk';
  confidenceOverall: 'low' | 'medium' | 'high';
};

export type SaveScoreDriverInput = {
  id: string;
  scanId: string;
  scoreName: string;
  driverType: 'positive' | 'negative' | 'neutral';
  label: string;
  impact: number;
  confidence: 'low' | 'medium' | 'high';
  sourceId?: string | null;
  sourceRef?: string | null;
};

export interface RadarScoreRepository {
  saveScores(input: SaveRadarScoresInput): Promise<void>;
  getByScanId(scanId: string): Promise<Record<string, unknown> | null>;
  replaceDrivers(scanId: string, drivers: SaveScoreDriverInput[]): Promise<void>;
  getDriversByScanId(scanId: string): Promise<Record<string, unknown>[]>;
}
