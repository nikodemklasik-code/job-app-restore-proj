import type { RadarOutboxRepository } from '../../domain/repositories/radar-outbox.repository.js';

export type QueuePublisher = {
  publish: (topic: string, payload: Record<string, unknown>) => Promise<void>;
};

/** Bridges outbox rows to an external broker; optional when workers poll outbox directly. */
export class OutboxPublisherService {
  constructor(
    private readonly outboxRepository: RadarOutboxRepository,
    private readonly queuePublisher: QueuePublisher,
  ) {}

  async publishPending(limit = 100): Promise<void> {
    const events = await this.outboxRepository.fetchUnpublished(limit);

    for (const event of events) {
      try {
        await this.queuePublisher.publish(event.eventName, {
          ...event.payload,
          _event_id: event.id,
          _aggregate_id: event.aggregateId,
        });
        await this.outboxRepository.markPublished(event.id);
      } catch (error) {
        await this.outboxRepository.incrementDeliveryAttempt(
          event.id,
          error instanceof Error ? error.message : 'UNKNOWN_ERROR',
        );
      }
    }
  }
}
