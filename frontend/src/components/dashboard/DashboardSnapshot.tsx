import { Link } from 'react-router-dom';
import { Sparkles, TrendingUp } from 'lucide-react';
import type { DashboardSnapshot as DashboardSnapshotDto } from '@/types/dashboard';

function formatCurrency(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

function formatDate(date: string | null): string {
  if (!date) return 'No completed sessions yet';
  return new Date(date).toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function firstName(fullName: string | null): string | null {
  const trimmed = fullName?.trim();
  if (!trimmed) return null;
  return trimmed.split(/\s+/)[0] ?? trimmed;
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
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusClasses[status]}`}>
      {status}
    </span>
  );
}

function CaseStudyPromo() {
  const steps = [
    ['01', 'Make your choice.', 'Pick the pressure situation you want to practise.'],
    ['02', 'Prepare to win.', 'Build your position before the challenge starts.'],
    ['03', 'Start the action.', 'Defend your answer and respond under pressure.'],
  ] as const;

  return (
    <section className="mvh-card-glow overflow-hidden rounded-3xl border border-violet-400/25 bg-gradient-to-br from-violet-600/25 via-indigo-600/15 to-slate-950 p-0 shadow-2xl shadow-black/20">
      <div className="grid gap-0 lg:grid-cols-[1.12fr_0.88fr]">
        <div className="p-5 sm:p-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-300/25 bg-violet-400/10 px-3 py-1 text-xs font-semibold text-violet-100">
            Featured practice
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Defend your position. Win with words.
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
            No winner is decided in advance. Your result depends on argument quality, clear rhetoric, interpersonal skill, and how well you hold your ground under pressure.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {steps.map(([number, title, detail]) => (
              <div key={number} className="rounded-2xl border border-white/10 bg-white/[0.06] p-3 shadow-inner shadow-white/5">
                <p className="text-xs font-bold uppercase tracking-wide text-violet-200">Step {number}</p>
                <p className="mt-1 text-sm font-semibold text-white">{title}</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">{detail}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/case-study"
              className="inline-flex min-w-[170px] items-center justify-center rounded-xl bg-violet-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-violet-400"
            >
              Play Case Study
            </Link>
            <Link
              to="/coach"
              className="inline-flex min-w-[170px] items-center justify-center rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Practise With Coach
            </Link>
          </div>
        </div>
        <div className="relative min-h-[220px] border-t border-white/10 bg-black/25 p-5 lg:border-l lg:border-t-0">
          <div className="absolute inset-0 opacity-50 [background-image:radial-gradient(circle_at_30%_30%,rgba(167,139,250,0.5),transparent_30%),radial-gradient(circle_at_75%_70%,rgba(79,70,229,0.35),transparent_35%)]" />
          <div className="relative flex h-full min-h-[190px] flex-col justify-between rounded-3xl border border-white/15 bg-slate-950/60 p-5">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200">Scenario preview</span>
              <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-200">Interactive</span>
            </div>
            <div className="py-5">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/25 bg-white/15 text-2xl text-white">
                ▶
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Example: Fair Treatment Concern</p>
              <p className="mt-1 text-sm leading-5 text-slate-300">
                Use evidence, rhetoric, and calm pressure control to make your case without losing your ground.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function DashboardSnapshot({ snapshot }: { snapshot: DashboardSnapshotDto }) {
  const { profile, applications, billing, practice, nextAction } = snapshot;
  const displayName = firstName(profile.fullName);

  return (
    <div className="space-y-8">
      <section className="mvh-card-glow rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-indigo-500/[0.08] p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-indigo-200">WELCOME BACK</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {displayName ? `Welcome back, ${displayName}` : 'Welcome back'}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Start from the next useful action, practise a case, or review your current career workspace.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to={nextAction.href}
              className="inline-flex min-w-[170px] items-center justify-center rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400"
            >
              {nextAction.label}
            </Link>
            <Link
              to="/case-study"
              className="inline-flex min-w-[170px] items-center justify-center rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-400"
            >
              Play Case Study
            </Link>
          </div>
        </div>
        {nextAction.reason ? (
          <div className="mt-5 rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-xs leading-5 text-slate-400">
            Workspace status: {nextAction.reason}
          </div>
        ) : null}
      </section>

      <CaseStudyPromo />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Profile completeness"
          value={`${profile.completeness}%`}
          subtitle={profile.targetRole ? `Target role: ${profile.targetRole}` : 'Add your target role in Profile & goals'}
        />
        <StatCard title="Applications" value={String(applications.total)} subtitle={`${applications.needsReviewCount} need review`} />
        <StatCard
          title="Available balance"
          value={formatCurrency(billing.availableBalanceCents, billing.currency)}
          subtitle={`${formatCurrency(billing.postedNetCents, billing.currency)} posted, ${formatCurrency(
            billing.pendingNetCents,
            billing.currency,
          )} pending`}
        />
        <StatCard
          title="Interview practice"
          value={String(practice.totalSessions)}
          subtitle={practice.averageScore === null ? 'No scored sessions yet' : `Average score ${practice.averageScore}`}
        />
      </section>


      {/* Career Intelligence Tiles */}
      <section className="grid gap-4 md:grid-cols-2">
        {/* Match Analysis Tile */}
        <Link
          to="/skills"
          className="mvh-card-glow group rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 to-slate-900/40 p-6 transition hover:border-indigo-500/50 hover:from-indigo-500/15"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 transition group-hover:bg-indigo-500/30">
              <Sparkles className="h-6 w-6 text-indigo-300" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-white">Match Analysis</h2>
              <p className="mt-1 text-sm text-slate-400">
                Understand why you match certain roles and which skills are being evaluated
              </p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Profile completeness</span>
                  <span className="font-semibold text-white">{profile.completeness}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
                    style={{ width: `${profile.completeness}%` }}
                  />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs font-medium text-indigo-300">
                <span>View detailed analysis</span>
                <span className="transition group-hover:translate-x-1">→</span>
              </div>
            </div>
          </div>
        </Link>

        {/* Skills Gap Analysis Tile */}
        <Link
          to="/skills"
          className="mvh-card-glow group rounded-2xl border border-teal-500/30 bg-gradient-to-br from-teal-500/10 to-slate-900/40 p-6 transition hover:border-teal-500/50 hover:from-teal-500/15"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-500/20 transition group-hover:bg-teal-500/30">
              <TrendingUp className="h-6 w-6 text-teal-300" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-white">Skills Gap Analysis</h2>
              <p className="mt-1 text-sm text-slate-400">
                Identify missing skills for your target role and get personalized development paths
              </p>
              <div className="mt-4 space-y-2">
                {profile.missingCriticalFields.length > 0 ? (
                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2">
                    <p className="text-xs font-medium text-amber-300">
                      {profile.missingCriticalFields.length} gap{profile.missingCriticalFields.length === 1 ? '' : 's'} identified
                    </p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2">
                    <p className="text-xs font-medium text-emerald-300">
                      Profile complete — ready for analysis
                    </p>
                  </div>
                )}
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs font-medium text-teal-300">
                <span>Open Skills Lab</span>
                <span className="transition group-hover:translate-x-1">→</span>
              </div>
            </div>
          </div>
        </Link>
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
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Company</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Updated</th>
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
                        {new Date(application.updatedAt).toLocaleDateString('en-GB')}
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
                <div key={status} className="flex items-center justify-between rounded-xl bg-black/20 px-4 py-3">
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
                  <li key={field} className="rounded-xl bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-100">
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
                <span className="font-semibold text-white">{practice.averageScore === null ? 'N/A' : practice.averageScore}</span>
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
