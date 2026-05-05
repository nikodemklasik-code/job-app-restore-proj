import { Link, useSearchParams } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { StartScanForm } from '@/features/job-radar/components/start-scan-form';
import { api } from '@/lib/api';
import { APP_SCREENS } from '@/config/appScreens';

function whyThisMatch(row: {
  employerScore?: number | null;
  offerScore?: number | null;
  riskScore?: number | null;
  freshnessStatus?: string | null;
}): string {
  const e = row.employerScore;
  const o = row.offerScore;
  const r = row.riskScore;
  if (e == null && o == null && r == null) {
    return 'Scores populate when the scan pipeline finishes writing Job Radar scores — open the report for live drivers.';
  }
  const parts: string[] = [];
  if (o != null && e != null && o >= e) {
    parts.push('Offer signals are at least as strong as employer context in this snapshot.');
  } else if (e != null && o != null) {
    parts.push('Employer context currently outweighs offer signals — review registry and careers sources in the report.');
  }
  if (r != null && r >= 60) {
    parts.push('Risk score is elevated; read red flags before you invest time in this employer.');
  } else if (r != null) {
    parts.push('Risk score looks moderate — still verify sources listed in the report.');
  }
  if (row.freshnessStatus === 'stale') {
    parts.push('Data freshness is stale; consider a rescan before relying on benchmarks.');
  }
  return parts.join(' ') || 'Open the report for fit drivers, benchmarks, and sources.';
}

export default function JobRadarLandingPage() {
  const { user } = useUser();
  const userId = user?.id ?? '';
  const [searchParams] = useSearchParams();
  const employerFilter = searchParams.get('employerId')?.trim() ?? '';

  const recent = api.jobRadar.getRecentScans.useQuery({ limit: 12 }, { enabled: Boolean(userId) });
  // Note: getEmployerHistory endpoint not yet implemented
  const employerHistory = { data: null, isLoading: false, error: null };

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <header className="mvh-card-glow rounded-2xl border border-neutral-200 bg-white px-5 py-4 dark:border-white/10 dark:bg-white/[0.04]">
        <h1 className="text-lg font-bold text-neutral-900 dark:text-white">{APP_SCREENS.jobRadar.label}</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-slate-400">
          Employer research and offer context — same module as in the 19-screen product map (screen 14).
        </p>
      </header>
      <StartScanForm />

      {userId && employerFilter ? (
        <section className="mvh-card-glow rounded-xl border border-indigo-200 bg-indigo-50/80 p-5 dark:border-indigo-500/30 dark:bg-indigo-950/40">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Employer history</h2>
            <Link
              to="/job-radar"
              className="text-xs font-medium text-indigo-700 hover:underline dark:text-indigo-300"
            >
              Clear filter
            </Link>
          </div>
          <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
            Feature not yet implemented - coming soon!
          </p>
        </section>
      ) : null}

      {userId && (
        <section className="mvh-card-glow rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Your recent scans</h2>
          <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
            Recent Job Radar scans tied to your account.
          </p>
          {recent.isLoading ? (
            <p className="mt-3 text-xs text-neutral-500">Loading…</p>
          ) : recent.data && recent.data.length > 0 ? (
            <ul className="mt-3 space-y-3">
              {recent.data.map((row: any) => {
                const label = `${row.jobTitle} at ${row.company}`;
                return (
                  <li
                    key={row.scanId}
                    className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-800 dark:bg-neutral-900/80"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{label}</p>
                        <p className="text-[11px] text-neutral-500">
                          {row.status} · {new Date(row.startedAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <Link
                          to={`/jobs/radar/${row.scanId}`}
                          className="rounded-md border border-neutral-300 px-2 py-1 text-xs font-medium text-neutral-800 hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800"
                        >
                          View scan
                        </Link>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-3 text-xs text-neutral-500">No reports yet — run a scan above.</p>
          )}
        </section>
      )}
    </main>
  );
}
