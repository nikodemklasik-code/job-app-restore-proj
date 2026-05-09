'use client';

import type { JobRadarReportView } from '../api/job-radar.types';
import { ScoreCardFlip } from './score-card-flip';
import { ActionPriorityBadge } from '@/components/jobs/ActionPriorityBadge';

const scoreItems = [
  { key: 'employer_score', label: 'Employer' },
  { key: 'offer_score', label: 'Offer Quality' },
  { key: 'market_pay_score', label: 'Market Pay' },
  { key: 'benefits_score', label: 'Benefits' },
  { key: 'culture_fit_score', label: 'Culture Fit' },
  { key: 'risk_score', label: 'Risk Level' },
] as const;

/**
 * Map the report recommendation text to an ActionRecommendation type.
 */
function mapRecommendation(rec: string): 'apply_now' | 'save' | 'reject' | 'verify_employer' | null {
  const lower = rec.toLowerCase();
  if (lower.includes('apply') || lower.includes('strong')) return 'apply_now';
  if (lower.includes('save') || lower.includes('monitor') || lower.includes('consider')) return 'save';
  if (lower.includes('avoid') || lower.includes('skip') || lower.includes('reject')) return 'reject';
  if (lower.includes('verify') || lower.includes('caution') || lower.includes('check')) return 'verify_employer';
  return null;
}

export function ScoreCardsGrid({ report }: { report: JobRadarReportView }) {
  const sourcesCount = report.sources?.length ?? 0;
  const mappedRec = mapRecommendation(report.recommendation ?? '');

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
            sourcesCount={sourcesCount}
          />
        );
      })}

      <div className="rounded-lg border border-neutral-200 bg-white p-4 sm:col-span-2 xl:col-span-3 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">Recommendation</div>
            <div className="mt-2 text-xl font-semibold text-neutral-900 dark:text-neutral-50">{report.recommendation}</div>
          </div>
          {mappedRec && (
            <ActionPriorityBadge recommendation={mappedRec} />
          )}
        </div>
        {sourcesCount > 0 && (
          <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
            Based on {sourcesCount} source{sourcesCount !== 1 ? 's' : ''} analyzed
          </div>
        )}
      </div>
    </div>
  );
}
