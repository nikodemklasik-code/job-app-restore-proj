'use client';

import { api } from '@/lib/api';
import { normalizeJobRadarScan } from '../lib/job-radar-scan.mapper';

const terminal: Set<string> = new Set(['ready', 'partial_report', 'sources_blocked', 'scan_failed']);

export function useJobRadarScan(scanId: string) {
  return api.jobRadar.getScanStatus.useQuery(
    { scanId },
    {
      enabled: Boolean(scanId),
      refetchInterval: (query) => {
        const status = query.state.data?.status;
        if (!status) return 3000;
        return terminal.has(status) ? false : 3000;
      },
      refetchOnWindowFocus: false,
      select: (data) => normalizeJobRadarScan(data as unknown as Record<string, unknown>),
    },
  );
}
