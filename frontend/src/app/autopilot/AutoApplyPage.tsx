import { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { api } from '@/lib/api';
import {
  Zap,
  Plus,
  Loader2,
  ChevronUp,
  RotateCcw,
  SkipForward,
  TrendingUp,
} from 'lucide-react';

// ─── types ────────────────────────────────────────────────────────────────────

type QueueStatus = 'pending' | 'processing' | 'applied' | 'failed' | 'skipped';

interface QueueItem {
  id: string;
  jobTitle: string;
  company: string;
  applyUrl: string;
  source: string | null;
  status: QueueStatus | null;
  fitScore: number | null;
  errorMessage: string | null;
  appliedAt: Date | string | null;
  scheduledAt: Date | string | null;
  createdAt: Date | string | null;
}

// ─── status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: QueueStatus | null }) {
  switch (status) {
    case 'pending':
      return (
        <span className="inline-flex items-center rounded-full bg-blue-500/15 border border-blue-500/30 px-2.5 py-0.5 text-xs font-medium text-blue-300">
          Pending
        </span>
      );
    case 'processing':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-xs font-medium text-amber-300">
          <Loader2 className="h-3 w-3 animate-spin" />
          Processing...
        </span>
      );
    case 'applied':
      return (
        <span className="inline-flex items-center rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
          Applied ✓
        </span>
      );
    case 'failed':
      return (
        <span className="inline-flex items-center rounded-full bg-red-500/15 border border-red-500/30 px-2.5 py-0.5 text-xs font-medium text-red-300">
          Failed
        </span>
      );
    case 'skipped':
      return (
        <span className="inline-flex items-center rounded-full bg-slate-500/15 border border-slate-500/30 px-2.5 py-0.5 text-xs font-medium text-slate-400">
          Skipped
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center rounded-full bg-slate-500/15 border border-slate-500/30 px-2.5 py-0.5 text-xs font-medium text-slate-400">
          Unknown
        </span>
      );
  }
}

// ─── stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  colour,
}: {
  label: string;
  value: number;
  colour: 'blue' | 'green' | 'red' | 'white';
}) {
  const colourMap: Record<string, string> = {
    blue: 'text-blue-400',
    green: 'text-emerald-400',
    red: 'text-red-400',
    white: 'text-white',
  };
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <p className="text-xs font-medium uppercase tracking-widest text-slate-500">{label}</p>
      <p className={`mt-1.5 text-3xl font-bold ${colourMap[colour]}`}>{value}</p>
    </div>
  );
}

// ─── format date ─────────────────────────────────────────────────────────────

