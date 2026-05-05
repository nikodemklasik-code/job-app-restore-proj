import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useJobRadarReport } from '@/features/job-radar/hooks/use-job-radar-report';
import { ReportHeader } from '@/features/job-radar/components/report-header';
import { ScoreCardsGrid } from '@/features/job-radar/components/score-cards-grid';
import { VerifiedInfoSection } from '@/features/job-radar/components/verified-info-section';
import { ModelObservationsSection } from '@/features/job-radar/components/model-observations-section';
import { FindingsSection } from '@/features/job-radar/components/findings-section';
import { ScoreDriversAccordion } from '@/features/job-radar/components/score-drivers-accordion';
import { SourcesSection } from '@/features/job-radar/components/sources-section';
import { ComplaintModal } from '@/features/job-radar/components/complaint-modal';
import { RescanReportButton } from '@/features/job-radar/components/rescan-report-button';

export default function JobRadarReportPage() {
  const { reportId } = useParams<{ reportId: string }>();
  const scanId = reportId ?? ''; // URL param is still called reportId for backwards compat
  const { data, isLoading, error } = useJobRadarReport(scanId);
  const [complaintOpen, setComplaintOpen] = useState(false);
  const [findingId, setFindingId] = useState<string | null>(null);

  if (isLoading) return <div className="p-6 text-neutral-600 dark:text-neutral-400">Loading report…</div>;
  if (error || !data) return <div className="p-6 text-red-600 dark:text-red-400">Failed to load report.</div>;

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <ReportHeader
        report={data}
        onReportIssue={() => {
          setFindingId(null);
          setComplaintOpen(true);
        }}
      />

      <div className="flex justify-end">
        <RescanReportButton reportId={scanId} />
      </div>

      <ScoreCardsGrid report={data} />
      <VerifiedInfoSection report={data} />
      <ModelObservationsSection report={data} />
      <FindingsSection
        report={data}
        onReportFinding={(fid: string | null) => {
          setFindingId(fid);
          setComplaintOpen(true);
        }}
      />
      <ScoreDriversAccordion report={data} />
      <SourcesSection report={data} />

      <ComplaintModal
        open={complaintOpen}
        reportId={scanId}
        findingId={findingId}
        onClose={() => setComplaintOpen(false)}
      />
    </main>
  );
}
