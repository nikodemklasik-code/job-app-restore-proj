import { describe, it, expect, vi } from 'vitest';
import { JobRadarKillSwitchService } from '../../application/services/job-radar-kill-switch.service.js';
import type { JobRadarConfigRepository } from '../../domain/repositories/job-radar-config.repository.js';

function makeConfig(flags: Partial<{ disableAllReports: boolean; disableReputationFindings: boolean; disableSevereRegistryAlerts: boolean }>): JobRadarConfigRepository {
  return {
    getFlags: vi.fn().mockResolvedValue({
      disableAllReports: false,
      disableReputationFindings: false,
      disableSevereRegistryAlerts: false,
      ...flags,
    }),
  };
}

describe('JobRadarKillSwitchService', () => {
  it('returns empty when all reports disabled', async () => {
    const svc = new JobRadarKillSwitchService(makeConfig({ disableAllReports: true }));
    const out = await svc.applyToFindings([{ findingType: 'positive' }]);
    expect(out).toEqual([]);
    expect(await svc.shouldBlockReport()).toBe(true);
  });

  it('filters reputation findings when flag set', async () => {
    const svc = new JobRadarKillSwitchService(makeConfig({ disableReputationFindings: true }));
    const out = await svc.applyToFindings([
      { findingType: 'positive' },
      { findingType: 'warning' },
      { findingType: 'red_flag' },
    ]);
    expect(out).toHaveLength(1);
  });

  it('filters REGISTRY_INACTIVE when registry severe flag set', async () => {
    const svc = new JobRadarKillSwitchService(makeConfig({ disableSevereRegistryAlerts: true }));
    const out = await svc.applyToFindings([{ findingType: 'red_flag', code: 'REGISTRY_INACTIVE' }]);
    expect(out).toHaveLength(0);
  });
});
