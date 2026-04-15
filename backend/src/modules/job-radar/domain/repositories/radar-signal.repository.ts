export type CreateRadarSignalInput = {
  id: string;
  scanId: string;
  sourceId?: string | null;
  employerId?: string | null;
  jobPostId?: string | null;
  signalScope: 'employer' | 'offer' | 'benchmark' | 'fit' | 'risk';
  category: string;
  signalKey: string;
  signalValueText?: string | null;
  signalValueNumber?: string | number | null;
  signalValueJson?: Record<string, unknown> | null;
  confidence: 'low' | 'medium' | 'high';
  sourceQualityTier?: 1 | 2 | 3 | null;
  sourceClusterId?: string | null;
  isMissingData?: boolean;
  isConflicted?: boolean;
  conflictReason?: string | null;
};

export interface RadarSignalRepository {
  bulkInsert(inputs: CreateRadarSignalInput[]): Promise<void>;
  findByScanId(scanId: string): Promise<Record<string, unknown>[]>;
  markConflicted(signalId: string, reason: string): Promise<void>;
}
