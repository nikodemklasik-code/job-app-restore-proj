import type { RadarReportRepository } from '../../domain/repositories/radar-report.repository.js';
import type { RadarScoreRepository } from '../../domain/repositories/radar-score.repository.js';
import type { RadarSourceRepository } from '../../domain/repositories/radar-source.repository.js';
import type { RadarSignalRepository } from '../../domain/repositories/radar-signal.repository.js';
import type { RadarFindingRepository } from '../../domain/repositories/radar-finding.repository.js';
import { ConfidenceSummaryBuilder } from './confidence-summary.builder.js';
import { SCAN_STATUS } from '../../domain/types/scan-status.js';
import type { ScanStatus } from '../../domain/types/scan-status.js';
import { JobRadarKillSwitchService } from './job-radar-kill-switch.service.js';

export class ReportComposerService {
  constructor(
    private readonly reportRepository: RadarReportRepository,
    private readonly scoreRepository: RadarScoreRepository,
    private readonly sourceRepository: RadarSourceRepository,
    private readonly signalRepository: RadarSignalRepository,
    private readonly findingRepository: RadarFindingRepository,
    private readonly confidenceSummaryBuilder: ConfidenceSummaryBuilder,
    private readonly killSwitchService: JobRadarKillSwitchService,
  ) {}

  async compose(scanId: string, scanStatus: ScanStatus): Promise<void> {
    if (await this.killSwitchService.shouldBlockReport()) {
      await this.reportRepository.updateComputedReport({
        scanId,
        status: SCAN_STATUS.PARTIAL_REPORT,
        confidenceSummary: { overall: 'low' },
        missingData: [],
        keyFindings: [
          {
            title: 'Report temporarily unavailable',
            summary: 'JobRadar reporting is temporarily limited.',
          },
        ],
        redFlags: [],
        nextBestAction: {
          type: 'none',
          label: 'Please try again later',
        },
        benchmarkProvenance: null,
        summaryJson: {},
        detailsJson: {},
        sourcesJson: [],
        freshnessStatus: 'fresh',
        freshnessHours: 0,
        lastScannedAt: new Date(),
        autoRescanEligible: false,
        rescanRecommended: false,
      });
      return;
    }

    const composeStatus = this.mapComposeStatus(scanStatus);

    const scores = await this.scoreRepository.getByScanId(scanId);
    const drivers = await this.scoreRepository.getDriversByScanId(scanId);
    const sources = await this.sourceRepository.findByScanId(scanId);
    const signals = await this.signalRepository.findByScanId(scanId);
    const findingsRaw = await this.findingRepository.getByScanId(scanId);
    const visibleFindings = findingsRaw.filter((f) => isFindingVisible(f));
    const findings = await this.killSwitchService.applyToFindings(visibleFindings);

    const confidenceSummary = this.confidenceSummaryBuilder.build(signals, scores);
    const missingData = this.buildMissingData(signals);
    const keyFindings = this.buildKeyFindings(findings, scores);
    const redFlags = this.buildRedFlags(findings);
    const nextBestAction = this.buildNextBestAction(missingData, composeStatus);

    const scoreDrivers = this.groupDrivers(drivers);

    const recommendation = (scores?.recommendation as string | undefined) ?? 'Mixed Signals';

    await this.reportRepository.updateComputedReport({
      scanId,
      status: scanStatus,
      confidenceSummary,
      missingData,
      keyFindings,
      redFlags,
      nextBestAction,
      benchmarkProvenance: null,
      summaryJson: {
        recommendation,
        scores: {
          employer_score: num(scores?.employerScore),
          offer_score: num(scores?.offerScore),
          market_pay_score: num(scores?.marketPayScore),
          benefits_score: num(scores?.benefitsScore),
          culture_fit_score: num(scores?.cultureFitScore),
          risk_score: num(scores?.riskScore),
        },
      },
      detailsJson: {
        recommendation,
        scores: {
          employer_score: num(scores?.employerScore),
          offer_score: num(scores?.offerScore),
          market_pay_score: num(scores?.marketPayScore),
          benefits_score: num(scores?.benefitsScore),
          culture_fit_score: num(scores?.cultureFitScore),
          risk_score: num(scores?.riskScore),
        },
        score_drivers: scoreDrivers,
        confidence_summary: confidenceSummary,
        missing_data: missingData,
        key_findings: keyFindings,
        red_flags: redFlags,
      },
      sourcesJson: sources.map((s) => ({
        source_id: s.id,
        type: s.sourceType,
        url: s.sourceUrl,
        tier: s.sourceQualityTier,
        collected_at: s.collectedAt,
        source_cluster_id: s.sourceClusterId,
      })),
      freshnessStatus: 'fresh',
      freshnessHours: 0,
      lastScannedAt: new Date(),
      autoRescanEligible: false,
      rescanRecommended: false,
    });
  }

