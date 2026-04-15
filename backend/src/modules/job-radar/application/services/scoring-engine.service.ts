import { randomUUID } from 'node:crypto';
import type { RadarSignalRepository } from '../../domain/repositories/radar-signal.repository.js';
import type { RadarScoreRepository } from '../../domain/repositories/radar-score.repository.js';
import type { RadarFindingRepository } from '../../domain/repositories/radar-finding.repository.js';
import type { RadarBenchmarkRepository } from '../../domain/repositories/radar-benchmark.repository.js';
import type { CreateFindingInput } from '../../domain/repositories/radar-finding.repository.js';
import {
  buildConfidenceOverall,
  capLowConfidenceDrivers,
  clampScore,
  deriveRecommendation,
} from './scoring.helpers.js';
import type { Driver, FullScoringResult, MetricScoreResult } from './scoring.types.js';

function str(v: unknown): string {
  return v == null ? '' : String(v);
}

export class ScoringEngineService {
  constructor(
    private readonly signalRepository: RadarSignalRepository,
    private readonly scoreRepository: RadarScoreRepository,
    private readonly findingRepository: RadarFindingRepository,
    private readonly benchmarkRepository: RadarBenchmarkRepository,
  ) {}

  async compute(scanId: string): Promise<FullScoringResult> {
    const signalsRaw = await this.signalRepository.findByScanId(scanId);
    const signals = signalsRaw.filter((s) => s.isConflicted !== true);

    const employerScore = this.computeEmployerScore(signals);
    const offerScore = this.computeOfferScore(signals);
    const marketPayScore = await this.computeMarketPayScoreWithBenchmark(scanId, signals);
    const benefitsScore = this.computeBenefitsScore(signals);
    const cultureFitScore = this.computeCultureFitScore(signals);
    const riskScore = this.computeRiskScore(signals);

    const finalEmployerScore = clampScore(capLowConfidenceDrivers(50, employerScore.drivers));
    const finalOfferScore = clampScore(capLowConfidenceDrivers(50, offerScore.drivers));
    const finalMarketPayScore = clampScore(capLowConfidenceDrivers(30, marketPayScore.drivers));
    const finalBenefitsScore = clampScore(capLowConfidenceDrivers(30, benefitsScore.drivers));
    const finalCultureFitScore = clampScore(capLowConfidenceDrivers(50, cultureFitScore.drivers));
    const finalRiskScore = clampScore(capLowConfidenceDrivers(20, riskScore.drivers));

    const recommendation = deriveRecommendation({
      employerScore: finalEmployerScore,
      offerScore: finalOfferScore,
      marketPayScore: finalMarketPayScore,
      benefitsScore: finalBenefitsScore,
      cultureFitScore: finalCultureFitScore,
      riskScore: finalRiskScore,
    });

    const confidenceOverall = buildConfidenceOverall(
      [
        ...employerScore.drivers,
        ...offerScore.drivers,
        ...marketPayScore.drivers,
        ...benefitsScore.drivers,
        ...cultureFitScore.drivers,
        ...riskScore.drivers,
      ].map((d) => d.confidence),
    );

    await this.scoreRepository.saveScores({
      scanId,
      employerScore: finalEmployerScore,
      offerScore: finalOfferScore,
      marketPayScore: finalMarketPayScore,
      benefitsScore: finalBenefitsScore,
      cultureFitScore: finalCultureFitScore,
      riskScore: finalRiskScore,
      recommendation,
      confidenceOverall,
    });

    await this.scoreRepository.replaceDrivers(scanId, [
      ...this.persistableDrivers(scanId, 'employer_score', employerScore.drivers),
      ...this.persistableDrivers(scanId, 'offer_score', offerScore.drivers),
      ...this.persistableDrivers(scanId, 'market_pay_score', marketPayScore.drivers),
      ...this.persistableDrivers(scanId, 'benefits_score', benefitsScore.drivers),
      ...this.persistableDrivers(scanId, 'culture_fit_score', cultureFitScore.drivers),
      ...this.persistableDrivers(scanId, 'risk_score', riskScore.drivers),
    ]);

    const findings = this.buildFindings(scanId, signals, {
      offerScore: finalOfferScore,
      riskScore: finalRiskScore,
      marketPayScore: finalMarketPayScore,
      recommendation,
    });

    await this.findingRepository.replaceByScanId(scanId, findings);

    return {
      employerScore: { score: finalEmployerScore, drivers: employerScore.drivers },
      offerScore: { score: finalOfferScore, drivers: offerScore.drivers },
      marketPayScore: { score: finalMarketPayScore, drivers: marketPayScore.drivers },
      benefitsScore: { score: finalBenefitsScore, drivers: benefitsScore.drivers },
      cultureFitScore: { score: finalCultureFitScore, drivers: cultureFitScore.drivers },
      riskScore: { score: finalRiskScore, drivers: riskScore.drivers },
      recommendation,
      confidenceOverall,
    };
  }

