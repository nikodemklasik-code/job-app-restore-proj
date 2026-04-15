import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StartScanHandler } from '../../application/handlers/start-scan.handler.js';
import { InputNormalizerService } from '../../infrastructure/services/input-normalizer.service.js';
import { FingerprintService } from '../../infrastructure/services/fingerprint.service.js';
import { QuotaService } from '../../application/services/quota.service.js';
import { IdempotencyService } from '../../application/services/idempotency.service.js';

const txMocks = vi.hoisted(() => ({
  scanCreate: vi.fn().mockResolvedValue(undefined),
  reportSkeleton: vi.fn().mockResolvedValue(undefined),
  outboxEnqueue: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../infrastructure/repositories/drizzle-radar-scan.repository.js', () => ({
  DrizzleRadarScanRepository: class {
    create = txMocks.scanCreate;
  },
}));

vi.mock('../../infrastructure/repositories/drizzle-radar-report.repository.js', () => ({
  DrizzleRadarReportRepository: class {
    createSkeleton = txMocks.reportSkeleton;
  },
}));

vi.mock('../../infrastructure/repositories/drizzle-radar-outbox.repository.js', () => ({
  DrizzleRadarOutboxRepository: class {
    enqueue = txMocks.outboxEnqueue;
  },
}));

describe('StartScanHandler', () => {
  let scanRepository: {
    create: ReturnType<typeof vi.fn>;
    findByUserAndIdempotencyKey: ReturnType<typeof vi.fn>;
    findFreshByFingerprint: ReturnType<typeof vi.fn>;
  };
  let outboxRepository: { enqueue: ReturnType<typeof vi.fn> };
  let transactionManager: { runInTransaction: ReturnType<typeof vi.fn> };
  let handler: StartScanHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    txMocks.scanCreate.mockClear();
    txMocks.reportSkeleton.mockClear();
    txMocks.outboxEnqueue.mockClear();

    scanRepository = {
      create: vi.fn(),
      findByUserAndIdempotencyKey: vi.fn().mockResolvedValue(null),
      findFreshByFingerprint: vi.fn().mockResolvedValue(null),
    };

    outboxRepository = {
      enqueue: vi.fn().mockResolvedValue(undefined),
    };

    transactionManager = {
      runInTransaction: vi.fn(async (fn: (db: unknown) => Promise<void>) => {
        await fn({});
      }),
    };

    handler = new StartScanHandler(
      scanRepository as never,
      outboxRepository as never,
      new InputNormalizerService(),
      new FingerprintService(),
      new QuotaService(),
      new IdempotencyService(),
      transactionManager as never,
    );
  });

  it('creates scan, report skeleton and outbox event inside a transaction', async () => {
    const result = await handler.execute({
      userId: 'user-1',
      idempotencyKey: 'idem-1',
      payload: {
        scanTrigger: 'manual_search',
        employerName: 'Example Ltd',
        sourceUrl: 'https://example.com/jobs/1',
        forceRescan: false,
      },
    });

    expect(result.status).toBe('processing');
    expect(result.idempotencyReused).toBe(false);
    expect(transactionManager.runInTransaction).toHaveBeenCalledTimes(1);
    expect(txMocks.scanCreate).toHaveBeenCalledTimes(1);
    expect(txMocks.reportSkeleton).toHaveBeenCalledTimes(1);
    expect(txMocks.outboxEnqueue).toHaveBeenCalledTimes(1);
  });

  it('reuses scan for same idempotency key and same payload', async () => {
    scanRepository.findByUserAndIdempotencyKey.mockResolvedValue({
      id: 'scan-existing',
      status: 'processing',
      inputPayload: {
        scanTrigger: 'manual_search',
        employerName: 'Example Ltd',
        sourceUrl: 'https://example.com/jobs/1',
        forceRescan: false,
      },
    });

    const result = await handler.execute({
      userId: 'user-1',
      idempotencyKey: 'idem-1',
      payload: {
        scanTrigger: 'manual_search',
        employerName: 'Example Ltd',
        sourceUrl: 'https://example.com/jobs/1',
        forceRescan: false,
      },
    });

    expect(result.scanId).toBe('scan-existing');
    expect(result.idempotencyReused).toBe(true);
    expect(transactionManager.runInTransaction).not.toHaveBeenCalled();
  });

  it('throws when idempotency key reused with different payload', async () => {
    scanRepository.findByUserAndIdempotencyKey.mockResolvedValue({
      id: 'scan-existing',
      status: 'processing',
      inputPayload: {
        scanTrigger: 'manual_search',
        employerName: 'Other Ltd',
        sourceUrl: 'https://example.com/jobs/1',
        forceRescan: false,
      },
    });

    await expect(
      handler.execute({
        userId: 'user-1',
        idempotencyKey: 'idem-1',
        payload: {
          scanTrigger: 'manual_search',
          employerName: 'Example Ltd',
          sourceUrl: 'https://example.com/jobs/1',
          forceRescan: false,
        },
      }),
    ).rejects.toThrow('IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD');
  });
});
