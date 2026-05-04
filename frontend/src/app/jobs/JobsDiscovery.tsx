import { useState, useMemo, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { api } from '@/lib/api';
import { Search, MapPin, Plus, Loader2, Cookie, CheckCircle2, XCircle, AlertCircle, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { JobCardCompact } from '@/components/jobs/JobCardCompact';
import { JobCardExpanded } from '@/components/jobs/JobCardExpanded';

type JobResult = {
  id: string;
  title: string;
  company: string;
  location: string;
  salaryMin: number | null;
  salaryMax: number | null;
  workMode: string | null;
  source: string;
  applyUrl: string;
  fitScore: number;
  description?: string;
  requirements?: string[];
  postedAt?: string;
  scamAnalysis?: {
    riskScore: number;
    level: 'low' | 'medium' | 'high';
    reasons?: string[];
  };
  employerSignals?: {
    trustScore: number;
    trustLevel: 'verified' | 'likely_legit' | 'review' | 'risky';
    riskScore: number;
    riskLevel: 'low' | 'medium' | 'high';
    salaryTransparency: 'full' | 'range' | 'none';
    descriptionQuality: 'detailed' | 'average' | 'thin';
    requirementsClarity: 'clear' | 'vague' | 'none';
    workModeClarity: 'explicit' | 'implicit' | 'none';
    benefits: { type: string; label: string; source: 'detected_in_listing' }[];
    ukSignals: { type: string; label: string; present: boolean }[];
    trustReasons: string[];
    riskReasons: string[];
  };
};

type SessionStatus = { id: string; provider: string; isActive: boolean; lastTestedAt: Date | null; updatedAt: Date };

type FitAnalysis = {
  skillsMatch: number;
  experienceMatch: number;
  salaryMatch: number;
  cultureMatch: number;
  strengths: string[];
  gaps: string[];
  advice?: string;
  skillsBreakdown?: {
    matched: string[];
    missing: string[];
    partial: string[];
    bonus: string[];
  };
};

const ALL_SOURCES = ['reed', 'adzuna', 'jooble', 'indeed', 'gumtree'] as const;
type Source = (typeof ALL_SOURCES)[number];

const SOURCE_META: Record<Source, { label: string; color: string; requiresSession: boolean; url: string }> = {
  reed: { label: 'Reed', color: 'bg-rose-500/20 text-rose-400', requiresSession: false, url: '' },
  adzuna: { label: 'Adzuna', color: 'bg-amber-500/20 text-amber-400', requiresSession: false, url: '' },
  jooble: { label: 'Jooble', color: 'bg-sky-500/20 text-sky-400', requiresSession: false, url: '' },
  indeed: { label: 'Indeed', color: 'bg-blue-500/20 text-blue-400', requiresSession: true, url: 'https://www.indeed.co.uk' },
  gumtree: { label: 'Gumtree', color: 'bg-green-500/20 text-green-400', requiresSession: true, url: 'https://www.gumtree.com/jobs' },
};

function ExplainFitModal({ jobId, userId, onClose }: { jobId: string; userId: string; onClose: () => void }) {
  const explainQuery = api.jobs.explainFit.useQuery(
    { userId, jobId },
    { enabled: !!jobId && !!userId }
  );

  const fit = explainQuery.data?.fit;
  const scam = explainQuery.data?.scam;

  function fitScoreColor(score: number): string {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-red-400';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#020617] p-6 space-y-4 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-400" />
            Why this match?
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        {explainQuery.isLoading && (
          <div className="flex flex-1 items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
              <p className="text-sm text-slate-400">Analysing your fit…</p>
            </div>
          </div>
        )}

            {explainQuery.isError && (
          <p className="text-sm text-red-400">
            Could not analyse fit. Please try again.
          </p>
        )}

        {fit && (
          <div className="flex-1 overflow-y-auto space-y-4">
            {/* Fit score */}
            <div className="flex items-center justify-center py-4">
              <span className={`text-6xl font-bold ${fitScoreColor(fit.score)}`}>
                {fit.score}%
              </span>
            </div>

            {/* Scam warning */}
            {scam?.isScam && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 space-y-1">
                <p className="text-sm font-semibold text-red-400 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  Potential scam detected
                </p>
                {scam.reasons && scam.reasons.length > 0 && (
                  <ul className="mt-1 space-y-0.5 pl-6 list-disc text-xs text-red-300">
                    {scam.reasons.map((r: string, i: number) => <li key={i}>{r}</li>)}
                  </ul>
                )}
              </div>
            )}

            {/* Strengths */}
            {fit.strengths && fit.strengths.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2">Strengths</p>
                <ul className="space-y-1">
                  {fit.strengths.map((s: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Gaps */}
            {fit.gaps && fit.gaps.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-2">Gaps</p>
                <ul className="space-y-1">
                  {fit.gaps.map((g: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                      {g}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Advice */}
            {fit.advice && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-2">Advice</p>
                <p className="text-sm text-slate-300 leading-relaxed">{fit.advice}</p>
              </div>
            )}
          </div>
        )}

        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full rounded-xl border border-white/10 py-2 text-sm text-slate-400 transition hover:bg-white/5"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Session setup panel for Indeed / Gumtree — auto login wizard ─────────────

type LoginStep = 'idle' | 'enterCredentials' | 'awaitingCode' | 'success' | 'error';

function SessionPanel({ provider, status, userId }: {
  provider: 'indeed' | 'gumtree';
  status: SessionStatus | undefined;
  userId: string;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<LoginStep>('idle');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [codeSentTo, setCodeSentTo] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const utils = api.useUtils();
  const meta = SOURCE_META[provider];

  const startIndeed = api.jobSessions.startIndeedLogin.useMutation({
    onSuccess: (data) => {
      if ('error' in data && data.error) { setMsg(data.error); setStep('error'); return; }
      if ('requiresCode' in data && data.requiresCode) {
        setCodeSentTo((data as { codeSentTo?: string | null }).codeSentTo ?? null);
        setStep('awaitingCode');
      } else {
        // Already logged in (returned storageState directly)
        setStep('success');
        void utils.jobSessions.getStatus.invalidate();
      }
    },
    onError: () => { setMsg('Connection failed. Please check your credentials and try again.'); setStep('error'); },
  });

  const submitIndeedCode = api.jobSessions.submitIndeedCode.useMutation({
    onSuccess: (data) => {
      if (data.success) { setStep('success'); void utils.jobSessions.getStatus.invalidate(); }
      else { setMsg(data.error ?? 'Code rejected'); setStep('error'); }
    },
    onError: () => { setMsg('Connection failed. Please check your credentials and try again.'); setStep('error'); },
  });

  const startGumtree = api.jobSessions.startGumtreeLogin.useMutation({
    onSuccess: (data) => {
      if (data.error) { setMsg(data.error); setStep('error'); return; }
      if (data.success) { setStep('success'); void utils.jobSessions.getStatus.invalidate(); return; }
      if (data.requiresCode) { setCodeSentTo(data.codeSentTo ?? null); setStep('awaitingCode'); }
    },
    onError: () => { setMsg('Connection failed. Please check your credentials and try again.'); setStep('error'); },
  });

  const submitGumtreeCode = api.jobSessions.submitGumtreeCode.useMutation({
    onSuccess: (data) => {
      if (data.success) { setStep('success'); void utils.jobSessions.getStatus.invalidate(); }
      else { setMsg(data.error ?? 'Code rejected'); setStep('error'); }
    },
    onError: () => { setMsg('Connection failed. Please check your credentials and try again.'); setStep('error'); },
  });

  const testMutation = api.jobSessions.testSession.useMutation({
    onSuccess: () => { void utils.jobSessions.getStatus.invalidate(); },
  });

  const removeMutation = api.jobSessions.remove.useMutation({
    onSuccess: () => { void utils.jobSessions.getStatus.invalidate(); setStep('idle'); },
  });

  const isLoading = startIndeed.isPending || submitIndeedCode.isPending || startGumtree.isPending || submitGumtreeCode.isPending;

  function handleStart() {
    setMsg('');
    if (provider === 'indeed') startIndeed.mutate({ userId, email, password: password || undefined });
    else startGumtree.mutate({ userId, email, password: password || undefined });
  }

  function handleCode() {
    setMsg('');
    if (provider === 'indeed') submitIndeedCode.mutate({ userId, code });
    else submitGumtreeCode.mutate({ userId, code });
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-3">
          <Cookie className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-medium text-white">{meta.label}</span>
          {status?.isActive
            ? <span className="flex items-center gap-1 text-xs text-emerald-400"><CheckCircle2 className="h-3.5 w-3.5" />Connected</span>
            : status
              ? <span className="flex items-center gap-1 text-xs text-amber-400"><AlertCircle className="h-3.5 w-3.5" />Expired</span>
              : <span className="flex items-center gap-1 text-xs text-slate-500"><XCircle className="h-3.5 w-3.5" />Not connected</span>
          }
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>

      {open && (
        <div className="border-t border-white/10 px-4 py-4 space-y-3">
          {/* Step: success */}
          {(step === 'success' || status?.isActive) && step !== 'enterCredentials' ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <p className="text-xs text-emerald-300">Session active — {meta.label} jobs included in search</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => testMutation.mutate({ userId, provider })}
                  disabled={testMutation.isPending}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2 text-xs text-slate-300 hover:bg-white/10 disabled:opacity-60"
                >
                  {testMutation.isPending ? 'Testing…' : 'Test connection'}
                </button>
                <button
                  onClick={() => setStep('enterCredentials')}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2 text-xs text-slate-300 hover:bg-white/10"
                >
                  Re-login
                </button>
                <button
                  onClick={() => removeMutation.mutate({ userId, provider })}
                  disabled={removeMutation.isPending}
                  className="rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 disabled:opacity-60"
                >
                  Disconnect
                </button>
              </div>
              {testMutation.data && (
                <p className={`text-xs ${testMutation.data.ok ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {testMutation.data.reason}
                </p>
              )}
            </div>
          ) : step === 'awaitingCode' ? (
            /* Step: enter verification code */
            <div className="space-y-3">
              <div className="rounded-lg bg-indigo-500/10 border border-indigo-500/20 p-3 text-xs text-indigo-300">
                <p className="font-semibold mb-1">Verification code required</p>
                {codeSentTo && <p>Code sent to: <span className="font-mono text-white">{codeSentTo}</span></p>}
                <p className="mt-1 text-indigo-200/70">Check your email or phone for the {meta.label} verification code.</p>
              </div>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Enter 6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                maxLength={8}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 font-mono tracking-widest text-center"
              />
              <div className="flex gap-2">
                <button onClick={() => setStep('enterCredentials')} className="rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-400 hover:bg-white/5">Back</button>
                <button
                  onClick={handleCode}
                  disabled={code.length < 4 || isLoading}
                  className="flex-1 rounded-xl bg-indigo-600 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {isLoading ? 'Verifying…' : 'Verify code'}
                </button>
              </div>
            </div>
          ) : (
            /* Step: enter credentials */
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Enter your {meta.label} credentials. The server will log in automatically via a secure headless browser — your password is never stored.
              </p>
              <input
                type="email"
                placeholder={`${meta.label} email`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
              <input
                type="password"
                placeholder="Password (optional — used for login only)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
              {msg && step === 'error' && (
                <p className="text-xs text-red-400 rounded-lg bg-red-500/10 px-3 py-2">{msg}</p>
              )}
              <button
                onClick={handleStart}
                disabled={!email || isLoading}
                className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Connecting…</> : `Connect ${meta.label}`}
              </button>
              <p className="text-xs text-slate-600 text-center">Your password is used only to connect and is never stored by us.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function JobsDiscovery() {
  const { user, isLoaded } = useUser();
  const userId = user?.id ?? '';

  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('United Kingdom');
  const [sources, setSources] = useState<Source[]>(['reed', 'adzuna', 'jooble']);
  const [maxDaysOld, setMaxDaysOld] = useState<number | undefined>(undefined);
  const [searchParams, setSearchParams] = useState<{
    query: string;
    location: string;
    sources: string[];
    userId?: string;
    maxDaysOld?: number;
  } | null>(null);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [manualForm, setManualForm] = useState({ title: '', company: '', location: '', applyUrl: '' });
  const [explainJobId, setExplainJobId] = useState<string | null>(null);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const [minJobFitPercent, _setMinJobFitPercent] = useState(50);
  const [pendingJobsSearchAfterCv] = useState(false);
  const [fitAnalysisCache, setFitAnalysisCache] = useState<Record<string, FitAnalysis>>({});
  const [loadingFitIds, setLoadingFitIds] = useState<Set<string>>(new Set());

  const sessionQuery = api.jobSessions.getStatus.useQuery(
    { userId },
    { enabled: !!userId }
  );
  const sessions = (sessionQuery.data ?? []) as SessionStatus[];

  const searchQuery = api.jobs.search.useQuery(
    searchParams ?? { query: '', location: 'United Kingdom', sources: ['reed'] },
    { enabled: searchParams !== null }
  );

  const saveManualMutation = api.jobs.saveManual.useMutation({
    onSuccess: () => {
      setShowManualModal(false);
      setManualForm({ title: '', company: '', location: '', applyUrl: '' });
    },
  });

  const profileQuery = api.profile.getProfile.useQuery(
    undefined,
    { enabled: !!userId }
  );

  const getSavedJobsQuery = api.jobs.getSavedJobs.useQuery(
    undefined,
    { enabled: !!userId }
  );

  const saveJobMutation = api.jobs.saveJob.useMutation({
    onSuccess: (_, vars) => {
      setSavedJobs((prev) => new Set(prev).add(vars.jobId));
    },
  });

  const unsaveJobMutation = api.jobs.unsaveJob.useMutation({
    onSuccess: (_, vars) => {
      setSavedJobs((prev) => {
        const next = new Set(prev);
        next.delete(vars.jobId);
        return next;
      });
    },
  });

  const handleSearch = () => {
    setSearchParams({ query, location, sources: [...sources], userId: userId || undefined, maxDaysOld });
  };

  // Load fit analysis for a job (called on card expand, cached to avoid re-fetching)
  const loadFitAnalysis = useCallback(async (jobId: string) => {
    if (!userId || fitAnalysisCache[jobId] || loadingFitIds.has(jobId)) return;
    setLoadingFitIds((prev) => new Set(prev).add(jobId));
    try {
      const result = await (api as any).jobs.explainFit.query({ userId, jobId });
      if (result?.fit) {
        setFitAnalysisCache((prev) => ({
          ...prev,
          [jobId]: {
            skillsMatch: result.fit.skillsMatch ?? result.fit.score ?? 50,
            experienceMatch: result.fit.experienceMatch ?? result.fit.score ?? 50,
            salaryMatch: result.fit.salaryMatch ?? 50,
            cultureMatch: result.fit.cultureMatch ?? 50,
            strengths: result.fit.strengths ?? [],
            gaps: result.fit.gaps ?? [],
            advice: result.fit.advice,
            skillsBreakdown: result.fit.skillsBreakdown,
          },
        }));
      }
    } catch {
      // silently fail — user can still click "Why this match?" manually
    } finally {
      setLoadingFitIds((prev) => { const next = new Set(prev); next.delete(jobId); return next; });
    }
  }, [userId, fitAnalysisCache, loadingFitIds]);

  const toggleSource = (source: Source) => {
    setSources((prev) =>
      prev.includes(source) ? prev.filter((s) => s !== source) : [...prev, source]
    );
  };

  const handleSaveManual = () => {
    if (!manualForm.title || !manualForm.company) return;
    saveManualMutation.mutate({
      title: manualForm.title,
      company: manualForm.company,
      location: manualForm.location || undefined,
      applyUrl: manualForm.applyUrl || undefined,
    });
  };

  if (!isLoaded) {
    return <div className="flex h-48 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-indigo-600" /></div>;
  }

  const jobResults = (searchQuery.data ?? []) as JobResult[];
  const jobIds = jobResults.map((j) => j.id);
  const indeedStatus = sessions.find((s) => s.provider === 'indeed');
  const gumtreeStatus = sessions.find((s) => s.provider === 'gumtree');

  const jobStatusQuery = api.jobs.getUserJobStatuses.useQuery(
    { userId, jobIds },
    { enabled: !!userId && jobIds.length > 0 }
  );
  const jobStatusMap = (jobStatusQuery.data ?? {}) as Record<string, string>;

  // Sync savedJobs from server query
  const serverSavedIds = useMemo(
    () => new Set((getSavedJobsQuery.data ?? []).map((j: { job: { id: string } }) => j.job.id)),
    [getSavedJobsQuery.data]
  );
  const effectiveSavedJobs = savedJobs.size > 0 ? savedJobs : serverSavedIds;

  const visibleJobs = useMemo(
    () => jobResults.filter((j) => j.fitScore >= minJobFitPercent),
    [jobResults, minJobFitPercent]
  );

  const handleToggleSave = (jobId: string) => {
    if (!userId) return;
    const isSaved = effectiveSavedJobs.has(jobId);
    if (isSaved) {
      setSavedJobs((prev) => { const next = new Set(prev); next.delete(jobId); return next; });
      unsaveJobMutation.mutate({ jobId });
    } else {
      setSavedJobs((prev) => new Set(prev).add(jobId));
      saveJobMutation.mutate({ jobId });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Jobs Discovery</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">AI-powered matching across Reed, Adzuna, Jooble, Indeed & Gumtree.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSessions((v) => !v)}
            className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
          >
            <Cookie className="h-4 w-4" />
            Sessions
            {sessions.filter((s) => s.isActive).length > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-white">
                {sessions.filter((s) => s.isActive).length}
              </span>
            )}
          </button>
          <button
            onClick={() => setShowManualModal(true)}
            className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
          >
            <Plus className="h-4 w-4" />
            Add Manual
          </button>
        </div>
      </div>

      {/* Session panels */}
      {showSessions && userId && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Provider sessions — Indeed &amp; Gumtree require your browser cookies</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <SessionPanel provider="indeed" status={indeedStatus} userId={userId} />
            <SessionPanel provider="gumtree" status={gumtreeStatus} userId={userId} />
          </div>
        </div>
      )}

      {/* Search Controls */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-4 dark:border-white/10 dark:bg-white/5">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Job title, skill, or keyword..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
              className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500"
            />
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-44 rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={searchQuery.isFetching}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {searchQuery.isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Search
          </button>
        </div>

        {/* Source toggles + date filter */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-slate-500 uppercase tracking-wider">Sources:</span>
          {ALL_SOURCES.map((source) => {
            const meta = SOURCE_META[source];
            const needsSession = meta.requiresSession;
            const hasSession = needsSession
              ? sessions.some((s) => s.provider === source && s.isActive)
              : true;
            return (
              <label key={source} className={`flex items-center gap-1.5 cursor-pointer ${needsSession && !hasSession ? 'opacity-50' : ''}`}>
                <input
                  type="checkbox"
                  checked={sources.includes(source)}
                  onChange={() => toggleSource(source)}
                  disabled={needsSession && !hasSession}
                  className="h-3.5 w-3.5 rounded border-white/20 bg-white/10 text-indigo-600 focus:ring-indigo-600 disabled:opacity-40"
                />
                <span className={`text-xs font-medium capitalize px-2 py-0.5 rounded-full ${meta.color}`}>
                  {meta.label}
                  {needsSession && !hasSession && (
                    <span className="ml-1 text-xs opacity-60" title="Connect this job board in Settings to enable job search here">⚠</span>
                  )}
                </span>
              </label>
            );
          })}

          {/* Date filter */}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-slate-500 uppercase tracking-wider">Posted:</span>
            <select
              value={maxDaysOld ?? ''}
              onChange={(e) => setMaxDaysOld(e.target.value ? Number(e.target.value) : undefined)}
              className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Any time</option>
              <option value="1">Today</option>
              <option value="3">Last 3 days</option>
              <option value="7">Last 7 days</option>
              <option value="14">Last 2 weeks</option>
              <option value="30">Last month</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Results</h2>
          {searchQuery.isError ? (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-400 sm:max-w-md">
              Search Failed — Please Try Again
            </p>
          ) : searchQuery.isFetching ? (
            <p className="flex items-center gap-2 text-xs text-slate-500">
              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-indigo-400" />
              Searching {sources.join(', ')}…
            </p>
          ) : jobResults.length > 0 ? (
            <p className="text-xs text-slate-500">
              Showing {visibleJobs.length} of {jobResults.length} listing{jobResults.length === 1 ? '' : 's'}
              {visibleJobs.length < jobResults.length ? ` (min fit ${minJobFitPercent}%)` : ''}
            </p>
          ) : searchParams !== null ? (
            <p className="text-xs text-slate-500">No Listings For This Search — Try Other Keywords Or Location</p>
          ) : (
            <p className="text-xs text-slate-500">
              {pendingJobsSearchAfterCv && profileQuery.isFetching
                ? 'Waiting For Profile After CV…'
                : pendingJobsSearchAfterCv
                  ? 'Preparing Search From Your CV…'
                  : profileQuery.isLoading
                    ? 'Loading Your Profile…'
                    : 'Placeholder Cards — Add Experience, Skills, Or Summary On Profile, Then Search'}
            </p>
          )}
        </div>

        {jobResults.length > 0 && visibleJobs.length === 0 && (
          <p className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
            Every listing is below your minimum fit. Lower the slider (here or on Profile) to see more roles.
          </p>
        )}

        <div className="space-y-5">
          {jobResults.length > 0
            ? visibleJobs.map((job) => {
              const isExpanded = expandedJobId === job.id;
              const isSaved = effectiveSavedJobs.has(job.id);

              const handleExpand = () => {
                setExpandedJobId(job.id);
                loadFitAnalysis(job.id);
              };

              return isExpanded ? (
                <JobCardExpanded
                  key={job.id}
                  job={job}
                  applicationStatus={jobStatusMap[job.id]}
                  isSaved={isSaved}
                  onToggleSave={() => handleToggleSave(job.id)}
                  onCollapse={() => setExpandedJobId(null)}
                  onExplain={() => setExplainJobId(job.id)}
                  fitAnalysis={fitAnalysisCache[job.id]}
                  fitLoading={loadingFitIds.has(job.id)}
                />
              ) : (
                <JobCardCompact
                  key={job.id}
                  job={job}
                  applicationStatus={jobStatusMap[job.id]}
                  isSaved={isSaved}
                  onToggleSave={() => handleToggleSave(job.id)}
                  onExpand={handleExpand}
                  onExplain={() => setExplainJobId(job.id)}
                  isExpanded={false}
                />
              );
            })
            : Array.from({ length: 6 }, (_, i) => (
              <div
                key={`job-placeholder-${i}`}
                className={`rounded-2xl border border-white/10 bg-white/5 h-48 ${
                  (searchQuery.isFetching || (pendingJobsSearchAfterCv && profileQuery.isFetching))
                    ? 'animate-pulse'
                    : ''
                }`}
              />
            ))}
        </div>
      </div>

      {/* Explain Fit Modal */}
      {explainJobId && (
        <ExplainFitModal
          jobId={explainJobId}
          userId={userId}
          onClose={() => setExplainJobId(null)}
        />
      )}

      {/* Manual Job Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#020617] p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white">Add Manual Job</h2>
            <div className="space-y-3">
              {[
                { label: 'Job Title *', key: 'title', placeholder: 'Senior Frontend Engineer', type: 'text' },
                { label: 'Company *', key: 'company', placeholder: 'Acme Ltd', type: 'text' },
                { label: 'Location', key: 'location', placeholder: 'London, UK', type: 'text' },
                { label: 'Apply URL', key: 'applyUrl', placeholder: 'https://jobs.example.com/123', type: 'url' },
              ].map(({ label, key, placeholder, type }) => (
                <div key={key}>
                  <label className="mb-1 block text-xs text-slate-400">{label}</label>
                  <input
                    type={type}
                    value={manualForm[key as keyof typeof manualForm]}
                    onChange={(e) => setManualForm({ ...manualForm, [key]: e.target.value })}
                    placeholder={placeholder}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              ))}
            </div>
            {saveManualMutation.isError && (
              <p className="text-sm text-red-400">{String(saveManualMutation.error)}</p>
            )}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowManualModal(false)}
                className="flex-1 rounded-xl border border-white/10 py-2 text-sm text-slate-400 transition hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveManual}
                disabled={saveManualMutation.isPending || !manualForm.title || !manualForm.company}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
              >
                {saveManualMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save Job
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
