'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

export function KillSwitchPanel() {
  const [disableAllReports, setDisableAllReports] = useState(false);
  const [disableReputationFindings, setDisableReputationFindings] = useState(false);
  const [disableSevereRegistryAlerts, setDisableSevereRegistryAlerts] = useState(false);
  const [saved, setSaved] = useState(false);

  // Note: admin endpoints not yet implemented
  const mutation = {
    mutateAsync: async () => { console.warn('adminUpdateKillSwitch not implemented'); },
    isLoading: false,
  } as any;

  async function handleSave() {
    await mutation.mutateAsync({
      disableAllReports,
      disableReputationFindings,
      disableSevereRegistryAlerts,
    });
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
      <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">Kill switch</h2>

      <div className="mt-4 space-y-3 text-sm text-neutral-800 dark:text-neutral-200">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={disableAllReports}
            onChange={(e) => setDisableAllReports(e.target.checked)}
          />
          Disable all reports
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={disableReputationFindings}
            onChange={(e) => setDisableReputationFindings(e.target.checked)}
          />
          Disable reputation findings
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={disableSevereRegistryAlerts}
            onChange={(e) => setDisableSevereRegistryAlerts(e.target.checked)}
          />
          Disable severe registry alerts
        </label>
      </div>

      <button
        type="button"
        className="mt-4 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
        onClick={() => void handleSave()}
        disabled={mutation.isPending}
      >
        {mutation.isPending ? 'Saving…' : 'Save switches'}
      </button>

      {saved && <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">Saved.</p>}
      {mutation.isError && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
          {mutation.error instanceof Error ? mutation.error.message : 'Save failed'}
        </p>
      )}
    </div>
  );
}
