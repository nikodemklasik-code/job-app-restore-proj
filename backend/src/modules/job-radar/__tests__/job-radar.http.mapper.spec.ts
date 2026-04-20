import { describe, expect, it } from 'vitest';
import { JobRadarHttpMapper } from '../api/job-radar.http.mapper.js';
import { mapJobRadarScanRequestWireToDtoShape, startScanDtoSchema } from '../api/job-radar.dto.js';
import { InputNormalizerService } from '../infrastructure/services/input-normalizer.service.js';
import { RadarScanEntity } from '../domain/entities/radar-scan.entity.js';
import { SCAN_STATUS } from '../domain/types/scan-status.js';
import { SCAN_TRIGGER } from '../domain/types/scan-trigger.js';

describe('JobRadarHttpMapper', () => {
  it('maps internal handler result to OpenAPI ScanAcceptedResponse (snake_case)', () => {
    const out = JobRadarHttpMapper.toScanAcceptedResponse({
      scanId: 'scan-1',
      status: 'processing',
      reportId: 'rep-9',
      quotaRemaining: 5,
      idempotencyReused: true,
    });
    expect(out).toEqual({
      scan_id: 'scan-1',
      status: 'processing',
      report_id: 'rep-9',
      quota_remaining: 5,
      idempotency_reused: true,
    });
  });

  it('omits optional report_id when absent', () => {
    const out = JobRadarHttpMapper.toScanAcceptedResponse({
      scanId: 's',
      status: 'processing',
      quotaRemaining: 0,
      idempotencyReused: false,
    });
    expect(out.report_id).toBeUndefined();
  });

  it('toScanProgressResponseWire maps skipped internal stages to pending (OpenAPI enum)', () => {
    const scan = new RadarScanEntity(
      's1',
      'u',
      SCAN_TRIGGER.MANUAL_SEARCH,
      SCAN_STATUS.PROCESSING,
      'fp',
      null,
      {},
      {
        employer_scan: 'skipped',
        offer_parse: 'skipped',
        benchmark: 'skipped',
        reviews: 'skipped',
        scoring: 'skipped',
        report_compose: 'skipped',
      },
      null,
      null,
      null,
      new Date(0),
      new Date(0),
      null,
      null,
    );
    const wire = JobRadarHttpMapper.toScanProgressResponseWire({ ...scan, reportId: null });
    expect(wire.progress.employer_resolution).toBe('pending');
    expect(wire.partial_report_id).toBeNull();
  });
});

describe('mapJobRadarScanRequestWireToDtoShape + startScanDtoSchema', () => {
  it('accepts OpenAPI wire snake_case and normalizes to savedJobId', () => {
    const raw = { scan_trigger: 'saved_job', saved_job_id: 'saved-42' };
    const normalized = mapJobRadarScanRequestWireToDtoShape(raw);
    expect(normalized).toMatchObject({ scanTrigger: 'saved_job', savedJobId: 'saved-42' });
    const parsed = startScanDtoSchema.safeParse(raw);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.savedJobId).toBe('saved-42');
  });

  it('feeds savedJobId into fingerprint via InputNormalizerService', () => {
    const n = new InputNormalizerService().normalize({
      scanTrigger: 'saved_job',
      savedJobId: 'JOB-A',
      employerName: undefined,
    } as unknown as Record<string, unknown>);
    expect(n.canonicalEmployerCandidate).toBe('saved-job:job-a');
  });
});
