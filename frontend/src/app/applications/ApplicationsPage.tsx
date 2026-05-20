import { useEffect, useMemo, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Bell,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Loader2,
  Mail,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { api } from '@/lib/api';
import toast from '@/lib/toast';
import { JobsLifecycleTabs } from '@/features/jobs/JobsLifecycleTabs';
import { Card, CardContent } from '@/components/ui/card';
import { ApplicationCard } from '@/components/applications/ApplicationCard';

type ApplicationStatus = 'draft' | 'prepared' | 'sent' | 'follow_up_sent' | 'rejected' | 'accepted' | 'interview';
type ApplicationMode = 'all' | 'review' | 'drafts' | 'sent' | 'interview';

type CardState = {
  emailSubject: string;
  emailBody: string;
  employerEmail: string;
};

type ApplicationRow = {
  id: string;
  jobTitle: string;
  company: string;
  status: ApplicationStatus;
  fitScore?: number | null;
  notes?: string | null;
  jobDescription?: string | null;
  emailSentAt?: string | Date | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
};

type ReviewItem = {
  application: ApplicationRow;
  label: string;
  detail: string;
  urgency: 'high' | 'medium' | 'low';
  days: number;
};

const MODES: Array<{ key: ApplicationMode; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'review', label: 'Review Queue' },
  { key: 'drafts', label: 'Drafts' },
  { key: 'sent', label: 'Sent' },
  { key: 'interview', label: 'Interview' },
];

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

function asDate(value?: string | Date | null): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysSince(value?: string | Date | null): number {
  const date = asDate(value);
  if (!date) return 0;
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86_400_000));
}

