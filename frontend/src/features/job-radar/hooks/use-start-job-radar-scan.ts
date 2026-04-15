'use client';

import { api } from '@/lib/api';

export function useStartJobRadarScan() {
  const utils = api.useUtils();
  return api.jobRadar.startScan.useMutation({
    onSuccess: () => {
      void utils.jobRadar.getScanStatus.invalidate();
      void utils.jobRadar.getReport.invalidate();
    },
  });
}
