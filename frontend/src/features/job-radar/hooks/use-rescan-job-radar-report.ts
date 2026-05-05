'use client';

import { api } from '@/lib/api';

export function useRescanJobRadarReport() {
  const utils = api.useUtils();
  // Note: rescanReport endpoint not yet implemented
  return {
    mutate: () => console.warn('rescanReport not implemented'),
    mutateAsync: async () => { throw new Error('rescanReport not implemented'); },
    isLoading: false,
    error: null,
  } as any;
}
