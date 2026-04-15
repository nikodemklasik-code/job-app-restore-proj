'use client';

import type { ConfidenceLevel } from '../api/job-radar.types';

export function ConfidenceBadge({ level }: { level: ConfidenceLevel }) {
  const label = level[0].toUpperCase() + level.slice(1);
  return (
    <span className="rounded-md border border-neutral-200 px-2 py-1 text-xs text-neutral-700 dark:border-neutral-700 dark:text-neutral-200">
      {label} confidence
    </span>
  );
}
