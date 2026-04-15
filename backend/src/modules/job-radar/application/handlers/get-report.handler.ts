import type { RadarReportRepository } from '../../domain/repositories/radar-report.repository.js';
import type { RadarFindingRepository } from '../../domain/repositories/radar-finding.repository.js';
import type { RadarScoreRepository } from '../../domain/repositories/radar-score.repository.js';
import { ReportComposerService } from '../services/report-composer.service.js';
import { JobRadarKillSwitchService } from '../services/job-radar-kill-switch.service.js';

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

export class GetReportHandler {
  constructor(
    private readonly reportRepository: RadarReportRepository,
    private readonly findingRepository: RadarFindingRepository,
    private readonly scoreRepository: RadarScoreRepository,
    private readonly reportComposer: ReportComposerService,
    private readonly killSwitchService: JobRadarKillSwitchService,
  ) {}

  async execute(input: { userId: string; reportId: string }): Promise<Record<string, unknown>> {
    const report = await this.reportRepository.findByIdForUser(input.reportId, input.userId);
    if (!report) throw new Error('REPORT_NOT_FOUND');

    if (await this.killSwitchService.shouldBlockReport()) {
      return {
        ...report,
        keyFindings: [
          {
            title: 'Report temporarily unavailable',
            summary: 'JobRadar reporting is temporarily limited.',
          },
        ],
        redFlags: [],
        detailsJson: {},
        summaryJson: asRecord(report.summaryJson),
      };
    }

    const scanId = String(report.scanId ?? '');
    const allFindings = await this.findingRepository.getByScanId(scanId);
    const visibleFindings = allFindings.filter((f) => isFindingVisibleForUser(f));
    const filteredFindings = await this.killSwitchService.applyToFindings(visibleFindings);
    const scores = await this.scoreRepository.getByScanId(scanId);
    const { keyFindings, redFlags } = this.reportComposer.projectDisplayedFindings(
      filteredFindings,
      scores,
    );

    const detailsJson = asRecord(report.detailsJson);
    const summaryJson = asRecord(report.summaryJson);

    return {
      ...report,
      keyFindings,
      redFlags,
      detailsJson: {
        ...detailsJson,
        key_findings: keyFindings,
        red_flags: redFlags,
      },
      summaryJson,
    };
  }
}

function isFindingVisibleForUser(f: Record<string, unknown>): boolean {
  const v = f.visibility;
  return v === 'visible' || v === undefined || v === null;
}
