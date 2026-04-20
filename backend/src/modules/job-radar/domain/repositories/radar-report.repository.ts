import type { RadarReportEntity } from '../entities/radar-report.entity.js';

export type JobRadarReportListRow = {
  reportId: string;
  scanId: string;
  reportStatus: string;
  scanStatus: string;
  startedAt: Date | null;
  employerName: string | null;
  jobTitle: string | null;
  sourceUrl: string | null;
  /** Stable pseudo-id on `job_radar_scans` (hash-based); null only for legacy rows. */
  employerId: string | null;
  employerScore: number | null;
  offerScore: number | null;
  riskScore: number | null;
  freshnessStatus: string | null;
};

export type EmployerHistoryEntryRow = {
  reportId: string;
  createdAt: Date | null;
  employerScore: number;
  offerScore: number;
  riskScore: number;
};

export interface RadarReportRepository {
  createSkeleton(report: RadarReportEntity): Promise<void>;
  findById(reportId: string): Promise<Record<string, unknown> | null>;
  findByScanId(scanId: string): Promise<Record<string, unknown> | null>;
  findByIdForUser(reportId: string, userId: string): Promise<Record<string, unknown> | null>;
  listRecentForUser(userId: string, limit: number): Promise<JobRadarReportListRow[]>;
  listEmployerHistoryForUser(userId: string, employerId: string, limit: number): Promise<EmployerHistoryEntryRow[]>;
  updateComputedReport(input: {
    scanId: string;
    status: string;
    confidenceSummary: Record<string, unknown>;
    missingData: unknown[];
    keyFindings: unknown[];
    redFlags: unknown[];
    nextBestAction: Record<string, unknown> | null;
    benchmarkProvenance: Record<string, unknown> | null;
    summaryJson: Record<string, unknown>;
    detailsJson: Record<string, unknown>;
    sourcesJson: unknown[];
    freshnessStatus: 'fresh' | 'acceptable' | 'stale';
    freshnessHours: number;
    lastScannedAt: Date;
    autoRescanEligible: boolean;
    rescanRecommended: boolean;
  }): Promise<void>;
  updateOverrideAudit(input: {
    scanId: string;
    overrideApplied: boolean;
    overrideId?: string | null;
    overrideReason?: string | null;
    overrideConfidence?: string | null;
    overrideCeiling?: string | null;
  }): Promise<void>;
}
