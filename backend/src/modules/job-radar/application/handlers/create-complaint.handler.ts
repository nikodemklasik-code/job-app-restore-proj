import { randomUUID } from 'node:crypto';
import type {
  ComplaintType,
  RadarComplaintRepository,
} from '../../domain/repositories/radar-complaint.repository.js';
import type { RadarReportRepository } from '../../domain/repositories/radar-report.repository.js';
import type { RadarScanRepository } from '../../domain/repositories/radar-scan.repository.js';
import type { RadarFindingRepository } from '../../domain/repositories/radar-finding.repository.js';

export class CreateComplaintHandler {
  constructor(
    private readonly complaintRepository: RadarComplaintRepository,
    private readonly reportRepository: RadarReportRepository,
    private readonly scanRepository: RadarScanRepository,
    private readonly findingRepository: RadarFindingRepository,
  ) {}

  async execute(input: {
    userId: string;
    reportId: string;
    findingId?: string | null;
    complaintType: ComplaintType;
    message: string;
  }): Promise<{ complaintId: string; status: 'open' }> {
    const report = await this.reportRepository.findById(input.reportId);
    if (!report || typeof report.scanId !== 'string') throw new Error('REPORT_NOT_FOUND');

    const scan = await this.scanRepository.findById(report.scanId);
    if (!scan) throw new Error('SCAN_NOT_FOUND');
    if (scan.userId !== input.userId) throw new Error('FORBIDDEN');

    let sourceSnapshot: Record<string, unknown> | null = null;

    if (input.findingId) {
      const findings = await this.findingRepository.getByScanId(scan.id);
      const finding = findings.find((f) => String(f.id) === input.findingId);
      if (!finding) throw new Error('FINDING_NOT_FOUND');

      sourceSnapshot = {
        finding_id: finding.id,
        title: finding.title,
        summary: finding.summary,
        severity: finding.severity,
        confidence: finding.confidence,
        visibility: finding.visibility,
      };

      if (input.complaintType === 'harmful_content' || input.complaintType === 'legal_notice') {
        await this.findingRepository.updateVisibility({
          findingId: String(finding.id),
          visibility: 'pending_review',
          reviewReason: 'Complaint submitted by report owner',
          reviewedBy: null,
        });
      }
    }

    const complaintId = randomUUID();

    await this.complaintRepository.create({
      id: complaintId,
      reportId: input.reportId,
      scanId: scan.id,
      findingId: input.findingId ?? null,
      userId: input.userId,
      employerId: scan.employerId ?? null,
      complaintType: input.complaintType,
      message: input.message,
      sourceSnapshot,
    });

    return { complaintId, status: 'open' };
  }
}
