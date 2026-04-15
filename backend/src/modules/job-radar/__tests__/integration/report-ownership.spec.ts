import { describe, it, expect, vi } from 'vitest';
import { GetReportHandler } from '../../application/handlers/get-report.handler.js';
import { ReportComposerService } from '../../application/services/report-composer.service.js';
import { ConfidenceSummaryBuilder } from '../../application/services/confidence-summary.builder.js';
import { JobRadarKillSwitchService } from '../../application/services/job-radar-kill-switch.service.js';

describe('GetReportHandler ownership', () => {
  it('throws when report not found for user', async () => {
    const reportRepository = {
      findByIdForUser: vi.fn().mockResolvedValue(null),
    };
    const findingRepository = { getByScanId: vi.fn() };
    const scoreRepository = { getByScanId: vi.fn() };
    const killSwitch = new JobRadarKillSwitchService({
      getFlags: vi.fn().mockResolvedValue({
        disableAllReports: false,
        disableReputationFindings: false,
        disableSevereRegistryAlerts: false,
      }),
    });
    const reportComposer = new ReportComposerService(
      reportRepository as never,
      scoreRepository as never,
      {} as never,
      {} as never,
      findingRepository as never,
      new ConfidenceSummaryBuilder(),
      killSwitch,
    );

    const handler = new GetReportHandler(
      reportRepository as never,
      findingRepository as never,
      scoreRepository as never,
      reportComposer,
      killSwitch,
    );

    await expect(handler.execute({ userId: 'u1', reportId: 'r1' })).rejects.toThrow('REPORT_NOT_FOUND');
  });
});
