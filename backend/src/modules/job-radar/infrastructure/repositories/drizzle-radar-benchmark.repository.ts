// @ts-nocheck
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { jobRadarBenchmarks } from '../../../../db/schema.js';
import type {
  RadarBenchmarkRepository,
  SaveBenchmarkInput,
} from '../../domain/repositories/radar-benchmark.repository.js';
import type { JobRadarDb } from '../../job-radar-database.types.js';

export class DrizzleRadarBenchmarkRepository implements RadarBenchmarkRepository {
  constructor(private readonly db: JobRadarDb) {}

  async save(input: SaveBenchmarkInput): Promise<void> {
    const existing = await this.getByScanId(input.scanId);

    if (existing) {
      await this.db
        .update(jobRadarBenchmarks)
        .set({
          roleFamily: input.roleFamily,
          seniority: input.seniority ?? null,
          location: input.location,
          country: input.country ?? null,
          currency: input.currency,
          benchmarkRegion: input.benchmarkRegion,
          benchmarkPeriod: input.benchmarkPeriod,
          sampleSize: input.sampleSize,
          sourceMix: input.sourceMix,
          normalizationVersion: input.normalizationVersion,
          salaryP25:
            input.salaryP25 !== undefined && input.salaryP25 !== null
              ? String(input.salaryP25)
              : null,
          salaryMedian:
            input.salaryMedian !== undefined && input.salaryMedian !== null
              ? String(input.salaryMedian)
              : null,
          salaryP75:
            input.salaryP75 !== undefined && input.salaryP75 !== null
              ? String(input.salaryP75)
              : null,
          confidence: input.confidence,
        })
        .where(eq(jobRadarBenchmarks.scanId, input.scanId));

      return;
    }

    await this.db.insert(jobRadarBenchmarks).values({
      id: input.id || randomUUID(),
      scanId: input.scanId,
      roleFamily: input.roleFamily,
      seniority: input.seniority ?? null,
      location: input.location,
      country: input.country ?? null,
      currency: input.currency,
      benchmarkRegion: input.benchmarkRegion,
      benchmarkPeriod: input.benchmarkPeriod,
      sampleSize: input.sampleSize,
      sourceMix: input.sourceMix,
      normalizationVersion: input.normalizationVersion,
      salaryP25:
        input.salaryP25 !== undefined && input.salaryP25 !== null
          ? String(input.salaryP25)
          : null,
      salaryMedian:
        input.salaryMedian !== undefined && input.salaryMedian !== null
          ? String(input.salaryMedian)
          : null,
      salaryP75:
        input.salaryP75 !== undefined && input.salaryP75 !== null
          ? String(input.salaryP75)
          : null,
      confidence: input.confidence,
    });
  }

  async getByScanId(scanId: string): Promise<Record<string, unknown> | null> {
    const rows = await this.db
      .select()
      .from(jobRadarBenchmarks)
      .where(eq(jobRadarBenchmarks.scanId, scanId))
      .limit(1);

    return rows[0] ? { ...rows[0] } : null;
  }
}
