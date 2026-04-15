import { eq } from 'drizzle-orm';
import { jobRadarSignals } from '../../../../db/schema.js';
import type {
  CreateRadarSignalInput,
  RadarSignalRepository,
} from '../../domain/repositories/radar-signal.repository.js';
import type { JobRadarDb } from '../../job-radar-database.types.js';

export class DrizzleRadarSignalRepository implements RadarSignalRepository {
  constructor(private readonly db: JobRadarDb) {}

  async bulkInsert(inputs: CreateRadarSignalInput[]): Promise<void> {
    if (inputs.length === 0) return;

    await this.db.insert(jobRadarSignals).values(
      inputs.map((input) => ({
        id: input.id,
        scanId: input.scanId,
        sourceId: input.sourceId ?? null,
        employerId: input.employerId ?? null,
        jobPostId: input.jobPostId ?? null,
        signalScope: input.signalScope,
        category: input.category,
        signalKey: input.signalKey,
        signalValueText: input.signalValueText ?? null,
        signalValueNumber:
          input.signalValueNumber !== undefined && input.signalValueNumber !== null
            ? String(input.signalValueNumber)
            : null,
        signalValueJson: input.signalValueJson ?? null,
        confidence: input.confidence as typeof jobRadarSignals.$inferInsert.confidence,
        sourceQualityTier: input.sourceQualityTier ?? null,
        sourceClusterId: input.sourceClusterId ?? null,
        isMissingData: input.isMissingData ?? false,
        isConflicted: input.isConflicted ?? false,
        conflictReason: input.conflictReason ?? null,
      })),
    );
  }

  async findByScanId(scanId: string): Promise<Record<string, unknown>[]> {
    const rows = await this.db.select().from(jobRadarSignals).where(eq(jobRadarSignals.scanId, scanId));
    return rows.map((r) => ({ ...r }));
  }

  async markConflicted(signalId: string, reason: string): Promise<void> {
    await this.db
      .update(jobRadarSignals)
      .set({
        isConflicted: true,
        conflictReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(jobRadarSignals.id, signalId));
  }
}
