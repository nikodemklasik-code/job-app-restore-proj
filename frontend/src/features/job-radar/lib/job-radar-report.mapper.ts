import type {
  ConfidenceLevel,
  ConfidenceSummary,
  FreshnessBlock,
  FreshnessStatus,
  JobRadarReportView,
  NextBestAction,
  OverrideAudit,
  RecommendationLabel,
  RedFlag,
  ScanStatus,
  ScoreDriverGroup,
  ScoreSet,
  SourceItem,
} from '../api/job-radar.types';

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

function num(v: unknown): number {
  if (v == null) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function toIso(v: unknown): string {
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'string') return v;
  return new Date(0).toISOString();
}

function asConfidence(v: unknown): ConfidenceLevel {
  if (v === 'low' || v === 'medium' || v === 'high') return v;
  return 'low';
}

function asScanStatus(v: unknown): ScanStatus {
  if (
    v === 'processing' ||
    v === 'partial_report' ||
    v === 'ready' ||
    v === 'sources_blocked' ||
    v === 'scan_failed'
  ) {
    return v;
  }
  return 'processing';
}

function asFreshnessStatus(v: unknown): FreshnessStatus {
  if (v === 'fresh' || v === 'acceptable' || v === 'stale') return v;
  return 'acceptable';
}

function emptyScoreDrivers(): Record<string, ScoreDriverGroup> {
  const emptyGroup = (): ScoreDriverGroup => ({
    positive_drivers: [],
    negative_drivers: [],
    neutral_constraints: [],
  });
  return {
    employer_score: emptyGroup(),
    offer_score: emptyGroup(),
    market_pay_score: emptyGroup(),
    benefits_score: emptyGroup(),
    culture_fit_score: emptyGroup(),
    risk_score: emptyGroup(),
  };
}

function normalizeScoreDrivers(raw: unknown): Record<string, ScoreDriverGroup> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return emptyScoreDrivers();
  const out: Record<string, ScoreDriverGroup> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const g = asRecord(v);
    out[k] = {
      positive_drivers: Array.isArray(g.positive_drivers) ? (g.positive_drivers as ScoreDriverGroup['positive_drivers']) : [],
      negative_drivers: Array.isArray(g.negative_drivers) ? (g.negative_drivers as ScoreDriverGroup['negative_drivers']) : [],
      neutral_constraints: Array.isArray(g.neutral_constraints)
        ? (g.neutral_constraints as ScoreDriverGroup['neutral_constraints'])
        : [],
    };
  }
  return { ...emptyScoreDrivers(), ...out };
}

function normalizeSources(raw: unknown): SourceItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((row) => {
    const s = asRecord(row);
    const t = num(s.tier ?? s.source_quality_tier);
    const tier = (t >= 1 && t <= 3 ? t : 1) as 1 | 2 | 3;
    return {
      source_id: String(s.source_id ?? s.sourceId ?? ''),
      type: String(s.type ?? s.source_type ?? ''),
      url: String(s.url ?? s.source_url ?? ''),
      tier,
      collected_at: toIso(s.collected_at ?? s.collectedAt),
      source_cluster_id: s.source_cluster_id != null ? String(s.source_cluster_id) : null,
    };
  });
}

function normalizeKeyFindings(raw: unknown): JobRadarReportView['key_findings'] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    if (typeof item === 'string') return { title: item, summary: '' };
    const o = asRecord(item);
    return { title: String(o.title ?? ''), summary: String(o.summary ?? '') };
  });
}

function normalizeRedFlags(raw: unknown): RedFlag[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const o = asRecord(item);
    return {
      id: o.id != null ? String(o.id) : null,
      code: o.code != null ? String(o.code) : null,
      label: String(o.label ?? o.title ?? ''),
      severity: (['low', 'medium', 'high', 'severe'].includes(String(o.severity))
        ? o.severity
        : 'medium') as RedFlag['severity'],
      confidence: asConfidence(o.confidence),
    };
  });
}

function normalizeMissingData(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((x) => String(x));
}

