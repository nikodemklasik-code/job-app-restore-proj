import { randomUUID } from 'node:crypto';
import { SCAN_STATUS } from '../../domain/types/scan-status.js';
import type { ScanStatus } from '../../domain/types/scan-status.js';
import type { RadarScanRepository } from '../../domain/repositories/radar-scan.repository.js';
import type { RadarSourceRepository } from '../../domain/repositories/radar-source.repository.js';
import type { RadarOutboxRepository } from '../../domain/repositories/radar-outbox.repository.js';
import { JOB_RADAR_EVENTS } from '../../constants/event-names.js';
import { ScoringEngineService } from './scoring-engine.service.js';
import { ReportComposerService } from './report-composer.service.js';
import { DeduplicateSourcesHandler } from '../handlers/deduplicate-sources.handler.js';
import { ResolveConflictsHandler } from '../handlers/resolve-conflicts.handler.js';
import { ApplyOverridesHandler } from '../handlers/apply-overrides.handler.js';
import type { ComputeBenchmarkHandler } from '../handlers/compute-benchmark.handler.js';

function getSourceUrlFromPayload(inputPayload: Record<string, unknown>): string | null {
  const direct = inputPayload.sourceUrl ?? inputPayload.source_url;
  if (typeof direct === 'string' && direct.trim().length > 0) return direct.trim();
  return null;
}

function getEmployerNameFromPayload(inputPayload: Record<string, unknown>): string | null {
  const raw = inputPayload.employerName ?? inputPayload.employer_name;
  if (typeof raw === 'string' && raw.trim().length > 0) return raw.trim();
  return null;
}

export class ScanOrchestratorService {
  constructor(
    private readonly scanRepository: RadarScanRepository,
    private readonly sourceRepository: RadarSourceRepository,
    private readonly outboxRepository: RadarOutboxRepository,
    private readonly scoringEngine: ScoringEngineService,
    private readonly reportComposer: ReportComposerService,
    private readonly deduplicateSourcesHandler: DeduplicateSourcesHandler,
    private readonly resolveConflictsHandler: ResolveConflictsHandler,
    private readonly applyOverridesHandler: ApplyOverridesHandler,
    private readonly computeBenchmarkHandler: ComputeBenchmarkHandler,
  ) {}

  async handleScanRequested(scanId: string): Promise<void> {
    const scan = await this.scanRepository.findById(scanId);
    if (!scan) throw new Error('SCAN_NOT_FOUND');

    scan.progress.employer_scan = 'processing';
    await this.scanRepository.updateProgress(scanId, scan.progress);

    const sourceUrl = getSourceUrlFromPayload(scan.inputPayload);

    if (!sourceUrl) {
      scan.progress.employer_scan = 'failed';
      scan.progress.offer_parse = 'failed';
      await this.scanRepository.updateProgress(scanId, scan.progress);

      await this.reportComposer.compose(scanId, SCAN_STATUS.PARTIAL_REPORT);
      await this.scanRepository.updateStatus(scanId, SCAN_STATUS.PARTIAL_REPORT);
      await this.scanRepository.markCompleted(scanId, new Date());
      return;
    }

    scan.progress.employer_scan = 'done';
    await this.scanRepository.updateProgress(scanId, scan.progress);

    const employerName = getEmployerNameFromPayload(scan.inputPayload);

    await this.outboxRepository.enqueue({
      id: randomUUID(),
      aggregateType: 'job_radar_scan',
      aggregateId: scanId,
      eventName: JOB_RADAR_EVENTS.SOURCE_FETCH_REQUESTED,
      eventVersion: '1.0',
      occurredAt: new Date(),
      payload: {
        scan_id: scanId,
        source_type: 'official_website',
        source_url: sourceUrl,
        employer_name: employerName,
        timeout_ms: 8000,
        employer_id: scan.employerId,
        job_post_id: scan.jobPostId,
      },
    });

    if (employerName) {
      await this.outboxRepository.enqueue({
        id: randomUUID(),
        aggregateType: 'job_radar_scan',
        aggregateId: scanId,
        eventName: JOB_RADAR_EVENTS.SOURCE_FETCH_REQUESTED,
        eventVersion: '1.0',
        occurredAt: new Date(),
        payload: {
          scan_id: scanId,
          source_type: 'registry',
          source_url: sourceUrl,
          employer_name: employerName,
          timeout_ms: 5000,
          employer_id: scan.employerId,
          job_post_id: scan.jobPostId,
        },
      });
    }
  }

