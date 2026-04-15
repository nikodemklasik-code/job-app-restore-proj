import type { JobRadarConfigRepository } from '../../domain/repositories/job-radar-config.repository.js';

export class JobRadarKillSwitchService {
  constructor(private readonly configRepository: JobRadarConfigRepository) {}

  async applyToFindings(findings: Record<string, unknown>[]): Promise<Record<string, unknown>[]> {
    const flags = await this.configRepository.getFlags();

    if (flags.disableAllReports) {
      return [];
    }

    return findings.filter((finding) => {
      const type = String(finding.findingType ?? '');
      if (
        flags.disableReputationFindings &&
        (type === 'warning' || type === 'red_flag')
      ) {
        return false;
      }

      if (flags.disableSevereRegistryAlerts && String(finding.code) === 'REGISTRY_INACTIVE') {
        return false;
      }

      return true;
    });
  }

  async shouldBlockReport(): Promise<boolean> {
    const flags = await this.configRepository.getFlags();
    return flags.disableAllReports;
  }
}
