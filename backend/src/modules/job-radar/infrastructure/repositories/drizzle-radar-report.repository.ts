// @ts-nocheck
import { and, desc, eq } from 'drizzle-orm';
import { jobRadarReports, jobRadarScans, jobRadarScores } from '../../../../db/schema.js';
import type {
  EmployerHistoryEntryRow,
  JobRadarReportListRow,
  RadarReportRepository,
} from '../../domain/repositories/radar-report.repository.js';
import type { RadarReportEntity } from '../../domain/entities/radar-report.entity.js';
import type { JobRadarDb } from '../../job-radar-database.types.js';

export class DrizzleRadarReportRepository implements RadarReportRepository {
  constructor(private readonly db: JobRadarDb) {}

  async createSkeleton(report: RadarReportEntity): Promise<void> {
    await this.db.insert(jobRadarReports).values({
      id: report.id,
      scanId: report.scanId,
      status: report.status,
      scoringVersion: report.scoringVersion,
      parserVersion: report.parserVersion,
      normalizationVersion: report.normalizationVersion,
      resolverVersion: report.resolverVersion,
      freshnessStatus: 'fresh',
      freshnessHours: '0.00',
      lastScannedAt: report.lastScannedAt,
      autoRescanEligible: false,
      rescanRecommended: false,
      confidenceSummary: {},
      missingData: [],
      keyFindings: [],
      redFlags: [],
      summaryJson: {},
      detailsJson: {},
      sourcesJson: [],
    });
  }

  async findById(reportId: string): Promise<Record<string, unknown> | null> {
    const rows = await this.db
      .select()
      .from(jobRadarReports)
      .where(eq(jobRadarReports.id, reportId))
      .limit(1);

    return rows[0] ? { ...rows[0] } : null;
  }

  async findByScanId(scanId: string): Promise<Record<string, unknown> | null> {
    const rows = await this.db
      .select()
      .from(jobRadarReports)
      .where(eq(jobRadarReports.scanId, scanId))
      .limit(1);

    return rows[0] ? { ...rows[0] } : null;
  }

  async findByIdForUser(reportId: string, userId: string): Promise<Record<string, unknown> | null> {
    const report = await this.findById(reportId);
    if (!report || typeof report.scanId !== 'string') return null;

    const scanRows = await this.db
      .select({ userId: jobRadarScans.userId })
      .from(jobRadarScans)
      .where(eq(jobRadarScans.id, report.scanId))
      .limit(1);

    if (scanRows[0]?.userId !== userId) return null;
    return report;
  }

  async listRecentForUser(userId: string, limit: number): Promise<JobRadarReportListRow[]> {
    const rows = await this.db
      .select({
        reportId: jobRadarReports.id,
        scanId: jobRadarReports.scanId,
        reportStatus: jobRadarReports.status,
        scanStatus: jobRadarScans.status,
        startedAt: jobRadarScans.startedAt,
        inputPayload: jobRadarScans.inputPayload,
        employerId: jobRadarScans.employerId,
        freshnessStatus: jobRadarReports.freshnessStatus,
        employerScore: jobRadarScores.employerScore,
        offerScore: jobRadarScores.offerScore,
        riskScore: jobRadarScores.riskScore,
      })
      .from(jobRadarReports)
      .innerJoin(jobRadarScans, eq(jobRadarReports.scanId, jobRadarScans.id))
      .leftJoin(jobRadarScores, eq(jobRadarReports.scanId, jobRadarScores.scanId))
      .where(eq(jobRadarScans.userId, userId))
      .orderBy(desc(jobRadarScans.startedAt))
      .limit(Math.min(Math.max(limit, 1), 50));

    return rows.map((r) => {
      const payload = (r.inputPayload ?? {}) as Record<string, unknown>;
      const employerName = typeof payload.employerName === 'string' ? payload.employerName : null;
      const jobTitle = typeof payload.jobTitle === 'string' ? payload.jobTitle : null;
      const sourceUrl = typeof payload.sourceUrl === 'string' ? payload.sourceUrl : null;
      return {
        reportId: r.reportId,
        scanId: r.scanId,
        reportStatus: String(r.reportStatus),
        scanStatus: String(r.scanStatus),
        startedAt: r.startedAt ?? null,
        employerName,
        jobTitle,
        sourceUrl,
        employerId: r.employerId ?? null,
        employerScore: r.employerScore != null ? Number(r.employerScore) : null,
        offerScore: r.offerScore != null ? Number(r.offerScore) : null,
        riskScore: r.riskScore != null ? Number(r.riskScore) : null,
        freshnessStatus: r.freshnessStatus != null ? String(r.freshnessStatus) : null,
      };
    });
  }

