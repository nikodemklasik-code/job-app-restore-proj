import type { RadarScanEntity } from '../domain/entities/radar-scan.entity.js';

export class JobRadarHttpMapper {
  static toStartScanResponse(input: {
    scanId: string;
    reportId?: string;
    status: string;
    quotaRemaining?: number;
    idempotencyReused?: boolean;
  }) {
    return {
      scanId: input.scanId,
      reportId: input.reportId,
      status: input.status,
      quotaRemaining: input.quotaRemaining ?? 0,
      idempotencyReused: input.idempotencyReused ?? false,
    };
  }

  static toScanStatusResponse(scan: RadarScanEntity & { reportId?: string | null }) {
    return {
      scanId: scan.id,
      reportId: scan.reportId ?? null,
      status: scan.status,
      scanTrigger: scan.scanTrigger,
      fingerprint: scan.entityFingerprint,
      progress: scan.progress,
      startedAt: scan.startedAt.toISOString(),
      lastUpdatedAt: scan.lastUpdatedAt.toISOString(),
      failedReason: scan.failedReason ?? null,
    };
  }
}
