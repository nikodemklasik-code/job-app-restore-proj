// @ts-nocheck
import { eq } from 'drizzle-orm';
import { jobRadarFindings } from '../../../../db/schema.js';
import type {
  CreateFindingInput,
  RadarFindingRepository,
  UpdateFindingVisibilityInput,
} from '../../domain/repositories/radar-finding.repository.js';
import type { JobRadarDb } from '../../job-radar-database.types.js';

export class DrizzleRadarFindingRepository implements RadarFindingRepository {
  constructor(private readonly db: JobRadarDb) {}

  async bulkInsert(findings: CreateFindingInput[]): Promise<void> {
    if (findings.length === 0) return;

    await this.db.insert(jobRadarFindings).values(
      findings.map((f) => ({
        id: f.id,
        scanId: f.scanId,
        findingType: f.findingType as typeof jobRadarFindings.$inferInsert.findingType,
        code: f.code ?? null,
        title: f.title,
        summary: f.summary,
        severity: f.severity,
        confidence: f.confidence as typeof jobRadarFindings.$inferInsert.confidence,
        sourceId: f.sourceId ?? null,
        sourceRef: f.sourceRef ?? null,
        visibility: (f.visibility ?? 'visible') as typeof jobRadarFindings.$inferInsert.visibility,
        reviewReason: f.reviewReason ?? null,
        reviewedBy: null,
        reviewedAt: null,
      })),
    );
  }

  async replaceByScanId(scanId: string, findings: CreateFindingInput[]): Promise<void> {
    await this.db.delete(jobRadarFindings).where(eq(jobRadarFindings.scanId, scanId));
    await this.bulkInsert(findings);
  }

  async getByScanId(scanId: string): Promise<Record<string, unknown>[]> {
    const rows = await this.db.select().from(jobRadarFindings).where(eq(jobRadarFindings.scanId, scanId));
    return rows.map((r) => ({ ...r }));
  }

  async updateVisibility(input: UpdateFindingVisibilityInput): Promise<void> {
    await this.db
      .update(jobRadarFindings)
      .set({
        visibility: input.visibility as typeof jobRadarFindings.$inferInsert.visibility,
        reviewReason: input.reviewReason ?? null,
        reviewedBy: input.reviewedBy ?? null,
        reviewedAt: new Date(),
      })
      .where(eq(jobRadarFindings.id, input.findingId));
  }
}