/** Maps tRPC `jobRadar.getReport` payload (Drizzle row + composer fields) to a stable UI model. */
export function normalizeJobRadarReport(raw: Record<string, unknown>): JobRadarReportView {
  const details = asRecord(raw.detailsJson);
  const summary = asRecord(raw.summaryJson);

  const scoresFromDetails = asRecord(details.scores);
  const scoresFromSummary = asRecord(summary.scores);
  const scores: ScoreSet = {
    employer_score: num(scoresFromDetails.employer_score ?? scoresFromSummary.employer_score),
    offer_score: num(scoresFromDetails.offer_score ?? scoresFromSummary.offer_score),
    market_pay_score: num(scoresFromDetails.market_pay_score ?? scoresFromSummary.market_pay_score),
    benefits_score: num(scoresFromDetails.benefits_score ?? scoresFromSummary.benefits_score),
    culture_fit_score: num(scoresFromDetails.culture_fit_score ?? scoresFromSummary.culture_fit_score),
    risk_score: num(scoresFromDetails.risk_score ?? scoresFromSummary.risk_score),
  };

  const confidenceRaw = asRecord(raw.confidenceSummary ?? details.confidence_summary);
  const confidence_summary: ConfidenceSummary = {
    overall: asConfidence(confidenceRaw.overall),
    salary: confidenceRaw.salary != null ? asConfidence(confidenceRaw.salary) : undefined,
    benefits: confidenceRaw.benefits != null ? asConfidence(confidenceRaw.benefits) : undefined,
    reputation: confidenceRaw.reputation != null ? asConfidence(confidenceRaw.reputation) : undefined,
    fit: confidenceRaw.fit != null ? asConfidence(confidenceRaw.fit) : undefined,
  };

  const recommendation = String(
    summary.recommendation ?? details.recommendation ?? 'Mixed Signals',
  ) as RecommendationLabel;

  const score_drivers = normalizeScoreDrivers(details.score_drivers);

  const key_findings =
    normalizeKeyFindings(raw.keyFindings).length > 0
      ? normalizeKeyFindings(raw.keyFindings)
      : normalizeKeyFindings(details.key_findings);

  const red_flags = normalizeRedFlags(raw.redFlags ?? details.red_flags);

  const missing_data = normalizeMissingData(raw.missingData ?? details.missing_data);

  const nextRaw = raw.nextBestAction ?? details.next_best_action;
  let next_best_action: NextBestAction | undefined;
  if (nextRaw && typeof nextRaw === 'object' && !Array.isArray(nextRaw)) {
    const n = asRecord(nextRaw);
    const t = String(n.type ?? 'none');
    if (t === 'complete_profile' || t === 'rescan' || t === 'compare' || t === 'review_missing_data' || t === 'none') {
      next_best_action = { type: t, label: String(n.label ?? '') };
    }
  }

  const benchmarkRaw = raw.benchmarkProvenance;
  let benchmark_provenance: JobRadarReportView['benchmark_provenance'] = null;
  if (benchmarkRaw && typeof benchmarkRaw === 'object' && !Array.isArray(benchmarkRaw)) {
    const b = asRecord(benchmarkRaw);
    benchmark_provenance = {
      benchmark_region: b.benchmark_region != null ? String(b.benchmark_region) : undefined,
      benchmark_period: b.benchmark_period != null ? String(b.benchmark_period) : undefined,
      sample_size: b.sample_size != null ? num(b.sample_size) : undefined,
      source_mix: Array.isArray(b.source_mix) ? b.source_mix.map(String) : undefined,
      normalization_version: b.normalization_version != null ? String(b.normalization_version) : undefined,
    };
  }

  const freshness: FreshnessBlock = {
    last_scanned_at: toIso(raw.lastScannedAt),
    freshness_hours: Math.round(num(raw.freshnessHours)),
    freshness_status: asFreshnessStatus(raw.freshnessStatus),
    auto_rescan_eligible: Boolean(raw.autoRescanEligible),
    rescan_recommended: Boolean(raw.rescanRecommended),
  };

  const override: OverrideAudit | undefined =
    raw.overrideApplied != null
      ? {
          override_applied: Boolean(raw.overrideApplied),
          override_id: raw.overrideId != null ? String(raw.overrideId) : null,
          override_reason: raw.overrideReason != null ? String(raw.overrideReason) : null,
          override_confidence:
            raw.overrideConfidence != null ? asConfidence(raw.overrideConfidence) : null,
        }
      : undefined;

  const employerBlock = asRecord(details.employer ?? summary.employer);
  const jobBlock = asRecord(details.job ?? summary.job);

  return {
    report_id: String(raw.id ?? ''),
    scan_id: String(raw.scanId ?? ''),
    status: asScanStatus(raw.status),
    scoring_version: String(raw.scoringVersion ?? ''),
    parser_version: String(raw.parserVersion ?? ''),
    employer:
      Object.keys(employerBlock).length > 0
        ? {
            name: employerBlock.name != null ? String(employerBlock.name) : undefined,
            industry: employerBlock.industry != null ? String(employerBlock.industry) : undefined,
            size_band: employerBlock.size_band != null ? String(employerBlock.size_band) : undefined,
          }
        : undefined,
    job:
      Object.keys(jobBlock).length > 0
        ? {
            title: jobBlock.title != null ? String(jobBlock.title) : undefined,
            location: jobBlock.location != null ? String(jobBlock.location) : undefined,
            work_mode: jobBlock.work_mode != null ? String(jobBlock.work_mode) : undefined,
          }
        : undefined,
    scores,
    recommendation,
    score_drivers,
    confidence_summary,
    freshness,
    missing_data,
    red_flags,
    key_findings,
    next_best_action,
    benchmark_provenance,
    sources: normalizeSources(raw.sourcesJson),
    override,
  };
}
