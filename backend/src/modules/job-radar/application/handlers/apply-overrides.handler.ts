import type { RadarScoreRepository } from '../../domain/repositories/radar-score.repository.js';
import type { RadarFindingRepository } from '../../domain/repositories/radar-finding.repository.js';
import type { RadarSignalRepository } from '../../domain/repositories/radar-signal.repository.js';
import type { RadarReportRepository } from '../../domain/repositories/radar-report.repository.js';
import { OverrideRuleEngine } from '../services/override-rule-engine.service.js';
import type { Recommendation } from '../../domain/types/recommendation.js';

function asRecommendation(v: unknown): Recommendation {
  const s = String(v ?? '');
  if (
    s === 'Strong Match' ||
    s === 'Good Option' ||
    s === 'Mixed Signals' ||
    s === 'High Risk'
  ) {
    return s;
  }
  return 'Mixed Signals';
}

export class ApplyOverridesHandler {
  constructor(
    private readonly scoreRepository: RadarScoreRepository,
    private readonly findingRepository: RadarFindingRepository,
    private readonly signalRepository: RadarSignalRepository,
    private readonly reportRepository: RadarReportRepository,
    private readonly overrideRuleEngine: OverrideRuleEngine,
  ) {}

  async execute(input: { scanId: string }): Promise<void> {
    const scores = await this.scoreRepository.getByScanId(input.scanId);
    const findings = await this.findingRepository.getByScanId(input.scanId);
    const signals = await this.signalRepository.findByScanId(input.scanId);

    if (!scores) {
      await this.reportRepository.updateOverrideAudit({
        scanId: input.scanId,
        overrideApplied: false,
      });
      return;
    }

    const recommendation = asRecommendation(scores.recommendation);

    const override = this.overrideRuleEngine.evaluate({
      signals,
      findings,
      recommendation,
    });

    if (!override.overrideApplied) {
      await this.reportRepository.updateOverrideAudit({
        scanId: input.scanId,
        overrideApplied: false,
      });
      return;
    }

    const newRecommendation = this.overrideRuleEngine.applyRecommendationCeiling(
      recommendation,
      override.overrideCeiling!,
    );

    await this.scoreRepository.saveScores({
      scanId: input.scanId,
      employerScore: Number(scores.employerScore ?? 0),
      offerScore: Number(scores.offerScore ?? 0),
      marketPayScore: Number(scores.marketPayScore ?? 0),
      benefitsScore: Number(scores.benefitsScore ?? 0),
      cultureFitScore: Number(scores.cultureFitScore ?? 0),
      riskScore: Number(scores.riskScore ?? 0),
      recommendation: newRecommendation,
      confidenceOverall: asConfidenceOverall(scores.confidenceOverall),
    });

    await this.reportRepository.updateOverrideAudit({
      scanId: input.scanId,
      overrideApplied: true,
      overrideId: override.overrideId,
      overrideReason: override.overrideReason,
      overrideConfidence: override.overrideConfidence,
      overrideCeiling: override.overrideCeiling,
    });

    const severeFindings = findings.filter(
      (f) => String(f.severity) === 'severe' || String(f.code) === 'REGISTRY_INACTIVE',
    );

    for (const finding of severeFindings) {
      await this.findingRepository.updateVisibility({
        findingId: String(finding.id),
        visibility: 'pending_review',
        reviewReason: 'Auto-held due to override threshold',
        reviewedBy: null,
      });
    }
  }
}

function asConfidenceOverall(v: unknown): 'low' | 'medium' | 'high' {
  const s = String(v ?? 'medium');
  if (s === 'low' || s === 'medium' || s === 'high') return s;
  return 'medium';
}
