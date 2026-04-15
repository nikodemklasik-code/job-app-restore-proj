import type {
  JobRadarKillSwitchFlags,
  MutableJobRadarConfigRepository,
} from '../../domain/repositories/job-radar-config.repository.js';

function envBool(name: string): boolean {
  const v = process.env[name];
  return v === '1' || v === 'true' || v === 'yes';
}

/**
 * Process-local flags + optional env overrides for emergency kill without deploy.
 * Replace with DB / feature-flag service for multi-instance production.
 */
export class InMemoryJobRadarConfigRepository implements MutableJobRadarConfigRepository {
  private flags: JobRadarKillSwitchFlags = {
    disableAllReports: false,
    disableReputationFindings: false,
    disableSevereRegistryAlerts: false,
  };

  async getFlags(): Promise<JobRadarKillSwitchFlags> {
    return {
      disableAllReports: this.flags.disableAllReports || envBool('JOB_RADAR_KILL_SWITCH_ALL'),
      disableReputationFindings:
        this.flags.disableReputationFindings || envBool('JOB_RADAR_KILL_SWITCH_REPUTATION'),
      disableSevereRegistryAlerts:
        this.flags.disableSevereRegistryAlerts || envBool('JOB_RADAR_KILL_SWITCH_REGISTRY_SEVERE'),
    };
  }

  async setFlags(input: Partial<JobRadarKillSwitchFlags>): Promise<void> {
    this.flags = {
      ...this.flags,
      ...input,
    };
  }
}
