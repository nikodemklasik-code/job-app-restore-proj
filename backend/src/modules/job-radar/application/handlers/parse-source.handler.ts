import { randomUUID } from 'node:crypto';
import type { RadarSourceRepository } from '../../domain/repositories/radar-source.repository.js';
import type { RadarSignalRepository } from '../../domain/repositories/radar-signal.repository.js';
import type { RadarOutboxRepository } from '../../domain/repositories/radar-outbox.repository.js';
import type { JobRadarParser } from '../../infrastructure/parsers/job-radar.parser.js';
import { JOB_RADAR_EVENTS } from '../../constants/event-names.js';

export type ParseSourceJob = {
  scanId: string;
  sourceId: string;
};

export class ParseSourceHandler {
  constructor(
    private readonly sourceRepository: RadarSourceRepository,
    private readonly signalRepository: RadarSignalRepository,
    private readonly outboxRepository: RadarOutboxRepository,
    private readonly parsers: JobRadarParser[],
  ) {}

  async execute(job: ParseSourceJob): Promise<void> {
    const source = await this.sourceRepository.findById(job.sourceId);
    if (!source) throw new Error('SOURCE_NOT_FOUND');

    const sourceType = String(source.sourceType ?? '');
    const rawContent = typeof source.rawContent === 'string' ? source.rawContent : null;
    const metadata = (source.metadata as Record<string, unknown> | undefined) ?? {};

    const parser = this.parsers.find((p) => p.canParse({ sourceType, rawContent }));

    if (!parser) {
      await this.sourceRepository.markParseFailed(String(source.id), 'No parser available');
      return;
    }

    try {
      const parsed = await parser.parse({
        sourceType,
        rawContent,
        metadata,
      });

      await this.signalRepository.bulkInsert(
        parsed.signals.map((signal) => ({
          id: randomUUID(),
          scanId: job.scanId,
          sourceId: String(source.id),
          employerId: (source.employerId as string | null) ?? null,
          jobPostId: (source.jobPostId as string | null) ?? null,
          signalScope: signal.signalScope,
          category: signal.category,
          signalKey: signal.signalKey,
          signalValueText: signal.signalValueText ?? null,
          signalValueNumber: signal.signalValueNumber ?? null,
          signalValueJson: signal.signalValueJson ?? null,
          confidence: signal.confidence,
          sourceQualityTier: (source.sourceQualityTier as 1 | 2 | 3 | null) ?? null,
          sourceClusterId: (source.sourceClusterId as string | null) ?? null,
          isMissingData: signal.isMissingData ?? false,
          isConflicted: false,
          conflictReason: null,
        })),
      );

      await this.sourceRepository.markParsed(String(source.id));

      if (parsed.containsOfferFields) {
        await this.outboxRepository.enqueue({
          id: randomUUID(),
          aggregateType: 'job_radar_scan',
          aggregateId: job.scanId,
          eventName: JOB_RADAR_EVENTS.OFFER_PARSED,
          eventVersion: '1.0',
          occurredAt: new Date(),
          payload: {
            scan_id: job.scanId,
            parser_version: 'p3.2',
            job: parsed.extractedFields,
            confidence: parsed.fieldConfidence,
          },
        });
      }
    } catch (error) {
      await this.sourceRepository.markParseFailed(
        String(source.id),
        error instanceof Error ? error.message : 'Unknown parse error',
      );
    }
  }
}
