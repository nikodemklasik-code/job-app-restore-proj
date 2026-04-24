import { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import {
  Bell,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  History,
  Inbox,
  Loader2,
  Mail,
  MessageSquare,
  RotateCcw,
  XCircle,
} from 'lucide-react';

type ReviewQueueItem = {
  applicationId: string;
  company: string;
  role: string;
  status: 'draft' | 'sent' | 'viewed' | 'interview' | 'offer' | 'accepted' | 'rejected' | 'archived';
  silenceDays: number;
  lastFollowedUpAt: string | null;
  listingStatus: 'active' | 'inactive' | 'unknown';
  recommendedAction: 'wait' | 'follow_up' | 'close_application' | 'move_to_interview' | 'none';
  recommendationReasons: string[];
  relatedJob: {
    id: string;
    title: string;
    company: string;
    location: string | null;
    url: string | null;
    isActive: boolean;
  } | null;
};

type LogEntry = { id: string; action: string; createdAt: Date | string };

type FilterType = 'all' | 'follow_up' | 'wait' | 'interview' | 'close';

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'follow_up', label: 'Follow-up needed' },
  { key: 'wait', label: 'Wait' },
  { key: 'interview', label: 'Interview stage' },
  { key: 'close', label: 'Close candidates' },
];

const ACTION_META: Record<ReviewQueueItem['recommendedAction'], {
  label: string;
  icon: React.ElementType;
  badgeClass: string;
  panelClass: string;
}> = {
  follow_up: {
    label: 'Send follow-up',
    icon: Mail,
    badgeClass: 'bg-amber-500/20 text-amber-300',
    panelClass: 'border-amber-500/25 bg-amber-500/8',
  },
  wait: {
    label: 'Wait',
    icon: Clock,
    badgeClass: 'bg-sky-500/20 text-sky-300',
    panelClass: 'border-sky-500/20 bg-sky-500/8',
  },
  close_application: {
    label: 'Close application',
    icon: XCircle,
    badgeClass: 'bg-rose-500/20 text-rose-300',
    panelClass: 'border-rose-500/25 bg-rose-500/8',
  },
  move_to_interview: {
    label: 'Move to interview',
    icon: MessageSquare,
    badgeClass: 'bg-indigo-500/20 text-indigo-300',
    panelClass: 'border-indigo-500/25 bg-indigo-500/8',
  },
  none: {
    label: 'No action',
    icon: CheckCircle2,
    badgeClass: 'bg-white/10 text-slate-300',
    panelClass: 'border-white/10 bg-white/5',
  },
};

