import { Link } from 'react-router-dom';
import { Sparkles, TrendingUp, DollarSign, Award, Target } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { api } from '@/lib/api';
import type { DashboardSnapshot as DashboardSnapshotDto } from '@/types/dashboard';

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
    offer: 'bg-emerald-500/20 text-amber-100',
    rejected: 'bg-rose-500/20 text-rose-100',
    archived: 'bg-slate-600/30 text-slate-300',
  };

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusClasses[status]}`}>
      {status}
    </span>
  );
}

// CV Value Card - shows market value signals from Skills Lab
function CVValueCard() {
  const { user } = useUser();
  const userId = user?.id ?? '';

  const coreSignalsQuery = api.skillLab.coreSignals.useQuery(undefined, {
    enabled: Boolean(userId),
    staleTime: 30_000
  });

  const profileQuery = api.profile.getProfile.useQuery(undefined, {
    enabled: Boolean(userId),
    staleTime: 30_000,
  });

  const skillCount = profileQuery.data?.skills?.length ?? 0;
  const hasStrongProfile = skillCount >= 8;

  if (coreSignalsQuery.isLoading || profileQuery.isLoading) {
    return (
      <div className="mvh-card-glow rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-slate-900/40 p-6 animate-pulse">
        <div className="h-6 w-32 bg-white/10 rounded mb-2" />
        <div className="h-4 w-48 bg-white/10 rounded" />
      </div>
    );
  }

  const signals = coreSignalsQuery.data;

  return (
    <Link
      to="/skills"
      className="mvh-card-glow group rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-slate-900/40 p-6 transition hover:border-amber-500/50 hover:from-amber-500/15"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 transition group-hover:bg-amber-500/30">
          <span className="text-2xl font-bold text-amber-300">£</span>
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-white">CV Market Value</h2>
          <p className="mt-1 text-sm text-slate-400">
            Your profile's market positioning and salary potential
          </p>

          {signals ? (
            <div className="mt-4 space-y-3">
              {/* Salary Potential */}
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="h-4 w-4 text-amber-300" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                    Salary Potential
                  </p>
                </div>
                <p className="text-sm font-medium text-amber-100">
                  {signals.salaryImpact.tier}
                </p>
                <p className="mt-1 text-xs text-amber-200/70">
                  {signals.salaryImpact.rationale}
                </p>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                  <p className="text-xs text-slate-500">Skills</p>
                  <p className="text-lg font-bold text-white">{skillCount}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                  <p className="text-xs text-slate-500">Value Signals</p>
                  <p className="text-lg font-bold text-white">{signals.cvValueSignals.length}</p>
                </div>
              </div>

              {/* Top Growth Hook */}
              {signals.growthHooks.length > 0 && (
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Award className="h-3.5 w-3.5 text-amber-300" />
                    <p className="text-xs font-semibold text-amber-300">Top Growth Area</p>
                  </div>
                  <p className="text-xs text-amber-100">{signals.growthHooks[0]}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-sm font-medium text-white">
                  {hasStrongProfile
                    ? 'Higher potential (strong skill breadth)'
                    : 'Medium potential (build 3-5 core skills)'}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {skillCount} skills on profile
                </p>
              </div>
            </div>
          )}

          <div className="mt-4 flex items-center gap-2 text-xs font-medium text-amber-300">
            <span>View full analysis in Skills Lab</span>
            <span className="transition group-hover:translate-x-1">→</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function DashboardSnapshot({ snapshot }: { snapshot: DashboardSnapshotDto }) {
  const { profile, applications, practice, nextAction } = snapshot;
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
        {/* Workspace Status - Always show real information */}
        <div className="mt-5 rounded-2xl border border-white/10 bg-black/15 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300 mb-1">Workspace Status</p>
              <p className="text-sm text-slate-300">{nextAction.reason}</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <Link to="/profile" className="hover:text-white transition">Profile</Link>
              <Link to="/jobs" className="hover:text-white transition">Jobs</Link>
              <Link to="/applications" className="hover:text-white transition">Applications</Link>
              <Link to="/settings" className="hover:text-white transition">Settings</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Profile completeness"
          value={`${profile.completeness}%`}
          subtitle={profile.targetRole ? `Target role: ${profile.targetRole}` : 'Add your target role in Profile & goals'}
        />
        <StatCard title="Applications" value={String(applications.total)} subtitle={`${applications.needsReviewCount} need review`} />
        <StatCard
          title="Interview practice"
          value={String(practice.totalSessions)}
          subtitle={practice.averageScore === null ? 'No scored sessions yet' : `Average score ${practice.averageScore}`}
        />
        <StatCard
          title="Jobs tracked"
          value={String(applications.byStatus.saved + applications.byStatus.applied)}
          subtitle="Saved + applied positions"
        />
      </section>


      {/* Career Intelligence Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Career Intelligence</h2>
            <p className="mt-1 text-sm text-slate-400">
              AI-powered insights about your market value and skills match
            </p>
          </div>
          <Link
            to="/skills"
            className="text-sm font-medium text-indigo-300 hover:text-indigo-200 transition"
          >
            View Skills Lab →
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* CV Market Value Tile */}
          <CVValueCard />

          {/* Skills Market Value - % match */}
          <Link
            to="/skills"
            className="mvh-card-glow group rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 to-slate-900/40 p-6 transition hover:border-indigo-500/50 hover:from-indigo-500/15"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 transition group-hover:bg-indigo-500/30">
                <Sparkles className="h-6 w-6 text-indigo-300" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-white">Skills Market Value</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Match to your dream job
                </p>
                <div className="mt-3">
                  <p className="text-4xl font-bold text-white">{profile.completeness}%</p>
                  <p className="mt-1 text-xs text-slate-500">skills alignment score</p>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
                    style={{ width: `${profile.completeness}%` }}
                  />
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
                  Missing skills for your target role
                </p>
                <div className="mt-3">
                  <p className="text-4xl font-bold text-white">{profile.missingCriticalFields.length}</p>
                  <p className="mt-1 text-xs text-slate-500">gaps identified</p>
                </div>
                {profile.missingCriticalFields.length > 0 ? (
                  <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2">
                    <p className="text-xs text-amber-300 truncate">
                      {profile.missingCriticalFields[0]}
                    </p>
                  </div>
                ) : (
                  <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2">
                    <p className="text-xs font-medium text-emerald-300">
                      Profile complete — ready for analysis
                    </p>
                  </div>
                )}
                <div className="mt-4 flex items-center gap-2 text-xs font-medium text-teal-300">
                  <span>Open Skills Lab</span>
                  <span className="transition group-hover:translate-x-1">→</span>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Quick Navigation - 4 tiles */}
      <section className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Link to="/profile" className="mvh-card-glow group rounded-2xl border border-white/10 bg-white/5 p-5 text-center transition hover:border-indigo-500/40 hover:bg-indigo-500/5">
          <Target className="mx-auto h-8 w-8 text-indigo-300 mb-2" />
          <p className="text-sm font-semibold text-white">Open Profile</p>
          <p className="mt-1 text-xs text-slate-500">Edit your details</p>
        </Link>
        <Link to="/jobs" className="mvh-card-glow group rounded-2xl border border-white/10 bg-white/5 p-5 text-center transition hover:border-emerald-500/40 hover:bg-emerald-500/5">
          <Sparkles className="mx-auto h-8 w-8 text-emerald-300 mb-2" />
          <p className="text-sm font-semibold text-white">Jobs</p>
          <p className="mt-1 text-xs text-slate-500">Discover opportunities</p>
        </Link>
        <Link to="/applications" className="mvh-card-glow group rounded-2xl border border-white/10 bg-white/5 p-5 text-center transition hover:border-violet-500/40 hover:bg-violet-500/5">
          <Award className="mx-auto h-8 w-8 text-violet-300 mb-2" />
          <p className="text-sm font-semibold text-white">Applications</p>
          <p className="mt-1 text-xs text-slate-500">Track your pipeline</p>
        </Link>
        <Link to="/settings" className="mvh-card-glow group rounded-2xl border border-white/10 bg-white/5 p-5 text-center transition hover:border-amber-500/40 hover:bg-amber-500/5">
          <DollarSign className="mx-auto h-8 w-8 text-amber-300 mb-2" />
          <p className="text-sm font-semibold text-white">Settings</p>
          <p className="mt-1 text-xs text-slate-500">Preferences & billing</p>
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
              <p className="mt-4 text-sm text-amber-300">All tracked profile signals are present.</p>
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
