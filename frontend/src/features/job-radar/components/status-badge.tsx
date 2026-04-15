'use client';

import type { ScanStatus } from '../api/job-radar.types';

const labelMap: Record<ScanStatus, string> = {
  processing: 'Processing',
  partial_report: 'Partial report',
  ready: 'Ready',
  sources_blocked: 'Sources blocked',
  scan_failed: 'Scan failed',
};

export function StatusBadge({ status }: { status: ScanStatus }) {
  return (
    <span className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs font-medium text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100">
      {labelMap[status]}
    </span>
  );
}