const LISTING_BADGE: Record<ReviewQueueItem['listingStatus'], string> = {
  active: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
  inactive: 'bg-rose-500/15 text-rose-300 border-rose-500/20',
  unknown: 'bg-slate-500/15 text-slate-300 border-slate-500/20',
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function SummaryBar({ items }: { items: ReviewQueueItem[] }) {
  const followUps = items.filter((item) => item.recommendedAction === 'follow_up').length;
  const waiting = items.filter((item) => item.recommendedAction === 'wait').length;
  const close = items.filter((item) => item.recommendedAction === 'close_application').length;
  const inactive = items.filter((item) => item.listingStatus === 'inactive').length;

  const stats = [
    { label: 'In queue', value: items.length, icon: Briefcase, color: 'text-sky-400', bg: 'bg-sky-500/10' },
    { label: 'Follow-ups', value: followUps, icon: Mail, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Wait', value: waiting, icon: Clock, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { label: 'Inactive listings', value: inactive + close, icon: XCircle, color: 'text-rose-400', bg: 'bg-rose-500/10' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-2xl border border-white/8 bg-white/5 p-4">
          <div className={`mb-2 inline-flex rounded-xl p-2 ${stat.bg}`}>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </div>
          <p className="text-xl font-bold text-white">{stat.value}</p>
          <p className="text-xs text-slate-500">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  const navigate = useNavigate();
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-12 text-center">
      <Inbox className="mx-auto mb-4 h-12 w-12 text-slate-600" />
      <p className="font-semibold text-white">All clear</p>
      <p className="mx-auto mt-2 max-w-md text-pretty text-sm text-slate-500">
        No applications match the review threshold. The queue is now based on the server review contract, not local guesswork.
      </p>
      <button
        onClick={() => navigate('/applications')}
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
      >
        <Briefcase className="h-4 w-4" />
        Go to Applications
      </button>
    </div>
  );
}

function QueueCard({
  item,
  logsExpanded,
  logsLoading,
  logEntries,
  isPending,
  onToggleLogs,
  onFollowUp,
  onMoveToInterview,
  onClose,
  onMarkNoResponse,
}: {
  item: ReviewQueueItem;
  logsExpanded: boolean;
  logsLoading: boolean;
  logEntries: LogEntry[];
  isPending: boolean;
  onToggleLogs: () => void;
  onFollowUp: () => void;
  onMoveToInterview: () => void;
  onClose: () => void;
  onMarkNoResponse: () => void;
}) {
  const meta = ACTION_META[item.recommendedAction];
  const Icon = meta.icon;

  return (
    <div className={`rounded-2xl border p-5 transition-all ${meta.panelClass}`}>
      <div className="flex items-start gap-4">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/20">
          <Icon className="h-5 w-5 text-white" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.badgeClass}`}>
              {meta.label}
            </span>
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${LISTING_BADGE[item.listingStatus]}`}>
              Listing {item.listingStatus}
            </span>
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-medium text-slate-400">
              {item.silenceDays} silence days
            </span>
          </div>

          <div className="mt-2">
            <p className="font-semibold leading-tight text-white">{item.role}</p>
            <p className="text-sm text-slate-400">{item.company}</p>
          </div>

          <ul className="mt-3 space-y-1 text-xs text-slate-400">
            {item.recommendationReasons.map((reason) => (
              <li key={reason}>• {reason}</li>
            ))}
          </ul>

          {item.relatedJob ? (
            <div className="mt-3 rounded-xl border border-white/8 bg-black/20 px-3 py-2 text-xs text-slate-400">
              <p className="font-medium text-slate-300">Linked listing: {item.relatedJob.title}</p>
              <p>{item.relatedJob.company}{item.relatedJob.location ? ` · ${item.relatedJob.location}` : ''}</p>
              {item.relatedJob.url ? (
                <a
                  href={item.relatedJob.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-indigo-300 hover:text-indigo-200"
                >
                  Open original listing
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="shrink-0 text-right text-xs text-slate-500">
          <p>Last follow-up</p>
          <p className="mt-1 text-slate-400">{formatDate(item.lastFollowedUpAt)}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-white/8 pt-4">
        {item.recommendedAction === 'follow_up' ? (
          <button
            onClick={onFollowUp}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500/15 px-3 py-1.5 text-xs font-medium text-amber-300 transition-colors hover:bg-amber-500/25 disabled:opacity-50"
          >
            <Mail className="h-3.5 w-3.5" />
            Mark followed up
          </button>
        ) : null}

        {item.status !== 'interview' ? (
          <button
            onClick={onMoveToInterview}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-500/15 px-3 py-1.5 text-xs font-medium text-indigo-300 transition-colors hover:bg-indigo-500/25 disabled:opacity-50"
          >
            <CalendarClock className="h-3.5 w-3.5" />
            Move to interview
          </button>
        ) : null}

        <button
          onClick={onMarkNoResponse}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-xl bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:bg-white/10 disabled:opacity-50"
        >
          <XCircle className="h-3.5 w-3.5" />
          Mark no response
        </button>

        <button
          onClick={onClose}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-xl bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:bg-white/10 disabled:opacity-50"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Close application
        </button>

        <button
          type="button"
          onClick={onToggleLogs}
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:bg-white/10"
        >
          <History className="h-3.5 w-3.5" />
          {logsExpanded ? 'Hide activity' : 'Activity log'}
        </button>
      </div>

      {logsExpanded ? (
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
                <li key={entry.id} className="flex items-center justify-between gap-2 rounded-lg border border-white/6 bg-black/20 px-2.5 py-1.5">
                  <span className="font-medium text-slate-300">{entry.action}</span>
                  <span className="shrink-0 text-slate-500">
                    {new Date(entry.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default function ReviewQueue() {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const userId = user?.id ?? '';

  const [filter, setFilter] = useState<FilterType>('all');
  const [logForAppId, setLogForAppId] = useState<string | null>(null);

  const queueQuery = api.review.getQueue.useQuery(
    { silenceThresholdDays: 7 },
    { enabled: isLoaded && Boolean(userId), staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 },
  );

  const logsQuery = api.applications.getLogs.useQuery(
    { userId, applicationId: logForAppId ?? '' },
    { enabled: isLoaded && Boolean(userId) && Boolean(logForAppId) },
  );

  const followUpMutation = api.review.followUp.useMutation({ onSuccess: () => void queueQuery.refetch() });
  const markInterviewMutation = api.review.markInterview.useMutation({ onSuccess: () => void queueQuery.refetch() });
  const closeMutation = api.review.closeApplication.useMutation({ onSuccess: () => void queueQuery.refetch() });
  const markNoResponseMutation = api.review.markNoResponse.useMutation({ onSuccess: () => void queueQuery.refetch() });

  if (!isLoaded) return null;

  if (!userId) {
    return <div className="flex items-center justify-center py-24 text-slate-500">Sign in to view your review queue</div>;
  }

  if (queueQuery.isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (queueQuery.isError) {
    return (
      <section className="rounded-3xl border border-rose-400/25 bg-rose-500/10 p-6">
        <h1 className="text-xl font-semibold text-rose-100">Applications Review failed to load</h1>
        <p className="mt-2 text-sm text-rose-50/80">{queueQuery.error.message}</p>
        <button
          type="button"
          onClick={() => void queueQuery.refetch()}
          className="mt-4 inline-flex items-center rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-400"
        >
          Retry
        </button>
      </section>
    );
  }

  const queue = (queueQuery.data ?? []) as ReviewQueueItem[];
  const filtered = queue.filter((item) => {
    if (filter === 'all') return true;
    if (filter === 'follow_up') return item.recommendedAction === 'follow_up';
    if (filter === 'wait') return item.recommendedAction === 'wait' || item.recommendedAction === 'none';
    if (filter === 'interview') return item.status === 'interview' || item.recommendedAction === 'move_to_interview';
    if (filter === 'close') return item.recommendedAction === 'close_application';
    return true;
  });

  const highCount = queue.filter((item) => item.recommendedAction === 'follow_up' || item.recommendedAction === 'close_application').length;
  const isPending = followUpMutation.isPending || markInterviewMutation.isPending || closeMutation.isPending || markNoResponseMutation.isPending;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10">
            <Bell className="h-6 w-6 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-balance text-2xl font-bold text-white">Applications Review</h1>
              {highCount > 0 ? (
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                  {highCount}
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 text-sm text-slate-400">
              Server-ranked application follow-up queue based on silence days, timeline state, and listing status.
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/applications')}
          className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-white/10 hover:text-white sm:inline-flex"
        >
          All applications
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {queue.length > 0 ? <SummaryBar items={queue} /> : null}

      {queue.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((item) => {
            const count = queue.filter((queueItem) => {
              if (item.key === 'all') return true;
              if (item.key === 'follow_up') return queueItem.recommendedAction === 'follow_up';
              if (item.key === 'wait') return queueItem.recommendedAction === 'wait' || queueItem.recommendedAction === 'none';
              if (item.key === 'interview') return queueItem.status === 'interview' || queueItem.recommendedAction === 'move_to_interview';
              if (item.key === 'close') return queueItem.recommendedAction === 'close_application';
              return false;
            }).length;
            if (count === 0 && item.key !== 'all') return null;
            return (
              <button
                key={item.key}
                onClick={() => setFilter(item.key)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  filter === item.key
                    ? 'bg-white text-slate-900'
                    : 'border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
                }`}
              >
                {item.label}
                <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${filter === item.key ? 'bg-slate-200 text-slate-700' : 'bg-white/10 text-slate-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <QueueCard
              key={item.applicationId}
              item={item}
              logsExpanded={logForAppId === item.applicationId}
              onToggleLogs={() => setLogForAppId((current) => (current === item.applicationId ? null : item.applicationId))}
              logEntries={(logsQuery.data ?? []) as LogEntry[]}
              logsLoading={logForAppId === item.applicationId && logsQuery.isFetching}
              isPending={isPending}
              onFollowUp={() => followUpMutation.mutate({ applicationId: item.applicationId, note: 'Follow-up sent from Applications Review' })}
              onMoveToInterview={() => markInterviewMutation.mutate({ applicationId: item.applicationId, note: 'Moved from Applications Review' })}
              onClose={() => closeMutation.mutate({ applicationId: item.applicationId, note: 'Closed from Applications Review' })}
              onMarkNoResponse={() => markNoResponseMutation.mutate({ applicationId: item.applicationId, note: 'Marked no response from Applications Review' })}
            />
          ))}
        </div>
      )}

      {queue.length > 0 ? (
        <div className="flex justify-center pt-2">
          <button
            onClick={() => navigate('/applications/board')}
            className="inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-300"
          >
            Open kanban board
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
