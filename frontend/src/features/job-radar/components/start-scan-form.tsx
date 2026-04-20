'use client';

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStartJobRadarScan } from '../hooks/use-start-job-radar-scan';

const terminal = new Set(['ready', 'partial_report', 'sources_blocked']);

export function StartScanForm() {
  const navigate = useNavigate();
  const mutation = useStartJobRadarScan();

  const [employerName, setEmployerName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [location, setLocation] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');

  const canSubmit = useMemo(() => {
    return Boolean(employerName.trim() || sourceUrl.trim());
  }, [employerName, sourceUrl]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    const result = await mutation.mutateAsync({
      scanTrigger: sourceUrl.trim() ? 'url_input' : 'manual_search',
      employerName: employerName.trim() || undefined,
      jobTitle: jobTitle.trim() || undefined,
      location: location.trim() || undefined,
      sourceUrl: sourceUrl.trim() || undefined,
      forceRescan: false,
    });

    if (result.report_id && result.status && terminal.has(result.status)) {
      navigate(`/job-radar/report/${result.report_id}`);
      return;
    }

    navigate(`/job-radar/scan/${result.scan_id}`);
  }

  return (
    <form
      onSubmit={(e) => void onSubmit(e)}
      className="mvh-card-glow space-y-4 rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950"
    >
      <div>
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">Job Radar scan</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Paste a job link or enter company details to generate a private research report.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-neutral-800 dark:text-neutral-200">Employer name</span>
          <input
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
            value={employerName}
            onChange={(e) => setEmployerName(e.target.value)}
            placeholder="Example Ltd"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-neutral-800 dark:text-neutral-200">Job title</span>
          <input
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="Product Designer"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-neutral-800 dark:text-neutral-200">Location</span>
          <input
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="London"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-neutral-800 dark:text-neutral-200">Job URL</span>
          <input
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://example.com/jobs/123"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={!canSubmit || mutation.isPending}
          className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-900 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
        >
          {mutation.isPending ? 'Starting…' : 'Run scan'}
        </button>

        <button
          type="button"
          className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-900 hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
          onClick={() => {
            setEmployerName('');
            setJobTitle('');
            setLocation('');
            setSourceUrl('');
          }}
        >
          Clear
        </button>
      </div>

      {mutation.isError && (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          {mutation.error.message}
        </div>
      )}
    </form>
  );
}
