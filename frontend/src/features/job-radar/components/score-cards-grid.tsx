'use client';

import type { JobRadarReportView } from '../api/job-radar.types';

const scoreItems = [
  { key: 'employer_score', label: 'Employer score' },
  { key: 'offer_score', label: 'Offer score' },
  { key: 'market_pay_score', label: 'Market pay score' },
  { key: 'benefits_score', label: 'Benefits score' },
  { key: 'culture_fit_score', label: 'Culture fit score' },
  { key: 'risk_score', label: 'Risk score' },
] as const;

export function ScoreCardsGrid({ report }: { report: JobRadarReportView }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {scoreItems.map((item) => (
        <div
          key={item.key}
          className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
        >
          <div className="text-sm text-neutral-600 dark:text-neutral-400">{item.label}</div>
          <div className="mt-2 text-3xl font-semibold text-neutral-900 dark:text-neutral-50">
            {report.scores[item.key]}/100
          </div>
        </div>
      ))}

      <div className="rounded-lg border border-neutral-200 bg-white p-4 sm:col-span-2 xl:col-span-3 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="text-sm text-neutral-600 dark:text-neutral-400">Recommendation</div>
        <div className="mt-2 text-xl font-semibold text-neutral-900 dark:text-neutral-50">{report.recommendation}</div>
      </div>
    </div>
  );
}
