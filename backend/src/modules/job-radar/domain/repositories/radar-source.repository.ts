export type CreateRadarSourceInput = {
  id: string;
  scanId: string;
  employerId?: string | null;
  jobPostId?: string | null;
  sourceType: string;
  sourceQualityTier: 1 | 2 | 3;
  sourceUrl: string;
  normalizedUrl?: string | null;
  canonicalUrl?: string | null;
  title?: string | null;
  sourceClusterId?: string | null;
  contentHash?: string | null;
  publishedAt?: Date | null;
  collectedAt: Date;
  rawContent?: string | null;
  rawContentExpiresAt?: Date | null;
  parseStatus: 'pending' | 'parsed' | 'failed' | 'blocked';
  blockReason?: string | null;
  metadata: Record<string, unknown>;
};

export interface RadarSourceRepository {
  create(input: CreateRadarSourceInput): Promise<void>;
  findByScanId(scanId: string): Promise<Record<string, unknown>[]>;
  findPendingParseSources(scanId: string): Promise<Record<string, unknown>[]>;
  findById(sourceId: string): Promise<Record<string, unknown> | null>;
  markParsed(sourceId: string): Promise<void>;
  markParseFailed(sourceId: string, reason: string): Promise<void>;
  markBlocked(sourceId: string, reason: string): Promise<void>;
  markTemporarilyUnavailable(sourceId: string, reason: string): Promise<void>;
  assignCluster(sourceIds: string[], clusterId: string): Promise<void>;
  clearExpiredRawContent(limit?: number): Promise<number>;
}
