import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Briefcase, Sparkles, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { ApplicationCard } from '@/components/applications/ApplicationCard';

export default function ApplicationsPage() {
  const { user } = useUser();
  const userId = user?.id ?? '';

  // State for each card's email fields (keyed by application ID)
  const [cardStates, setCardStates] = useState<Record<string, {
    emailSubject: string;
    emailBody: string;
    employerEmail: string;
  }>>({});

  const applicationsQuery = api.applications.getAll.useQuery({ userId }, { enabled: !!userId });

  const generateDocumentsMutation = api.applications.generateDocuments.useMutation({
    onSuccess: () => void applicationsQuery.refetch(),
  });

  const sendByEmailMutation = api.applications.sendByEmail.useMutation({
    onSuccess: () => void applicationsQuery.refetch(),
  });

  const updateStatusMutation = api.applications.updateStatus.useMutation({
    onSuccess: () => void applicationsQuery.refetch(),
  });

  const applications = applicationsQuery.data ?? [];

  // Initialize card state when applications load
  useEffect(() => {
    applications.forEach((app: any) => {
      if (!cardStates[app.id]) {
        setCardStates(prev => ({
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

  // Try to extract email from job description for each application
  useEffect(() => {
    applications.forEach((app: any) => {
      if (app.jobDescription && !cardStates[app.id]?.employerEmail) {
        const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
        const emails = app.jobDescription.match(emailRegex);
        if (emails && emails.length > 0) {
          setCardStates(prev => ({
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

  async function handlePrepare(applicationId: string) {
    if (!userId) return;
    await generateDocumentsMutation.mutateAsync({
      userId,
      applicationId,
    });
  }

  async function handleSend(application: { id: string; jobTitle: string }) {
    if (!userId) return;
    const state = cardStates[application.id];
    if (!state) return;

    await sendByEmailMutation.mutateAsync({
      userId,
      applicationId: application.id,
      recipientEmail: state.employerEmail,
      subject: state.emailSubject || `Application for ${application.jobTitle}`,
      body: state.emailBody || undefined,
    });
  }

  async function handleUpdateStatus(applicationId: string, status: 'draft' | 'prepared' | 'sent' | 'follow_up_sent' | 'rejected' | 'accepted' | 'interview') {
    if (!userId) return;
    await updateStatusMutation.mutateAsync({
      id: applicationId,
      userId,
      status,
    });
  }

  function updateCardState(applicationId: string, field: 'emailSubject' | 'emailBody' | 'employerEmail', value: string) {
    setCardStates(prev => ({
      ...prev,
      [applicationId]: {
        ...prev[applicationId],
        [field]: value,
      },
    }));
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Applications</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Click "Open" on any card to flip it and see email panel with auto-filled fields
          </p>
        </div>
        <Link
          to="/applications/board"
          className="mvh-card-glow shrink-0 self-start rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Kanban Board View
        </Link>
      </div>

      <div className="space-y-4">
        {applicationsQuery.isLoading ? (
          <Card className="mvh-card-glow">
            <CardContent className="flex h-28 items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading applications…
            </CardContent>
          </Card>
        ) : applicationsQuery.isError ? (
          <Card className="mvh-card-glow">
            <CardContent className="py-6 text-sm text-rose-600 dark:text-rose-400">
              Could not load applications. Refresh the page and try again.
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
          applications.map((application: any) => {
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
                onSelect={() => { }}
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
                jobDescription={application.jobDescription}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
