'use client';

import type { JobRadarReportView } from '../api/job-radar.types';

export function SourcesSection({ report }: { report: JobRadarReportView }) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
      <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">Sources</h2>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm text-neutral-800 dark:text-neutral-200">
          <thead>
            <tr className="text-left text-neutral-500 dark:text-neutral-400">
              <th className="py-2 pr-4">Type</th>
              <th className="py-2 pr-4">Tier</th>
              <th className="py-2 pr-4">Collected</th>
              <th className="py-2 pr-4">URL</th>
            </tr>
          </thead>
          <tbody>
            {report.sources.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-4 text-neutral-500 dark:text-neutral-400">
                  No sources recorded.
                </td>
              </tr>
            ) : (
              report.sources.map((source) => (
                <tr key={source.source_id} className="border-t border-neutral-200 dark:border-neutral-800">
                  <td className="py-2 pr-4">{source.type}</td>
                  <td className="py-2 pr-4">{source.tier}</td>
                  <td className="py-2 pr-4">{new Date(source.collected_at).toLocaleString()}</td>
                  <td className="break-all py-2 pr-4">
                    <a href={source.url} className="text-indigo-600 underline dark:text-indigo-400" target="_blank" rel="noreferrer">
                      {source.url}
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
