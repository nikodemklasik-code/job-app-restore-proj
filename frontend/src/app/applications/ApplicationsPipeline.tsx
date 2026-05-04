import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useLocation } from 'react-router-dom';
import { api } from '@/lib/api';
import {
  Plus,
  Loader2,
  FileText,
  Mail,
  CheckCircle,
  XCircle,
  Briefcase,
  TrendingUp,
  MessageSquare,
  Award,
  Bell,
  RefreshCw,
  Sparkles,
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

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<AppStatus, {
  label: string;
  color: string;
  badgeClass: string;
  borderClass: string;
  avatarBg: string;
}> = {
  draft:     { label: 'Draft',     color: '#94a3b8', badgeClass: 'text-slate-400 bg-white/10',         borderClass: 'border-slate-500/40',   avatarBg: 'bg-slate-500/20' },
  prepared:  { label: 'Ready',     color: '#818cf8', badgeClass: 'text-indigo-400 bg-indigo-500/20',   borderClass: 'border-indigo-500/50',  avatarBg: 'bg-indigo-500/20' },
  sent:      { label: 'Submitted', color: '#38bdf8', badgeClass: 'text-sky-400 bg-sky-500/20',         borderClass: 'border-sky-500/50',     avatarBg: 'bg-sky-500/20' },
  interview: { label: 'Interview', color: '#fbbf24', badgeClass: 'text-amber-400 bg-amber-500/20',     borderClass: 'border-amber-500/50',   avatarBg: 'bg-amber-500/20' },
  accepted:  { label: 'Offer',     color: '#34d399', badgeClass: 'text-emerald-400 bg-emerald-500/20', borderClass: 'border-emerald-500/50', avatarBg: 'bg-emerald-500/20' },
  rejected:  { label: 'Rejected',  color: '#f87171', badgeClass: 'text-red-400 bg-red-500/20',         borderClass: 'border-red-500/50',     avatarBg: 'bg-red-500/20' },
};

const ALL_STATUSES: AppStatus[] = ['draft', 'prepared', 'sent', 'interview', 'accepted', 'rejected'];

// ── Main component ────────────────────────────────────────────────────────────

export default function ApplicationsPipeline() {
  const { user, isLoaded } = useUser();
  const userId = user?.id ?? null;
  const location = useLocation();

  const [filterStatus, setFilterStatus] = useState<AppStatus | 'all'>('all');
  const [showNewModal, setShowNewModal] = useState(false);
  const [newForm, setNewForm] = useState({ jobTitle: '', company: '', notes: '' });
  const [showCoverLetter, setShowCoverLetter] = useState<{ id: string; text: string } | null>(null);
  const [fitReasonsMap, setFitReasonsMap] = useState<Record<string, string[]>>({});
  const [showEmailModal, setShowEmailModal] = useState<{ id: string; title: string; company: string } | null>(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [followUpAppId, setFollowUpAppId] = useState<string | null>(null);
  const [followUpText, setFollowUpText] = useState('');
  const [monitoringMap, setMonitoringMap] = useState<Record<string, boolean>>({});

  // Cover letter compose modal (triggered from job cards via navigation state)
  const [composeModal, setComposeModal] = useState<{
    jobId: string;
    jobTitle: string;
    company: string;
    recipientEmail: string;
    subject: string;
    coverLetter: string;
  } | null>(null);

  const coverLetterMutation = api.jobs.generateCoverLetter.useMutation({
    onSuccess: (data) => {
      setComposeModal((prev) => prev ? {
        ...prev,
        coverLetter: data.coverLetter,
        recipientEmail: data.recipientEmail ?? prev.recipientEmail,
        jobTitle: data.jobTitle,
        company: data.company,
        subject: `Application for ${data.jobTitle} — ${user?.fullName ?? 'Candidate'}`,
      } : null);
    },
  });

  // Detect navigation state from "Tailor CV" button on job cards
  useEffect(() => {
    const state = location.state as { tailorForJobId?: string; jobTitle?: string; company?: string } | null;
    if (state?.tailorForJobId && isLoaded && userId) {
      setComposeModal({
        jobId: state.tailorForJobId,
        jobTitle: state.jobTitle ?? 'Role',
        company: state.company ?? 'Company',
        recipientEmail: '',
        subject: `Application for ${state.jobTitle ?? 'Role'} — ${user?.fullName ?? 'Candidate'}`,
        coverLetter: '',
      });
      // Trigger cover letter generation
      coverLetterMutation.mutate({ jobId: state.tailorForJobId });
      // Clear nav state to prevent re-triggering on re-render
      window.history.replaceState({}, '', location.pathname);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, userId]);

  const appsQuery = api.applications.getAll.useQuery(
    { userId: userId! },
    { enabled: isLoaded && !!userId }
  );

  const analyticsQuery = api.applications.getAnalytics.useQuery(
    { userId: userId! },
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

  const generateDocsMutation = api.applications.generateDocuments.useMutation({
    onSuccess: (data, variables) => {
      void appsQuery.refetch();
      setShowCoverLetter({ id: variables.applicationId, text: data.coverLetter });
      if (data.fitReasons?.length) {
        setFitReasonsMap(prev => ({ ...prev, [variables.applicationId]: data.fitReasons as string[] }));
      }
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

  const grantMonitoringMutation = api.emailMonitoring.grant.useMutation({
    onSuccess: (_data, variables) => {
      setMonitoringMap(prev => ({ ...prev, [variables.applicationId]: true }));
    },
  });

  const revokeMonitoringMutation = api.emailMonitoring.revoke.useMutation({
    onSuccess: (_data, variables) => {
      setMonitoringMap(prev => ({ ...prev, [variables.applicationId]: false }));
    },
  });

  if (!isLoaded || !userId) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  const apps = (appsQuery.data ?? []) as Application[];
  const analytics = analyticsQuery.data;

  const visibleApps = filterStatus === 'all' ? apps : apps.filter(a => a.status === filterStatus);

  const handleCreate = () => {
    if (!newForm.jobTitle || !newForm.company || !userId) return;
    createMutation.mutate({ userId, jobTitle: newForm.jobTitle, company: newForm.company, notes: newForm.notes || undefined });
  };

  return (
    <div className="space-y-6">

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Applications</h1>
          <p className="mt-1 text-sm text-slate-400">Track every role from first draft to signed offer.</p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Add Application
        </button>
      </div>

      {/* ── Stats row ─────────────────────────────────────────────────────── */}
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

      {/* ── Status filter pills ───────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setFilterStatus('all')}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            filterStatus === 'all'
              ? 'bg-white text-slate-900'
              : 'border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
          }`}
        >
          All · {apps.length}
        </button>
        {ALL_STATUSES.map(status => {
          const cfg = STATUS_CONFIG[status];
          const count = apps.filter(a => a.status === status).length;
          const isActive = filterStatus === status;
          return (
            <button
              key={status}
              onClick={() => setFilterStatus(prev => prev === status ? 'all' : status)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                isActive
                  ? 'bg-white/15 text-white border border-white/20'
                  : 'border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
              }`}
              style={isActive ? { borderColor: cfg.color + '80', color: cfg.color } : undefined}
            >
              {cfg.label} · {count}
            </button>
          );
        })}
      </div>

      {/* ── Error / Loading ───────────────────────────────────────────────── */}
      {appsQuery.isError && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          Unable to load applications. Please refresh the page.
        </p>
      )}
      {appsQuery.isLoading && (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      )}

      {/* ── Application cards grid ────────────────────────────────────────── */}
      {!appsQuery.isLoading && (
        <>
          {visibleApps.length === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-white/10 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5">
                <Briefcase className="h-6 w-6 text-slate-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-300">
                  {filterStatus === 'all' ? 'No applications yet' : `No ${STATUS_CONFIG[filterStatus].label.toLowerCase()} applications`}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {filterStatus === 'all'
                    ? 'Add your first application to get started.'
                    : 'Try a different filter or add a new application.'}
                </p>
              </div>
              {filterStatus === 'all' && (
                <button
                  onClick={() => setShowNewModal(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
                >
                  <Plus className="h-4 w-4" />
                  Add Application
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visibleApps.map((app) => {
                const cfg = STATUS_CONFIG[app.status];
                const fitReasons = fitReasonsMap[app.id] ?? [];
                const monitoringActive = monitoringMap[app.id] ?? false;

                return (
                  <div
                    key={app.id}
                    className="relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-white/20 hover:bg-white/[0.07]"
                  >
                    {/* Coloured top accent line */}
                    <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl" style={{ backgroundColor: cfg.color }} />

                    {/* Header row: avatar + title + status */}
                    <div className="flex items-start gap-3 pt-1">
                      {/* Company initial avatar */}
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white ${cfg.avatarBg}`}
                        style={{ color: cfg.color }}
                      >
                        {app.company.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">{app.jobTitle}</p>
                        <p className="truncate text-xs text-slate-400">{app.company}</p>
                      </div>
                      {/* Status badge */}
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${cfg.badgeClass}`}>
                        {cfg.label}
                      </span>
                    </div>

                    {/* Fit score bar */}
                    {app.fitScore !== null && (
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${app.fitScore}%`, backgroundColor: cfg.color }}
                          />
                        </div>
                        <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${cfg.badgeClass}`}>
                          {app.fitScore}%
                        </span>
                      </div>
                    )}

                    {/* Fit reasons */}
                    {fitReasons.length > 0 && (
                      <div className="space-y-0.5">
                        {fitReasons.slice(0, 2).map((reason, i) => (
                          <p key={i} className="flex items-start gap-1 text-[10px] text-emerald-400/80">
                            <span className="mt-0.5 shrink-0">✓</span>
                            {reason}
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Notes snippet */}
                    {app.notes && (
                      <p className="line-clamp-2 text-[11px] leading-relaxed text-slate-500">{app.notes}</p>
                    )}

                    {/* Action buttons */}
                    <div className="mt-auto space-y-1.5">
                      {app.status === 'draft' && (
                        <button
                          onClick={() => generateDocsMutation.mutate({ userId, applicationId: app.id })}
                          disabled={generateDocsMutation.isPending && generateDocsMutation.variables?.applicationId === app.id}
                          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 py-1.5 text-xs font-medium text-indigo-400 transition hover:bg-indigo-500/20 disabled:opacity-50"
                        >
                          {generateDocsMutation.isPending && generateDocsMutation.variables?.applicationId === app.id
                            ? <Loader2 className="h-3 w-3 animate-spin" />
                            : <FileText className="h-3 w-3" />}
                          Generate Documents
                        </button>
                      )}

                      {app.status === 'prepared' && (
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

                      {app.status === 'sent' && (
                        <>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => recordOutcomeMutation.mutate({ userId, applicationId: app.id, outcome: 'interview' })}
                              disabled={recordOutcomeMutation.isPending}
                              className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-amber-500/30 bg-amber-500/10 py-1.5 text-[10px] font-medium text-amber-400 transition hover:bg-amber-500/20 disabled:opacity-50"
                            >
                              <MessageSquare className="h-3 w-3" />
                              Got Interview
                            </button>
                            <button
                              onClick={() => recordOutcomeMutation.mutate({ userId, applicationId: app.id, outcome: 'rejection' })}
                              disabled={recordOutcomeMutation.isPending}
                              className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-red-500/30 bg-red-500/10 py-1.5 text-[10px] font-medium text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
                            >
                              <XCircle className="h-3 w-3" />
                              Rejected
                            </button>
                          </div>
                          <button
                            onClick={() => {
                              if (monitoringActive) {
                                revokeMonitoringMutation.mutate({ userId, applicationId: app.id });
                              } else {
                                grantMonitoringMutation.mutate({ userId, applicationId: app.id });
                              }
                            }}
                            className={`flex w-full items-center justify-center gap-1.5 rounded-xl py-1.5 text-xs font-medium transition ${
                              monitoringActive
                                ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                                : 'border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
                            }`}
                          >
                            <Bell className="h-3 w-3" />
                            {monitoringActive ? 'Inbox monitored ✓' : 'Monitor inbox replies'}
                          </button>
                        </>
                      )}

                      {app.status === 'interview' && (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => recordOutcomeMutation.mutate({ userId, applicationId: app.id, outcome: 'offer' })}
                            disabled={recordOutcomeMutation.isPending}
                            className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-1.5 text-[10px] font-medium text-emerald-400 transition hover:bg-emerald-500/20 disabled:opacity-50"
                          >
                            <CheckCircle className="h-3 w-3" />
                            Offer Received
                          </button>
                          <button
                            onClick={() => recordOutcomeMutation.mutate({ userId, applicationId: app.id, outcome: 'rejection' })}
                            disabled={recordOutcomeMutation.isPending}
                            className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-red-500/30 bg-red-500/10 py-1.5 text-[10px] font-medium text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
                          >
                            <XCircle className="h-3 w-3" />
                            Rejected
                          </button>
                        </div>
                      )}

                      {app.status === 'rejected' && (
                        <button
                          onClick={() => {
                            setFollowUpAppId(app.id);
                            setFollowUpText('');
                            generateFollowUpMutation.mutate({ userId, applicationId: app.id });
                          }}
                          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 py-1.5 text-xs font-medium text-amber-400 transition hover:bg-amber-500/20"
                        >
                          <Mail className="h-3 w-3" />
                          Request Feedback
                        </button>
                      )}

                      {/* Follow-up — all stages */}
                      <button
                        onClick={() => {
                          setFollowUpAppId(app.id);
                          setFollowUpText('');
                          generateFollowUpMutation.mutate({ userId, applicationId: app.id });
                        }}
                        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-violet-500/30 bg-violet-500/10 py-1.5 text-xs font-medium text-violet-400 transition hover:bg-violet-500/20"
                      >
                        <Mail className="h-3 w-3" />
                        Follow-up Email
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── New Application Modal ─────────────────────────────────────────── */}
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
                  placeholder="e.g. Senior React Developer"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Company *</label>
                <input
                  type="text"
                  value={newForm.company}
                  onChange={(e) => setNewForm({ ...newForm, company: e.target.value })}
                  placeholder="e.g. Acme Ltd"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Notes (optional)</label>
                <textarea
                  value={newForm.notes}
                  onChange={(e) => setNewForm({ ...newForm, notes: e.target.value })}
                  placeholder="Any notes about this role…"
                  rows={3}
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            </div>
            {createMutation.isError && (
              <p className="text-sm text-red-400">Could not create application. Please try again.</p>
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
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
              >
                {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Cover Letter Modal ────────────────────────────────────────────── */}
      {showCoverLetter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="flex max-h-[80vh] w-full max-w-2xl flex-col space-y-4 rounded-2xl border border-white/10 bg-[#020617] p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Cover Letter</h2>
              <button onClick={() => setShowCoverLetter(null)} className="text-slate-400 hover:text-white">
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto rounded-xl border border-white/10 bg-white/5 p-4">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-300">
                {showCoverLetter.text}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ── Follow-up Modal ───────────────────────────────────────────────── */}
      {followUpAppId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="flex max-h-[80vh] w-full max-w-2xl flex-col space-y-4 rounded-2xl border border-white/10 bg-[#020617] p-6">
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
                  <p className="text-sm text-red-400">Could not generate follow-up email. Please try again.</p>
                )}
                <textarea
                  value={followUpText}
                  onChange={(e) => setFollowUpText(e.target.value)}
                  rows={12}
                  className="flex-1 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-relaxed text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-600"
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
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 py-2 text-sm font-medium text-violet-400 transition hover:bg-violet-500/20 disabled:opacity-50"
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

      {/* ── Cover Letter Compose Modal (from Tailor CV) ──────────────────── */}
      {composeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl space-y-4 rounded-2xl border border-white/10 bg-[#020617] p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-indigo-400" />
                  Tailor CV — Send Cover Letter
                </h2>
                <p className="text-sm text-slate-400 mt-0.5">
                  AI-generated cover letter for <span className="text-white font-medium">{composeModal.jobTitle}</span> at <span className="text-white font-medium">{composeModal.company}</span>
                </p>
              </div>
              <button onClick={() => setComposeModal(null)} className="text-slate-500 hover:text-white transition">✕</button>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">To (Employer Email)</label>
              <input
                type="email"
                value={composeModal.recipientEmail}
                onChange={(e) => setComposeModal((prev) => prev ? { ...prev, recipientEmail: e.target.value } : null)}
                placeholder="hiring@company.com"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">Subject</label>
              <input
                type="text"
                value={composeModal.subject}
                onChange={(e) => setComposeModal((prev) => prev ? { ...prev, subject: e.target.value } : null)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Cover Letter</label>
                <button
                  onClick={() => coverLetterMutation.mutate({ jobId: composeModal.jobId })}
                  disabled={coverLetterMutation.isPending}
                  className="flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-xs font-medium text-indigo-300 transition hover:bg-indigo-500/20 disabled:opacity-50"
                >
                  {coverLetterMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                  Regenerate
                </button>
              </div>
              {coverLetterMutation.isPending && !composeModal.coverLetter ? (
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-8 text-sm text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin text-indigo-400 shrink-0" />
                  Generating personalised cover letter…
                </div>
              ) : (
                <textarea
                  value={composeModal.coverLetter}
                  onChange={(e) => setComposeModal((prev) => prev ? { ...prev, coverLetter: e.target.value } : null)}
                  rows={12}
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-relaxed text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  placeholder="Cover letter will appear here…"
                />
              )}
            </div>

            {coverLetterMutation.isError && (
              <p className="text-xs text-red-400">Could not generate cover letter. Check your profile has skills and summary.</p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setComposeModal(null)}
                className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-slate-400 transition hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const body = `${composeModal.coverLetter}`;
                  const mailto = `mailto:${composeModal.recipientEmail}?subject=${encodeURIComponent(composeModal.subject)}&body=${encodeURIComponent(body)}`;
                  window.open(mailto, '_blank');
                }}
                disabled={!composeModal.coverLetter || coverLetterMutation.isPending}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
              >
                <Mail className="h-4 w-4" />
                Open in Email Client
              </button>
              <button
                onClick={() => { void navigator.clipboard.writeText(composeModal.coverLetter); }}
                disabled={!composeModal.coverLetter}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 px-4 text-sm font-medium text-slate-300 transition hover:bg-white/10 disabled:opacity-60"
                title="Copy cover letter to clipboard"
              >
                <FileText className="h-4 w-4" />
                Copy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Send by Email Modal ───────────────────────────────────────────── */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-white/10 bg-[#020617] p-6">
            <h2 className="text-lg font-semibold text-white">Send Application by Email</h2>
            <p className="text-sm text-slate-400">
              Sending CV + cover letter for{' '}
              <span className="font-medium text-white">{showEmailModal.title}</span> at{' '}
              <span className="font-medium text-white">{showEmailModal.company}</span>
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
              <p className="text-sm text-red-400">Could not send email. Please try again.</p>
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
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-sky-600 py-2 text-sm font-medium text-white transition hover:bg-sky-700 disabled:opacity-60"
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
