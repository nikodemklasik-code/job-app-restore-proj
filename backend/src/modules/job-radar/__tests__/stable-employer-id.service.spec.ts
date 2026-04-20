import { describe, expect, it } from 'vitest';
import { deriveStableEmployerIdFromScanPayload } from '../infrastructure/services/stable-employer-id.service.js';

describe('deriveStableEmployerIdFromScanPayload', () => {
  it('is stable for same employer name', () => {
    const a = deriveStableEmployerIdFromScanPayload({
      scanTrigger: 'manual_search',
      employerName: '  Acme Ltd ',
      forceRescan: false,
    });
    const b = deriveStableEmployerIdFromScanPayload({
      scanTrigger: 'manual_search',
      employerName: 'acme ltd',
      forceRescan: false,
    });
    expect(a).toBe(b);
    expect(a).toMatch(/^emp_[a-f0-9]{32}$/);
  });

  it('uses host for sourceUrl-only payloads', () => {
    const id = deriveStableEmployerIdFromScanPayload({
      scanTrigger: 'url_input',
      sourceUrl: 'https://careers.example.com/jobs/123',
      forceRescan: false,
    });
    expect(id).toMatch(/^emp_[a-f0-9]{32}$/);
  });

  it('uses saved job id when that is the only anchor', () => {
    const id = deriveStableEmployerIdFromScanPayload({
      scanTrigger: 'saved_job',
      savedJobId: 'app-uuid-1',
      forceRescan: false,
    });
    expect(id).toMatch(/^emp_[a-f0-9]{32}$/);
  });
});
