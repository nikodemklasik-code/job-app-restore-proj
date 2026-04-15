import type { RadarScanEntity } from '../entities/radar-scan.entity.js';
import type { ScanStatus } from '../types/scan-status.js';

export interface RadarScanRepository {
  create(scan: RadarScanEntity): Promise<void>;
  findById(scanId: string): Promise<RadarScanEntity | null>;
  findByUserAndIdempotencyKey(userId: string, idempotencyKey: string): Promise<RadarScanEntity | null>;
  findFreshByFingerprint(entityFingerprint: string, maxAgeMs: number): Promise<{
    scanId: string;
    reportId: string;
    status: ScanStatus;
  } | null>;
  updateStatus(scanId: string, status: ScanStatus, failedReason?: string | null): Promise<void>;
  updateProgress(scanId: string, progress: RadarScanEntity['progress']): Promise<void>;
  markCompleted(scanId: string, completedAt: Date): Promise<void>;
  attachEmployer(scanId: string, employerId: string): Promise<void>;
}