  async listEmployerHistoryForUser(
    userId: string,
    employerId: string,
    limit: number,
  ): Promise<EmployerHistoryEntryRow[]> {
    const lim = Math.min(Math.max(limit, 1), 50);
    const rows = await this.db
      .select({
        reportId: jobRadarReports.id,
        lastScannedAt: jobRadarReports.lastScannedAt,
        employerScore: jobRadarScores.employerScore,
        offerScore: jobRadarScores.offerScore,
        riskScore: jobRadarScores.riskScore,
      })
      .from(jobRadarReports)
      .innerJoin(jobRadarScans, eq(jobRadarReports.scanId, jobRadarScans.id))
      .leftJoin(jobRadarScores, eq(jobRadarReports.scanId, jobRadarScores.scanId))
      .where(and(eq(jobRadarScans.userId, userId), eq(jobRadarScans.employerId, employerId)))
      .orderBy(desc(jobRadarScans.startedAt))
      .limit(lim);

    return rows.map((r) => ({
      reportId: r.reportId,
      createdAt: r.lastScannedAt ?? null,
      employerScore: r.employerScore != null ? Number(r.employerScore) : 0,
      offerScore: r.offerScore != null ? Number(r.offerScore) : 0,
      riskScore: r.riskScore != null ? Number(r.riskScore) : 0,
    }));
  }

  async updateComputedReport(input: {
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
  }): Promise<void> {
    await this.db
      .update(jobRadarReports)
      .set({
        status: input.status as typeof jobRadarReports.$inferInsert.status,
        confidenceSummary: input.confidenceSummary,
        missingData: input.missingData,
        keyFindings: input.keyFindings,
        redFlags: input.redFlags,
        nextBestAction: input.nextBestAction,
        benchmarkProvenance: input.benchmarkProvenance,
        summaryJson: input.summaryJson,
        detailsJson: input.detailsJson,
        sourcesJson: input.sourcesJson,
        freshnessStatus: input.freshnessStatus,
        freshnessHours: String(input.freshnessHours),
        lastScannedAt: input.lastScannedAt,
        autoRescanEligible: input.autoRescanEligible,
        rescanRecommended: input.rescanRecommended,
        updatedAt: new Date(),
      })
      .where(eq(jobRadarReports.scanId, input.scanId));
  }

  async updateOverrideAudit(input: {
    scanId: string;
    overrideApplied: boolean;
    overrideId?: string | null;
    overrideReason?: string | null;
    overrideConfidence?: string | null;
    overrideCeiling?: string | null;
  }): Promise<void> {
    await this.db
      .update(jobRadarReports)
      .set({
        overrideApplied: input.overrideApplied,
        overrideId: input.overrideId ?? null,
        overrideReason: input.overrideReason ?? null,
        overrideConfidence: input.overrideConfidence as typeof jobRadarReports.$inferInsert.overrideConfidence,
        overrideCeiling: input.overrideCeiling as typeof jobRadarReports.$inferInsert.overrideCeiling,
        updatedAt: new Date(),
      })
      .where(eq(jobRadarReports.scanId, input.scanId));
  }
}
