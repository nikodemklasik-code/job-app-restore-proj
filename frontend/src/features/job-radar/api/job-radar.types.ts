export type ScanStatus =
  | 'processing'
  | 'partial_report'
  | 'ready'
  | 'sources_blocked'
  | 'scan_failed';

export type ConfidenceLevel = 'low' | 'medium' | 'high';
export type FreshnessStatus = 'fresh' | 'acceptable' | 'stale';
export type RecommendationLabel =
  | 'Strong Match'
  | 'Good Option'
  | 'Mixed Signals'
  | 'High Risk';

export type ScoreDriver = {
  label: string;
  impact: number;
  confidence: ConfidenceLevel;
  source_ref?: string | null;
};

export type ScoreDriverGroup = {
  positive_drivers: ScoreDriver[];
  negative_drivers: ScoreDriver[];
  neutral_constraints: ScoreDriver[];
};

export type ScoreSet = {
  employer_score: number;
  offer_score: number;
  market_pay_score: number;
  benefits_score: number;
  culture_fit_score: number;
  risk_score: number;
};

export type FreshnessBlock = {
  last_scanned_at: string;
  freshness_hours: number;
  freshness_status: FreshnessStatus;
  auto_rescan_eligible: boolean;
  rescan_recommended?: boolean;
};

export type ConfidenceSummary = {
  overall: ConfidenceLevel;
  salary?: ConfidenceLevel;
  benefits?: ConfidenceLevel;
  reputation?: ConfidenceLevel;
  fit?: ConfidenceLevel;
};

export type RedFlag = {
  id?: string | null;
  code?: string | null;
  label: string;
  severity: 'low' | 'medium' | 'high' | 'severe';
  confidence: ConfidenceLevel;
};

export type SourceItem = {
  source_id: string;
  type: string;
  url: string;
  tier: 1 | 2 | 3;
  collected_at: string;
  source_cluster_id?: string | null;
};

export type NextBestAction = {
  type: 'complete_profile' | 'rescan' | 'compare' | 'review_missing_data' | 'none';
  label: string;
};

export type OverrideAudit = {
  override_applied: boolean;
  override_id?: string | null;
  override_reason?: string | null;
  override_confidence?: ConfidenceLevel | null;
};

export type JobRadarReportView = {
  report_id: string;
  scan_id: string;
  status: ScanStatus;
  scoring_version: string;
  parser_version: string;
  employer?: {
    name?: string;
    industry?: string;
    size_band?: string;
  };
  job?: {
    title?: string;
    location?: string;
    work_mode?: string;
  };
  scores: ScoreSet;
  recommendation: RecommendationLabel;
  score_drivers: Record<string, ScoreDriverGroup>;
  confidence_summary: ConfidenceSummary;
  freshness: FreshnessBlock;
  missing_data: string[];
  red_flags: RedFlag[];
  key_findings: Array<{
    title: string;
    summary: string;
  }>;
  next_best_action?: NextBestAction;
  benchmark_provenance?: {
    benchmark_region?: string;
    benchmark_period?: string;
    sample_size?: number;
    source_mix?: string[];
    normalization_version?: string;
  } | null;
  sources: SourceItem[];
  override?: OverrideAudit;
};

export type JobRadarScanProgressView = {
  scan_id: string;
  report_id?: string | null;
  status: ScanStatus;
  scan_trigger?: string;
  fingerprint?: string;
  progress: {
    employer_scan: JobRadarScanStageState;
    offer_parse: JobRadarScanStageState;
    benchmark: JobRadarScanStageState;
    reviews: JobRadarScanStageState;
    scoring: JobRadarScanStageState;
    report_compose: JobRadarScanStageState;
  };
  started_at: string;
  last_updated_at: string;
  failed_reason?: string | null;
};

export type JobRadarScanStageState =
  | 'pending'
  | 'processing'
  | 'done'
  | 'partial'
  | 'failed'
  | 'skipped'
  | 'blocked';

export type CreateComplaintPayload = {
  reportId: string;
  findingId?: string | null;
  complaintType:
    | 'factual_inaccuracy'
    | 'outdated_information'
    | 'harmful_content'
    | 'legal_notice';
  message: string;
};

export type CreateComplaintResponse = {
  complaintId: string;
  status: 'open';
};

export type AdminComplaintItem = {
  id: string;
  reportId: string;
  scanId: string;
  findingId?: string | null;
  complaintType: string;
  status: string;
  message: string;
  createdAt: string;
};

export type StartScanPayload = {
  scanTrigger: 'saved_job' | 'manual_search' | 'url_input';
  employerName?: string;
  jobTitle?: string;
  location?: string;
  sourceUrl?: string;
  savedJobId?: string;
  jobPostId?: string | null;
  forceRescan?: boolean;
};

/** Matches OpenAPI `ScanAcceptedResponse` (snake_case) from `jobRadar.startScan` / `rescanReport`. */
export type StartScanResponse = {
  scan_id: string;
  report_id?: string;
  status: ScanStatus;
  quota_remaining: number;
  idempotency_reused?: boolean;
};
