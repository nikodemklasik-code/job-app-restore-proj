import type { RadarReportEntity } from '../entities/radar-report.entity.js';

export interface RadarReportRepository {
  createSkeleton(report: RadarReportEntity): Promise<void>;
  findById(reportId: string): Promise<Record<string, unknown> | null>;
  findByScanId(scanId: string): Promise<Record<string, unknown> | null>;
  findByIdForUser(reportId: string, userId: string): Promise<Record<string, unknown> | null>;
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
