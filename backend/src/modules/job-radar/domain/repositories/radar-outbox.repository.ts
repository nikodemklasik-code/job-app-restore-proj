export interface OutboxEvent {
  id: string;
  aggregateType: string;
  aggregateId: string;
  eventName: string;
  eventVersion: string;
  payload: Record<string, unknown>;
  occurredAt: Date;
}

export interface RadarOutboxRepository {
  enqueue(event: OutboxEvent): Promise<void>;
  fetchUnpublished(limit: number): Promise<OutboxEvent[]>;
  markPublished(eventId: string): Promise<void>;
  incrementDeliveryAttempt(eventId: string, error?: string): Promise<void>;
  /**
   * True while unpublished `source_fetch_requested` rows remain for this scan (multi-source fetch wave).
   * Pass `excludeEventId` when the caller is finishing that outbox row but `markPublished` has not run yet
   * (same transactional batch as `processJobRadarOutbox`).
   */
  hasUnpublishedSourceFetchRequested(scanId: string, excludeEventId?: string): Promise<boolean>;
}
