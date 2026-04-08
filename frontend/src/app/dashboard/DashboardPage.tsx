import { useUser } from '@clerk/clerk-react';
import { Briefcase, TrendingUp, MessageSquare, Award, ChevronRight, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useNavigate } from 'react-router-dom';

const PIPELINE_STATUSES = [
  { key: 'draft', label: 'Draft', color: 'bg-slate-500' },
  { key: 'prepared', label: 'Prepared', color: 'bg-indigo-500' },
  { key: 'sent', label: 'Sent', color: 'bg-sky-500' },
  { key: 'interview', label: 'Interview', color: 'bg-amber-500' },
  { key: 'accepted', label: 'Offers', color: 'bg-emerald-500' },
  { key: 'rejected', label: 'Rejected', color: 'bg-red-500' },
];

const suggestedActions = [
  { title: 'Complete your profile', description: 'Add work experience to boost your fit scores', badge: 'Profile', href: '/profile' },
  { title: 'Search for jobs', description: 'Browse AI-matched jobs from Reed, Adzuna, and Jooble', badge: 'Jobs', href: '/jobs' },
  { title: 'Review applications', description: 'Update statuses and generate documents for your pipeline', badge: 'Pipeline', href: '/applications' },
];

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const userId = user?.id ?? '';
  const navigate = useNavigate();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const analyticsQuery = api.applications.getAnalytics.useQuery(
    { userId },
    { enabled: isLoaded && !!userId }
  );

  const analytics = analyticsQuery.data;

  const stats = [
    {
      label: 'Total Applications',
      value: analytics?.total ?? 0,
      icon: Briefcase,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
    },
    {
      label: 'Response Rate',
      value: analytics ? `${analytics.responseRate}%` : '—',
      icon: TrendingUp,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Interviews',
      value: analytics?.interviews ?? 0,
      icon: MessageSquare,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
    {
      label: 'Offers',
      value: analytics?.offers ?? 0,
      icon: Award,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
  ];

  if (!isLoaded) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  const byStatus = analytics?.byStatus ?? {};
  const total = analytics?.total ?? 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">
          {greeting}, {user?.firstName ?? 'there'}
        </h1>
        <p className="mt-1 text-slate-400">Here's what's happening in your career workspace today.</p>
      </div>

      {/* Stats */}
      {analyticsQuery.isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      ) : analyticsQuery.isError ? (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          Failed to load analytics
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className={`mb-3 inline-flex rounded-xl p-2.5 ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="mt-0.5 text-sm text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Pipeline Mini-Chart */}
      {analytics && total > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
          <h2 className="font-semibold text-white">Application Pipeline</h2>
          <div className="space-y-3">
            {PIPELINE_STATUSES.map(({ key, label, color }) => {
              const count = (byStatus as Record<string, number>)[key] ?? 0;
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className="w-20 text-xs text-slate-400 shrink-0">{label}</span>
                  <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all ${color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-xs font-medium text-slate-400">{count}</span>
                </div>
              );
            })}
          </div>

          {/* Summary stats row */}
          <div className="flex gap-4 pt-2 border-t border-white/10">
            <div className="text-center">
              <p className="text-lg font-bold text-white">{analytics.applied}</p>
              <p className="text-xs text-slate-500">Sent</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-white">{analytics.interviews}</p>
              <p className="text-xs text-slate-500">Interviews</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-white">{analytics.offers}</p>
              <p className="text-xs text-slate-500">Offers</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-white">{analytics.rejections}</p>
              <p className="text-xs text-slate-500">Rejections</p>
            </div>
            <div className="ml-auto text-center">
              <p className="text-lg font-bold text-emerald-400">{analytics.responseRate}%</p>
              <p className="text-xs text-slate-500">Response Rate</p>
            </div>
          </div>
        </div>
      )}

      {/* Suggested Actions */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-white">Next Actions</h2>
        <div className="space-y-3">
          {suggestedActions.map((action) => (
            <button
              key={action.href}
              onClick={() => void navigate(action.href)}
              className="group flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-indigo-500/30 hover:bg-white/[0.07]"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white">{action.title}</span>
                  <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-medium text-indigo-400">
                    {action.badge}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-slate-500">{action.description}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-400" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
