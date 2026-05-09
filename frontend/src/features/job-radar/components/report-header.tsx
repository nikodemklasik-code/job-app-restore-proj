'use client';

import type { JobRadarReportView } from '../api/job-radar.types';
import { StatusBadge } from './status-badge';
import { FreshnessBadge } from './freshness-badge';
import { ConfidenceBadge } from './confidence-badge';
import { EmployerTrustBadge } from '@/components/employer/EmployerTrustBadge';

type Props = {
  report: JobRadarReportView;
  onReportIssue: () => void;
};

export function ReportHeader({ report, onReportIssue }: Props) {
  // Derive trust/risk from existing scores if available
  const employerScore = report.scores?.employer_score ?? null;
  const riskScore = report.scores?.risk_score ?? null;

  return (
    <div className="flex flex-col gap-4 border-b border-neutral-200 pb-4 dark:border-neutral-800">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
            {report.employer?.name ?? 'Employer'}
            {report.job?.title ? ` · ${report.job.title}` : ''}
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {report.job?.location ?? 'Location unknown'}
            {report.job?.work_mode ? ` · ${report.job.work_mode}` : ''}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {employerScore !== null && (
            <EmployerTrustBadge trustScore={employerScore} riskScore={riskScore ?? undefined} size="sm" />
          )}
          <StatusBadge status={report.status} />
          <FreshnessBadge status={report.freshness.freshness_status} />
          <ConfidenceBadge level={report.confidence_summary.overall} />
        </div>
      </div>

      <div>
        <button
          type="button"
          className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
          onClick={onReportIssue}
        >
          Report issue
        </button>
      </div>
    </div>
  );
}
