'use client';

import type { AdminComplaintItem } from '../api/job-radar.types';

type Props = {
  items: AdminComplaintItem[];
  onSelect: (item: AdminComplaintItem) => void;
};

export function ComplaintsTable({ items, onSelect }: Props) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
      <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">JobRadar complaints</h1>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm text-neutral-800 dark:text-neutral-200">
          <thead>
            <tr className="text-left text-neutral-500 dark:text-neutral-400">
              <th className="py-2 pr-4">Type</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Report</th>
              <th className="py-2 pr-4">Created</th>
              <th className="py-2 pr-4">Message</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-neutral-500 dark:text-neutral-400">
                  No complaints.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr
                  key={item.id}
                  className="cursor-pointer border-t border-neutral-200 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900/60"
                  onClick={() => onSelect(item)}
                >
                  <td className="py-2 pr-4">{item.complaintType}</td>
                  <td className="py-2 pr-4">{item.status}</td>
                  <td className="py-2 pr-4 font-mono text-xs">{item.reportId}</td>
                  <td className="py-2 pr-4">{new Date(item.createdAt).toLocaleString()}</td>
                  <td className="max-w-[300px] truncate py-2 pr-4">{item.message}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
