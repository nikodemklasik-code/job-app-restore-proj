'use client';

import type { JobRadarScanProgressView } from '../api/job-radar.types';

const stageLabels: Record<keyof JobRadarScanProgressView['progress'], string> = {
  employer_scan: 'Employer scan',
  offer_parse: 'Offer parsing',
  benchmark: 'Benchmark',
  reviews: 'Reviews',
  scoring: 'Scoring',
  report_compose: 'Report compose',
};

export function ScanProgress({ scan }: { scan: JobRadarScanProgressView }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
      <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">JobRadar is scanning this employer</h1>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
        We are collecting public data and building your report.
      </p>

      <div className="mt-4 space-y-3">
        {Object.entries(scan.progress).map(([stage, state]) => (
          <div
            key={stage}
            className="flex items-center justify-between rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-700"
          >
            <span className="text-neutral-800 dark:text-neutral-200">{stageLabels[stage as keyof JobRadarScanProgressView['progress']]}</span>
            <span className="text-sm text-neutral-600 dark:text-neutral-400">{state}</span>
          </div>
        ))}
      </div>

      {scan.failed_reason && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{scan.failed_reason}</p>}
    </div>
  );
}
