export type CollectorInput = {
  scanId: string;
  employerName?: string | null;
  sourceUrl?: string | null;
  timeoutMs: number;
};

export type CollectorResult =
  | {
      status: 'done';
      sourceUrl: string;
      normalizedUrl?: string;
      title?: string;
      rawContent: string;
      metadata?: Record<string, unknown>;
    }
  | {
      status: 'blocked';
      sourceUrl: string;
      blockReason: string;
      metadata?: Record<string, unknown>;
    }
  | {
      status: 'failed';
      sourceUrl: string;
      errorCode: string;
      errorMessage: string;
      metadata?: Record<string, unknown>;
    };

export interface JobRadarCollector {
  readonly sourceType: string;
  readonly sourceQualityTier: 1 | 2 | 3;

  canHandle(input: CollectorInput): boolean;
  collect(input: CollectorInput): Promise<CollectorResult>;
}
