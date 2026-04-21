import { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import {
  Clock,
  Mail,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Loader2,
  Inbox,
  CalendarClock,
  TrendingUp,
  MessageSquare,
  Briefcase,
  Bell,
  RotateCcw,
  History,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type AppStatus = 'draft' | 'prepared' | 'sent' | 'interview' | 'accepted' | 'rejected';

interface Application {
  id: string;
  jobTitle: string;
  company: string;
  status: AppStatus;
  fitScore: number | null;
  coverLetterSnapshot: string | null;
  notes: string | null;
  emailSentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysSince(dateStr: string | null | undefined): number {
  if (!dateStr) return 0;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

type ActionType = 'follow_up' | 'interview_prep' | 'awaiting' | 'celebrate' | 'reapply';

interface QueueItem {
  app: Application;
  action: ActionType;
  urgency: 'high' | 'medium' | 'low';
  label: string;
  detail: string;
  days: number;
}

function classifyAction(app: Application): QueueItem | null {
  const days = daysSince(app.emailSentAt ?? app.updatedAt);

  if (app.status === 'sent' && days >= 14) {
    return {
      app, action: 'follow_up', urgency: days >= 21 ? 'high' : 'medium',
      label: 'Send follow-up',
      detail: `No response in ${days} days`,
      days,
    };
  }
  if (app.status === 'sent' && days >= 7 && days < 14) {
    return {
      app, action: 'awaiting', urgency: 'low',
      label: 'Awaiting response',
      detail: `Submitted ${days} days ago`,
      days,
    };
  }
  if (app.status === 'interview') {
    return {
      app, action: 'interview_prep', urgency: 'high',
      label: 'Prepare for interview',
      detail: 'Interview stage — practice now',
      days,
    };
  }
  if (app.status === 'accepted') {
    return {
      app, action: 'celebrate', urgency: 'low',
      label: 'Offer received',
      detail: 'Review offer and negotiate',
      days,
    };
  }
  if (app.status === 'rejected' && days <= 30) {
    return {
      app, action: 'reapply', urgency: 'low',
      label: 'Consider next steps',
      detail: `Rejected ${days} days ago`,
      days,
    };
  }
  return null;
}

// ─── Action config ────────────────────────────────────────────────────────────

const ACTION_CONFIG: Record<ActionType, {
  icon: React.ElementType;
  iconColor: string;
  bg: string;
  border: string;
  badgeClass: string;
}> = {
  follow_up:      { icon: Mail,        iconColor: 'text-amber-400',   bg: 'bg-amber-500/8',   border: 'border-amber-500/25',   badgeClass: 'bg-amber-500/20 text-amber-300' },
  interview_prep: { icon: MessageSquare, iconColor: 'text-indigo-400', bg: 'bg-indigo-500/8',  border: 'border-indigo-500/25',  badgeClass: 'bg-indigo-500/20 text-indigo-300' },
  awaiting:       { icon: Clock,        iconColor: 'text-sky-400',     bg: 'bg-sky-500/8',     border: 'border-sky-500/20',     badgeClass: 'bg-sky-500/20 text-sky-300' },
  celebrate:      { icon: CheckCircle2, iconColor: 'text-emerald-400', bg: 'bg-emerald-500/8', border: 'border-emerald-500/25', badgeClass: 'bg-emerald-500/20 text-emerald-300' },
  reapply:        { icon: RotateCcw,    iconColor: 'text-slate-400',   bg: 'bg-white/5',       border: 'border-white/10',       badgeClass: 'bg-white/10 text-slate-400' },
};

const URGENCY_DOT: Record<string, string> = {
  high:   'bg-red-400',
  medium: 'bg-amber-400',
  low:    'bg-slate-500',
};

// ─── Summary stats ────────────────────────────────────────────────────────────

function SummaryBar({ apps }: { apps: Application[] }) {
  const sent      = apps.filter(a => a.status === 'sent').length;
  const interview = apps.filter(a => a.status === 'interview').length;
  const offer     = apps.filter(a => a.status === 'accepted').length;
  const stale     = apps.filter(a => a.status === 'sent' && daysSince(a.emailSentAt ?? a.updatedAt) >= 14).length;

  const stats = [
    { label: 'Active',     value: sent,      icon: Briefcase,   color: 'text-sky-400',     bg: 'bg-sky-500/10' },
    { label: 'Interviews', value: interview,  icon: MessageSquare, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Offers',     value: offer,      icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Need action',value: stale,      icon: Bell,        color: 'text-red-400',     bg: 'bg-red-500/10' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map(s => (
        <div key={s.label} className="rounded-2xl border border-white/8 bg-white/5 p-4">
          <div className={`mb-2 inline-flex rounded-xl p-2 ${s.bg}`}>
            <s.icon className={`h-4 w-4 ${s.color}`} />
          </div>
          <p className="text-xl font-bold text-white">{s.value}</p>
          <p className="text-xs text-slate-500">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Queue card ───────────────────────────────────────────────────────────────

type LogEntry = { id: string; action: string; createdAt: Date | string };

function QueueCard({
  item,
  onStatusChange,
  onFollowUp,
  onGoToInterview,
  onGoToNegotiation,
  isPending,
  logsExpanded,
  onToggleLogs,
  logEntries,
  logsLoading,
}: {
  item: QueueItem;
  onStatusChange: (id: string, status: AppStatus) => void;
  onFollowUp: (id: string) => void;
  onGoToInterview: () => void;
  onGoToNegotiation: () => void;
  isPending: boolean;
  logsExpanded: boolean;
  onToggleLogs: () => void;
  logEntries: LogEntry[];
  logsLoading: boolean;
}) {
  const { app, action, urgency, label, detail } = item;
  const cfg = ACTION_CONFIG[action];
  const Icon = cfg.icon;

  return (
    <div className={`rounded-2xl border ${cfg.border} ${cfg.bg} p-5 transition-all`}>
      <div className="flex items-start gap-4">
        {/* icon */}
        <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${cfg.border} bg-black/20`}>
          <Icon className={`h-5 w-5 ${cfg.iconColor}`} />
        </div>

        {/* content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.badgeClass}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${URGENCY_DOT[urgency]}`} />
              {label}
            </span>
          </div>

          <div className="mt-2">
            <p className="font-semibold text-white leading-tight">{app.jobTitle}</p>
            <p className="text-sm text-slate-400">{app.company}</p>
          </div>

          <p className="mt-1.5 text-xs text-slate-500">{detail}</p>

          {app.fitScore !== null && (
            <div className="mt-2 flex items-center gap-1.5">
              <TrendingUp className="h-3 w-3 text-slate-500" />
              <span className="text-xs text-slate-500">Fit score: <span className="font-medium text-slate-300">{app.fitScore}%</span></span>
            </div>
          )}
        </div>

        {/* date */}
        <div className="shrink-0 text-right">
          <p className="text-xs text-slate-500">{formatDate(app.emailSentAt ?? app.createdAt)}</p>
        </div>
      </div>

      {/* action buttons */}
      <div className="mt-4 flex flex-wrap gap-2 border-t border-white/8 pt-4">
        {action === 'follow_up' && (
          <>
            <button
              onClick={() => onFollowUp(app.id)}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500/15 px-3 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-500/25 transition-colors disabled:opacity-50"
            >
              <Mail className="h-3.5 w-3.5" />
              Mark followed up
            </button>
            <button
              onClick={() => onStatusChange(app.id, 'interview')}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              <CalendarClock className="h-3.5 w-3.5" />
              Got interview
            </button>
            <button
              onClick={() => onStatusChange(app.id, 'rejected')}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              <XCircle className="h-3.5 w-3.5" />
              Mark rejected
            </button>
          </>
        )}

        {action === 'awaiting' && (
          <button
            onClick={() => onStatusChange(app.id, 'interview')}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-xl bg-sky-500/15 px-3 py-1.5 text-xs font-medium text-sky-300 hover:bg-sky-500/25 transition-colors disabled:opacity-50"
          >
            <CalendarClock className="h-3.5 w-3.5" />
            Got interview
          </button>
        )}

        {action === 'interview_prep' && (
          <button
            onClick={onGoToInterview}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Practice interview
            <ChevronRight className="h-3.5 w-3.5 opacity-60" />
          </button>
        )}

        {action === 'celebrate' && (
          <button
            onClick={onGoToNegotiation}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 transition-colors"
          >
            <TrendingUp className="h-3.5 w-3.5" />
            Negotiate offer
            <ChevronRight className="h-3.5 w-3.5 opacity-60" />
          </button>
        )}

        {action === 'reapply' && (
          <button
            onClick={() => onStatusChange(app.id, 'draft')}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reopen as draft
          </button>
        )}

        <button
          type="button"
          onClick={onToggleLogs}
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-white/10 transition-colors"
        >
          <History className="h-3.5 w-3.5" />
          {logsExpanded ? 'Hide activity' : 'Activity log'}
        </button>
      </div>

      {logsExpanded && (
        <div className="mt-4 border-t border-white/8 pt-4">
          {logsLoading ? (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
              Loading events…
            </div>
          ) : logEntries.length === 0 ? (
            <p className="text-xs text-slate-500">No logged events for this application yet.</p>
          ) : (
            <ul className="max-h-40 space-y-2 overflow-y-auto text-xs">
              {logEntries.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-white/6 bg-black/20 px-2.5 py-1.5"
                >
                  <span className="font-medium text-slate-300">{entry.action}</span>
                  <span className="shrink-0 text-slate-500">
                    {new Date(entry.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ hasApps }: { hasApps: boolean }) {
  const navigate = useNavigate();
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-12 text-center">
      <Inbox className="mx-auto mb-4 h-12 w-12 text-slate-600" />
      {hasApps ? (
        <>
          <p className="font-semibold text-white">All clear</p>
          <p className="mt-1 text-sm text-slate-500">
            No applications need your attention right now.
          </p>
        </>
      ) : (
        <>
          <p className="text-balance font-semibold text-white">No applications yet</p>
          <p className="mx-auto mt-2 max-w-md text-pretty text-sm text-slate-500">
            Start tracking your job applications and this queue will surface what needs action.
          </p>
          <button
            onClick={() => navigate('/applications')}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            <Briefcase className="h-4 w-4" />
            Go to Applications
          </button>
        </>
      )}
    </div>
  );
}

// ─── Filter tabs ──────────────────────────────────────────────────────────────

type FilterType = 'all' | 'follow_up' | 'interview_prep' | 'offers';

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all',            label: 'All' },
  { key: 'follow_up',      label: 'Follow-up needed' },
  { key: 'interview_prep', label: 'Interview stage' },
  { key: 'offers',         label: 'Offers' },
];

// ─── Main component ───────────────────────────────────────────────────────────

export default function ReviewQueue() {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const userId = user?.id ?? '';

  const [filter, setFilter] = useState<FilterType>('all');
  const [logForAppId, setLogForAppId] = useState<string | null>(null);

  const appsQuery = api.applications.getAll.useQuery(
    { userId },
    { enabled: isLoaded && !!userId },
  );

  const logsQuery = api.applications.getLogs.useQuery(
    { userId, applicationId: logForAppId ?? '' },
    { enabled: isLoaded && !!userId && !!logForAppId },
  );

  const statusMutation = api.applications.updateStatus.useMutation({
    onSuccess: () => {
      void appsQuery.refetch();
      void logsQuery.refetch();
    },
  });

  const followUpMutation = api.review.followUp.useMutation({
    onSuccess: () => void appsQuery.refetch(),
  });

  if (!isLoaded) return null;

  if (!userId) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500">
        Sign in to view your review queue
      </div>
    );
  }

  if (appsQuery.isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  const apps = (appsQuery.data ?? []) as unknown as Application[];

  // Build queue
  const queue: QueueItem[] = apps
    .map(classifyAction)
    .filter((x): x is QueueItem => x !== null)
    .sort((a, b) => {
      const u = { high: 0, medium: 1, low: 2 };
      return u[a.urgency] - u[b.urgency] || b.days - a.days;
    });

  // Apply filter
  const filtered = queue.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'follow_up') return item.action === 'follow_up' || item.action === 'awaiting';
    if (filter === 'interview_prep') return item.action === 'interview_prep';
    if (filter === 'offers') return item.action === 'celebrate';
    return true;
  });

  const highCount = queue.filter(i => i.urgency === 'high').length;

  return (
    <div className="space-y-8">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10">
            <Bell className="h-6 w-6 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-balance text-2xl font-bold text-white">Review queue</h1>
              {highCount > 0 && (
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                  {highCount}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-slate-400">
              Applications that need your attention right now.
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/applications')}
          className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
        >
          All applications
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* ── Summary bar ─────────────────────────────────────────────────── */}
      {apps.length > 0 && <SummaryBar apps={apps} />}

      {/* ── Filter tabs ─────────────────────────────────────────────────── */}
      {queue.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(f => {
            const count = f.key === 'all' ? queue.length
              : f.key === 'follow_up' ? queue.filter(i => i.action === 'follow_up' || i.action === 'awaiting').length
              : f.key === 'interview_prep' ? queue.filter(i => i.action === 'interview_prep').length
              : queue.filter(i => i.action === 'celebrate').length;

            if (count === 0 && f.key !== 'all') return null;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  filter === f.key
                    ? 'bg-white text-slate-900'
                    : 'border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
                }`}
              >
                {f.label}
                {count > 0 && (
                  <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${
                    filter === f.key ? 'bg-slate-200 text-slate-700' : 'bg-white/10 text-slate-400'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Queue ───────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <EmptyState hasApps={apps.length > 0} />
      ) : (
        <div className="space-y-3">
          {filtered.map(item => (
            <QueueCard
              key={item.app.id}
              item={item}
              onStatusChange={(id, status) => statusMutation.mutate({ id, status, userId })}
              onFollowUp={(id) => followUpMutation.mutate({ applicationId: id, note: 'Follow-up sent' })}
              onGoToInterview={() => navigate('/practice/interview')}
              onGoToNegotiation={() => navigate('/practice/negotiation')}
              isPending={statusMutation.isPending || followUpMutation.isPending}
              logsExpanded={logForAppId === item.app.id}
              onToggleLogs={() => setLogForAppId((cur) => (cur === item.app.id ? null : item.app.id))}
              logEntries={(logsQuery.data ?? []) as LogEntry[]}
              logsLoading={logForAppId === item.app.id && logsQuery.isFetching}
            />
          ))}
        </div>
      )}

      {/* ── Footer link ─────────────────────────────────────────────────── */}
      {apps.length > 0 && (
        <div className="flex justify-center pt-2">
          <button
            onClick={() => navigate('/applications/board')}
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            Open kanban board
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
