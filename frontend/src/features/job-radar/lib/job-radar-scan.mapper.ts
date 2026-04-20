import type { JobRadarScanProgressView, JobRadarScanStageState, ScanStatus } from '../api/job-radar.types';

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

function toIso(v: unknown): string {
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'string') return v;
  return new Date(0).toISOString();
}

function asStage(v: unknown): JobRadarScanStageState {
  if (
    v === 'pending' ||
    v === 'processing' ||
    v === 'done' ||
    v === 'partial' ||
    v === 'failed' ||
    v === 'skipped' ||
    v === 'blocked'
  ) {
    return v;
  }
  return 'pending';
}

function isOpenApiWireProgress(p: Record<string, unknown>): boolean {
  return 'employer_resolution' in p && 'offer_parsing' in p;
}

/** Maps tRPC `jobRadar.getScanStatus` output to UI view (snake_case timestamps for components). */
export function normalizeJobRadarScan(raw: Record<string, unknown>): JobRadarScanProgressView {
  const progressRaw = (raw.progress ?? {}) as Record<string, unknown>;

  if (isOpenApiWireProgress(progressRaw)) {
    return {
      scan_id: String(raw.scan_id ?? raw.scanId ?? ''),
      report_id:
        raw.partial_report_id != null
          ? String(raw.partial_report_id)
          : raw.reportId != null
            ? String(raw.reportId)
            : null,
      status: asScanStatus(raw.status),
      scan_trigger:
        raw.scan_trigger != null ? String(raw.scan_trigger) : raw.scanTrigger != null ? String(raw.scanTrigger) : undefined,
      fingerprint: raw.fingerprint != null ? String(raw.fingerprint) : undefined,
      progress: {
        employer_scan: asStage(progressRaw.employer_resolution),
        offer_parse: asStage(progressRaw.offer_parsing),
        benchmark: asStage(progressRaw.benchmarking),
        reviews: asStage(progressRaw.source_collection),
        scoring: asStage(progressRaw.fit_scoring),
        report_compose: asStage(progressRaw.report_generation),
      },
      started_at: toIso(raw.started_at ?? raw.startedAt),
      last_updated_at: toIso(raw.last_updated_at ?? raw.lastUpdatedAt),
      failed_reason:
        raw.failed_reason != null ? String(raw.failed_reason) : raw.failedReason != null ? String(raw.failedReason) : null,
    };
  }

  const progress = progressRaw as JobRadarScanProgressView['progress'];
  return {
    scan_id: String(raw.scan_id ?? raw.scanId ?? ''),
    report_id:
      raw.partial_report_id != null
        ? String(raw.partial_report_id)
        : raw.reportId != null
          ? String(raw.reportId)
          : null,
    status: asScanStatus(raw.status),
    scan_trigger: raw.scan_trigger != null ? String(raw.scan_trigger) : raw.scanTrigger != null ? String(raw.scanTrigger) : undefined,
    fingerprint: raw.fingerprint != null ? String(raw.fingerprint) : undefined,
    progress: {
      employer_scan: asStage(progress?.employer_scan),
      offer_parse: asStage(progress?.offer_parse),
      benchmark: asStage(progress?.benchmark),
      reviews: asStage(progress?.reviews),
      scoring: asStage(progress?.scoring),
      report_compose: asStage(progress?.report_compose),
    },
    started_at: toIso(raw.started_at ?? raw.startedAt),
    last_updated_at: toIso(raw.last_updated_at ?? raw.lastUpdatedAt),
    failed_reason:
      raw.failed_reason != null ? String(raw.failed_reason) : raw.failedReason != null ? String(raw.failedReason) : null,
  };
}
