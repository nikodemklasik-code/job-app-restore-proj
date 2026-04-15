import type { SourceFetchHandler } from '../../application/handlers/source-fetch.handler.js';
import type { ScanOrchestratorService } from '../../application/services/scan-orchestrator.service.js';
import type { OutboxEvent } from '../../domain/repositories/radar-outbox.repository.js';

export class SourceFetchWorker {
  constructor(
    private readonly handler: SourceFetchHandler,
    private readonly orchestrator: ScanOrchestratorService,
  ) {}

  async handle(event: OutboxEvent): Promise<void> {
    const payload = event.payload;
    const scanId = String(payload.scan_id ?? '');
    await this.handler.execute({
      scanId,
      employerId: (payload.employer_id as string | null | undefined) ?? null,
      jobPostId: (payload.job_post_id as string | null | undefined) ?? null,
      employerName:
        typeof payload.employer_name === 'string' ? String(payload.employer_name) : null,
      sourceType: String(payload.source_type ?? 'official_website'),
      sourceUrl: String(payload.source_url ?? ''),
      timeoutMs: Number(payload.timeout_ms ?? 8000),
    });

    await this.orchestrator.afterSourceFetch(scanId, event.id);
  }
}
