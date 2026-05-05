'use client';

import { api } from '@/lib/api';
import { normalizeJobRadarReport } from '../lib/job-radar-report.mapper';

export function useJobRadarReport(scanId: string) {
  return api.jobRadar.getReport.useQuery(
    { scanId },
    {
      enabled: Boolean(scanId),
      refetchOnWindowFocus: false,
      select: (data) => normalizeJobRadarReport(data as unknown as Record<string, unknown>),
    },
  );
}
