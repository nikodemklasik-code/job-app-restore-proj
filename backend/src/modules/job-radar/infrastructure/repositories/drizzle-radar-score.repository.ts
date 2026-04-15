import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { jobRadarScoreDrivers, jobRadarScores } from '../../../../db/schema.js';
import type {
  RadarScoreRepository,
  SaveRadarScoresInput,
  SaveScoreDriverInput,
} from '../../domain/repositories/radar-score.repository.js';
import type { JobRadarDb } from '../../job-radar-database.types.js';

export class DrizzleRadarScoreRepository implements RadarScoreRepository {
  constructor(private readonly db: JobRadarDb) {}

  async saveScores(input: SaveRadarScoresInput): Promise<void> {
    const existing = await this.getByScanId(input.scanId);

    if (existing) {
      await this.db
        .update(jobRadarScores)
        .set({
          employerScore: input.employerScore,
          offerScore: input.offerScore,
          marketPayScore: input.marketPayScore,
          benefitsScore: input.benefitsScore,
          cultureFitScore: input.cultureFitScore,
          riskScore: input.riskScore,
          recommendation: input.recommendation as typeof jobRadarScores.$inferInsert.recommendation,
          confidenceOverall: input.confidenceOverall as typeof jobRadarScores.$inferInsert.confidenceOverall,
          updatedAt: new Date(),
        })
        .where(eq(jobRadarScores.scanId, input.scanId));

      return;
    }

    await this.db.insert(jobRadarScores).values({
      id: randomUUID(),
      scanId: input.scanId,
      employerScore: input.employerScore,
      offerScore: input.offerScore,
      marketPayScore: input.marketPayScore,
      benefitsScore: input.benefitsScore,
      cultureFitScore: input.cultureFitScore,
      riskScore: input.riskScore,
      recommendation: input.recommendation as typeof jobRadarScores.$inferInsert.recommendation,
      confidenceOverall: input.confidenceOverall as typeof jobRadarScores.$inferInsert.confidenceOverall,
    });
  }

  async getByScanId(scanId: string): Promise<Record<string, unknown> | null> {
    const rows = await this.db
      .select()
      .from(jobRadarScores)
      .where(eq(jobRadarScores.scanId, scanId))
      .limit(1);

    return rows[0] ? { ...rows[0] } : null;
  }

  async replaceDrivers(scanId: string, drivers: SaveScoreDriverInput[]): Promise<void> {
    await this.db.delete(jobRadarScoreDrivers).where(eq(jobRadarScoreDrivers.scanId, scanId));

    if (drivers.length === 0) return;

    await this.db.insert(jobRadarScoreDrivers).values(
      drivers.map((driver) => ({
        id: driver.id,
        scanId: driver.scanId,
        scoreName: driver.scoreName,
        driverType: driver.driverType as typeof jobRadarScoreDrivers.$inferInsert.driverType,
        label: driver.label,
        impact: driver.impact,
        confidence: driver.confidence as typeof jobRadarScoreDrivers.$inferInsert.confidence,
        sourceId: driver.sourceId ?? null,
        sourceRef: driver.sourceRef ?? null,
      })),
    );
  }

  async getDriversByScanId(scanId: string): Promise<Record<string, unknown>[]> {
    const rows = await this.db
      .select()
      .from(jobRadarScoreDrivers)
      .where(eq(jobRadarScoreDrivers.scanId, scanId));

    return rows.map((r) => ({ ...r }));
  }
}