  private computeEmployerScore(signals: Record<string, unknown>[]): MetricScoreResult {
    const drivers: Driver[] = [];

    const hasOfficialSourceSignals = signals.some((s) => str(s.signalScope) === 'employer');
    if (hasOfficialSourceSignals) {
      drivers.push({
        label: 'Employer profile has public company information',
        impact: 8,
        confidence: 'medium',
        driverType: 'positive',
      });
    }

    const missingEmployerSignals = signals.filter(
      (s) => str(s.signalScope) === 'employer' && s.isMissingData === true,
    );
    if (missingEmployerSignals.length > 0) {
      drivers.push({
        label: 'Limited public employer information',
        impact: -6,
        confidence: 'low',
        driverType: 'negative',
      });
    }

    return { score: 0, drivers };
  }

  private computeOfferScore(signals: Record<string, unknown>[]): MetricScoreResult {
    const drivers: Driver[] = [];

    const hasWorkMode = signals.some((s) => str(s.signalKey) === 'work_mode');
    if (hasWorkMode) {
      drivers.push({
        label: 'Job listing clearly states work mode',
        impact: 8,
        confidence: 'medium',
        driverType: 'positive',
      });
    }

    const salaryMissing = signals.some((s) => str(s.signalKey) === 'salary_missing');
    if (salaryMissing) {
      drivers.push({
        label: 'Salary is not clearly stated',
        impact: -10,
        confidence: 'high',
        driverType: 'negative',
      });
    }

    const benefitSignals = signals.filter(
      (s) => str(s.signalScope) === 'offer' && str(s.category) === 'benefits',
    );
    if (benefitSignals.length >= 2) {
      drivers.push({
        label: 'Listing includes several benefits',
        impact: 10,
        confidence: 'medium',
        driverType: 'positive',
      });
    }

    return { score: 0, drivers };
  }

  private async computeMarketPayScoreWithBenchmark(
    scanId: string,
    signals: Record<string, unknown>[],
  ): Promise<MetricScoreResult> {
    const drivers: Driver[] = [];
    const benchmark = await this.benchmarkRepository.getByScanId(scanId);

    const salaryMin = signals.find((s) => str(s.signalKey) === 'salary_min');
    const salaryMax = signals.find((s) => str(s.signalKey) === 'salary_max');

    const toNum = (v: unknown): number => {
      if (v == null) return NaN;
      const n = Number(v);
      return Number.isFinite(n) ? n : NaN;
    };

    const benchConfidence = (v: unknown): Driver['confidence'] =>
      v === 'low' || v === 'medium' || v === 'high' ? v : 'low';

    if (!benchmark) {
      drivers.push({
        label: 'No benchmark available yet',
        impact: -4,
        confidence: 'high',
        driverType: 'negative',
      });
      return { score: 0, drivers };
    }

    if (!salaryMin || !salaryMax || benchmark.salaryMedian == null) {
      drivers.push({
        label: 'Salary cannot be compared reliably against benchmark',
        impact: -6,
        confidence: 'high',
        driverType: 'negative',
      });
      return { score: 0, drivers };
    }

    const avg =
      (toNum(salaryMin.signalValueNumber) + toNum(salaryMax.signalValueNumber)) / 2;
    const median = toNum(benchmark.salaryMedian);
    const p25 = toNum(benchmark.salaryP25);
    const p75 = toNum(benchmark.salaryP75);

    if (!Number.isFinite(avg) || !Number.isFinite(median)) {
      drivers.push({
        label: 'Salary cannot be compared reliably against benchmark',
        impact: -6,
        confidence: 'high',
        driverType: 'negative',
      });
      return { score: 0, drivers };
    }

    const conf = benchConfidence(benchmark.confidence);

    if (avg >= p75) {
      drivers.push({
        label: 'Salary is above upper benchmark range',
        impact: 22,
        confidence: conf,
        driverType: 'positive',
      });
    } else if (avg >= median) {
      drivers.push({
        label: 'Salary is around or above benchmark median',
        impact: 12,
        confidence: conf,
        driverType: 'positive',
      });
    } else if (avg >= p25) {
      drivers.push({
        label: 'Salary is below benchmark median',
        impact: -6,
        confidence: conf,
        driverType: 'negative',
      });
    } else {
      drivers.push({
        label: 'Salary is below lower benchmark range',
        impact: -16,
        confidence: conf,
        driverType: 'negative',
      });
    }

    return { score: 0, drivers };
  }

  private computeBenefitsScore(signals: Record<string, unknown>[]): MetricScoreResult {
    const drivers: Driver[] = [];
    const benefits = signals.filter((s) => str(s.category) === 'benefits');

    if (benefits.length === 0) {
      drivers.push({
        label: 'No clear benefits information found',
        impact: -6,
        confidence: 'medium',
        driverType: 'negative',
      });
    } else if (benefits.length >= 3) {
      drivers.push({
        label: 'Benefits package looks relatively rich',
        impact: 14,
        confidence: 'medium',
        driverType: 'positive',
      });
    } else {
      drivers.push({
        label: 'Some benefits are listed',
        impact: 6,
        confidence: 'medium',
        driverType: 'positive',
      });
    }

    return { score: 0, drivers };
  }

