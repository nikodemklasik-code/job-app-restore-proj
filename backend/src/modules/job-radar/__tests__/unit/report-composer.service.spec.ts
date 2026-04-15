import { describe, it, expect, vi } from 'vitest';
import { ReportComposerService } from '../../application/services/report-composer.service.js';
import { ConfidenceSummaryBuilder } from '../../application/services/confidence-summary.builder.js';
import { JobRadarKillSwitchService } from '../../application/services/job-radar-kill-switch.service.js';
import { SCAN_STATUS } from '../../domain/types/scan-status.js';

describe('ReportComposerService', () => {
  it('excludes suppressed and pending_review findings from composed report', async () => {
    const reportRepository = {
      updateComputedReport: vi.fn().mockResolvedValue(undefined),
    };
    const scoreRepository = {
      getByScanId: vi.fn().mockResolvedValue({ recommendation: 'Mixed Signals' }),
      getDriversByScanId: vi.fn().mockResolvedValue([]),
    };
    const sourceRepository = { findByScanId: vi.fn().mockResolvedValue([]) };
    const signalRepository = { findByScanId: vi.fn().mockResolvedValue([]) };
    const findingRepository = {
      getByScanId: vi.fn().mockResolvedValue([
        { id: '1', title: 'Visible', summary: 'ok', findingType: 'positive', severity: 'low', confidence: 'high', visibility: 'visible' },
        {
          id: '2',
          title: 'Hidden',
          summary: 'x',
          findingType: 'red_flag',
          severity: 'high',
          confidence: 'high',
          visibility: 'suppressed',
        },
        {
          id: '3',
          title: 'Pending',
          summary: 'y',
          findingType: 'warning',
          severity: 'medium',
          confidence: 'medium',
          visibility: 'pending_review',
        },
      ]),
    };

    const killSwitch = new JobRadarKillSwitchService({
      getFlags: vi.fn().mockResolvedValue({
        disableAllReports: false,
        disableReputationFindings: false,
        disableSevereRegistryAlerts: false,
      }),
    });

    const composer = new ReportComposerService(
      reportRepository as never,
      scoreRepository as never,
      sourceRepository as never,
      signalRepository as never,
      findingRepository as never,
      new ConfidenceSummaryBuilder(),
      killSwitch,
    );

    await composer.compose('scan-1', SCAN_STATUS.PARTIAL_REPORT);

    const call = reportRepository.updateComputedReport.mock.calls[0][0];
    const keyFindings = call.keyFindings as { title: string }[];
    expect(keyFindings.some((k) => k.title === 'Hidden')).toBe(false);
    expect(keyFindings.some((k) => k.title === 'Pending')).toBe(false);
  });
});
