'use client';

import { api } from '@/lib/api';

export function useStartJobRadarScan() {
  const utils = api.useUtils();
  return api.jobRadar.startScan.useMutation({
    onSuccess: () => {
      void utils.jobRadar.getScanProgress.invalidate();
      void utils.jobRadar.getReport.invalidate();
    },
  });
}
