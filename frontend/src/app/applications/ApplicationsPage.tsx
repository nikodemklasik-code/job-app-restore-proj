import { useMemo, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import {
  FileText,
  Send,
  Clock3,
  CheckCircle2,
  Ban,
  Briefcase,
  Sparkles,
  Eye,
  Mail,
  Loader2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function statusBadge(status: string) {
  const map: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
    prepared: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300',
    sent: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    follow_up_sent: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
    interview: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
    rejected: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
    accepted: 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300',
  };

  return map[status] ?? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200';
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    draft: 'Draft',
    prepared: 'Prepared',
    sent: 'Sent',
    follow_up_sent: 'Follow-Up Sent',
    interview: 'Interview',
    rejected: 'Rejected',
    accepted: 'Accepted',
  };

  return map[status] ?? status;
}

function statusIcon(status: string) {
  if (status === 'sent') return <Send className="h-3.5 w-3.5" />;
  if (status === 'follow_up_sent') return <Clock3 className="h-3.5 w-3.5" />;
  if (status === 'interview') return <Briefcase className="h-3.5 w-3.5" />;
  if (status === 'rejected') return <Ban className="h-3.5 w-3.5" />;
  if (status === 'accepted') return <CheckCircle2 className="h-3.5 w-3.5" />;
  return <FileText className="h-3.5 w-3.5" />;
}

