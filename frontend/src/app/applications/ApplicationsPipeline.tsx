import { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { api } from '@/lib/api';
import { useThemeStore } from '@/stores/themeStore';
import {
  Plus,
  Loader2,
  FileText,
  Mail,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronRight,
  Briefcase,
  TrendingUp,
  MessageSquare,
  Award,
  Palette,
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

// ── Stage config ────────────────────────────────────────────────────────────

type StageConfig = {
  key: AppStatus;
  label: string;
  ringColor: string;
  countColor: string;
  borderColor: string;
  bgColor: string;
  badgeColor: string;
  activeBorder: string;
  glowColor: string;
};

const STAGES: StageConfig[] = [
  {
    key: 'draft',
    label: 'Draft',
    ringColor: '#94a3b8',
    countColor: 'text-slate-300',
    borderColor: 'border-slate-500/30',
    bgColor: 'bg-slate-500/10',
    badgeColor: 'text-slate-400 bg-white/10',
    activeBorder: 'border-slate-400',
    glowColor: 'shadow-slate-500/20',
  },
  {
    key: 'prepared',
    label: 'Ready',
    ringColor: '#818cf8',
    countColor: 'text-indigo-300',
    borderColor: 'border-indigo-500/30',
    bgColor: 'bg-indigo-500/10',
    badgeColor: 'text-indigo-400 bg-indigo-500/20',
    activeBorder: 'border-indigo-400',
    glowColor: 'shadow-indigo-500/20',
  },
  {
    key: 'sent',
    label: 'Submitted',
    ringColor: '#38bdf8',
    countColor: 'text-sky-300',
    borderColor: 'border-sky-500/30',
    bgColor: 'bg-sky-500/10',
    badgeColor: 'text-sky-400 bg-sky-500/20',
    activeBorder: 'border-sky-400',
    glowColor: 'shadow-sky-500/20',
  },
  {
    key: 'interview',
    label: 'Interview',
    ringColor: '#fbbf24',
    countColor: 'text-amber-300',
    borderColor: 'border-amber-500/30',
    bgColor: 'bg-amber-500/10',
    badgeColor: 'text-amber-400 bg-amber-500/20',
    activeBorder: 'border-amber-400',
    glowColor: 'shadow-amber-500/20',
  },
  {
    key: 'accepted',
    label: 'Offer',
    ringColor: '#34d399',
    countColor: 'text-emerald-300',
    borderColor: 'border-emerald-500/30',
    bgColor: 'bg-emerald-500/10',
    badgeColor: 'text-emerald-400 bg-emerald-500/20',
    activeBorder: 'border-emerald-400',
    glowColor: 'shadow-emerald-500/20',
  },
  {
    key: 'rejected',
    label: 'Rejected',
    ringColor: '#f87171',
    countColor: 'text-red-300',
    borderColor: 'border-red-500/30',
    bgColor: 'bg-red-500/10',
    badgeColor: 'text-red-400 bg-red-500/20',
    activeBorder: 'border-red-400',
    glowColor: 'shadow-red-500/20',
  },
];

const statusBadgeColor: Record<AppStatus, string> = {
  draft: 'text-slate-400 bg-white/10',
  prepared: 'text-indigo-400 bg-indigo-500/20',
  sent: 'text-sky-400 bg-sky-500/20',
  interview: 'text-amber-400 bg-amber-500/20',
  accepted: 'text-emerald-400 bg-emerald-500/20',
  rejected: 'text-red-400 bg-red-500/20',
};

const STATUS_LABELS: Record<AppStatus, string> = {
  draft: 'Draft',
  prepared: 'Ready',
  sent: 'Submitted',
  interview: 'Interview',
  accepted: 'Offer',
  rejected: 'Rejected',
};

// ── Progress Ring SVG ────────────────────────────────────────────────────────

function ProgressRing({
  value,
  max,
  color,
  size = 40,
}: {
  value: number;
  max: number;
  color: string;
  size?: number;
}) {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = max === 0 ? 0 : Math.min(value / max, 1);
  const offset = circumference * (1 - pct);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0 -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={3}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
    </svg>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function ApplicationsPipeline() {
  const { user, isLoaded } = useUser();
  const userId = user?.id ?? '';

  const { theme, setTheme } = useThemeStore();

  const [activeStage, setActiveStage] = useState<AppStatus | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const [newForm, setNewForm] = useState({ jobTitle: '', company: '', notes: '' });
  const [showCoverLetter, setShowCoverLetter] = useState<{ id: string; text: string } | null>(null);
  const [fitReasonsMap, setFitReasonsMap] = useState<Record<string, string[]>>({});
  const [showEmailModal, setShowEmailModal] = useState<{ id: string; title: string; company: string } | null>(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [followUpAppId, setFollowUpAppId] = useState<string | null>(null);
  const [followUpText, setFollowUpText] = useState('');
  const [monitoringMap, setMonitoringMap] = useState<Record<string, boolean>>({});

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

  if (!isLoaded) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  const apps = (appsQuery.data ?? []) as Application[];
  const analytics = analyticsQuery.data;
  const totalApps = apps.length;

  const recentApps = [...apps]
    .slice()
    .reverse()
    .slice(0, 3);

  const handleCreate = () => {
    if (!newForm.jobTitle || !newForm.company) return;
    createMutation.mutate({ userId, jobTitle: newForm.jobTitle, company: newForm.company, notes: newForm.notes || undefined });
  };

  const handleTileClick = (key: AppStatus) => {
    setActiveStage(prev => (prev === key ? null : key));
  };

  const activeStageApps = activeStage ? apps.filter(a => a.status === activeStage) : [];
  const activeStageConfig = activeStage ? STAGES.find(s => s.key === activeStage)! : null;

  const themeOptions: { value: 'light' | 'dark' | 'overstimulated' | 'visually-impaired'; label: string }[] = [
    { value: 'light',             label: 'Jasny' },
    { value: 'dark',              label: 'Granatowy' },
    { value: 'overstimulated',    label: 'Spokojny' },
    { value: 'visually-impaired', label: 'Kontrast' },
  ];

  return (
    <div className="space-y-6">

      {/* ── New responses banner ─────────────────────────────────────────── */}
      {showBanner && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 dark:border-amber-800 dark:bg-amber-950/20">
          <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
          <span className="text-sm font-medium text-amber-800 dark:text-amber-400">2 nowe odpowiedzi od pracodawców</span>
          <button onClick={() => setShowBanner(false)} className="ml-auto text-xs text-amber-600 hover:underline">Ukryj</button>
        </div>
      )}

      {/* ── Top Bar ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

        {/* Theme switcher */}
        <div className="flex items-center gap-2">
          <Palette className="h-3.5 w-3.5 shrink-0 text-slate-500" />
          <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
            {themeOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={`rounded-lg px-2.5 py-1 text-[10px] font-medium transition-all ${
                  theme === opt.value
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Recent apps chips */}
        {recentApps.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
            <span className="shrink-0 text-[10px] text-slate-500">Recent:</span>
            {recentApps.map(app => (
              <button
                key={app.id}
                onClick={() => handleTileClick(app.status)}
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] transition hover:bg-white/10"
              >
                <span className="max-w-[80px] truncate font-medium text-white">{app.jobTitle}</span>
                <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${statusBadgeColor[app.status]}`}>
                  {STATUS_LABELS[app.status]}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Page header ──────────────────────────────────────────────────── */}
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

      {/* ── Analytics Stats ───────────────────────────────────────────────── */}
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

      {/* Errors / Loading */}
      {appsQuery.isError && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          {appsQuery.error ? 'Unable to load applications. Please refresh the page.' : 'Failed to load applications'}
        </p>
      )}
      {appsQuery.isLoading && (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      )}

      {/* ── Stage Tiles Grid ──────────────────────────────────────────────── */}
      {!appsQuery.isLoading && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {STAGES.map((stage) => {
            const count = apps.filter(a => a.status === stage.key).length;
            const isActive = activeStage === stage.key;

            return (
              <button
                key={stage.key}
                onClick={() => handleTileClick(stage.key)}
                className={`group relative flex h-[120px] flex-col justify-between overflow-hidden rounded-2xl border p-4 text-left transition-all duration-200
                  ${isActive
                    ? `${stage.activeBorder} bg-white/8 shadow-lg ${stage.glowColor}`
                    : `border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8`
                  }`}
              >
                {/* Top row: stage name + chevron */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 group-hover:text-slate-300 transition-colors">
                    {stage.label}
                  </span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-slate-600 transition-transform duration-200 ${isActive ? 'rotate-180 text-slate-400' : ''}`}
                  />
                </div>

                {/* Bottom row: count + progress ring */}
                <div className="flex items-end justify-between">
                  <span className={`text-4xl font-black leading-none tabular-nums ${stage.countColor}`}>
                    {count}
                  </span>
                  <ProgressRing
                    value={count}
                    max={Math.max(totalApps, 1)}
                    color={stage.ringColor}
                    size={42}
                  />
                </div>

                {/* Active indicator bar at bottom */}
                {isActive && (
                  <div
                    className="absolute bottom-0 left-0 h-0.5 w-full"
                    style={{ backgroundColor: stage.ringColor }}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Drill-down Panel ─────────────────────────────────────────────── */}
      {activeStage && activeStageConfig && (
        <div
          className="overflow-hidden rounded-2xl border border-white/10 bg-white/5"
          style={{
            borderColor: activeStageConfig.ringColor + '40',
          }}
        >
          {/* Panel header */}
          <div
            className="flex items-center justify-between px-5 py-3"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: activeStageConfig.ringColor }}
              />
              <span className="font-semibold text-white">{activeStageConfig.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${activeStageConfig.badgeColor}`}
              >
                {activeStageApps.length} application{activeStageApps.length !== 1 ? 's' : ''}
              </span>
            </div>
            <button
              onClick={() => setActiveStage(null)}
              aria-label="Close panel"
              title="Close"
              className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/10 hover:text-slate-300"
            >
              <XCircle className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {/* Application cards */}
          <div className="p-4">
            {activeStageApps.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <div className="rounded-2xl border-2 border-dashed border-white/10 px-8 py-6">
                  <p className="text-sm text-slate-500">No applications in this stage.</p>
                  <button
                    onClick={() => setShowNewModal(true)}
                    className="mt-3 flex items-center gap-1.5 rounded-xl bg-white/5 px-3 py-1.5 text-xs text-slate-400 transition hover:bg-white/10 hover:text-white"
                  >
                    <Plus className="h-3 w-3" />
                    Add one
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {activeStageApps.map((app) => (
                  <AppCard
                    key={app.id}
                    app={app}
                    stage={activeStageConfig}
                    fitReasons={fitReasonsMap[app.id] ?? []}
                    userId={userId}
                    generateDocsMutation={generateDocsMutation}
                    recordOutcomeMutation={recordOutcomeMutation}
                    onViewCoverLetter={() =>
                      app.coverLetterSnapshot &&
                      setShowCoverLetter({ id: app.id, text: app.coverLetterSnapshot })
                    }
                    onSendEmail={() =>
                      setShowEmailModal({ id: app.id, title: app.jobTitle, company: app.company })
                    }
                    onFollowUp={() => {
                      setFollowUpAppId(app.id);
                      setFollowUpText('');
                      generateFollowUpMutation.mutate({ userId, applicationId: app.id });
                    }}
                    monitoringActive={monitoringMap[app.id] ?? false}
                    onToggleMonitoring={() => {
                      const active = monitoringMap[app.id] ?? false;
                      if (active) {
                        revokeMonitoringMutation.mutate({ userId, applicationId: app.id });
                      } else {
                        grantMonitoringMutation.mutate({ userId, applicationId: app.id });
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
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
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            </div>
            {createMutation.isError && (
              <p className="text-sm text-red-400">
                {createMutation.isError ? 'Could not create application. Please try again.' : ''}
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
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
              >
                {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Cover Letter Preview Modal ────────────────────────────────────── */}
      {showCoverLetter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="flex max-h-[80vh] w-full max-w-2xl flex-col space-y-4 rounded-2xl border border-white/10 bg-[#020617] p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Cover Letter Preview</h2>
              <button onClick={() => setShowCoverLetter(null)} aria-label="Close cover letter preview" title="Close" className="text-slate-400 hover:text-white">
                <XCircle className="h-5 w-5" aria-hidden="true" />
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

      {/* ── Follow-up Copilot Modal ───────────────────────────────────────── */}
      {followUpAppId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="flex max-h-[80vh] w-full max-w-2xl flex-col space-y-4 rounded-2xl border border-white/10 bg-[#020617] p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Follow-up Email</h2>
              <button
                onClick={() => { setFollowUpAppId(null); setFollowUpText(''); }}
                aria-label="Close follow-up"
                title="Close"
                className="text-slate-400 hover:text-white"
              >
                <XCircle className="h-5 w-5" aria-hidden="true" />
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
                     Could not generate follow-up email. Please try again.
                   </p>
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
              <p className="text-sm text-red-400">
                {sendEmailMutation.isError ? 'Could not send email. Please try again.' : ''}
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

// ── AppCard sub-component ────────────────────────────────────────────────────

type MutationRef<TVariables> = {
  mutate: (vars: TVariables) => void;
  isPending: boolean;
  variables?: TVariables;
};

function AppCard({
  app,
  stage,
  fitReasons,
  userId,
  generateDocsMutation,
  recordOutcomeMutation,
  onViewCoverLetter,
  onSendEmail,
  onFollowUp,
  onToggleMonitoring,
  monitoringActive,
}: {
  app: Application;
  stage: StageConfig;
  fitReasons: string[];
  userId: string;
  generateDocsMutation: MutationRef<{ userId: string; applicationId: string }>;
  recordOutcomeMutation: MutationRef<{ userId: string; applicationId: string; outcome: 'interview' | 'offer' | 'rejection' }>;
  onViewCoverLetter: () => void;
  onSendEmail: () => void;
  onFollowUp: () => void;
  onToggleMonitoring: () => void;
  monitoringActive: boolean;
}) {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-white/20 hover:bg-white/8">
      {/* Title + company */}
      <div>
        <p className="text-sm font-semibold leading-tight text-white">{app.jobTitle}</p>
        <p className="mt-0.5 text-xs text-slate-400">{app.company}</p>
      </div>

      {/* Fit score */}
      {app.fitScore !== null && (
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${app.fitScore}%`,
                backgroundColor: stage.ringColor,
              }}
            />
          </div>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${stage.badgeColor}`}
          >
            {app.fitScore}% fit
          </span>
        </div>
      )}

      {/* Fit reasons */}
      {fitReasons.length > 0 && (
        <div className="space-y-0.5">
          {fitReasons.slice(0, 3).map((reason, i) => (
            <p key={i} className="flex items-start gap-1 text-[10px] text-emerald-400/80">
              <span className="mt-0.5 shrink-0">✓</span>
              {reason}
            </p>
          ))}
        </div>
      )}

      {/* Stage-specific actions */}
      <div className="mt-auto space-y-1.5">
        {stage.key === 'draft' && (
          <button
            onClick={() => generateDocsMutation.mutate({ userId, applicationId: app.id })}
            disabled={
              generateDocsMutation.isPending &&
              generateDocsMutation.variables?.applicationId === app.id
            }
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 py-1.5 text-xs font-medium text-indigo-400 transition hover:bg-indigo-500/20 disabled:opacity-50"
          >
            {generateDocsMutation.isPending &&
            generateDocsMutation.variables?.applicationId === app.id ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <FileText className="h-3 w-3" />
            )}
            Generate Docs
          </button>
        )}

        {stage.key === 'prepared' && (
          <>
            {app.coverLetterSnapshot && (
              <button
                onClick={onViewCoverLetter}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-1.5 text-xs text-slate-400 transition hover:bg-white/10"
              >
                <FileText className="h-3 w-3" />
                View Cover Letter
              </button>
            )}
            <button
              onClick={onSendEmail}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-sky-500/30 bg-sky-500/10 py-1.5 text-xs font-medium text-sky-400 transition hover:bg-sky-500/20"
            >
              <Mail className="h-3 w-3" />
              Send by Email
            </button>
          </>
        )}

        {stage.key === 'sent' && (
          <div className="flex gap-1.5">
            <button
              onClick={() =>
                recordOutcomeMutation.mutate({ userId, applicationId: app.id, outcome: 'interview' })
              }
              disabled={recordOutcomeMutation.isPending}
              className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-amber-500/30 bg-amber-500/10 py-1.5 text-[10px] font-medium text-amber-400 transition hover:bg-amber-500/20 disabled:opacity-50"
            >
              <ChevronRight className="h-3 w-3" />
              Interview
            </button>
            <button
              onClick={() =>
                recordOutcomeMutation.mutate({ userId, applicationId: app.id, outcome: 'rejection' })
              }
              disabled={recordOutcomeMutation.isPending}
              className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-red-500/30 bg-red-500/10 py-1.5 text-[10px] font-medium text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
            >
              <XCircle className="h-3 w-3" />
              Rejected
            </button>
          </div>
        )}

        {/* IMAP monitoring toggle — available for sent applications */}
        {stage.key === 'sent' && (
          <button
            onClick={onToggleMonitoring}
            title={monitoringActive ? 'Disable inbox monitoring for this application' : 'Enable inbox monitoring — app will detect employer replies and update status automatically'}
            className={`flex w-full items-center justify-center gap-1.5 rounded-xl py-1.5 text-xs font-medium transition ${
              monitoringActive
                ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                : 'border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            <Mail className="h-3 w-3" />
            {monitoringActive ? 'Inbox monitored ✓' : 'Monitor inbox replies'}
          </button>
        )}

        {stage.key === 'interview' && (
          <div className="flex gap-1.5">
            <button
              onClick={() =>
                recordOutcomeMutation.mutate({ userId, applicationId: app.id, outcome: 'offer' })
              }
              disabled={recordOutcomeMutation.isPending}
              className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-1.5 text-[10px] font-medium text-emerald-400 transition hover:bg-emerald-500/20 disabled:opacity-50"
            >
              <CheckCircle className="h-3 w-3" />
              Offer
            </button>
            <button
              onClick={() =>
                recordOutcomeMutation.mutate({ userId, applicationId: app.id, outcome: 'rejection' })
              }
              disabled={recordOutcomeMutation.isPending}
              className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-red-500/30 bg-red-500/10 py-1.5 text-[10px] font-medium text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
            >
              <XCircle className="h-3 w-3" />
              Rejected
            </button>
          </div>
        )}

        {/* Follow-up Copilot — available on all stages */}
        <button
          onClick={onFollowUp}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-violet-500/30 bg-violet-500/10 py-1.5 text-xs font-medium text-violet-400 transition hover:bg-violet-500/20"
        >
          <Mail className="h-3 w-3" />
          Follow-up
        </button>

        {/* Rejection reason — available only on rejected stage */}
        {stage.key === 'rejected' && (
          <>
            <button
              onClick={() => setShowConfirm(true)}
              className="mt-2 w-full rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
            >
              Zapytaj AI o powód odmowy
            </button>

            {showConfirm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 max-w-sm w-full">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    AI wyśle uprzejmy email do pracodawcy z prośbą o feedback dotyczący Twojej aplikacji.
                  </p>
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => setShowConfirm(false)}
                      className="flex-1 rounded-xl border border-slate-200 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700"
                    >
                      Anuluj
                    </button>
                    <button
                      onClick={() => { setShowConfirm(false); }}
                      className="flex-1 rounded-xl bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                    >
                      Wyślij email
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
