import { randomUUID } from 'node:crypto';
import { RadarScanEntity } from '../../domain/entities/radar-scan.entity.js';
import { RadarReportEntity } from '../../domain/entities/radar-report.entity.js';
import { SCAN_STATUS } from '../../domain/types/scan-status.js';
import type { RadarScanRepository } from '../../domain/repositories/radar-scan.repository.js';
import type { RadarOutboxRepository } from '../../domain/repositories/radar-outbox.repository.js';
import type { StartScanCommand } from '../commands/start-scan.command.js';
import { InputNormalizerService } from '../../infrastructure/services/input-normalizer.service.js';
import { FingerprintService } from '../../infrastructure/services/fingerprint.service.js';
import { QuotaService } from '../services/quota.service.js';
import { IdempotencyService } from '../services/idempotency.service.js';
import { JOB_RADAR_VERSIONS } from '../../constants/job-radar-versions.js';
import { JOB_RADAR_EVENTS } from '../../constants/event-names.js';
import type { TransactionManager } from '../../../../shared/db/transaction-manager.js';
import type { JobRadarDb } from '../../job-radar-database.types.js';
import { DrizzleRadarScanRepository } from '../../infrastructure/repositories/drizzle-radar-scan.repository.js';
import { DrizzleRadarReportRepository } from '../../infrastructure/repositories/drizzle-radar-report.repository.js';
import { DrizzleRadarOutboxRepository } from '../../infrastructure/repositories/drizzle-radar-outbox.repository.js';
import { deriveStableEmployerIdFromScanPayload } from '../../infrastructure/services/stable-employer-id.service.js';

function cacheTtlMs(): number {
  const hours = Number.parseInt(process.env.JOB_RADAR_CACHE_TTL_HOURS ?? '72', 10);
  return (Number.isFinite(hours) && hours > 0 ? hours : 72) * 60 * 60 * 1000;
}

export class StartScanHandler {
  constructor(
    private readonly scanRepository: RadarScanRepository,
    private readonly outboxRepository: RadarOutboxRepository,
    private readonly inputNormalizer: InputNormalizerService,
    private readonly fingerprintService: FingerprintService,
    private readonly quotaService: QuotaService,
    private readonly idempotencyService: IdempotencyService,
    private readonly transactionManager: TransactionManager,
  ) {}

  async execute(command: StartScanCommand): Promise<{
    scanId: string;
    reportId?: string;
    status: string;
    quotaRemaining: number;
    idempotencyReused: boolean;
  }> {
    const quotaRemaining = await this.quotaService.ensureUserCanScan(command.userId);

    const payloadRecord = command.payload as unknown as Record<string, unknown>;
    const normalized = this.inputNormalizer.normalize(payloadRecord);
    const entityFingerprint = this.fingerprintService.computeEntityFingerprint(normalized);
    const sourceFingerprint = this.fingerprintService.computeSourceFingerprint(normalized);

    if (command.idempotencyKey) {
      const existing = await this.scanRepository.findByUserAndIdempotencyKey(
        command.userId,
        command.idempotencyKey,
      );

      if (existing) {
        // Key-order–insensitive semantic match (stored row vs request); not JSON.stringify.
        if (this.idempotencyService.payloadMatches(existing.inputPayload, payloadRecord)) {
          return {
            scanId: existing.id,
            status: existing.status,
            quotaRemaining,
            idempotencyReused: true,
          };
        }
        throw new Error('IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD');
      }
    }

    const cached = await this.scanRepository.findFreshByFingerprint(entityFingerprint, cacheTtlMs());
    if (cached && !command.payload.forceRescan) {
      await this.outboxRepository.enqueue({
        id: randomUUID(),
        aggregateType: 'job_radar_scan',
        aggregateId: cached.scanId,
        eventName: JOB_RADAR_EVENTS.SCAN_REQUESTED_CACHE_HIT,
        eventVersion: '1.0',
        occurredAt: new Date(),
        payload: {
          user_id: command.userId,
          scan_id: cached.scanId,
          report_id: cached.reportId,
          entity_fingerprint: entityFingerprint,
        },
      });

      return {
        scanId: cached.scanId,
        reportId: cached.reportId,
        status: cached.status,
        quotaRemaining,
        idempotencyReused: false,
      };
    }

    const now = new Date();
    const scanId = randomUUID();
    const reportId = randomUUID();

    const stableEmployerId = deriveStableEmployerIdFromScanPayload(command.payload);

    const scan = new RadarScanEntity(
      scanId,
      command.userId,
      command.payload.scanTrigger,
      SCAN_STATUS.PROCESSING,
      entityFingerprint,
      sourceFingerprint,
      payloadRecord,
      RadarScanEntity.defaultProgress(),
      command.idempotencyKey ?? null,
      stableEmployerId,
      command.payload.jobPostId ?? null,
      now,
      now,
      null,
      null,
    );

    const report = new RadarReportEntity(
      reportId,
      scanId,
      SCAN_STATUS.PROCESSING,
      JOB_RADAR_VERSIONS.scoring,
      JOB_RADAR_VERSIONS.parser,
      JOB_RADAR_VERSIONS.normalization,
      JOB_RADAR_VERSIONS.resolver,
      now,
    );

    await this.transactionManager.runInTransaction(async (tx) => {
      const session = tx as JobRadarDb;
      const scanRepo = new DrizzleRadarScanRepository(session);
      const reportRepo = new DrizzleRadarReportRepository(session);
      const outboxRepo = new DrizzleRadarOutboxRepository(session);

      await scanRepo.create(scan);
      await reportRepo.createSkeleton(report);

      await outboxRepo.enqueue({
        id: randomUUID(),
        aggregateType: 'job_radar_scan',
        aggregateId: scanId,
        eventName: JOB_RADAR_EVENTS.SCAN_REQUESTED,
        eventVersion: '1.0',
        occurredAt: now,
        payload: {
          scan_id: scanId,
          user_id: command.userId,
          scan_trigger: command.payload.scanTrigger,
          idempotency_key: command.idempotencyKey ?? null,
          entity_fingerprint: entityFingerprint,
          source_fingerprint: sourceFingerprint,
          input: command.payload,
        },
      });
    });

    return {
      scanId,
      reportId,
      status: SCAN_STATUS.PROCESSING,
      quotaRemaining,
      idempotencyReused: false,
    };
  }
}
