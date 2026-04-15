'use client';

import { useEffect, useState } from 'react';
import { useCreateComplaint } from '../hooks/use-create-complaint';

type Props = {
  open: boolean;
  reportId: string;
  findingId?: string | null;
  onClose: () => void;
};

export function ComplaintModal({ open, reportId, findingId, onClose }: Props) {
  const mutation = useCreateComplaint();
  const [complaintType, setComplaintType] = useState<
    'factual_inaccuracy' | 'outdated_information' | 'harmful_content' | 'legal_notice'
  >('factual_inaccuracy');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!open) return;
    setComplaintType('factual_inaccuracy');
    setMessage('');
  }, [open, reportId, findingId]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await mutation.mutateAsync({
      reportId,
      findingId: findingId ?? null,
      complaintType,
      message,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-lg border border-neutral-200 bg-white p-6 shadow-lg dark:border-neutral-700 dark:bg-neutral-950">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">Report issue</h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Report incorrect, outdated, or potentially harmful information in this report.
        </p>

        <form className="mt-4 space-y-4" onSubmit={(e) => void handleSubmit(e)}>
          <div>
            <label htmlFor="jr-complaint-type" className="mb-1 block text-sm font-medium text-neutral-800 dark:text-neutral-200">
              Complaint type
            </label>
            <select
              id="jr-complaint-type"
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
              value={complaintType}
              onChange={(e) =>
                setComplaintType(
                  e.target.value as 'factual_inaccuracy' | 'outdated_information' | 'harmful_content' | 'legal_notice',
                )
              }
            >
              <option value="factual_inaccuracy">Factual inaccuracy</option>
              <option value="outdated_information">Outdated information</option>
              <option value="harmful_content">Harmful content</option>
              <option value="legal_notice">Legal concern</option>
            </select>
          </div>

          <div>
            <label htmlFor="jr-complaint-msg" className="mb-1 block text-sm font-medium text-neutral-800 dark:text-neutral-200">
              Message
            </label>
            <textarea
              id="jr-complaint-msg"
              className="min-h-[140px] w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe the issue."
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
              disabled={mutation.isPending || message.trim().length < 10}
            >
              {mutation.isPending ? 'Submitting…' : 'Submit complaint'}
            </button>

            <button
              type="button"
              className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>

          {mutation.isError && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {mutation.error instanceof Error ? mutation.error.message : 'Failed to submit complaint'}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
