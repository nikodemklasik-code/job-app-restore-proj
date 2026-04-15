'use client';

import type { JobRadarReportView } from '../api/job-radar.types';

type Props = {
  report: JobRadarReportView;
  onReportFinding?: (findingId: string | null) => void;
};

export function FindingsSection({ report, onReportFinding }: Props) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
      <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">Findings</h2>

      <div className="mt-4">
        <h3 className="font-medium text-neutral-900 dark:text-neutral-100">Key findings</h3>
        <div className="mt-2 space-y-3">
          {report.key_findings.length === 0 ? (
            <p className="text-sm text-neutral-600 dark:text-neutral-400">No key findings available.</p>
          ) : (
            report.key_findings.map((finding, index) => (
              <div key={`${finding.title}-${index}`} className="rounded-md border border-neutral-200 p-3 dark:border-neutral-700">
                <div className="font-medium text-neutral-900 dark:text-neutral-100">{finding.title}</div>
                <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">{finding.summary}</p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-6">
        <h3 className="font-medium text-neutral-900 dark:text-neutral-100">Red flags</h3>
        <div className="mt-2 space-y-3">
          {report.red_flags.length === 0 ? (
            <p className="text-sm text-neutral-600 dark:text-neutral-400">No visible red flags.</p>
          ) : (
            report.red_flags.map((flag, index) => (
              <div key={`${flag.id ?? flag.code ?? 'flag'}-${index}`} className="rounded-md border border-neutral-200 p-3 dark:border-neutral-700">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="font-medium text-neutral-900 dark:text-neutral-100">{flag.label}</div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    {flag.severity} · {flag.confidence} confidence
                  </div>
                </div>

                <button
                  type="button"
                  className="mt-3 rounded-md border border-neutral-300 px-2 py-1 text-xs text-neutral-800 hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-100 dark:hover:bg-neutral-800"
                  onClick={() => onReportFinding?.(flag.id ?? null)}
                  disabled={!flag.id}
                  title={flag.id ? undefined : 'Finding reference unavailable for this row'}
                >
                  Report this finding
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-6">
        <h3 className="font-medium text-neutral-900 dark:text-neutral-100">Missing data</h3>
        {report.missing_data.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">No major missing data points.</p>
        ) : (
          <ul className="mt-2 list-disc pl-5 text-sm text-neutral-700 dark:text-neutral-300">
            {report.missing_data.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
