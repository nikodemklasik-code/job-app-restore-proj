'use client';

import type { FreshnessStatus } from '../api/job-radar.types';

export function FreshnessBadge({ status }: { status: FreshnessStatus }) {
  const label = status[0].toUpperCase() + status.slice(1);
  return (
    <span className="rounded-md border border-neutral-200 px-2 py-1 text-xs text-neutral-700 dark:border-neutral-700 dark:text-neutral-200">
      {label}
    </span>
  );
}