  private computeCultureFitScore(signals: Record<string, unknown>[]): MetricScoreResult {
    const drivers: Driver[] = [];

    const workMode = signals.find((s) => str(s.signalKey) === 'work_mode');
    if (workMode) {
      drivers.push({
        label: `Work mode detected: ${str(workMode.signalValueText)}`,
        impact: 6,
        confidence: 'medium',
        driverType: 'positive',
      });
    } else {
      drivers.push({
        label: 'Too little information to assess work style fit',
        impact: -4,
        confidence: 'low',
        driverType: 'negative',
      });
    }

    return { score: 0, drivers };
  }

  private computeRiskScore(signals: Record<string, unknown>[]): MetricScoreResult {
    const drivers: Driver[] = [];

    const salaryMissing = signals.some((s) => str(s.signalKey) === 'salary_missing');
    if (salaryMissing) {
      drivers.push({
        label: 'Missing salary transparency',
        impact: 8,
        confidence: 'high',
        driverType: 'negative',
      });
    }

    const missingDataCount = signals.filter((s) => s.isMissingData === true).length;
    if (missingDataCount >= 2) {
      drivers.push({
        label: 'Several important fields are missing',
        impact: 6,
        confidence: 'medium',
        driverType: 'negative',
      });
    }

    return { score: 0, drivers };
  }

  private persistableDrivers(scanId: string, scoreName: string, drivers: Driver[]) {
    return drivers.map((driver) => ({
      id: randomUUID(),
      scanId,
      scoreName,
      driverType: driver.driverType,
      label: driver.label,
      impact: driver.impact,
      confidence: driver.confidence,
      sourceId: driver.sourceId ?? null,
      sourceRef: driver.sourceRef ?? null,
    }));
  }

  private buildFindings(
    scanId: string,
    signals: Record<string, unknown>[],
    scoring: {
      offerScore: number;
      riskScore: number;
      marketPayScore: number;
      recommendation: FullScoringResult['recommendation'];
    },
  ): CreateFindingInput[] {
    const findings: CreateFindingInput[] = [];

    if (scoring.offerScore >= 60) {
      findings.push({
        id: randomUUID(),
        scanId,
        findingType: 'positive',
        code: 'OFFER_CLARITY_OK',
        title: 'Offer has usable detail',
        summary: 'The job listing includes enough information to assess some key conditions.',
        severity: 'low',
        confidence: 'medium',
      });
    }

    if (signals.some((s) => str(s.signalKey) === 'salary_missing')) {
      findings.push({
        id: randomUUID(),
        scanId,
        findingType: 'red_flag',
        code: 'SALARY_MISSING',
        title: 'Salary not listed',
        summary: 'The job listing does not clearly disclose salary information.',
        severity: 'medium',
        confidence: 'high',
      });
    }

    if (scoring.riskScore >= 40) {
      findings.push({
        id: randomUUID(),
        scanId,
        findingType: 'warning',
        code: 'ELEVATED_RISK',
        title: 'Elevated risk signal',
        summary: 'Transparency gaps or missing fields reduce confidence in the listing.',
        severity: 'medium',
        confidence: 'medium',
      });
    }

    if (signals.some((s) => str(s.signalKey) === 'fake_or_inactive_company_signal')) {
      findings.push({
        id: randomUUID(),
        scanId,
        findingType: 'red_flag',
        code: 'REGISTRY_INACTIVE',
        title: 'Registry status raises concern',
        summary: 'The employer appears inactive or mismatched in registry data.',
        severity: 'severe',
        confidence: 'high',
      });
    }

    // Final market pay uses base 30 + drivers (capLowConfidenceDrivers). Best case is 30 + 22 = 52
    // (p75+ salary vs benchmark with non-low benchmark confidence). Median-or-better tier is 30 + 12 = 42.
    // A threshold of 60 was never reachable; keep this at or below 52 so strong matches can surface.
    if (scoring.marketPayScore >= 42) {
      findings.push({
        id: randomUUID(),
        scanId,
        findingType: 'benchmark',
        code: 'PAY_BENCHMARK_OK',
        title: 'Pay compares reasonably to benchmark',
        summary: 'The advertised salary appears aligned with benchmark expectations.',
        severity: 'low',
        confidence: 'low',
      });
    }

    if (findings.length === 0) {
      findings.push({
        id: randomUUID(),
        scanId,
        findingType: 'positive',
        code: 'INITIAL_ASSESSMENT',
        title: 'Initial JobRadar assessment generated',
        summary: `Recommendation: ${scoring.recommendation}.`,
        severity: 'low',
        confidence: 'low',
      });
    }

    return findings;
  }
}
