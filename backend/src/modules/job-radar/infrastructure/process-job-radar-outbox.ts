import type { RadarOutboxRepository } from '../domain/repositories/radar-outbox.repository.js';
import { JOB_RADAR_EVENTS } from '../constants/event-names.js';
import type { ScanRequestedWorker } from './workers/scan-requested.worker.js';
import type { SourceFetchWorker } from './workers/source-fetch.worker.js';
import type { ParseSourceWorker } from './workers/parse-source.worker.js';

const AUDIT_ONLY_EVENTS: Set<string> = new Set([
  JOB_RADAR_EVENTS.SCAN_REQUESTED_CACHE_HIT,
  JOB_RADAR_EVENTS.SOURCE_FETCH_STARTED,
  JOB_RADAR_EVENTS.SOURCE_FETCH_COMPLETED,
  JOB_RADAR_EVENTS.SOURCE_FETCH_FAILED,
  JOB_RADAR_EVENTS.OFFER_PARSED,
  JOB_RADAR_EVENTS.BENCHMARK_READY,
  JOB_RADAR_EVENTS.SOURCE_DEDUPLICATED,
]);

/**
 * Processes unpublished outbox rows (in-process MVP: no external queue).
 */
export async function processJobRadarOutbox(
  outboxRepository: RadarOutboxRepository,
  workers: {
    scanRequested: ScanRequestedWorker;
    sourceFetch: SourceFetchWorker;
    parseSource: ParseSourceWorker;
  },
  limit = 25,
): Promise<void> {
  const events = await outboxRepository.fetchUnpublished(limit);

  for (const event of events) {
    try {
      const name = event.eventName;

      if (name === JOB_RADAR_EVENTS.SCAN_REQUESTED) {
        await workers.scanRequested.handle(event.payload);
      } else if (name === JOB_RADAR_EVENTS.SOURCE_FETCH_REQUESTED) {
        await workers.sourceFetch.handle(event);
      } else if (name === JOB_RADAR_EVENTS.PARSE_SOURCE_REQUESTED) {
        await workers.parseSource.handle(event.payload);
      } else if (AUDIT_ONLY_EVENTS.has(name)) {
        /* no pipeline side-effect */
      } else {
        continue;
      }

      await outboxRepository.markPublished(event.id);
    } catch (error) {
      await outboxRepository.incrementDeliveryAttempt(
        event.id,
        error instanceof Error ? error.message : 'UNKNOWN_ERROR',
      );
    }
  }
}
