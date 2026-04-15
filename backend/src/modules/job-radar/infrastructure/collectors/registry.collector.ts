import type { CollectorInput, CollectorResult, JobRadarCollector } from './job-radar.collector.js';

export type RegistryLookupClient = {
  searchCompany(input: {
    employerName?: string | null;
    sourceUrl?: string | null;
    timeoutMs: number;
  }): Promise<{
    status: 'done' | 'blocked' | 'failed';
    finalUrl?: string;
    title?: string;
    rawContent?: string;
    metadata?: Record<string, unknown>;
    errorCode?: string;
    errorMessage?: string;
    blockReason?: string;
  }>;
};

export class RegistryCollector implements JobRadarCollector {
  readonly sourceType = 'registry';
  readonly sourceQualityTier = 1 as const;

  constructor(private readonly registryClient: RegistryLookupClient) {}

  canHandle(input: CollectorInput): boolean {
    return Boolean(input.employerName || input.sourceUrl);
  }

  async collect(input: CollectorInput): Promise<CollectorResult> {
    const result = await this.registryClient.searchCompany({
      employerName: input.employerName ?? null,
      sourceUrl: input.sourceUrl ?? null,
      timeoutMs: input.timeoutMs,
    });

    if (result.status === 'blocked') {
      return {
        status: 'blocked',
        sourceUrl: result.finalUrl ?? input.sourceUrl ?? '',
        blockReason: result.blockReason ?? 'Registry access blocked',
        metadata: result.metadata,
      };
    }

    if (result.status === 'failed') {
      return {
        status: 'failed',
        sourceUrl: result.finalUrl ?? input.sourceUrl ?? '',
        errorCode: result.errorCode ?? 'REGISTRY_LOOKUP_FAILED',
        errorMessage: result.errorMessage ?? 'Registry lookup failed',
        metadata: result.metadata,
      };
    }

    return {
      status: 'done',
      sourceUrl: result.finalUrl ?? input.sourceUrl ?? '',
      normalizedUrl: result.finalUrl,
      title: result.title,
      rawContent: result.rawContent ?? '',
      metadata: result.metadata ?? {},
    };
  }
}
