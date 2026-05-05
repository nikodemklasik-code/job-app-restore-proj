'use client';

import { api } from '@/lib/api';

export function useCreateComplaint() {
  // Note: createComplaint endpoint not yet implemented
  return {
    mutate: () => console.warn('createComplaint not implemented'),
    mutateAsync: async () => { throw new Error('createComplaint not implemented'); },
    isLoading: false,
    error: null,
  } as any;
}
