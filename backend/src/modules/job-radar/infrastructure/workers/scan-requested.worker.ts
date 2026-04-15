import { ScanOrchestratorService } from '../../application/services/scan-orchestrator.service.js';

export class ScanRequestedWorker {
  constructor(private readonly orchestrator: ScanOrchestratorService) {}

  async handle(payload: Record<string, unknown>): Promise<void> {
    const scanId = String(payload.scan_id ?? '');
    if (!scanId) throw new Error('SCAN_ID_MISSING');
    await this.orchestrator.handleScanRequested(scanId);
  }
}
