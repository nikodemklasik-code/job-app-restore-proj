export type FindingVisibility = 'visible' | 'pending_review' | 'suppressed';

export type CreateFindingInput = {
  id: string;
  scanId: string;
  findingType: 'positive' | 'warning' | 'red_flag' | 'fit_match' | 'fit_mismatch' | 'benchmark';
  code?: string | null;
  title: string;
  summary: string;
  severity: 'low' | 'medium' | 'high' | 'severe';
  confidence: 'low' | 'medium' | 'high';
  sourceId?: string | null;
  sourceRef?: string | null;
  visibility?: FindingVisibility;
  reviewReason?: string | null;
};

export type UpdateFindingVisibilityInput = {
  findingId: string;
  visibility: FindingVisibility;
  reviewReason?: string | null;
  reviewedBy?: string | null;
};

export interface RadarFindingRepository {
  bulkInsert(findings: CreateFindingInput[]): Promise<void>;
  replaceByScanId(scanId: string, findings: CreateFindingInput[]): Promise<void>;
  getByScanId(scanId: string): Promise<Record<string, unknown>[]>;
  updateVisibility(input: UpdateFindingVisibilityInput): Promise<void>;
}
