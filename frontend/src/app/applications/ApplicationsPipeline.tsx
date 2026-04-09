import { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { api } from '@/lib/api';
import {
  Plus,
  Loader2,
  FileText,
  Mail,
  CheckCircle,
  XCircle,
  ChevronRight,
  Briefcase,
  TrendingUp,
  MessageSquare,
  Award,
} from 'lucide-react';

type AppStatus = 'draft' | 'prepared' | 'sent' | 'interview' | 'accepted' | 'rejected';

type Application = {
  id: string;
  jobTitle: string;
  company: string;
  status: AppStatus;
  fitScore: number | null;
  coverLetterSnapshot: string | null;
  notes: string | null;
};

const COLUMNS: { key: AppStatus; label: string }[] = [
  { key: 'draft', label: 'Draft' },
  { key: 'prepared', label: 'Prepared' },
  { key: 'sent', label: 'Sent' },
  { key: 'interview', label: 'Interview' },
  { key: 'accepted', label: 'Offer' },
  { key: 'rejected', label: 'Rejected' },
];

const statusColor: Record<AppStatus, string> = {
  draft: 'text-slate-400 bg-white/10',
  prepared: 'text-indigo-400 bg-indigo-500/20',
  sent: 'text-sky-400 bg-sky-500/20',
  interview: 'text-amber-400 bg-amber-500/20',
  accepted: 'text-emerald-400 bg-emerald-500/20',
  rejected: 'text-red-400 bg-red-500/20',
};

const columnHeaderColor: Record<AppStatus, string> = {
  draft: 'text-slate-400',
  prepared: 'text-indigo-400',
  sent: 'text-sky-400',
  interview: 'text-amber-400',
  accepted: 'text-emerald-400',
  rejected: 'text-red-400',
};

export default function ApplicationsPipeline() {
  const { user, isLoaded } = useUser();
  const userId = user?.id ?? '';

  const [showNewModal, setShowNewModal] = useState(false);
  const [newForm, setNewForm] = useState({ jobTitle: '', company: '', notes: '' });
  const [showCoverLetter, setShowCoverLetter] = useState<{ id: string; text: string } | null>(null);
  const [showEmailModal, setShowEmailModal] = useState<{ id: string; title: string; company: string } | null>(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [followUpAppId, setFollowUpAppId] = useState<string | null>(null);
  const [followUpText, setFollowUpText] = useState('');

  const appsQuery = api.applications.getAll.useQuery(
    { userId },
    { enabled: isLoaded && !!userId }
  );

  const analyticsQuery = api.applications.getAnalytics.useQuery(
    { userId },
    { enabled: isLoaded && !!userId }
  );

  const createMutation = api.applications.create.useMutation({
    onSuccess: () => {
      void appsQuery.refetch();
      void analyticsQuery.refetch();
      setShowNewModal(false);
      setNewForm({ jobTitle: '', company: '', notes: '' });
    },
  });

  const updateStatusMutation = api.applications.updateStatus.useMutation({
    onSuccess: () => {
      void appsQuery.refetch();
      void analyticsQuery.refetch();
    },
  });

  const generateDocsMutation = api.applications.generateDocuments.useMutation({
    onSuccess: (data, variables) => {
      void appsQuery.refetch();
      setShowCoverLetter({ id: variables.applicationId, text: data.coverLetter });
    },
  });

  const sendEmailMutation = api.applications.sendByEmail.useMutation({
    onSuccess: () => {
      void appsQuery.refetch();
      setShowEmailModal(null);
      setRecipientEmail('');
    },
  });

  const recordOutcomeMutation = api.applications.recordOutcome.useMutation({
    onSuccess: () => {
      void appsQuery.refetch();
      void analyticsQuery.refetch();
    },
  });

  const generateFollowUpMutation = api.applications.generateFollowUp.useMutation({
    onSuccess: (data) => {
      setFollowUpText(data.emailText);
    },
  });

  if (!isLoaded) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  const apps = (appsQuery.data ?? []) as Application[];
  const analytics = analyticsQuery.data;

  const handleCreate = () => {
    if (!newForm.jobTitle || !newForm.company) return;
    createMutation.mutate({ userId, jobTitle: newForm.jobTitle, company: newForm.company, notes: newForm.notes || undefined });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Applications Pipeline</h1>
          <p className="mt-1 text-slate-400">Track every stage of your job search.</p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          New Application
        </button>
      </div>

      {/* Analytics Stats */}
      {analytics && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: 'Total', value: analytics.total, icon: Briefcase, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
            { label: 'Response Rate', value: `${analytics.responseRate}%`, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: 'Interviews', value: analytics.interviews, icon: MessageSquare, color: 'text-amber-400', bg: 'bg-amber-500/10' },
            { label: 'Offers', value: analytics.offers, icon: Award, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className={`mb-2 inline-flex rounded-xl p-2 ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <p className="text-xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {appsQuery.isError && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          {appsQuery.error instanceof Error ? appsQuery.error.message : 'Failed to load applications'}
        </p>
      )}

      {appsQuery.isLoading && (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      )}

      {/* Kanban Board */}
      {!appsQuery.isLoading && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {COLUMNS.map((col) => {
              const colApps = apps.filter((a) => a.status === col.key);
              return (
                <div key={col.key} className="w-64 shrink-0 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-xs font-semibold uppercase tracking-wider ${columnHeaderColor[col.key]}`}>
                      {col.label}
                    </h3>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold text-slate-400">
                      {colApps.length}
                    </span>
                  </div>

                  {colApps.map((app) => (
                    <div key={app.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
                      <div>
                        <p className="font-medium text-white text-sm leading-tight">{app.jobTitle}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{app.company}</p>
                      </div>

                      {app.fitScore !== null && (
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColor[app.status]}`}>
                          {app.fitScore}% fit
                        </span>
                      )}

                      {/* Actions per column */}
                      <div className="space-y-1.5">
                        {col.key === 'draft' && (
                          <button
                            onClick={() => generateDocsMutation.mutate({ userId, applicationId: app.id })}
                            disabled={generateDocsMutation.isPending && generateDocsMutation.variables?.applicationId === app.id}
                            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 py-1.5 text-xs font-medium text-indigo-400 transition hover:bg-indigo-500/20 disabled:opacity-50"
                          >
                            {generateDocsMutation.isPending && generateDocsMutation.variables?.applicationId === app.id
                              ? <Loader2 className="h-3 w-3 animate-spin" />
                              : <FileText className="h-3 w-3" />}
                            Generate Docs
                          </button>
                        )}

                        {col.key === 'prepared' && (
                          <>
                            {app.coverLetterSnapshot && (
                              <button
                                onClick={() => setShowCoverLetter({ id: app.id, text: app.coverLetterSnapshot! })}
                                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-1.5 text-xs text-slate-400 transition hover:bg-white/10"
                              >
                                <FileText className="h-3 w-3" />
                                View Cover Letter
                              </button>
                            )}
                            <button
                              onClick={() => setShowEmailModal({ id: app.id, title: app.jobTitle, company: app.company })}
                              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-sky-500/30 bg-sky-500/10 py-1.5 text-xs font-medium text-sky-400 transition hover:bg-sky-500/20"
                            >
                              <Mail className="h-3 w-3" />
                              Send by Email
                            </button>
                          </>
                        )}

                        {col.key === 'sent' && (
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => recordOutcomeMutation.mutate({ userId, applicationId: app.id, outcome: 'interview' })}
                              disabled={recordOutcomeMutation.isPending}
                              className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-amber-500/30 bg-amber-500/10 py-1.5 text-[10px] font-medium text-amber-400 transition hover:bg-amber-500/20"
                            >
                              <ChevronRight className="h-3 w-3" />
                              Interview
                            </button>
                            <button
                              onClick={() => recordOutcomeMutation.mutate({ userId, applicationId: app.id, outcome: 'rejection' })}
                              disabled={recordOutcomeMutation.isPending}
                              className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-red-500/30 bg-red-500/10 py-1.5 text-[10px] font-medium text-red-400 transition hover:bg-red-500/20"
                            >
                              <XCircle className="h-3 w-3" />
                              Rejected
                            </button>
                          </div>
                        )}

                        {col.key === 'interview' && (
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => recordOutcomeMutation.mutate({ userId, applicationId: app.id, outcome: 'offer' })}
                              disabled={recordOutcomeMutation.isPending}
                              className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-1.5 text-[10px] font-medium text-emerald-400 transition hover:bg-emerald-500/20"
                            >
                              <CheckCircle className="h-3 w-3" />
                              Offer
                            </button>
                            <button
                              onClick={() => recordOutcomeMutation.mutate({ userId, applicationId: app.id, outcome: 'rejection' })}
                              disabled={recordOutcomeMutation.isPending}
                              className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-red-500/30 bg-red-500/10 py-1.5 text-[10px] font-medium text-red-400 transition hover:bg-red-500/20"
                            >
                              <XCircle className="h-3 w-3" />
                              Rejected
                            </button>
                          </div>
                        )}

                        {/* Move to next status for draft → prepared handled by generateDocsMutation */}
                        {(col.key !== 'draft' && col.key !== 'prepared' && col.key !== 'sent' && col.key !== 'interview' && col.key !== 'accepted' && col.key !== 'rejected') && (
                          <button
                            onClick={() => updateStatusMutation.mutate({ id: app.id, status: 'sent' })}
                            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/10 py-1.5 text-xs text-slate-400 transition hover:bg-white/5"
                          >
                            Mark Sent
                          </button>
                        )}

                        {/* Follow-up Copilot */}
                        <button
                          onClick={() => {
                            setFollowUpAppId(app.id);
                            setFollowUpText('');
                            generateFollowUpMutation.mutate({ userId, applicationId: app.id });
                          }}
                          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-violet-500/30 bg-violet-500/10 py-1.5 text-xs font-medium text-violet-400 transition hover:bg-violet-500/20"
                        >
                          <Mail className="h-3 w-3" />
                          Follow-up
                        </button>
                      </div>
                    </div>
                  ))}

                  {colApps.length === 0 && (
                    <div className="rounded-2xl border-2 border-dashed border-white/10 p-6 text-center text-xs text-slate-600">
                      No applications
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* New Application Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#020617] p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white">New Application</h2>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-slate-400">Job Title *</label>
                <input
                  type="text"
                  value={newForm.jobTitle}
                  onChange={(e) => setNewForm({ ...newForm, jobTitle: e.target.value })}
                  placeholder="Senior React Developer"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Company *</label>
                <input
                  type="text"
                  value={newForm.company}
                  onChange={(e) => setNewForm({ ...newForm, company: e.target.value })}
                  placeholder="Acme Ltd"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Notes</label>
                <textarea
                  value={newForm.notes}
                  onChange={(e) => setNewForm({ ...newForm, notes: e.target.value })}
                  placeholder="Any notes about this application..."
                  rows={3}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 resize-none"
                />
              </div>
            </div>

            {createMutation.isError && (
              <p className="text-sm text-red-400">
                {createMutation.error instanceof Error ? createMutation.error.message : 'Failed to create'}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowNewModal(false)}
                className="flex-1 rounded-xl border border-white/10 py-2 text-sm text-slate-400 transition hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={createMutation.isPending || !newForm.jobTitle || !newForm.company}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
              >
                {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cover Letter Preview Modal */}
      {showCoverLetter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#020617] p-6 space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Cover Letter Preview</h2>
              <button onClick={() => setShowCoverLetter(null)} className="text-slate-400 hover:text-white">
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto rounded-xl border border-white/10 bg-white/5 p-4">
              <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                {showCoverLetter.text}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Follow-up Copilot Modal */}
      {followUpAppId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#020617] p-6 space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Follow-up Email</h2>
              <button
                onClick={() => { setFollowUpAppId(null); setFollowUpText(''); }}
                className="text-slate-400 hover:text-white"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {generateFollowUpMutation.isPending ? (
              <div className="flex flex-1 items-center justify-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
                  <p className="text-sm text-slate-400">Generating follow-up email…</p>
                </div>
              </div>
            ) : (
              <>
                {generateFollowUpMutation.isError && (
                  <p className="text-sm text-red-400">
                    {generateFollowUpMutation.error instanceof Error ? generateFollowUpMutation.error.message : 'Failed to generate follow-up'}
                  </p>
                )}
                <textarea
                  value={followUpText}
                  onChange={(e) => setFollowUpText(e.target.value)}
                  rows={12}
                  className="flex-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-600 resize-none leading-relaxed"
                  placeholder="Follow-up email will appear here…"
                />
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => { setFollowUpAppId(null); setFollowUpText(''); }}
                    className="flex-1 rounded-xl border border-white/10 py-2 text-sm text-slate-400 transition hover:bg-white/5"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => { void navigator.clipboard.writeText(followUpText); }}
                    disabled={!followUpText}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 py-2 text-sm font-medium text-violet-400 transition hover:bg-violet-500/20 disabled:opacity-50"
                  >
                    <Mail className="h-4 w-4" />
                    Copy to clipboard
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Send by Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#020617] p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white">Send Application by Email</h2>
            <p className="text-sm text-slate-400">
              Sending CV + cover letter for <span className="text-white font-medium">{showEmailModal.title}</span> at{' '}
              <span className="text-white font-medium">{showEmailModal.company}</span>
            </p>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Recipient Email *</label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="hiring@company.com"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            {sendEmailMutation.isError && (
              <p className="text-sm text-red-400">
                {sendEmailMutation.error instanceof Error ? sendEmailMutation.error.message : 'Failed to send'}
              </p>
            )}
            {sendEmailMutation.isSuccess && (
              <p className="text-sm text-emerald-400">Email sent successfully!</p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setShowEmailModal(null); setRecipientEmail(''); }}
                className="flex-1 rounded-xl border border-white/10 py-2 text-sm text-slate-400 transition hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!recipientEmail) return;
                  sendEmailMutation.mutate({ userId, applicationId: showEmailModal.id, recipientEmail });
                }}
                disabled={sendEmailMutation.isPending || !recipientEmail}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-sky-600 py-2 text-sm font-medium text-white transition hover:bg-sky-700 disabled:opacity-60"
              >
                {sendEmailMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                <Mail className="h-4 w-4" />
                Send Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
