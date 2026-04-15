'use client';

import { api } from '@/lib/api';

export function useCreateComplaint() {
  const utils = api.useUtils();
  return api.jobRadar.createComplaint.useMutation({
    onSuccess: (_, vars) => {
      void utils.jobRadar.getReport.invalidate({ reportId: vars.reportId });
    },
  });
}
