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

  const recent = api.jobRadar.listMyReports.useQuery({ limit: 12 }, { enabled: Boolean(userId) });
  const employerHistory = api.jobRadar.getEmployerHistory.useQuery(
    { employerId: employerFilter, limit: 24 },
    { enabled: Boolean(userId) && employerFilter.length >= 4 },
  );

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
            Prior scans grouped by stable employer id (hash of employer name / URL / saved job).
          </p>
          {employerHistory.isLoading ? (
            <p className="mt-3 text-xs text-neutral-500">Loading…</p>
          ) : employerHistory.data && employerHistory.data.history.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {employerHistory.data.history.map((h) => (
                <li
                  key={h.report_id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs dark:border-neutral-700 dark:bg-neutral-900"
                >
                  <span className="text-neutral-600 dark:text-neutral-400">
                    {h.created_at ? new Date(h.created_at).toLocaleString() : '—'}
                  </span>
                  <span className="text-neutral-700 dark:text-neutral-300">
                    employer {h.employer_score} · offer {h.offer_score} · risk {h.risk_score}
                  </span>
                  <Link
                    to={`/job-radar/report/${h.report_id}`}
                    className="font-medium text-indigo-700 hover:underline dark:text-indigo-300"
                  >
                    Open
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-xs text-neutral-500">No prior reports for this employer id.</p>
          )}
        </section>
      ) : null}

      {userId && (
        <section className="mvh-card-glow rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Your recent reports</h2>
          <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
            Private scans tied to your account. Fit / risk / freshness use Job Radar scores when available.
          </p>
          {recent.isLoading ? (
            <p className="mt-3 text-xs text-neutral-500">Loading…</p>
          ) : recent.data && recent.data.length > 0 ? (
            <ul className="mt-3 space-y-3">
              {recent.data.map((row) => {
                const label =
                  row.employerName?.trim() ||
                  row.jobTitle?.trim() ||
                  row.sourceUrl?.trim()?.slice(0, 48) ||
                  'Scan';
                const historyTo =
                  row.employerId && row.employerId.length >= 4
                    ? `/job-radar?employerId=${encodeURIComponent(row.employerId)}`
                    : null;
                return (
                  <li
                    key={row.reportId}
                    className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-800 dark:bg-neutral-900/80"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{label}</p>
                        <p className="text-[11px] text-neutral-500">
                          {row.reportStatus}
                          {row.freshnessStatus ? ` · freshness ${row.freshnessStatus}` : ''} ·{' '}
                          {row.startedAt != null ? new Date(row.startedAt).toLocaleString() : '—'}
                        </p>
                        <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-neutral-600 dark:text-neutral-400">
                          {row.employerScore != null ? (
                            <span className="rounded border border-neutral-200 px-2 py-0.5 dark:border-neutral-700">
                              Employer {row.employerScore}
                            </span>
                          ) : null}
                          {row.offerScore != null ? (
                            <span className="rounded border border-neutral-200 px-2 py-0.5 dark:border-neutral-700">
                              Offer {row.offerScore}
                            </span>
                          ) : null}
                          {row.riskScore != null ? (
                            <span className="rounded border border-neutral-200 px-2 py-0.5 dark:border-neutral-700">
                              Risk {row.riskScore}
                            </span>
                          ) : null}
                        </div>
                        <p className="pt-2 text-xs text-neutral-700 dark:text-neutral-300">
                          <span className="font-semibold text-neutral-800 dark:text-neutral-200">Why this match: </span>
                          {whyThisMatch(row)}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <Link
                          to={`/job-radar/report/${row.reportId}`}
                          className="rounded-md border border-neutral-300 px-2 py-1 text-xs font-medium text-neutral-800 hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800"
                        >
                          Open report
                        </Link>
                        {historyTo ? (
                          <Link
                            to={historyTo}
                            className="text-[11px] font-medium text-indigo-700 hover:underline dark:text-indigo-300"
                          >
                            Employer track
                          </Link>
                        ) : null}
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
