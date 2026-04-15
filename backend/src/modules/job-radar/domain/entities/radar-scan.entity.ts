import type { ScanStatus } from '../types/scan-status.js';
import type { ScanTrigger } from '../types/scan-trigger.js';

export type ScanProgress = {
  employer_scan:
    | 'pending'
    | 'processing'
    | 'done'
    | 'partial'
    | 'failed'
    | 'skipped'
    | 'blocked';
  offer_parse:
    | 'pending'
    | 'processing'
    | 'done'
    | 'partial'
    | 'failed'
    | 'skipped'
    | 'blocked';
  benchmark:
    | 'pending'
    | 'processing'
    | 'done'
    | 'partial'
    | 'failed'
    | 'skipped'
    | 'blocked';
  reviews:
    | 'pending'
    | 'processing'
    | 'done'
    | 'partial'
    | 'failed'
    | 'skipped'
    | 'blocked';
  scoring:
    | 'pending'
    | 'processing'
    | 'done'
    | 'partial'
    | 'failed'
    | 'skipped'
    | 'blocked';
  report_compose:
    | 'pending'
    | 'processing'
    | 'done'
    | 'partial'
    | 'failed'
    | 'skipped'
    | 'blocked';
};

export class RadarScanEntity {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly scanTrigger: ScanTrigger,
    public status: ScanStatus,
    public readonly entityFingerprint: string,
    public readonly sourceFingerprint: string | null,
    public readonly inputPayload: Record<string, unknown>,
    public progress: ScanProgress,
    public readonly idempotencyKey: string | null,
    public employerId: string | null,
    public jobPostId: string | null,
    public readonly startedAt: Date,
    public lastUpdatedAt: Date,
    public completedAt: Date | null,
    public failedReason: string | null,
  ) {}

  static defaultProgress(): ScanProgress {
    return {
      employer_scan: 'pending',
      offer_parse: 'pending',
      benchmark: 'pending',
      reviews: 'pending',
      scoring: 'pending',
      report_compose: 'pending',
    };
  }
}
