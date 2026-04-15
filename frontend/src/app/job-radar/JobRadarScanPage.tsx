import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useJobRadarScan } from '@/features/job-radar/hooks/use-job-radar-scan';
import { ScanProgress } from '@/features/job-radar/components/scan-progress';

const terminal = new Set(['ready', 'partial_report', 'sources_blocked']);

export default function JobRadarScanPage() {
  const { scanId } = useParams<{ scanId: string }>();
  const id = scanId ?? '';
  const navigate = useNavigate();
  const { data, isLoading, error } = useJobRadarScan(id);

  useEffect(() => {
    if (!data) return;
    if (terminal.has(data.status) && data.report_id) {
      navigate(`/job-radar/report/${data.report_id}`, { replace: true });
    }
  }, [data, navigate]);

  if (isLoading) return <div className="p-6 text-neutral-600 dark:text-neutral-400">Loading scan…</div>;
  if (error || !data) return <div className="p-6 text-red-600 dark:text-red-400">Failed to load scan.</div>;

  return (
    <main className="mx-auto max-w-3xl p-6">
      <ScanProgress scan={data} />
    </main>
  );
}
