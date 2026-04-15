import type { JobRadarScanProgressView, ScanStatus } from '../api/job-radar.types';

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

/** Maps tRPC `jobRadar.getScanStatus` output to UI view (snake_case timestamps for components). */
export function normalizeJobRadarScan(raw: Record<string, unknown>): JobRadarScanProgressView {
  const progress = (raw.progress ?? {}) as JobRadarScanProgressView['progress'];
  return {
    scan_id: String(raw.scanId ?? ''),
    report_id: raw.reportId != null ? String(raw.reportId) : null,
    status: asScanStatus(raw.status),
    scan_trigger: raw.scanTrigger != null ? String(raw.scanTrigger) : undefined,
    fingerprint: raw.fingerprint != null ? String(raw.fingerprint) : undefined,
    progress: {
      employer_scan: progress?.employer_scan ?? 'pending',
      offer_parse: progress?.offer_parse ?? 'pending',
      benchmark: progress?.benchmark ?? 'pending',
      reviews: progress?.reviews ?? 'pending',
      scoring: progress?.scoring ?? 'pending',
      report_compose: progress?.report_compose ?? 'pending',
    },
    started_at: toIso(raw.startedAt),
    last_updated_at: toIso(raw.lastUpdatedAt),
    failed_reason: raw.failedReason != null ? String(raw.failedReason) : null,
  };
}
