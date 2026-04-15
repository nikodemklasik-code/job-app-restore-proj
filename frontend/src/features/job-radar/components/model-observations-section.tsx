'use client';

import type { JobRadarReportView } from '../api/job-radar.types';

export function ModelObservationsSection({ report }: { report: JobRadarReportView }) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
      <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">Model observations</h2>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
        These are model-based observations built from public signals. They may be incomplete.
      </p>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-md border border-neutral-200 p-3 dark:border-neutral-700">
          <div className="font-medium text-neutral-900 dark:text-neutral-100">Fit summary</div>
          <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">
            Culture fit score: {report.scores.culture_fit_score}/100. Confidence:{' '}
            {report.confidence_summary.fit ?? 'low'}.
          </p>
        </div>

        <div className="rounded-md border border-neutral-200 p-3 dark:border-neutral-700">
          <div className="font-medium text-neutral-900 dark:text-neutral-100">Transparency summary</div>
          <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">
            Missing data points: {report.missing_data.length}. Risk score: {report.scores.risk_score}/100.
          </p>
        </div>

        <div className="rounded-md border border-neutral-200 p-3 dark:border-neutral-700">
          <div className="font-medium text-neutral-900 dark:text-neutral-100">Compensation summary</div>
          <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">
            Market pay score: {report.scores.market_pay_score}/100. Salary confidence:{' '}
            {report.confidence_summary.salary ?? 'low'}.
          </p>
        </div>

        <div className="rounded-md border border-neutral-200 p-3 dark:border-neutral-700">
          <div className="font-medium text-neutral-900 dark:text-neutral-100">Recommendation summary</div>
          <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">
            JobRadar recommends: {report.recommendation}.
          </p>
        </div>
      </div>
    </section>
  );
}