function formatDate(d: Date | string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// ─── main component ───────────────────────────────────────────────────────────

export default function AutoApplyPage() {
  const { user, isLoaded } = useUser();
  const userId = user?.id ?? null;

  const [showAddForm, setShowAddForm] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [applyUrl, setApplyUrl] = useState('');
  const [source, setSource] = useState<'indeed' | 'reed' | 'gumtree' | 'manual'>('indeed');
  const [formError, setFormError] = useState<string | null>(null);

  // tRPC queries
  const queueQuery = api.autoApply.getQueue.useQuery(
    { userId: userId ?? '' },
    { enabled: Boolean(userId) },
  );

  const statsQuery = api.autoApply.getStats.useQuery(
    { userId: userId ?? '' },
    { enabled: Boolean(userId) },
  );

  // mutations
  const addMutation = api.autoApply.addToQueue.useMutation({
    onSuccess: () => {
      setJobTitle('');
      setCompany('');
      setApplyUrl('');
      setSource('indeed');
      setFormError(null);
      setShowAddForm(false);
      void queueQuery.refetch();
      void statsQuery.refetch();
    },
    onError: (err) => setFormError(err.message),
  });

  const updateStatusMutation = api.autoApply.updateStatus.useMutation({
    onSuccess: () => {
      void queueQuery.refetch();
      void statsQuery.refetch();
    },
  });

  const clearCompletedMutation = api.autoApply.clearCompleted.useMutation({
    onSuccess: () => {
      void queueQuery.refetch();
      void statsQuery.refetch();
    },
  });

  // handlers
  function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setFormError(null);
    addMutation.mutate({ userId, jobTitle, company, applyUrl, source });
  }

  function handleRetry(id: string) {
    updateStatusMutation.mutate({ id, status: 'pending' });
  }

  function handleSkip(id: string) {
    updateStatusMutation.mutate({ id, status: 'skipped' });
  }

  function handleClearCompleted() {
    if (!userId) return;
    clearCompletedMutation.mutate({ userId });
  }

  // render guards
  if (!isLoaded) return null;
  if (!userId) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500">
        Sign in to use Auto Apply
      </div>
    );
  }

  const queue = (queueQuery.data ?? []) as QueueItem[];
  const stats = statsQuery.data ?? { pending: 0, processing: 0, applied: 0, failed: 0, skipped: 0, total: 0, weeklyUsed: 0, weeklyLimit: 3, plan: 'free' };
  const weeklyPct = stats.weeklyLimit > 0 ? Math.min(100, Math.round((stats.weeklyUsed / stats.weeklyLimit) * 100)) : 0;
  const weeklyRemaining = Math.max(0, stats.weeklyLimit - stats.weeklyUsed);
  const planLabels: Record<string, string> = { free: 'Free', pro: 'Pro', autopilot: 'Autopilot' };
  const upgradeHints: Record<string, string | null> = {
    free: 'Upgrade to Pro for 15/week or Autopilot for 50/week',
    pro: 'Upgrade to Autopilot for 50/week',
    autopilot: null,
  };

  return (
    <div className="space-y-8">
      {/* Weekly quota bar */}
      <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
            <TrendingUp className="h-4 w-4 text-indigo-400" />
            Weekly auto-apply quota — <span className="text-indigo-300">{planLabels[stats.plan] ?? stats.plan} plan</span>
          </div>
          <span className={`text-sm font-semibold ${weeklyRemaining === 0 ? 'text-red-400' : 'text-slate-200'}`}>
            {stats.weeklyUsed} / {stats.weeklyLimit} used
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all ${weeklyPct >= 100 ? 'bg-red-500' : weeklyPct >= 80 ? 'bg-amber-500' : 'bg-indigo-500'}`}
            style={{ width: `${weeklyPct}%` }}
          />
        </div>
        {upgradeHints[stats.plan] && (
          <p className="mt-2 text-xs text-slate-500">
            {upgradeHints[stats.plan]} ·{' '}
            <a href="/billing" className="text-indigo-400 underline hover:text-indigo-300">Upgrade</a>
          </p>
        )}
        {weeklyRemaining === 0 && (
          <p className="mt-2 text-xs text-amber-400">Limit reached — resets every Monday at 00:00 UTC</p>
        )}
      </div>

      {/* header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10">
            <Zap className="h-6 w-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Auto Apply</h1>
            <p className="mt-0.5 text-sm text-slate-400">
              Autopilot automatically applies to matching jobs on your behalf
            </p>
          </div>
        </div>

        <div className="flex shrink-0 gap-3">
          <button
            onClick={() => setShowAddForm((v) => !v)}
            disabled={weeklyRemaining === 0}
            title={weeklyRemaining === 0 ? 'Weekly limit reached — resets Monday' : undefined}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {showAddForm ? <ChevronUp className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            Add Job
          </button>
          <button
            onClick={handleClearCompleted}
            disabled={clearCompletedMutation.isPending}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10 disabled:opacity-50"
          >
            {clearCompletedMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}
            Clear Completed
          </button>
        </div>
      </div>

      {/* stats bar */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Pending" value={stats.pending ?? 0} colour="blue" />
        <StatCard label="Applied" value={stats.applied ?? 0} colour="green" />
        <StatCard label="Failed" value={stats.failed ?? 0} colour="red" />
        <StatCard label="Total" value={stats.total ?? 0} colour="white" />
      </div>

      {/* add to queue form */}
      {showAddForm && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-sm font-semibold text-white">Add job to queue</h2>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">
                  Job Title <span className="text-red-400">*</span>
                </label>
                <input
                  required
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Senior Frontend Engineer"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">
                  Company <span className="text-red-400">*</span>
                </label>
                <input
                  required
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">
                  Apply URL <span className="text-red-400">*</span>
                </label>
                <input
                  required
                  type="url"
                  value={applyUrl}
                  onChange={(e) => setApplyUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">Source</label>
                <select
                  value={source}
                  onChange={(e) =>
                    setSource(e.target.value as 'indeed' | 'reed' | 'gumtree' | 'manual')
                  }
                  className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
                >
                  <option value="indeed">Indeed</option>
                  <option value="reed">Reed</option>
                  <option value="gumtree">Gumtree</option>
                  <option value="manual">Manual</option>
                </select>
              </div>
            </div>

            {formError && (
              <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
                {formError}
              </p>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addMutation.isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
              >
                {addMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Add to Queue
              </button>
            </div>
          </form>
        </div>
      )}

      {/* queue table */}
      <div className="rounded-2xl border border-white/10 bg-white/5">
        {queueQuery.isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
          </div>
        ) : queue.length === 0 ? (
          <div className="py-16 text-center">
            <Zap className="mx-auto mb-3 h-10 w-10 text-slate-700" />
            <p className="text-sm text-slate-500">
              No jobs in queue. Add jobs manually or enable Auto-Pilot to discover and queue jobs
              automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Job Title
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Company
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Source
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Fit Score
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Scheduled
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {queue.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-white/[0.03]">
                    <td className="px-5 py-4">
                      <a
                        href={item.applyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-white hover:text-indigo-400 transition-colors"
                      >
                        {item.jobTitle}
                      </a>
                    </td>
                    <td className="px-5 py-4 text-slate-300">{item.company}</td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-400 capitalize">
                        {item.source ?? '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-5 py-4 text-slate-400">
                      {item.fitScore != null ? (
                        <span
                          className={
                            item.fitScore >= 80
                              ? 'text-emerald-400'
                              : item.fitScore >= 60
                              ? 'text-amber-400'
                              : 'text-red-400'
                          }
                        >
                          {item.fitScore}%
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-400">
                      {formatDate(item.scheduledAt)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {item.status === 'applied' && (
                        <span className="text-xs text-slate-500">
                          {formatDate(item.appliedAt)}
                        </span>
                      )}
                      {item.status === 'failed' && (
                        <button
                          onClick={() => handleRetry(item.id)}
                          disabled={updateStatusMutation.isPending}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-300 transition-colors hover:bg-indigo-500/20 disabled:opacity-50"
                        >
                          <RotateCcw className="h-3 w-3" />
                          Retry
                        </button>
                      )}
                      {item.status === 'pending' && (
                        <button
                          onClick={() => handleSkip(item.id)}
                          disabled={updateStatusMutation.isPending}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-500/30 bg-slate-500/10 px-3 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-500/20 disabled:opacity-50"
                        >
                          <SkipForward className="h-3 w-3" />
                          Skip
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
