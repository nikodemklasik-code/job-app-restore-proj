import { describe, expect, it, vi } from 'vitest';
import { GetScanStatusHandler } from '../../application/handlers/get-scan-status.handler.js';
import { JobRadarHttpMapper } from '../../api/job-radar.http.mapper.js';
import { RadarScanEntity } from '../../domain/entities/radar-scan.entity.js';
import { SCAN_STATUS } from '../../domain/types/scan-status.js';
import { SCAN_TRIGGER } from '../../domain/types/scan-trigger.js';

/**
 * Integration-style check: handler view + HTTP mapper matches OpenAPI ScanProgressResponse wire
 * (same path as `jobRadar.getScanStatus` tRPC procedure).
 */
describe('Job Radar scan status → OpenAPI wire', () => {
  it('maps handler output through JobRadarHttpMapper.toScanProgressResponseWire', async () => {
    const scan = new RadarScanEntity(
      's-int',
      'user-1',
      SCAN_TRIGGER.URL_INPUT,
      SCAN_STATUS.PROCESSING,
      'deadbeef',
      null,
      { source_url: 'https://example.com/job' },
      {
        employer_scan: 'done',
        offer_parse: 'processing',
        benchmark: 'pending',
        reviews: 'pending',
        scoring: 'pending',
        report_compose: 'pending',
      },
      null,
      null,
      null,
      new Date('2026-04-16T10:00:00.000Z'),
      new Date('2026-04-16T10:02:00.000Z'),
      null,
      null,
    );

    const scanRepository = { findById: vi.fn().mockResolvedValue(scan) };
    const reportRepository = { findByScanId: vi.fn().mockResolvedValue({ id: 'report-int-1' }) };

    const handler = new GetScanStatusHandler(
      scanRepository as never,
      reportRepository as never,
    );

    const view = await handler.execute({ userId: 'user-1', scanId: 's-int' });
    const wire = JobRadarHttpMapper.toScanProgressResponseWire(view);

    expect(wire.scan_id).toBe('s-int');
    expect(wire.scan_trigger).toBe(SCAN_TRIGGER.URL_INPUT);
    expect(wire.fingerprint).toBe('deadbeef');
    expect(wire.partial_report_id).toBe('report-int-1');
    expect(wire.failed_reason).toBeNull();
    expect(wire.progress.employer_resolution).toBe('done');
    expect(wire.progress.offer_parsing).toBe('processing');
    expect(wire.progress.input_normalization).toBe('done');
    expect(Object.keys(wire.progress).sort()).toEqual(
      [
        'benchmarking',
        'employer_resolution',
        'fit_scoring',
        'input_normalization',
        'offer_parsing',
        'report_generation',
        'source_collection',
      ].sort(),
    );
  });
});
