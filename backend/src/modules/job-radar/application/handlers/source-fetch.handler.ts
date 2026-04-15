import { createHash, randomUUID } from 'node:crypto';
import type { RadarSourceRepository } from '../../domain/repositories/radar-source.repository.js';
import type { RadarOutboxRepository } from '../../domain/repositories/radar-outbox.repository.js';
import type { JobRadarCollector } from '../../infrastructure/collectors/job-radar.collector.js';
import { PiiSanitizerService } from '../../infrastructure/services/pii-sanitizer.service.js';
import { JOB_RADAR_EVENTS } from '../../constants/event-names.js';

export type SourceFetchJob = {
  scanId: string;
  employerId?: string | null;
  jobPostId?: string | null;
  employerName?: string | null;
  sourceType: string;
  sourceUrl: string;
  timeoutMs: number;
};

export class SourceFetchHandler {
  constructor(
    private readonly sourceRepository: RadarSourceRepository,
    private readonly outboxRepository: RadarOutboxRepository,
    private readonly collectors: JobRadarCollector[],
    private readonly piiSanitizer: PiiSanitizerService,
  ) {}

  async execute(job: SourceFetchJob): Promise<void> {
    const collector = this.collectors.find((c) => c.sourceType === job.sourceType);
    if (!collector) {
      throw new Error(`COLLECTOR_NOT_FOUND:${job.sourceType}`);
    }

    const now = new Date();

    await this.outboxRepository.enqueue({
      id: randomUUID(),
      aggregateType: 'job_radar_scan',
      aggregateId: job.scanId,
      eventName: JOB_RADAR_EVENTS.SOURCE_FETCH_STARTED,
      eventVersion: '1.0',
      occurredAt: now,
      payload: {
        scan_id: job.scanId,
        source_job: {
          source_type: job.sourceType,
          source_url: job.sourceUrl,
          timeout_ms: job.timeoutMs,
          retry_attempt: 0,
        },
      },
    });

    const result = await collector.collect({
      scanId: job.scanId,
      employerName: job.employerName ?? null,
      sourceUrl: job.sourceUrl,
      timeoutMs: job.timeoutMs,
    });

    if (result.status === 'blocked') {
      const sourceId = randomUUID();

      await this.sourceRepository.create({
        id: sourceId,
        scanId: job.scanId,
        employerId: job.employerId ?? null,
        jobPostId: job.jobPostId ?? null,
        sourceType: job.sourceType,
        sourceQualityTier: collector.sourceQualityTier,
        sourceUrl: result.sourceUrl,
        collectedAt: now,
        parseStatus: 'blocked',
        blockReason: result.blockReason,
        metadata: result.metadata ?? {},
      });

      return;
    }

    if (result.status === 'failed') {
      await this.outboxRepository.enqueue({
        id: randomUUID(),
        aggregateType: 'job_radar_scan',
        aggregateId: job.scanId,
        eventName: JOB_RADAR_EVENTS.SOURCE_FETCH_FAILED,
        eventVersion: '1.0',
        occurredAt: new Date(),
        payload: {
          scan_id: job.scanId,
          source: {
            source_type: job.sourceType,
            source_url: result.sourceUrl,
          },
          error: {
            code: result.errorCode,
            message: result.errorMessage,
          },
          retry_attempt: 0,
          retry_scheduled: false,
        },
      });

      return;
    }

    const sanitized = this.piiSanitizer.sanitize(result.rawContent);
    const contentHash = `sha256:${createHash('sha256').update(sanitized).digest('hex')}`;
    const sourceId = randomUUID();

    await this.sourceRepository.create({
      id: sourceId,
      scanId: job.scanId,
      employerId: job.employerId ?? null,
      jobPostId: job.jobPostId ?? null,
      sourceType: job.sourceType,
      sourceQualityTier: collector.sourceQualityTier,
      sourceUrl: result.sourceUrl,
      normalizedUrl: result.normalizedUrl ?? null,
      canonicalUrl: result.normalizedUrl ?? result.sourceUrl,
      title: result.title ?? null,
      contentHash,
      collectedAt: now,
      rawContent: sanitized,
      rawContentExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      parseStatus: 'pending',
      metadata: result.metadata ?? {},
    });

    await this.outboxRepository.enqueue({
      id: randomUUID(),
      aggregateType: 'job_radar_scan',
      aggregateId: job.scanId,
      eventName: JOB_RADAR_EVENTS.SOURCE_FETCH_COMPLETED,
      eventVersion: '1.0',
      occurredAt: new Date(),
      payload: {
        scan_id: job.scanId,
        source: {
          source_id: sourceId,
          source_type: job.sourceType,
          source_quality_tier: collector.sourceQualityTier,
          source_url: result.sourceUrl,
          normalized_url: result.normalizedUrl ?? null,
          title: result.title ?? null,
          content_hash: contentHash,
        },
      },
    });
  }
}
