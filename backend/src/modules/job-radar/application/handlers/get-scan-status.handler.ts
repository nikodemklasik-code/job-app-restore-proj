import type { RadarScanRepository } from '../../domain/repositories/radar-scan.repository.js';
import type { RadarReportRepository } from '../../domain/repositories/radar-report.repository.js';
import type { RadarScanEntity } from '../../domain/entities/radar-scan.entity.js';

export type ScanStatusView = RadarScanEntity & { reportId: string | null };

export class GetScanStatusHandler {
  constructor(
    private readonly scanRepository: RadarScanRepository,
    private readonly reportRepository: RadarReportRepository,
  ) {}

  async execute(input: { userId: string; scanId: string }): Promise<ScanStatusView> {
    const scan = await this.scanRepository.findById(input.scanId);
    if (!scan) throw new Error('SCAN_NOT_FOUND');
    if (scan.userId !== input.userId) throw new Error('FORBIDDEN');

    const report = await this.reportRepository.findByScanId(input.scanId);
    const reportId = report && typeof report.id === 'string' ? report.id : null;

    return { ...scan, reportId };
  }
}
