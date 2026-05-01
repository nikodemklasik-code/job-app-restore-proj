// @ts-nocheck
import { and, eq, inArray, isNotNull, lte } from 'drizzle-orm';
import { jobRadarSources } from '../../../../db/schema.js';
import type {
  CreateRadarSourceInput,
  RadarSourceRepository,
} from '../../domain/repositories/radar-source.repository.js';
import type { JobRadarDb } from '../../job-radar-database.types.js';

export class DrizzleRadarSourceRepository implements RadarSourceRepository {
  constructor(private readonly db: JobRadarDb) {}

  async create(input: CreateRadarSourceInput): Promise<void> {
    await this.db.insert(jobRadarSources).values({
      id: input.id,
      scanId: input.scanId,
      employerId: input.employerId ?? null,
      jobPostId: input.jobPostId ?? null,
      sourceType: input.sourceType as typeof jobRadarSources.$inferInsert.sourceType,
      sourceQualityTier: input.sourceQualityTier,
      sourceUrl: input.sourceUrl,
      normalizedUrl: input.normalizedUrl ?? null,
      canonicalUrl: input.canonicalUrl ?? null,
      title: input.title ?? null,
      sourceClusterId: input.sourceClusterId ?? null,
      contentHash: input.contentHash ?? null,
      publishedAt: input.publishedAt ?? null,
      collectedAt: input.collectedAt,
      rawContent: input.rawContent ?? null,
      rawContentExpiresAt: input.rawContentExpiresAt ?? null,
      parseStatus: input.parseStatus as typeof jobRadarSources.$inferInsert.parseStatus,
      blockReason: input.blockReason ?? null,
      metadata: input.metadata,
    });
  }

  async findByScanId(scanId: string): Promise<Record<string, unknown>[]> {
    const rows = await this.db.select().from(jobRadarSources).where(eq(jobRadarSources.scanId, scanId));
    return rows.map((r) => ({ ...r }));
  }

  async findPendingParseSources(scanId: string): Promise<Record<string, unknown>[]> {
    const rows = await this.db
      .select()
      .from(jobRadarSources)
      .where(and(eq(jobRadarSources.scanId, scanId), eq(jobRadarSources.parseStatus, 'pending')));

    return rows.map((r) => ({ ...r }));
  }

  async findById(sourceId: string): Promise<Record<string, unknown> | null> {
    const rows = await this.db
      .select()
      .from(jobRadarSources)
      .where(eq(jobRadarSources.id, sourceId))
      .limit(1);

    return rows[0] ? { ...rows[0] } : null;
  }

  async markParsed(sourceId: string): Promise<void> {
    await this.db
      .update(jobRadarSources)
      .set({
        parseStatus: 'parsed',
        updatedAt: new Date(),
      })
      .where(eq(jobRadarSources.id, sourceId));
  }

  async markParseFailed(sourceId: string, reason: string): Promise<void> {
    await this.db
      .update(jobRadarSources)
      .set({
        parseStatus: 'failed',
        blockReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(jobRadarSources.id, sourceId));
  }

  async markBlocked(sourceId: string, reason: string): Promise<void> {
    await this.db
      .update(jobRadarSources)
      .set({
        parseStatus: 'blocked',
        blockReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(jobRadarSources.id, sourceId));
  }

  async markTemporarilyUnavailable(sourceId: string, reason: string): Promise<void> {
    await this.db
      .update(jobRadarSources)
      .set({
        parseStatus: 'failed',
        blockReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(jobRadarSources.id, sourceId));
  }

  async assignCluster(sourceIds: string[], clusterId: string): Promise<void> {
    if (sourceIds.length === 0) return;

    await this.db
      .update(jobRadarSources)
      .set({
        sourceClusterId: clusterId,
        updatedAt: new Date(),
      })
      .where(inArray(jobRadarSources.id, sourceIds));
  }

  async clearExpiredRawContent(limit = 500): Promise<number> {
    const rows = await this.db
      .select({ id: jobRadarSources.id })
      .from(jobRadarSources)
      .where(
        and(
          isNotNull(jobRadarSources.rawContent),
          isNotNull(jobRadarSources.rawContentExpiresAt),
          lte(jobRadarSources.rawContentExpiresAt, new Date()),
        ),
      )
      .limit(limit);

    if (rows.length === 0) return 0;

    await this.db
      .update(jobRadarSources)
      .set({
        rawContent: null,
        updatedAt: new Date(),
      })
      .where(inArray(jobRadarSources.id, rows.map((r) => r.id)));

    return rows.length;
  }
}
