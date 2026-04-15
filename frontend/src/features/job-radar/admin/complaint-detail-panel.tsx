'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import type { AdminComplaintItem } from '../api/job-radar.types';

type Props = {
  complaint: AdminComplaintItem | null;
};

export function ComplaintDetailPanel({ complaint }: Props) {
  const [note, setNote] = useState('');
  const utils = api.useUtils();
  const reviewMutation = api.jobRadar.adminReviewFinding.useMutation({
    onSuccess: async () => {
      await utils.jobRadar.adminListComplaints.invalidate();
    },
  });

  if (!complaint) {
    return (
      <div className="rounded-lg border border-neutral-200 p-4 text-sm text-neutral-600 dark:border-neutral-800 dark:text-neutral-400">
        Select a complaint to review.
      </div>
    );
  }

  const item = complaint;

  async function handleAction(action: 'approve_visible' | 'keep_pending' | 'suppress') {
    if (!item.findingId) return;
    await reviewMutation.mutateAsync({
      complaintId: item.id,
      findingId: item.findingId,
      action,
      note: note.trim() || null,
    });
  }

  const canAct = Boolean(item.findingId);

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
      <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">Complaint detail</h2>

      <dl className="mt-4 space-y-2 text-sm text-neutral-800 dark:text-neutral-200">
        <div>
          <dt className="text-neutral-500 dark:text-neutral-400">Complaint type</dt>
          <dd>{item.complaintType}</dd>
        </div>
        <div>
          <dt className="text-neutral-500 dark:text-neutral-400">Status</dt>
          <dd>{item.status}</dd>
        </div>
        <div>
          <dt className="text-neutral-500 dark:text-neutral-400">Report</dt>
          <dd className="font-mono text-xs">{item.reportId}</dd>
        </div>
        <div>
          <dt className="text-neutral-500 dark:text-neutral-400">Finding</dt>
          <dd className="font-mono text-xs">{item.findingId ?? 'No finding linked'}</dd>
        </div>
      </dl>

      <div className="mt-4">
        <label htmlFor="jr-reviewer-note" className="mb-1 block text-sm font-medium text-neutral-800 dark:text-neutral-200">
          Reviewer note
        </label>
        <textarea
          id="jr-reviewer-note"
          className="min-h-[120px] w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
          disabled={!canAct || reviewMutation.isPending}
          onClick={() => void handleAction('approve_visible')}
        >
          Keep visible
        </button>
        <button
          type="button"
          className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
          disabled={!canAct || reviewMutation.isPending}
          onClick={() => void handleAction('keep_pending')}
        >
          Keep pending
        </button>
        <button
          type="button"
          className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
          disabled={!canAct || reviewMutation.isPending}
          onClick={() => void handleAction('suppress')}
        >
          Suppress
        </button>
      </div>

      {reviewMutation.isError && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
          {reviewMutation.error instanceof Error ? reviewMutation.error.message : 'Action failed'}
        </p>
      )}
    </div>
  );
}
