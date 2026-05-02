'use client';

import type { JobRadarReportView } from '../api/job-radar.types';
import { ScoreCardFlip } from './score-card-flip';

const scoreItems = [
  { key: 'employer_score', label: 'Employer' },
  { key: 'offer_score', label: 'Offer Quality' },
  { key: 'market_pay_score', label: 'Market Pay' },
  { key: 'benefits_score', label: 'Benefits' },
  { key: 'culture_fit_score', label: 'Culture Fit' },
  { key: 'risk_score', label: 'Risk Level' },
] as const;

export function ScoreCardsGrid({ report }: { report: JobRadarReportView }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {scoreItems.map((item) => {
        const score = report.scores[item.key];
        const drivers = report.score_drivers[item.key] || {
          positive_drivers: [],
          negative_drivers: [],
          neutral_constraints: [],
        };

        return (
          <ScoreCardFlip
            key={item.key}
            label={item.label}
            score={score}
            drivers={drivers}
          />
        );
      })}

      <div className="rounded-lg border border-neutral-200 bg-white p-4 sm:col-span-2 xl:col-span-3 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="text-sm text-neutral-600 dark:text-neutral-400">Recommendation</div>
        <div className="mt-2 text-xl font-semibold text-neutral-900 dark:text-neutral-50">{report.recommendation}</div>
      </div>
    </div>
  );
}