  /**
   * After a fetch attempt: enqueue parse jobs for pending sources, or finalize if nothing to parse
   * (e.g. fetch failed, blocked-only, or empty).
   */
  /**
   * @param currentSourceFetchOutboxEventId - Outbox row for this fetch; excluded until `markPublished` runs
   *   after the worker returns (see `processJobRadarOutbox`).
   */
  async afterSourceFetch(scanId: string, currentSourceFetchOutboxEventId?: string): Promise<void> {
    const pending = await this.sourceRepository.findPendingParseSources(scanId);
    if (pending.length > 0) {
      for (const source of pending) {
        await this.outboxRepository.enqueue({
          id: randomUUID(),
          aggregateType: 'job_radar_scan',
          aggregateId: scanId,
          eventName: JOB_RADAR_EVENTS.PARSE_SOURCE_REQUESTED,
          eventVersion: '1.0',
          occurredAt: new Date(),
          payload: {
            scan_id: scanId,
            source_id: String(source.id),
          },
        });
      }
      return;
    }

    if (
      await this.outboxRepository.hasUnpublishedSourceFetchRequested(
        scanId,
        currentSourceFetchOutboxEventId,
      )
    ) {
      return;
    }

    await this.finalizeBasic(scanId);
  }

  /** Call after each parse completes; finalizes only when no sources remain in `pending` parse state. */
  async maybeFinalizeAfterParse(scanId: string): Promise<void> {
    const stillPending = await this.sourceRepository.findPendingParseSources(scanId);
    if (stillPending.length > 0) return;

    if (await this.outboxRepository.hasUnpublishedSourceFetchRequested(scanId)) {
      return;
    }

    await this.finalizeBasic(scanId);
  }

  async finalizeBasic(scanId: string): Promise<void> {
    const scan = await this.scanRepository.findById(scanId);
    if (!scan) throw new Error('SCAN_NOT_FOUND');

    const sources = await this.sourceRepository.findByScanId(scanId);

    let status: ScanStatus = SCAN_STATUS.SCAN_FAILED;
    if (sources.some((s) => s.parseStatus === 'parsed')) {
      status = SCAN_STATUS.PARTIAL_REPORT;
    } else if (sources.some((s) => s.parseStatus === 'blocked')) {
      status = SCAN_STATUS.SOURCES_BLOCKED;
    }

    scan.progress.offer_parse = sources.some((s) => s.parseStatus === 'parsed') ? 'partial' : 'failed';
    await this.scanRepository.updateProgress(scanId, scan.progress);

    if (status !== SCAN_STATUS.SOURCES_BLOCKED && status !== SCAN_STATUS.SCAN_FAILED) {
      await this.deduplicateSourcesHandler.execute({ scanId });
      await this.resolveConflictsHandler.execute({ scanId });

      scan.progress.benchmark = 'processing';
      await this.scanRepository.updateProgress(scanId, scan.progress);

      await this.computeBenchmarkHandler.execute({ scanId });

      scan.progress.benchmark = 'partial';
      scan.progress.scoring = 'processing';
      await this.scanRepository.updateProgress(scanId, scan.progress);

      await this.scoringEngine.compute(scanId);
      await this.applyOverridesHandler.execute({ scanId });
    } else {
      scan.progress.benchmark = 'skipped';
    }

    scan.progress.report_compose = 'processing';
    await this.scanRepository.updateProgress(scanId, scan.progress);

    await this.reportComposer.compose(scanId, status);

    scan.progress.scoring = status === SCAN_STATUS.PARTIAL_REPORT ? 'partial' : 'failed';
    scan.progress.report_compose = 'done';

    await this.scanRepository.updateProgress(scanId, scan.progress);
    await this.scanRepository.updateStatus(scanId, status);
    await this.scanRepository.markCompleted(scanId, new Date());
  }

  async finalize(_scanId: string): Promise<void> {
    /* reserved */
  }
}
