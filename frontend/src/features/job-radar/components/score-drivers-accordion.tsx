'use client';

import type { JobRadarReportView } from '../api/job-radar.types';

const labels: Record<string, string> = {
  employer_score: 'Employer score',
  offer_score: 'Offer score',
  market_pay_score: 'Market pay score',
  benefits_score: 'Benefits score',
  culture_fit_score: 'Culture fit score',
  risk_score: 'Risk score',
};

export function ScoreDriversAccordion({ report }: { report: JobRadarReportView }) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
      <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">What influenced the scores</h2>

      <div className="mt-4 space-y-3">
        {Object.entries(report.score_drivers).map(([scoreName, groups]) => (
          <details key={scoreName} className="rounded-md border border-neutral-200 p-3 dark:border-neutral-700">
            <summary className="cursor-pointer font-medium text-neutral-900 dark:text-neutral-100">
              {labels[scoreName] ?? scoreName}
            </summary>

            <div className="mt-3 grid gap-4 lg:grid-cols-3">
              <div>
                <div className="text-sm font-medium text-neutral-800 dark:text-neutral-200">Positive</div>
                <ul className="mt-2 space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
                  {groups.positive_drivers.map((d, i) => (
                    <li key={i}>
                      {d.label} <span className="text-neutral-500">({d.impact})</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="text-sm font-medium text-neutral-800 dark:text-neutral-200">Negative</div>
                <ul className="mt-2 space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
                  {groups.negative_drivers.map((d, i) => (
                    <li key={i}>
                      {d.label} <span className="text-neutral-500">({d.impact})</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="text-sm font-medium text-neutral-800 dark:text-neutral-200">Constraints</div>
                <ul className="mt-2 space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
                  {groups.neutral_constraints.map((d, i) => (
                    <li key={i}>
                      {d.label} <span className="text-neutral-500">({d.impact})</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
