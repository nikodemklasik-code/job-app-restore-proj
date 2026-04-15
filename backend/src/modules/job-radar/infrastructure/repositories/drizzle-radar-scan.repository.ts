import { and, desc, eq, gte, ne } from 'drizzle-orm';
import { jobRadarReports, jobRadarScans } from '../../../../db/schema.js';
import type { RadarScanRepository } from '../../domain/repositories/radar-scan.repository.js';
import { RadarScanEntity } from '../../domain/entities/radar-scan.entity.js';
import type { ScanStatus } from '../../domain/types/scan-status.js';
import type { JobRadarDb } from '../../job-radar-database.types.js';

function mapRow(row: typeof jobRadarScans.$inferSelect): RadarScanEntity {
  return new RadarScanEntity(
    row.id,
    row.userId,
    row.scanTrigger as RadarScanEntity['scanTrigger'],
    row.status as ScanStatus,
    row.entityFingerprint,
    row.sourceFingerprint,
    row.inputPayload as Record<string, unknown>,
    row.progress as RadarScanEntity['progress'],
    row.idempotencyKey,
    row.employerId,
    row.jobPostId,
    row.startedAt,
    row.lastUpdatedAt,
    row.completedAt,
    row.failedReason,
  );
}

export class DrizzleRadarScanRepository implements RadarScanRepository {
  constructor(private readonly db: JobRadarDb) {}

  async create(scan: RadarScanEntity): Promise<void> {
    await this.db.insert(jobRadarScans).values({
      id: scan.id,
      userId: scan.userId,
      employerId: scan.employerId,
      jobPostId: scan.jobPostId,
      scanTrigger: scan.scanTrigger,
      status: scan.status,
      idempotencyKey: scan.idempotencyKey,
      entityFingerprint: scan.entityFingerprint,
      sourceFingerprint: scan.sourceFingerprint,
      inputPayload: scan.inputPayload,
      progress: scan.progress,
      startedAt: scan.startedAt,
      lastUpdatedAt: scan.lastUpdatedAt,
      completedAt: scan.completedAt,
      failedReason: scan.failedReason,
    });
  }

  async findById(scanId: string): Promise<RadarScanEntity | null> {
    const rows = await this.db.select().from(jobRadarScans).where(eq(jobRadarScans.id, scanId)).limit(1);
    const row = rows[0];
    if (!row) return null;
    return mapRow(row);
  }

  async findByUserAndIdempotencyKey(
    userId: string,
    idempotencyKey: string,
  ): Promise<RadarScanEntity | null> {
    const rows = await this.db
      .select()
      .from(jobRadarScans)
      .where(and(eq(jobRadarScans.userId, userId), eq(jobRadarScans.idempotencyKey, idempotencyKey)))
      .limit(1);

    const row = rows[0];
    if (!row) return null;
    return mapRow(row);
  }

  async findFreshByFingerprint(
    entityFingerprint: string,
    maxAgeMs: number,
  ): Promise<{ scanId: string; reportId: string; status: ScanStatus } | null> {
    const cutoff = new Date(Date.now() - maxAgeMs);
    const rows = await this.db
      .select({
        scanId: jobRadarScans.id,
        reportId: jobRadarReports.id,
        status: jobRadarReports.status,
      })
      .from(jobRadarScans)
      .innerJoin(jobRadarReports, eq(jobRadarReports.scanId, jobRadarScans.id))
      .where(
        and(
          eq(jobRadarScans.entityFingerprint, entityFingerprint),
          gte(jobRadarReports.lastScannedAt, cutoff),
          ne(jobRadarScans.status, 'scan_failed'),
        ),
      )
      .orderBy(desc(jobRadarReports.lastScannedAt))
      .limit(1);

    const row = rows[0];
    if (!row) return null;
    return {
      scanId: row.scanId,
      reportId: row.reportId,
      status: row.status as ScanStatus,
    };
  }

  async updateStatus(scanId: string, status: ScanStatus, failedReason?: string | null): Promise<void> {
    await this.db
      .update(jobRadarScans)
      .set({
        status,
        failedReason: failedReason ?? null,
        lastUpdatedAt: new Date(),
      })
      .where(eq(jobRadarScans.id, scanId));
  }

  async updateProgress(scanId: string, progress: RadarScanEntity['progress']): Promise<void> {
    await this.db
      .update(jobRadarScans)
      .set({
        progress,
        lastUpdatedAt: new Date(),
      })
      .where(eq(jobRadarScans.id, scanId));
  }

  async markCompleted(scanId: string, completedAt: Date): Promise<void> {
    await this.db
      .update(jobRadarScans)
      .set({
        completedAt,
        lastUpdatedAt: completedAt,
      })
      .where(eq(jobRadarScans.id, scanId));
  }

  async attachEmployer(scanId: string, employerId: string): Promise<void> {
    await this.db
      .update(jobRadarScans)
      .set({
        employerId,
        lastUpdatedAt: new Date(),
      })
      .where(eq(jobRadarScans.id, scanId));
  }
}
