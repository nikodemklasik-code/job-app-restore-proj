'use client';

import { api } from '@/lib/api';
import { normalizeJobRadarReport } from '../lib/job-radar-report.mapper';

export function useJobRadarReport(reportId: string) {
  return api.jobRadar.getReport.useQuery(
    { reportId },
    {
      enabled: Boolean(reportId),
      refetchOnWindowFocus: false,
      select: (data) => normalizeJobRadarReport(data as unknown as Record<string, unknown>),
    },
  );
}
