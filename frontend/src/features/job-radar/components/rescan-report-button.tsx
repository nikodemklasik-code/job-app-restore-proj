'use client';

import { useNavigate } from 'react-router-dom';
import { useRescanJobRadarReport } from '../hooks/use-rescan-job-radar-report';

const terminal = new Set(['ready', 'partial_report', 'sources_blocked']);

export function RescanReportButton({ reportId }: { reportId: string }) {
  const navigate = useNavigate();
  const mutation = useRescanJobRadarReport();

  async function handleClick() {
    const result = await mutation.mutateAsync({ reportId });

    if ('report_id' in result && result.report_id && result.status && terminal.has(result.status)) {
      navigate(`/job-radar/report/${result.report_id}`);
      return;
    }

    if ('scan_id' in result) {
      navigate(`/job-radar/scan/${result.scan_id}`);
    }
  }

  return (
    <button
      type="button"
      className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
      onClick={() => void handleClick()}
      disabled={mutation.isPending}
    >
      {mutation.isPending ? 'Rescanning…' : 'Rescan'}
    </button>
  );
}
