'use client';

import { useNavigate } from 'react-router-dom';
import { useStartJobRadarScan } from '../hooks/use-start-job-radar-scan';

type Props = {
  employerName?: string;
  jobTitle?: string;
  location?: string;
  sourceUrl?: string;
  jobPostId?: string | null;
};

const terminal = new Set(['ready', 'partial_report', 'sources_blocked']);

export function StartScanCtaCard(props: Props) {
  const navigate = useNavigate();
  const mutation = useStartJobRadarScan();

  async function handleStart() {
    const result = await mutation.mutateAsync({
      scanTrigger: props.sourceUrl ? 'url_input' : 'manual_search',
      employerName: props.employerName,
      jobTitle: props.jobTitle,
      location: props.location,
      sourceUrl: props.sourceUrl,
      jobPostId: props.jobPostId ?? undefined,
      forceRescan: false,
    });

    if (result.reportId && result.status && terminal.has(result.status)) {
      navigate(`/job-radar/report/${result.reportId}`);
      return;
    }

    navigate(`/job-radar/scan/${result.scanId}`);
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="text-sm font-medium text-neutral-900 dark:text-neutral-50">JobRadar</div>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
        Scan this employer and offer using public data.
      </p>

      <button
        type="button"
        className="mt-3 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
        onClick={() => void handleStart()}
        disabled={mutation.isPending}
      >
        {mutation.isPending ? 'Starting…' : 'Scan with JobRadar'}
      </button>
    </div>
  );
}
