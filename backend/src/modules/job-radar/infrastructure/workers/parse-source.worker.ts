import type { ParseSourceHandler } from '../../application/handlers/parse-source.handler.js';
import type { ScanOrchestratorService } from '../../application/services/scan-orchestrator.service.js';

export class ParseSourceWorker {
  constructor(
    private readonly handler: ParseSourceHandler,
    private readonly orchestrator: ScanOrchestratorService,
  ) {}

  async handle(payload: Record<string, unknown>): Promise<void> {
    const scanId = String(payload.scan_id ?? '');

    await this.handler.execute({
      scanId,
      sourceId: String(payload.source_id ?? ''),
    });

    await this.orchestrator.maybeFinalizeAfterParse(scanId);
  }
}