function formatDate(value?: string | Date | null): string {
  const date = asDate(value);
  if (!date) return 'No date';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function buildReviewItem(application: ApplicationRow): ReviewItem | null {
  const referenceDate = application.emailSentAt ?? application.updatedAt ?? application.createdAt;
  const days = daysSince(referenceDate);

  if (application.status === 'sent' && days >= 14) {
    return {
      application,
      label: 'Follow-Up Recommended',
      detail: `No response for ${days} days since sending.`,
      urgency: days >= 21 ? 'high' : 'medium',
      days,
    };
  }

  if (application.status === 'sent' && days >= 7) {
    return {
      application,
      label: 'Waiting For Reply',
      detail: `Sent ${days} days ago. Keep tracking it here.`,
      urgency: 'low',
      days,
    };
  }

  if (application.status === 'follow_up_sent') {
    return {
      application,
      label: 'Follow-Up Sent',
      detail: `Follow-up logged ${days} days ago. Watch for response.`,
      urgency: 'low',
      days,
    };
  }

  if (application.status === 'interview') {
    return {
      application,
      label: 'Interview Stage',
      detail: 'Prepare interview notes and practice answers.',
      urgency: 'high',
      days,
    };
  }

  return null;
}

function filterApplications(applications: ApplicationRow[], mode: ApplicationMode, reviewItems: ReviewItem[]) {
  if (mode === 'review') return reviewItems.map((item) => item.application);
  if (mode === 'drafts') return applications.filter((app) => app.status === 'draft' || app.status === 'prepared');
  if (mode === 'sent') return applications.filter((app) => app.status === 'sent' || app.status === 'follow_up_sent');
  if (mode === 'interview') return applications.filter((app) => app.status === 'interview');
  return applications;
}

function ReviewQueuePanel({
  reviewItems,
  isUpdating,
  onMarkFollowedUp,
  onMoveToInterview,
}: {
  reviewItems: ReviewItem[];
  isUpdating: boolean;
  onMarkFollowedUp: (applicationId: string) => void;
  onMoveToInterview: (applicationId: string) => void;
}) {
  if (reviewItems.length === 0) {
    return (
      <Card className="mvh-card-glow">
        <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">Review Queue Clear</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">No sent applications need action right now.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {reviewItems.map(({ application, label, detail, urgency }) => (
        <Card key={application.id} className="mvh-card-glow border-amber-200/70 dark:border-amber-900/50">
          <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${urgency === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300' : urgency === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' : 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300'}`}>
                {application.status === 'interview' ? <CalendarClock className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-slate-900 dark:text-white">{application.jobTitle}</p>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{label}</span>
                </div>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{application.company}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">{detail} Last update: {formatDate(application.updatedAt ?? application.createdAt)}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:justify-end">
              {application.status === 'sent' && (
                <button
                  type="button"
                  onClick={() => onMarkFollowedUp(application.id)}
                  disabled={isUpdating}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
                >
                  {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
                  Mark Followed Up
                </button>
              )}
              {application.status !== 'interview' && (
                <button
                  type="button"
                  onClick={() => onMoveToInterview(application.id)}
                  disabled={isUpdating}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <CalendarClock className="h-3.5 w-3.5" />
                  Move To Interview
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function ApplicationsPage() {
  const { user, isLoaded } = useUser();
  const userId = user?.id ?? '';
  const [searchParams, setSearchParams] = useSearchParams();
  const [cardStates, setCardStates] = useState<Record<string, CardState>>({});

  const modeParam = searchParams.get('mode') as ApplicationMode | null;
  const statusParam = searchParams.get('status') as ApplicationStatus | null;
  const mode: ApplicationMode = modeParam && MODES.some((item) => item.key === modeParam) ? modeParam : 'all';

  const applicationsQuery = api.applications.getAll.useQuery({ userId }, { enabled: isLoaded && !!userId });

  const generateDocumentsMutation = api.applications.generateDocuments.useMutation({
    onSuccess: () => void applicationsQuery.refetch(),
  });

  const sendByEmailMutation = api.applications.sendByEmail.useMutation({
    onSuccess: () => void applicationsQuery.refetch(),
  });

  const updateStatusMutation = api.applications.updateStatus.useMutation({
    onSuccess: () => void applicationsQuery.refetch(),
  });

  const applications = (applicationsQuery.data ?? []) as ApplicationRow[];
  const reviewItems = useMemo(
    () => applications.map(buildReviewItem).filter((item): item is ReviewItem => item !== null).sort((a, b) => {
      const rank = { high: 0, medium: 1, low: 2 };
      return rank[a.urgency] - rank[b.urgency] || b.days - a.days;
    }),
    [applications],
  );

  const visibleApplications = useMemo(() => {
    const base = filterApplications(applications, mode, reviewItems);
    if (!statusParam) return base;
    return base.filter((application) => application.status === statusParam);
  }, [applications, mode, reviewItems, statusParam]);

  const counts = useMemo(() => ({
    all: applications.length,
    review: reviewItems.length,
    drafts: applications.filter((app) => app.status === 'draft' || app.status === 'prepared').length,
    sent: applications.filter((app) => app.status === 'sent' || app.status === 'follow_up_sent').length,
    interview: applications.filter((app) => app.status === 'interview').length,
  }), [applications, reviewItems.length]);

  useEffect(() => {
    applications.forEach((app) => {
      if (!cardStates[app.id]) {
        setCardStates((prev) => ({
          ...prev,
          [app.id]: {
            emailSubject: `Application for ${app.jobTitle}`,
            emailBody: '',
            employerEmail: '',
          },
        }));
      }
    });
  }, [applications.length]);

  useEffect(() => {
    applications.forEach((app) => {
      if (app.jobDescription && !cardStates[app.id]?.employerEmail) {
        const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
        const emails = app.jobDescription.match(emailRegex);
        if (emails && emails.length > 0) {
          setCardStates((prev) => ({
            ...prev,
            [app.id]: {
              ...prev[app.id],
              employerEmail: emails[0],
            },
          }));
        }
      }
    });
  }, [applications]);

  function setMode(nextMode: ApplicationMode) {
    const params = new URLSearchParams(searchParams);
    if (nextMode === 'all') params.delete('mode');
    else params.set('mode', nextMode);
    params.delete('status');
    setSearchParams(params);
  }

  async function handlePrepare(applicationId: string) {
    if (!userId) return;
    const toastId = toast.loading('Preparing documents…');
    try {
      await generateDocumentsMutation.mutateAsync({ userId, applicationId });
      toast.success('Documents prepared.', { id: toastId });
    } catch (error) {
      toast.error(`Could not prepare documents: ${getErrorMessage(error)}`, { id: toastId });
    }
  }

  async function handleSend(application: { id: string; jobTitle: string }) {
    if (!userId) return;
    const state = cardStates[application.id];
    if (!state?.employerEmail) {
      toast.error('Add employer email before sending.');
      return;
    }

    const toastId = toast.loading('Sending application email…');
    try {
      await sendByEmailMutation.mutateAsync({
        userId,
        applicationId: application.id,
        recipientEmail: state.employerEmail,
        subject: state.emailSubject || `Application for ${application.jobTitle}`,
        body: state.emailBody || undefined,
      });
      toast.success('Application email sent.', { id: toastId });
    } catch (error) {
      toast.error(`Could not send email: ${getErrorMessage(error)}`, { id: toastId });
    }
  }

  async function handleUpdateStatus(applicationId: string, status: ApplicationStatus, successMessage = 'Application status updated.') {
    if (!userId) return;
    const toastId = toast.loading('Updating application…');
    try {
      await updateStatusMutation.mutateAsync({ id: applicationId, userId, status });
      toast.success(successMessage, { id: toastId });
    } catch (error) {
      toast.error(`Could not update application: ${getErrorMessage(error)}`, { id: toastId });
    }
  }

  function updateCardState(applicationId: string, field: keyof CardState, value: string) {
    setCardStates((prev) => ({
      ...prev,
      [applicationId]: {
        ...prev[applicationId],
        [field]: value,
      },
    }));
  }

  if (!isLoaded || applicationsQuery.isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!userId) {
    return <div className="p-6 text-sm text-slate-500 dark:text-slate-400">Sign in to view applications.</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Applications</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
              Track drafts, sent applications, follow-ups, and interview movement from one pipeline. Astonishingly, this is what a pipeline is supposed to do.
            </p>
          </div>
          <div className="space-y-3 xl:min-w-[420px]">
            <JobsLifecycleTabs />
            <div className="flex justify-end">
              <Link
                to="/applications/board"
                className="mvh-card-glow rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Kanban Board View
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="mvh-card-glow"><CardContent className="p-4"><p className="text-xs text-slate-500">Total</p><p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{counts.all}</p></CardContent></Card>
        <Card className="mvh-card-glow"><CardContent className="p-4"><p className="text-xs text-slate-500">Review</p><p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-300">{counts.review}</p></CardContent></Card>
        <Card className="mvh-card-glow"><CardContent className="p-4"><p className="text-xs text-slate-500">Drafts</p><p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{counts.drafts}</p></CardContent></Card>
        <Card className="mvh-card-glow"><CardContent className="p-4"><p className="text-xs text-slate-500">Sent</p><p className="mt-1 text-2xl font-bold text-sky-600 dark:text-sky-300">{counts.sent}</p></CardContent></Card>
        <Card className="mvh-card-glow"><CardContent className="p-4"><p className="text-xs text-slate-500">Interview</p><p className="mt-1 text-2xl font-bold text-violet-600 dark:text-violet-300">{counts.interview}</p></CardContent></Card>
      </div>

      <div className="flex flex-wrap gap-2">
        {MODES.map((item) => {
          const active = mode === item.key;
          const count = counts[item.key];
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setMode(item.key)}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition ${active ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900'}`}
            >
              {item.key === 'review' ? <Bell className="h-3.5 w-3.5" /> : item.key === 'sent' ? <Mail className="h-3.5 w-3.5" /> : item.key === 'interview' ? <CalendarClock className="h-3.5 w-3.5" /> : item.key === 'drafts' ? <Clock3 className="h-3.5 w-3.5" /> : <Briefcase className="h-3.5 w-3.5" />}
              {item.label}
              <span className={`rounded-full px-1.5 py-0.5 ${active ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {applicationsQuery.isError ? (
        <Card className="mvh-card-glow border-rose-200 dark:border-rose-900/50">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 py-6 text-sm text-rose-600 dark:text-rose-400">
            <span>Could not load applications.</span>
            <button type="button" onClick={() => void applicationsQuery.refetch()} className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700">
              <RotateCcw className="h-3.5 w-3.5" /> Retry
            </button>
          </CardContent>
        </Card>
      ) : applications.length === 0 ? (
        <Card className="mvh-card-glow">
          <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
            <Briefcase className="h-12 w-12 text-slate-300 dark:text-slate-600" aria-hidden />
            <div>
              <p className="text-base font-semibold text-slate-800 dark:text-slate-100">No Applications Yet</p>
              <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">Save roles from Jobs or create a draft from a search result once you are ready to track lifecycle.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/jobs" className="mvh-card-glow inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
                Browse Jobs <Sparkles className="h-4 w-4" />
              </Link>
              <Link to="/jobs/saved" className="mvh-card-glow inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">
                Open Saved Jobs
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {mode === 'review' && (
            <ReviewQueuePanel
              reviewItems={reviewItems}
              isUpdating={updateStatusMutation.isPending}
              onMarkFollowedUp={(applicationId) => void handleUpdateStatus(applicationId, 'follow_up_sent', 'Follow-up marked as sent.')}
              onMoveToInterview={(applicationId) => void handleUpdateStatus(applicationId, 'interview', 'Application moved to interview.')}
            />
          )}

          {visibleApplications.length === 0 ? (
            <Card className="mvh-card-glow">
              <CardContent className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">No applications match this view.</CardContent>
            </Card>
          ) : (
            visibleApplications.map((application) => {
              const state = cardStates[application.id] || {
                emailSubject: `Application for ${application.jobTitle}`,
                emailBody: '',
                employerEmail: '',
              };

              return (
                <ApplicationCard
                  key={application.id}
                  application={application}
                  userId={userId}
                  isSelected={false}
                  onSelect={() => {}}
                  onPrepare={() => void handlePrepare(application.id)}
                  onSendEmail={() => void handleSend(application)}
                  onUpdateStatus={(status) => void handleUpdateStatus(application.id, status)}
                  isPreparing={generateDocumentsMutation.isPending}
                  isUpdating={updateStatusMutation.isPending}
                  emailSubject={state.emailSubject}
                  emailBody={state.emailBody}
                  employerEmail={state.employerEmail}
                  onEmailSubjectChange={(value) => updateCardState(application.id, 'emailSubject', value)}
                  onEmailBodyChange={(value) => updateCardState(application.id, 'emailBody', value)}
                  onEmployerEmailChange={(value) => updateCardState(application.id, 'employerEmail', value)}
                  jobDescription={application.jobDescription ?? undefined}
                />
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
