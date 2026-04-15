'use client';

import type { JobRadarReportView } from '../api/job-radar.types';

export function VerifiedInfoSection({ report }: { report: JobRadarReportView }) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
      <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">Verified public information</h2>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
        Public facts from structured or official sources.
      </p>

      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="font-medium text-neutral-900 dark:text-neutral-100">Company facts</h3>
          <dl className="mt-2 space-y-2 text-sm text-neutral-800 dark:text-neutral-200">
            <div>
              <dt className="text-neutral-500 dark:text-neutral-400">Employer</dt>
              <dd>{report.employer?.name ?? 'Unknown'}</dd>
            </div>
            <div>
              <dt className="text-neutral-500 dark:text-neutral-400">Industry</dt>
              <dd>{report.employer?.industry ?? 'Unknown'}</dd>
            </div>
            <div>
              <dt className="text-neutral-500 dark:text-neutral-400">Size band</dt>
              <dd>{report.employer?.size_band ?? 'Unknown'}</dd>
            </div>
          </dl>
        </div>

        <div>
          <h3 className="font-medium text-neutral-900 dark:text-neutral-100">Offer facts</h3>
          <dl className="mt-2 space-y-2 text-sm text-neutral-800 dark:text-neutral-200">
            <div>
              <dt className="text-neutral-500 dark:text-neutral-400">Job title</dt>
              <dd>{report.job?.title ?? 'Unknown'}</dd>
            </div>
            <div>
              <dt className="text-neutral-500 dark:text-neutral-400">Location</dt>
              <dd>{report.job?.location ?? 'Unknown'}</dd>
            </div>
            <div>
              <dt className="text-neutral-500 dark:text-neutral-400">Work mode</dt>
              <dd>{report.job?.work_mode ?? 'Unknown'}</dd>
            </div>
          </dl>
        </div>
      </div>

      {report.benchmark_provenance && (
        <div className="mt-6">
          <h3 className="font-medium text-neutral-900 dark:text-neutral-100">Benchmark provenance</h3>
          <dl className="mt-2 grid gap-2 text-sm text-neutral-800 dark:text-neutral-200 sm:grid-cols-2">
            <div>
              <dt className="text-neutral-500 dark:text-neutral-400">Region</dt>
              <dd>{report.benchmark_provenance.benchmark_region ?? 'Unknown'}</dd>
            </div>
            <div>
              <dt className="text-neutral-500 dark:text-neutral-400">Period</dt>
              <dd>{report.benchmark_provenance.benchmark_period ?? 'Unknown'}</dd>
            </div>
            <div>
              <dt className="text-neutral-500 dark:text-neutral-400">Sample size</dt>
              <dd>{report.benchmark_provenance.sample_size ?? 'Unknown'}</dd>
            </div>
            <div>
              <dt className="text-neutral-500 dark:text-neutral-400">Normalization</dt>
              <dd>{report.benchmark_provenance.normalization_version ?? 'Unknown'}</dd>
            </div>
          </dl>
        </div>
      )}
    </section>
  );
}
