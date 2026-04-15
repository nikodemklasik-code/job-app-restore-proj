'use client';

import { api } from '@/lib/api';

export function useRescanJobRadarReport() {
  const utils = api.useUtils();
  return api.jobRadar.rescanReport.useMutation({
    onSuccess: () => {
      void utils.jobRadar.getScanStatus.invalidate();
      void utils.jobRadar.getReport.invalidate();
    },
  });
}