  private mapComposeStatus(
    status: ScanStatus,
  ): 'ready' | 'partial_report' | 'sources_blocked' {
    if (status === SCAN_STATUS.SOURCES_BLOCKED) return 'sources_blocked';
    if (status === SCAN_STATUS.READY) return 'ready';
    return 'partial_report';
  }

  private buildMissingData(signals: Record<string, unknown>[]): string[] {
    return Array.from(
      new Set(signals.filter((s) => s.isMissingData === true).map((s) => String(s.signalKey))),
    );
  }

  /** Rebuild user-facing slices from findings (e.g. GET report after kill-switch or visibility changes). */
  projectDisplayedFindings(
    findings: Record<string, unknown>[],
    scores: Record<string, unknown> | null,
  ): { keyFindings: unknown[]; redFlags: unknown[] } {
    return {
      keyFindings: this.buildKeyFindings(findings, scores),
      redFlags: this.buildRedFlags(findings),
    };
  }

  private buildKeyFindings(
    findings: Record<string, unknown>[],
    scores: Record<string, unknown> | null,
  ): Array<{ title: string; summary: string } | string> {
    const top = findings.slice(0, 5).map((f) => ({
      title: String(f.title ?? ''),
      summary: String(f.summary ?? ''),
    }));

    if (top.length > 0) return top;

    return [
      {
        title: 'Initial JobRadar assessment generated',
        summary: `Recommendation: ${String(scores?.recommendation ?? 'Mixed Signals')}.`,
      },
    ];
  }

  private buildRedFlags(findings: Record<string, unknown>[]) {
    return findings
      .filter((f) => f.findingType === 'red_flag' || f.severity === 'severe')
      .map((f) => ({
        code: f.code,
        label: f.title,
        severity: f.severity,
        confidence: f.confidence,
      }));
  }

  private buildNextBestAction(
    missingData: string[],
    composeStatus: 'ready' | 'partial_report' | 'sources_blocked',
  ) {
    if (composeStatus === 'sources_blocked') {
      return {
        type: 'rescan',
        label: 'Try another source or rescan later due to blocked sources',
      };
    }

    if (missingData.includes('salary_missing')) {
      return {
        type: 'review_missing_data',
        label: 'Salary is missing. Compare this employer with another listing if possible',
      };
    }

    return {
      type: 'none',
      label: 'No immediate action needed',
    };
  }

  private groupDrivers(drivers: Record<string, unknown>[]) {
    const grouped: Record<
      string,
      {
        positive_drivers: unknown[];
        negative_drivers: unknown[];
        neutral_constraints: unknown[];
      }
    > = {};

    for (const driver of drivers) {
      const scoreName = String(driver.scoreName ?? 'unknown');
      if (!grouped[scoreName]) {
        grouped[scoreName] = {
          positive_drivers: [],
          negative_drivers: [],
          neutral_constraints: [],
        };
      }

      const payload = {
        label: driver.label,
        impact: driver.impact,
        confidence: driver.confidence,
        source_ref: driver.sourceRef ?? driver.sourceId ?? null,
      };

      if (driver.driverType === 'positive') {
        grouped[scoreName].positive_drivers.push(payload);
      } else if (driver.driverType === 'negative') {
        grouped[scoreName].negative_drivers.push(payload);
      } else {
        grouped[scoreName].neutral_constraints.push(payload);
      }
    }

    return grouped;
  }
}

function num(v: unknown): number {
  if (v == null) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function isFindingVisible(f: Record<string, unknown>): boolean {
  const v = f.visibility;
  return v === 'visible' || v === undefined || v === null;
}
