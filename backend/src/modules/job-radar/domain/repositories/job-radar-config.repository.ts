export type JobRadarKillSwitchFlags = {
  disableAllReports: boolean;
  disableReputationFindings: boolean;
  disableSevereRegistryAlerts: boolean;
};

export interface JobRadarConfigRepository {
  getFlags(): Promise<JobRadarKillSwitchFlags>;
}

/** Optional: admin kill-switch writes (in-memory or DB-backed implementation). */
export interface MutableJobRadarConfigRepository extends JobRadarConfigRepository {
  setFlags(input: Partial<JobRadarKillSwitchFlags>): Promise<void>;
}
