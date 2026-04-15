import { and, asc, eq, isNull } from 'drizzle-orm';
import { jobRadarOutbox } from '../../../../db/schema.js';
import { JOB_RADAR_EVENTS } from '../../constants/event-names.js';
import type { OutboxEvent, RadarOutboxRepository } from '../../domain/repositories/radar-outbox.repository.js';
import type { JobRadarDb } from '../../job-radar-database.types.js';

function mapOutboxRow(row: typeof jobRadarOutbox.$inferSelect): OutboxEvent {
  return {
    id: row.id,
    aggregateType: row.aggregateType,
    aggregateId: row.aggregateId,
    eventName: row.eventName,
    eventVersion: row.eventVersion,
    payload: row.payload as Record<string, unknown>,
    occurredAt: row.occurredAt,
  };
}

export class DrizzleRadarOutboxRepository implements RadarOutboxRepository {
  constructor(private readonly db: JobRadarDb) {}

  async enqueue(event: OutboxEvent): Promise<void> {
    await this.db.insert(jobRadarOutbox).values({
      id: event.id,
      aggregateType: event.aggregateType,
      aggregateId: event.aggregateId,
      eventName: event.eventName,
      eventVersion: event.eventVersion,
      payload: event.payload,
      occurredAt: event.occurredAt,
    });
  }

  async fetchUnpublished(limit: number): Promise<OutboxEvent[]> {
    const rows = await this.db
      .select()
      .from(jobRadarOutbox)
      .where(isNull(jobRadarOutbox.publishedAt))
      .orderBy(asc(jobRadarOutbox.occurredAt))
      .limit(limit);

    return rows.map(mapOutboxRow);
  }

  async markPublished(eventId: string): Promise<void> {
    await this.db
      .update(jobRadarOutbox)
      .set({ publishedAt: new Date() })
      .where(eq(jobRadarOutbox.id, eventId));
  }

  async hasUnpublishedSourceFetchRequested(scanId: string): Promise<boolean> {
    const rows = await this.db
      .select({ id: jobRadarOutbox.id })
      .from(jobRadarOutbox)
      .where(
        and(
          eq(jobRadarOutbox.aggregateId, scanId),
          eq(jobRadarOutbox.eventName, JOB_RADAR_EVENTS.SOURCE_FETCH_REQUESTED),
          isNull(jobRadarOutbox.publishedAt),
        ),
      )
      .limit(1);

    return rows.length > 0;
  }

  async incrementDeliveryAttempt(eventId: string, error?: string): Promise<void> {
    const rows = await this.db
      .select()
      .from(jobRadarOutbox)
      .where(eq(jobRadarOutbox.id, eventId))
      .limit(1);

    const row = rows[0];
    if (!row) return;

    await this.db
      .update(jobRadarOutbox)
      .set({
        deliveryAttempts: row.deliveryAttempts + 1,
        lastError: error ?? null,
      })
      .where(eq(jobRadarOutbox.id, eventId));
  }
}