export default function ApplicationsPage() {
  const { user } = useUser();
  const userId = user?.id ?? '';

  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [employerEmail, setEmployerEmail] = useState('');

  const applicationsQuery = api.applications.getAll.useQuery({ userId }, { enabled: !!userId });

  const logsQuery = api.applications.getLogs.useQuery(
    { userId, applicationId: selectedApplicationId ?? '' },
    { enabled: !!userId && !!selectedApplicationId }
  );

  const selectedApplication = useMemo(() => {
    const list = applicationsQuery.data ?? [];
    return list.find((item) => item.id === selectedApplicationId) ?? null;
  }, [applicationsQuery.data, selectedApplicationId]);

  const linkedJobQuery = api.jobs.getById.useQuery(
    { id: selectedApplication?.jobId ?? '' },
    { enabled: !!selectedApplication?.jobId }
  );

  const generateDocumentsMutation = api.applications.generateDocuments.useMutation({
    onSuccess: () => void applicationsQuery.refetch(),
  });

  const sendByEmailMutation = api.applications.sendByEmail.useMutation({
    onSuccess: () => {
      void applicationsQuery.refetch();
      void logsQuery.refetch();
    },
  });

  const updateStatusMutation = api.applications.updateStatus.useMutation({
    onSuccess: () => {
      void applicationsQuery.refetch();
      void logsQuery.refetch();
    },
  });

  const applications = applicationsQuery.data ?? [];
  const hasApplicationsError = applicationsQuery.isError;
  const hasLogsError = logsQuery.isError;

  async function handlePrepare(application: { id: string }) {
    if (!userId) return;
    await generateDocumentsMutation.mutateAsync({
      userId,
      applicationId: application.id,
    });
  }

  async function handleSend(application: { id: string; jobTitle: string }) {
    if (!userId) return;

    await sendByEmailMutation.mutateAsync({
      userId,
      applicationId: application.id,
      recipientEmail: employerEmail,
      subject: emailSubject || `Application for ${application.jobTitle}`,
    });
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Applications</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Prepare documents, send employer email, and track lifecycle — all backed by your account data.
          </p>
        </div>
        <Link
          to="/applications/board"
          className="mvh-card-glow shrink-0 self-start rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Kanban Board View
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          {applicationsQuery.isLoading ? (
            <Card className="mvh-card-glow">
              <CardContent className="flex h-28 items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading Applications...
              </CardContent>
            </Card>
          ) : hasApplicationsError ? (
            <Card className="mvh-card-glow">
              <CardContent className="py-6 text-sm text-rose-600 dark:text-rose-400">
                Failed To Load Applications. Please Refresh And Try Again.
              </CardContent>
            </Card>
          ) : applications.length === 0 ? (
            <Card className="mvh-card-glow">
              <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
                <Briefcase className="h-12 w-12 text-slate-300 dark:text-slate-600" aria-hidden />
                <div>
                  <p className="text-base font-semibold text-slate-800 dark:text-slate-100">No Applications Yet</p>
                  <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
                    Save roles from Jobs or start a draft here once you are ready to prepare documents and track lifecycle.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-3">
                  <Link
                    to="/jobs"
                    className="mvh-card-glow inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                  >
                    Browse Jobs
                    <Sparkles className="h-4 w-4" />
                  </Link>
                  <Link
                    to="/documents?tab=upload"
                    className="mvh-card-glow inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Open Document Lab
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            applications.map((application: any) => (
              <Card
                key={application.id}
                className="mvh-card-glow p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-base font-semibold text-slate-900 dark:text-white">{application.jobTitle}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{application.company}</p>
                  </div>

                  <button
                    onClick={() => setSelectedApplicationId(application.id)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Open
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(application.status)}`}>
                    {statusIcon(application.status)}
                    {statusLabel(application.status)}
                  </span>

                  {typeof application.fitScore === 'number' && (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {application.fitScore}% fit
                    </span>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {application.status === 'draft' && (
                    <button
                      onClick={() => void handlePrepare(application)}
                      disabled={generateDocumentsMutation.isPending}
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                    >
                      {generateDocumentsMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      Prepare Documents
                    </button>
                  )}

                  {(application.status === 'draft' || application.status === 'prepared') && (
                    <button
                      onClick={() => setSelectedApplicationId(application.id)}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <Mail className="h-4 w-4" />
                      Send Email
                    </button>
                  )}

                  {application.status === 'sent' && (
                    <button
                      onClick={() =>
                        void updateStatusMutation.mutateAsync({
                          id: application.id,
                          userId,
                          status: 'follow_up_sent',
                        })
                      }
                      disabled={!userId || updateStatusMutation.isPending}
                      className="inline-flex items-center gap-2 rounded-xl border border-blue-200 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-300 dark:hover:bg-blue-950/40"
                    >
                      <Clock3 className="h-4 w-4" />
                      Mark Follow-Up Sent
                    </button>
                  )}

                  <button
                    onClick={() =>
                      void updateStatusMutation.mutateAsync({
                        id: application.id,
                        userId,
                        status: 'interview',
                      })
                    }
                    disabled={!userId || updateStatusMutation.isPending}
                    className="inline-flex items-center gap-2 rounded-xl border border-violet-200 px-4 py-2 text-sm font-medium text-violet-700 hover:bg-violet-50 dark:border-violet-900 dark:text-violet-300 dark:hover:bg-violet-950/40"
                  >
                    <Briefcase className="h-4 w-4" />
                    Interview
                  </button>

                  <button
                    onClick={() =>
                      void updateStatusMutation.mutateAsync({
                        id: application.id,
                        userId,
                        status: 'rejected',
                      })
                    }
                    disabled={!userId || updateStatusMutation.isPending}
                    className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/40"
                  >
                    <Ban className="h-4 w-4" />
                    Rejected
                  </button>

                  <button
                    onClick={() =>
                      void updateStatusMutation.mutateAsync({
                        id: application.id,
                        userId,
                        status: 'accepted',
                      })
                    }
                    disabled={!userId || updateStatusMutation.isPending}
                    className="inline-flex items-center gap-2 rounded-xl border border-green-200 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-50 dark:border-green-900 dark:text-green-300 dark:hover:bg-green-950/40"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Accepted
                  </button>
                </div>
              </Card>
            ))
          )}
        </div>

        <div className="space-y-6">
          <Card className="mvh-card-glow p-5">
            <CardHeader className="p-0">
              <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100">Email Send Panel</CardTitle>
            </CardHeader>

            {selectedApplication ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800/60">
                  <p className="font-medium text-slate-800 dark:text-slate-100">{selectedApplication.jobTitle}</p>
                  <p className="mt-1 text-slate-500 dark:text-slate-400">{selectedApplication.company}</p>
                </div>

                {linkedJobQuery.data?.description ? (
                  <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400 line-clamp-4">
                    {linkedJobQuery.data.description}
                  </p>
                ) : null}

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  The Message Uses Your Profile And The Prepared Cover Letter Snapshot. Run &quot;Prepare Documents&quot; First; PDFs Are Attached Automatically.
                </p>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Employer Email</label>
                  <input
                    value={employerEmail}
                    onChange={(e) => setEmployerEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    placeholder="employer@company.com"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Subject</label>
                  <input
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    placeholder={`Application for ${selectedApplication.jobTitle}`}
                  />
                </div>

                <button
                  onClick={() => void handleSend(selectedApplication)}
                  disabled={sendByEmailMutation.isPending || !employerEmail || !userId}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {sendByEmailMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Send Application Email
                </button>
              </div>
            ) : (
              <div className="mvh-card-glow mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center dark:border-slate-600 dark:bg-slate-800/40">
                <Mail className="mx-auto h-8 w-8 text-slate-400 dark:text-slate-500" aria-hidden />
                <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-300">Select An Application</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Choose a card on the left to prepare documents and send employer email.
                </p>
              </div>
            )}
          </Card>

          <Card className="mvh-card-glow p-5">
            <CardHeader className="p-0">
              <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100">Lifecycle History</CardTitle>
            </CardHeader>

            {logsQuery.isLoading ? (
              <div className="mt-4 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading Lifecycle History...
              </div>
            ) : hasLogsError ? (
              <p className="mt-3 text-sm text-rose-600 dark:text-rose-400">
                Failed To Load Lifecycle History.
              </p>
            ) : logsQuery.data?.length ? (
              <div className="mt-4 space-y-2">
                {logsQuery.data.map((entry: any) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2 text-xs dark:border-slate-700"
                  >
                    <span className="font-medium text-slate-700 dark:text-slate-200">{entry.action}</span>
                    <span className="text-slate-400">
                      {new Date(entry.createdAt).toLocaleString('en-GB')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                No Lifecycle Events Yet.
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
