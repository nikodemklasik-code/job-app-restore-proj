import { randomUUID } from 'node:crypto';
import type { RadarSourceRepository } from '../../domain/repositories/radar-source.repository.js';
import type { RadarOutboxRepository } from '../../domain/repositories/radar-outbox.repository.js';
import { SourceDedupService } from '../services/source-dedup.service.js';
import { JOB_RADAR_EVENTS } from '../../constants/event-names.js';

export class DeduplicateSourcesHandler {
  constructor(
    private readonly sourceRepository: RadarSourceRepository,
    private readonly outboxRepository: RadarOutboxRepository,
    private readonly dedupService: SourceDedupService,
  ) {}

  async execute(input: { scanId: string }): Promise<void> {
    const sources = await this.sourceRepository.findByScanId(input.scanId);
    const clusters = await this.dedupService.deduplicate(sources);

    for (const cluster of clusters) {
      await this.sourceRepository.assignCluster(cluster.sourceIds, cluster.clusterId);

      await this.outboxRepository.enqueue({
        id: randomUUID(),
        aggregateType: 'job_radar_scan',
        aggregateId: input.scanId,
        eventName: JOB_RADAR_EVENTS.SOURCE_DEDUPLICATED,
        eventVersion: '1.0',
        occurredAt: new Date(),
        payload: {
          scan_id: input.scanId,
          source_cluster_id: cluster.clusterId,
          primary_source_id: cluster.primarySourceId,
          duplicate_source_ids: cluster.sourceIds.filter((id) => id !== cluster.primarySourceId),
          dedup_reason: cluster.reason,
        },
      });
    }
  }
}
