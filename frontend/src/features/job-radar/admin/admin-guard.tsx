'use client';

import type { ReactNode } from 'react';
import { api } from '@/lib/api';
import type { AdminComplaintItem } from '../api/job-radar.types';
import { isTrustAccessForbidden } from './is-trust-forbidden';

type Props = {
  children: (items: AdminComplaintItem[]) => ReactNode;
};

export function AdminGuard({ children }: Props) {
  // Note: admin endpoints not yet implemented
  const q = { data: { items: [] }, isPending: false, isError: false, error: null };

  if (q.isPending) {
    return <div className="p-6 text-neutral-600 dark:text-neutral-400">Loading complaints…</div>;
  }

  if (q.isError) {
    if (isTrustAccessForbidden(q.error)) {
      return (
        <div className="p-6">
          <div className="rounded-md border border-neutral-200 px-4 py-3 text-sm text-neutral-800 dark:border-neutral-700 dark:text-neutral-200">
            Access denied.
          </div>
        </div>
      );
    }
    return <div className="p-6 text-red-600 dark:text-red-400">Failed to load complaints.</div>;
  }

  const items = (q.data?.items ?? []) as AdminComplaintItem[];
  return <>{children(items)}</>;
}
