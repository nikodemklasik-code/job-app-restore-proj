import { Link } from 'react-router-dom';
import type { DashboardSnapshot as DashboardSnapshotDto } from '@/types/dashboard';

function formatDate(date: string | null): string {
  if (!date) return 'No completed sessions yet';
  return new Date(date).toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function StatCard(props: { title: string; value: string; subtitle: string }) {
  return (
    <div className="mvh-card-glow rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="text-sm font-medium text-slate-400">{props.title}</div>
      <div className="mt-2 text-2xl font-semibold text-white">{props.value}</div>
      <div className="mt-1 text-sm text-slate-500">{props.subtitle}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: DashboardSnapshotDto['applications']['recent'][number]['status'] }) {
  const statusClasses: Record<typeof status, string> = {
    draft: 'bg-slate-500/20 text-slate-200',
    saved: 'bg-sky-500/20 text-sky-200',
    applied: 'bg-amber-500/20 text-amber-100',
    interview: 'bg-violet-500/20 text-violet-100',
    offer: 'bg-emerald-500/20 text-emerald-100',
    rejected: 'bg-rose-500/20 text-rose-100',
    archived: 'bg-slate-600/30 text-slate-300',
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusClasses[status]}`}
    >
      {status}
    </span>
  );
}

export function DashboardSnapshot({ snapshot }: { snapshot: DashboardSnapshotDto }) {
  const { profile, applications, billing, practice, nextAction } = snapshot;

  return (
    <div className="space-y-8">
      <section className="mvh-card-glow rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-400">Dashboard</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">
              {profile.fullName ? `Welcome back, ${profile.fullName}` : 'Welcome back'}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">{nextAction.reason}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to={nextAction.href}
              className="inline-flex items-center justify-center rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400"
            >
              {nextAction.label}
            </Link>
            <Link
              to="/review"
              className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
            >
              Review queue
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Profile completeness"
          value={`${profile.completeness}%`}
          subtitle={
            profile.targetRole ? `Target role: ${profile.targetRole}` : 'Add your target role in Profile & goals'
          }
        />
        <StatCard
          title="Applications"
          value={String(applications.total)}
          subtitle={`${applications.needsReviewCount} need review`}
        />
        <StatCard
          title="Spendable (billing engine)"
          value={billing.availableBalanceCents.toLocaleString()}
          subtitle="Credit-style units from account state (GBP ledger where enabled)"
        />
        <StatCard
          title="Interview practice"
          value={String(practice.totalSessions)}
          subtitle={
            practice.averageScore === null
              ? 'No scored sessions yet'
              : `Average score ${practice.averageScore}`
          }
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="mvh-card-glow rounded-2xl border border-white/10 bg-white/5 p-5 xl:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Recent applications</h2>
            <Link to="/applications" className="text-sm font-medium text-indigo-300 hover:text-indigo-200">
              View all
            </Link>
          </div>

          {applications.recent.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-black/20 p-6 text-sm text-slate-400">
              No applications yet. Start from Jobs and build your pipeline.
            </div>
          ) : (
            <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
              <table className="min-w-full divide-y divide-white/10">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Company
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Updated
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 bg-black/10">
                  {applications.recent.map((application) => (
                    <tr key={application.id}>
                      <td className="px-4 py-3 text-sm font-medium text-white">{application.companyName}</td>
                      <td className="px-4 py-3 text-sm text-slate-300">{application.roleTitle}</td>
                      <td className="px-4 py-3 text-sm text-slate-300">
                        <StatusBadge status={application.status} />
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-400">
                        {new Date(application.updatedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="mvh-card-glow rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-semibold text-white">Pipeline by status</h2>
            <div className="mt-4 space-y-3">
              {Object.entries(applications.byStatus).map(([status, count]) => (
                <div
                  key={status}
                  className="flex items-center justify-between rounded-xl bg-black/20 px-4 py-3"
                >
                  <span className="text-sm font-medium capitalize text-slate-300">{status}</span>
                  <span className="text-sm font-semibold text-white">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mvh-card-glow rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-semibold text-white">Profile gaps</h2>
            {profile.missingCriticalFields.length === 0 ? (
              <p className="mt-4 text-sm text-emerald-300">All tracked profile signals are present.</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {profile.missingCriticalFields.map((field) => (
                  <li
                    key={field}
                    className="rounded-xl bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-100"
                  >
                    {field}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mvh-card-glow rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-semibold text-white">Practice activity</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <div className="flex items-center justify-between">
                <span>Completed sessions</span>
                <span className="font-semibold text-white">{practice.completedSessions}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Average score</span>
                <span className="font-semibold text-white">
                  {practice.averageScore === null ? 'N/A' : practice.averageScore}
                </span>
              </div>
              <div>
                <span className="block text-slate-500">Last completed</span>
                <span className="mt-1 block font-medium text-white">{formatDate(practice.lastCompletedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
