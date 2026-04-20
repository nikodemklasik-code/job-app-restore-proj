import type { RadarScanEntity } from '../domain/entities/radar-scan.entity.js';

/** OpenAPI `ProgressStageState` (no `skipped` — entity may emit `skipped`). */
export type OpenApiProgressStageState = 'pending' | 'processing' | 'done' | 'partial' | 'blocked' | 'failed';

/** OpenAPI `ScanProgress` wire shape (snake_case keys per job-radar-openapi-v1.1.yaml). */
export type ScanProgressWire = {
  input_normalization: OpenApiProgressStageState;
  employer_resolution: OpenApiProgressStageState;
  source_collection: OpenApiProgressStageState;
  offer_parsing: OpenApiProgressStageState;
  benchmarking: OpenApiProgressStageState;
  fit_scoring: OpenApiProgressStageState;
  report_generation: OpenApiProgressStageState;
};

function internalStageToOpenApi(v: string): OpenApiProgressStageState {
  if (v === 'skipped') return 'pending';
  if (v === 'pending' || v === 'processing' || v === 'done' || v === 'partial' || v === 'blocked' || v === 'failed') {
    return v;
  }
  return 'pending';
}

/** OpenAPI `ScanAcceptedResponse` wire shape (snake_case). */
export type ScanAcceptedResponseWire = {
  scan_id: string;
  status: string;
  quota_remaining: number;
  idempotency_reused: boolean;
  report_id?: string;
  estimated_report_type?: 'full' | 'partial' | 'unknown';
};

export class JobRadarHttpMapper {
  /** Maps handler result (camelCase) to OpenAPI `ScanAcceptedResponse` property names. */
  static toScanAcceptedResponse(input: {
    scanId: string;
    reportId?: string;
    status: string;
    quotaRemaining?: number;
    idempotencyReused?: boolean;
  }): ScanAcceptedResponseWire {
    const out: ScanAcceptedResponseWire = {
      scan_id: input.scanId,
      status: input.status,
      quota_remaining: input.quotaRemaining ?? 0,
      idempotency_reused: input.idempotencyReused ?? false,
    };
    if (input.reportId) out.report_id = input.reportId;
    return out;
  }

  /**
   * Maps domain scan + optional `reportId` to OpenAPI `ScanProgressResponse` wire shape.
   * Progress keys follow the YAML schema; internal pipeline stages are folded as:
   * - `input_normalization`: `done` once employer work has left `pending`, else `pending`
   * - `employer_resolution` ← `employer_scan`
   * - `source_collection` ← `reviews`
   * - `offer_parsing` ← `offer_parse`
   * - `benchmarking` ← `benchmark`
   * - `fit_scoring` ← `scoring`
   * - `report_generation` ← `report_compose`
   */
  static toScanProgressResponseWire(scan: RadarScanEntity & { reportId?: string | null }): {
    scan_id: string;
    status: string;
    scan_trigger: string;
    fingerprint: string;
    progress: ScanProgressWire;
    started_at: string;
    last_updated_at: string;
    partial_report_id: string | null;
    failed_reason: string | null;
  } {
    const p = scan.progress;
    const inputNormalization: OpenApiProgressStageState =
      p.employer_scan !== 'pending' && p.employer_scan !== 'skipped' ? 'done' : 'pending';
    return {
      scan_id: scan.id,
      status: scan.status,
      scan_trigger: scan.scanTrigger,
      fingerprint: scan.entityFingerprint,
      progress: {
        input_normalization: inputNormalization,
        employer_resolution: internalStageToOpenApi(p.employer_scan),
        source_collection: internalStageToOpenApi(p.reviews),
        offer_parsing: internalStageToOpenApi(p.offer_parse),
        benchmarking: internalStageToOpenApi(p.benchmark),
        fit_scoring: internalStageToOpenApi(p.scoring),
        report_generation: internalStageToOpenApi(p.report_compose),
      },
      started_at: scan.startedAt.toISOString(),
      last_updated_at: scan.lastUpdatedAt.toISOString(),
      partial_report_id: scan.reportId ?? null,
      failed_reason: scan.failedReason ?? null,
    };
  }
}
