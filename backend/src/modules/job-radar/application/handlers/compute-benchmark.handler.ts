import { randomUUID } from 'node:crypto';
import type { RadarOutboxRepository } from '../../domain/repositories/radar-outbox.repository.js';
import { BenchmarkEngineService } from '../services/benchmark-engine.service.js';
import { JOB_RADAR_EVENTS } from '../../constants/event-names.js';

export class ComputeBenchmarkHandler {
  constructor(
    private readonly benchmarkEngine: BenchmarkEngineService,
    private readonly outboxRepository: RadarOutboxRepository,
  ) {}

  async execute(job: { scanId: string }): Promise<void> {
    await this.benchmarkEngine.compute(job.scanId);

    await this.outboxRepository.enqueue({
      id: randomUUID(),
      aggregateType: 'job_radar_scan',
      aggregateId: job.scanId,
      eventName: JOB_RADAR_EVENTS.BENCHMARK_READY,
      eventVersion: '1.0',
      occurredAt: new Date(),
      payload: {
        scan_id: job.scanId,
      },
    });
  }
}
