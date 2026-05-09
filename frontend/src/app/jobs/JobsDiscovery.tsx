import { useCallback, useEffect, useMemo, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import toast from '@/lib/toast';
import { api } from '@/lib/api';
import {
  clearPendingCvJobsSearchMarker,
  hasPendingCvJobsSearchMarker,
} from '@/lib/jobsAfterCvSync';
import type { ProfileSnapshot } from '../../../../shared/profile';
import { Search, MapPin, Plus, Loader2, Cookie, CheckCircle2, XCircle, AlertCircle, ChevronDown, ChevronUp, Sparkles, Save, Check } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { MIN_JOB_FIT_LOCAL_KEY, readMinJobFitPercent } from '@/lib/jobMatchPreferences';
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

// Removed unused FitAnalysis type - defined in backend

type SessionStatus = { id: string; provider: string; isActive: boolean; sessionStatus?: 'active' | 'needs_refresh' | 'blocked' | 'expired'; lastTestedAt: Date | null; lastHealthReason?: string | null; updatedAt: Date };

type ProviderDiagnostic = {
  provider: string;
  label: string;
  status: 'ok' | 'empty' | 'missing_session' | 'expired' | 'blocked' | 'http_error' | 'error';
  message: string;
  count: number;
  durationMs: number | null;
  error?: string;
};

type JobsSearchResponse = { jobs: JobResult[]; providerDiagnostics?: ProviderDiagnostic[]; diagnostics?: unknown };

function normalizeJobsSearchData(data: unknown): JobsSearchResponse {
  if (Array.isArray(data)) return { jobs: data as JobResult[], providerDiagnostics: [] };
  const maybe = data as Partial<JobsSearchResponse> | undefined;
  return {
    jobs: Array.isArray(maybe?.jobs) ? maybe.jobs : [],
    providerDiagnostics: Array.isArray(maybe?.providerDiagnostics) ? maybe.providerDiagnostics : [],
    diagnostics: maybe?.diagnostics,
  };
}
type SessionProvider = 'indeed' | 'gumtree' | 'glassdoor' | 'linkedin';

function formatSessionTimestamp(value: Date | string | null | undefined): string {
  if (!value) return 'Not tested yet';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not tested yet';
  return date.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
}

// Alphabetically sorted providers
const ALL_SOURCES = ['adzuna', 'cv-library', 'findajob', 'glassdoor', 'gumtree', 'indeed', 'jooble', 'linkedin', 'monster', 'reed', 'totaljobs'] as const;
type Source = (typeof ALL_SOURCES)[number];

const SOURCE_META: Record<Source, { label: string; color: string; requiresSession: boolean; url: string; loginUrl?: string; cookieHelp?: string }> = {
  adzuna: { label: 'Adzuna', color: 'bg-amber-500/20 text-amber-400', requiresSession: false, url: '' },
  'cv-library': { label: 'CV-Library', color: 'bg-indigo-500/20 text-indigo-400', requiresSession: false, url: '' },
  findajob: { label: 'Find a Job', color: 'bg-teal-500/20 text-teal-400', requiresSession: false, url: '' },
  glassdoor: { label: 'Glassdoor', color: 'bg-emerald-500/20 text-emerald-400', requiresSession: true, url: 'https://www.glassdoor.co.uk', loginUrl: 'https://www.glassdoor.co.uk/index.htm', cookieHelp: 'Open Glassdoor, sign in (Google sign-in is OK), confirm https://www.glassdoor.co.uk/member/profile/accountSettings opens, then paste your Glassdoor Cookie header here.' },
  gumtree: { label: 'Gumtree', color: 'bg-green-500/20 text-green-400', requiresSession: true, url: 'https://www.gumtree.com/jobs', loginUrl: 'https://www.gumtree.com/login', cookieHelp: 'Open Gumtree, sign in, confirm your account area opens, then paste your Gumtree Cookie header here if the automatic wizard is blocked.' },
  indeed: { label: 'Indeed', color: 'bg-blue-500/20 text-blue-400', requiresSession: true, url: 'https://www.indeed.co.uk', loginUrl: 'https://secure.indeed.com/auth', cookieHelp: 'Open Indeed, sign in, confirm your account page opens, then paste your Indeed Cookie header here if the automatic wizard is blocked.' },
  jooble: { label: 'Jooble', color: 'bg-sky-500/20 text-sky-400', requiresSession: false, url: '' },
  linkedin: { label: 'LinkedIn', color: 'bg-cyan-500/20 text-cyan-400', requiresSession: true, url: 'https://www.linkedin.com', loginUrl: 'https://www.linkedin.com/', cookieHelp: 'Open LinkedIn, sign in (Google sign-in is OK if LinkedIn offers it on your account), confirm your feed opens, then paste your LinkedIn Cookie header here.' },
  monster: { label: 'Monster UK', color: 'bg-orange-500/20 text-orange-400', requiresSession: false, url: '' },
  reed: { label: 'Reed', color: 'bg-rose-500/20 text-rose-400', requiresSession: false, url: '' },
  totaljobs: { label: 'Totaljobs', color: 'bg-purple-500/20 text-purple-400', requiresSession: false, url: '' },
};

const SESSION_BOARD_TOOLTIP: Partial<Record<Source, string>> = {
  indeed:
    'Indeed needs a saved browser session. Click “Sessions” (cookie icon) above, expand Indeed, sign in with the secure wizard, then tick Indeed here again.',
  gumtree:
    'Gumtree needs a saved browser session. Click “Sessions”, expand Gumtree, complete the login wizard, then enable Gumtree here.',
  glassdoor:
    'Glassdoor needs a saved browser session. Click “Sessions”, expand Glassdoor, try Automatic login first, then use Cookie fallback only if blocked.',
  linkedin:
    'LinkedIn needs a saved browser session. Click “Sessions”, expand LinkedIn, try Automatic login first, then use Cookie fallback only if blocked.',
};


/** Build a search string from saved profile / CV data so Jobs can auto-load listings. */
function deriveJobSearchQueryFromProfile(profile: ProfileSnapshot | undefined): string {
  if (!profile) return '';
  const target = profile.careerGoals?.targetJobTitle?.trim();
  if (target) return target.slice(0, 120);
  const exp = profile.experiences?.[0];
  if (exp?.jobTitle?.trim()) return exp.jobTitle.trim().slice(0, 120);
  const skills = (profile.skills ?? []).filter((s) => s?.trim());
  if (skills.length > 0) return skills.slice(0, 5).join(' ').slice(0, 120);
  const summary = profile.personalInfo?.summary?.trim();
  if (summary) return summary.split(/\s+/).slice(0, 14).join(' ').slice(0, 120);
  return '';
}

function deriveSkillsBasedJobSearchQuery(profile: ProfileSnapshot | undefined): string {
  if (!profile) return '';
  const skills = (profile.skills ?? []).map((skill) => skill.trim()).filter(Boolean);
  const targetRole = profile.careerGoals?.targetJobTitle?.trim() || '';
  const latestRole = profile.experiences?.[0]?.jobTitle?.trim() || '';
  const role = targetRole || latestRole;

  // Build a focused query: role first, then top skills as keywords
  if (role && skills.length > 0) {
    // Use the role as primary, add top 2 skills for specificity
    return `${role} ${skills.slice(0, 2).join(' ')}`.trim().slice(0, 100);
  }
  if (role) return role.slice(0, 100);
  if (skills.length > 0) {
    // No role — use skills directly, prioritize technical ones
    const techSkills = skills.filter((s) =>
      /javascript|typescript|python|react|node|java|aws|azure|docker|sql|c#|go|rust|php|ruby|angular|vue/i.test(s),
    );
    const query = techSkills.length > 0
      ? `${techSkills[0]} developer`
      : skills.slice(0, 3).join(' ');
    return query.slice(0, 100);
  }
  return '';
}

// ── Job results grid: placeholder tiles (same shell as JobCard, empty content) ─

const JOB_CARD_PLACEHOLDER_COUNT = 6;

function JobCardPlaceholder({ pulsing }: { pulsing?: boolean }) {
  return (
    <div
      className={`flex flex-col gap-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5 ${pulsing ? 'animate-pulse' : ''
        } opacity-[0.55]`}
      aria-hidden
    >
      <div className="flex flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-white/10" />
          <div className="flex items-center gap-1.5">
            <div className="h-5 w-14 rounded-full bg-white/10" />
            <div className="h-5 w-16 rounded-full bg-white/10" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-4 max-w-[88%] rounded bg-white/10" />
          <div className="h-3 max-w-[55%] rounded bg-white/10" />
        </div>
        <div className="flex flex-wrap gap-2 pt-0.5">
          <div className="h-3 w-24 rounded bg-white/10" />
          <div className="h-3 w-20 rounded bg-white/10" />
          <div className="ml-auto h-4 w-14 rounded-full bg-white/10" />
        </div>
      </div>
      <div className="border-t border-white/5 px-5 py-2.5">
        <div className="h-3 w-36 rounded bg-white/10" />
      </div>
      <div className="mt-auto flex flex-col gap-2 px-5 pb-5 pt-2">
        <div className="h-9 rounded-xl bg-white/10" />
        <div className="h-9 rounded-xl bg-white/10" />
      </div>
    </div>
  );
}


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


function CookieCopyGuide() {
  const browsers = [
    { name: 'Chrome', shortcut: 'F12 → Network', hint: 'Right click request → Copy → Copy request headers' },
    { name: 'Edge', shortcut: 'F12 → Network', hint: 'Open Headers tab and copy only Cookie:' },
    { name: 'Safari', shortcut: 'Develop → Show Web Inspector', hint: 'Network → authenticated request → Request Headers' },
  ];

  return (
    <div className="space-y-2 rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-indigo-200">Visual cookie-copy guide</p>
      <div className="grid gap-2 sm:grid-cols-3">
        {browsers.map((browser) => (
          <div key={browser.name} className="rounded-lg border border-white/10 bg-slate-950/60 p-2">
            <div className="mb-2 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-400" />
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="ml-2 text-[10px] font-semibold text-white">{browser.name}</span>
            </div>
            <div className="rounded bg-black/40 p-2 font-mono text-[10px] text-slate-300">
              <div>{browser.shortcut}</div>
              <div className="mt-1 text-indigo-200">Cookie: provider_session=…;</div>
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-slate-400">{browser.hint}</p>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-slate-500">Copy only the Cookie header from the job-board domain after login. Do not paste Google account cookies.</p>
    </div>
  );
}

function ProviderDiagnosticsPanel({ diagnostics }: { diagnostics: ProviderDiagnostic[] }) {
  if (diagnostics.length === 0) return null;
  const visible = diagnostics.filter((diagnostic) => diagnostic.status !== 'ok' || diagnostic.count === 0);
  if (visible.length === 0) return null;

  const statusClass: Record<ProviderDiagnostic['status'], string> = {
    ok: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-100',
    empty: 'border-slate-500/25 bg-slate-500/10 text-slate-200',
    missing_session: 'border-amber-500/30 bg-amber-500/10 text-amber-100',
    expired: 'border-red-500/30 bg-red-500/10 text-red-100',
    blocked: 'border-orange-500/30 bg-orange-500/10 text-orange-100',
    http_error: 'border-red-500/30 bg-red-500/10 text-red-100',
    error: 'border-red-500/30 bg-red-500/10 text-red-100',
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-white">Provider diagnostics</h3>
          <p className="text-xs text-slate-500">Automatic search status per job board — no more silent empty results.</p>
        </div>
        <button type="button" onClick={() => window.dispatchEvent(new Event('multivohub:open-job-sessions'))} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5">
          Fix sessions
        </button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {visible.map((diagnostic) => (
          <div key={`${diagnostic.provider}-${diagnostic.status}-${diagnostic.message}`} className={`rounded-xl border px-3 py-2 text-xs ${statusClass[diagnostic.status]}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold">{diagnostic.label}</span>
              <span className="uppercase tracking-wide opacity-75">{diagnostic.status.replace('_', ' ')}</span>
            </div>
            <p className="mt-1 leading-relaxed opacity-90">{diagnostic.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Session setup panel — automatic login first, manual cookies fallback ─────

type LoginStep = 'idle' | 'enterCredentials' | 'awaitingCode' | 'success' | 'error';

function SessionPanel({ provider, status, userId }: {
  provider: SessionProvider;
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
  const [cookies, setCookies] = useState('');
  const utils = api.useUtils();
  const meta = SOURCE_META[provider];

  const startAutoLogin = api.jobSessions.startProviderLogin.useMutation({
    onSuccess: (data) => {
      if (data.error) { setMsg(data.error); setStep('error'); return; }
      if (data.requiresCode) {
        setCodeSentTo(data.codeSentTo ?? null);
        setStep('awaitingCode');
        return;
      }
      if (data.success || data.storageState) {
        setStep('success');
        setMsg('Automatic login captured provider cookies — verifying session now.');
        void utils.jobSessions.getStatus.invalidate();
        testMutation.mutate({ userId, provider });
        return;
      }
      setMsg('Automatic login did not finish. Use manual Cookie fallback below.');
      setStep('error');
    },
    onError: (error) => { setMsg(error.message || 'Automatic login failed. Use manual Cookie fallback below.'); setStep('error'); },
  });

  const submitAutoCode = api.jobSessions.submitProviderCode.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setStep('success');
        setMsg('Verification complete — provider cookies captured automatically.');
        void utils.jobSessions.getStatus.invalidate();
        testMutation.mutate({ userId, provider });
      } else {
        setMsg(data.error ?? 'Code rejected. Use manual Cookie fallback if this continues.');
        setStep('error');
      }
    },
    onError: (error) => { setMsg(error.message || 'Connection failed. Please try again or use manual Cookie fallback.'); setStep('error'); },
  });

  const testMutation = api.jobSessions.testSession.useMutation({
    onSuccess: () => { void utils.jobSessions.getStatus.invalidate(); },
  });

  const saveCookiesMutation = api.jobSessions.saveCookies.useMutation({
    onSuccess: () => {
      setCookies('');
      setStep('success');
      setMsg('Cookies saved — verifying the provider session now.');
      void utils.jobSessions.getStatus.invalidate();
      testMutation.mutate({ userId, provider });
    },
    onError: (error) => { setMsg(error.message || 'Could not save cookies. Please paste the full provider Cookie header and try again.'); setStep('error'); },
  });

  const removeMutation = api.jobSessions.remove.useMutation({
    onSuccess: () => { void utils.jobSessions.getStatus.invalidate(); setStep('idle'); },
  });

  const isLoading = startAutoLogin.isPending || submitAutoCode.isPending || saveCookiesMutation.isPending || testMutation.isPending;

  function handleStart() {
    setMsg('');
    startAutoLogin.mutate({ userId, provider, email, password: password || undefined });
  }

  function handleSaveCookies() {
    setMsg('');
    saveCookiesMutation.mutate({ userId, provider, cookies });
  }

  function handleCode() {
    setMsg('');
    submitAutoCode.mutate({ userId, provider, code });
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
            ? <span className="flex items-center gap-1 text-xs text-emerald-400"><CheckCircle2 className="h-3.5 w-3.5" />{status.sessionStatus === 'blocked' ? 'Blocked but saved' : 'Connected'}</span>
            : status
              ? <span className="flex items-center gap-1 text-xs text-amber-400"><AlertCircle className="h-3.5 w-3.5" />{status.sessionStatus === 'expired' ? 'Expired' : 'Needs refresh'}</span>
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
              <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-400">
                <p>Last tested: <span className="text-slate-200">{formatSessionTimestamp(status?.lastTestedAt)}</span></p>
                <p className="mt-1">Saved/updated: <span className="text-slate-200">{formatSessionTimestamp(status?.updatedAt)}</span></p>
                {status?.lastHealthReason && <p className="mt-1 text-slate-500">Health-check: {status.lastHealthReason}</p>}
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
              {msg && (
                <p className="text-xs text-slate-400">{msg}</p>
              )}
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
              <div className="space-y-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
                <p className="text-xs text-slate-400">
                  Recommended: automatic login first. The server signs in to {meta.label}, captures only the resulting provider cookies, encrypts them, and then the health-check keeps the session status updated. Manual Cookie paste is only a fallback when the provider blocks automation, CAPTCHA, OAuth, or 2FA.
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
                <button
                  onClick={handleStart}
                  disabled={!email || isLoading}
                  className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Connecting…</> : `Automatic login to ${meta.label}`}
                </button>
              </div>

              {/* Manual cookie fallback - only shown on error */}
              {step === 'error' && (
                <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Manual cookie fallback
                  </p>
                  <p className="text-xs text-slate-400">{meta.cookieHelp}</p>
                  <CookieCopyGuide />
                  <ol className="list-decimal space-y-1 pl-4 text-xs text-slate-500">
                    <li>
                      Open{' '}
                      <a href={meta.loginUrl ?? meta.url} target="_blank" rel="noopener noreferrer" className="text-indigo-300 underline underline-offset-2">
                        {meta.loginUrl ?? meta.url}
                      </a>{' '}
                      and sign in. Using Google is OK when the provider offers it.
                    </li>
                    <li>After login, copy only the Cookie request header from an authenticated {meta.label} page/request.</li>
                    <li>Paste provider cookies below. Do not paste Google account cookies; the backend rejects obvious Google-only cookies.</li>
                  </ol>
                  <textarea
                    placeholder={`${meta.label} Cookie header, e.g. ${provider === 'linkedin' ? 'li_at=...; JSESSIONID=...' : 'cookie_a=...; cookie_b=...'}`}
                    value={cookies}
                    onChange={(e) => setCookies(e.target.value)}
                    rows={4}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 font-mono"
                  />
                  <button
                    onClick={handleSaveCookies}
                    disabled={cookies.trim().length < 10 || isLoading}
                    className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Saving…</> : `Save ${meta.label} cookies`}
                  </button>
                  <p className="text-xs text-slate-600 text-center">If you logged in with Google, paste the resulting {meta.label} cookies from {meta.label} — not Google cookies.</p>
                </div>
              )}

              {msg && step === 'error' && (
                <p className="text-xs text-red-400 rounded-lg bg-red-500/10 px-3 py-2">{msg}</p>
              )}
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
  const navigate = useNavigate();
  const [urlSearchParams, setUrlSearchParams] = useSearchParams();

  // Initialize from URL params or state
  const [query, setQuery] = useState(() => urlSearchParams.get('q') || '');
  const [location, setLocation] = useState(() => urlSearchParams.get('loc') || 'United Kingdom');
  const [sources, setSources] = useState<Source[]>(() => {
    const sourcesParam = urlSearchParams.get('sources');
    // Default to all 11 providers (alphabetically sorted)
    return sourcesParam ? sourcesParam.split(',') as Source[] : ['adzuna', 'cv-library', 'findajob', 'glassdoor', 'gumtree', 'indeed', 'jooble', 'linkedin', 'monster', 'reed', 'totaljobs'];
  });
  const [maxDaysOld, setMaxDaysOld] = useState<number | undefined>(undefined);

  // searchParams is derived from URL - never null if URL has params
  const searchParams = useMemo(() => {
    const q = urlSearchParams.get('q');
    const loc = urlSearchParams.get('loc');
    const src = urlSearchParams.get('sources');

    if (!q) return null;

    return {
      query: q,
      location: loc || 'United Kingdom',
      sources: src ? src.split(',') : ['adzuna', 'cv-library', 'findajob', 'glassdoor', 'gumtree', 'indeed', 'jooble', 'linkedin', 'monster', 'reed', 'totaljobs'],
      maxDaysOld,
      userId: userId || undefined,
    };
  }, [urlSearchParams, maxDaysOld, userId]);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [manualForm, setManualForm] = useState({ title: '', company: '', location: '', applyUrl: '' });
  const [explainJobId, setExplainJobId] = useState<string | null>(null);
  /** After CV upload/import elsewhere: wait for profile refetch, then re-run profile-derived search. */
  const [pendingJobsSearchAfterCv, setPendingJobsSearchAfterCv] = useState(false);
  const [minJobFitPercent, setMinJobFitPercent] = useState(() => readMinJobFitPercent());
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

  // Fetch fit analysis for expanded job
  const expandedJobFitQuery = api.jobs.explainFit.useQuery(
    { userId, jobId: expandedJobId! },
    { enabled: !!userId && !!expandedJobId }
  );
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());

  // Load persisted saved jobs from backend and hydrate local Set
  const savedJobsQuery = api.jobs.getSavedJobs.useQuery(undefined, { enabled: !!userId });
  useEffect(() => {
    if (savedJobsQuery.data) {
      setSavedJobs(new Set(savedJobsQuery.data.map((j) => j.job.id)));
    }
  }, [savedJobsQuery.data]);

  const saveJobMutation = api.jobs.saveJob.useMutation();
  const unsaveJobMutation = api.jobs.unsaveJob.useMutation();
  const createApplicationMutation = api.applications.create.useMutation();
  const generateDocumentsMutation = api.applications.generateDocuments.useMutation();
  const startRadarScanMutation = api.jobRadar.startScan.useMutation();

  const handleToggleSave = (jobId: string) => {
    const isSaved = savedJobs.has(jobId);
    // Optimistic update
    setSavedJobs(prev => {
      const next = new Set(prev);
      if (isSaved) next.delete(jobId); else next.add(jobId);
      return next;
    });
    // Persist to backend
    if (isSaved) {
      unsaveJobMutation.mutate({ jobId }, {
        onError: () => setSavedJobs(prev => { const next = new Set(prev); next.add(jobId); return next; }),
      });
    } else {
      saveJobMutation.mutate({ jobId }, {
        onError: () => setSavedJobs(prev => { const next = new Set(prev); next.delete(jobId); return next; }),
      });
    }
  };

  const handleCreateDraft = (job: JobResult) => {
    if (!userId) {
      toast.error('Please sign in to create applications');
      return;
    }

    const toastId = toast.loading('Creating draft application...');

    createApplicationMutation.mutate(
      {
        userId,
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        notes: `Source: ${job.source}\nLocation: ${job.location}\nFit Score: ${job.fitScore}%`,
      },
      {
        onSuccess: (data) => {
          toast.success('Draft application created!', { id: toastId });
          navigate('/applications');
        },
        onError: (error) => {
          toast.error(`Failed to create draft: ${error.message}`, { id: toastId });
        },
      }
    );
  };

  const handleTailorResume = (job: JobResult) => {
    if (!userId) {
      toast.error('Please sign in to tailor resume');
      return;
    }

    const toastId = toast.loading('Creating draft and generating documents...');

    // First create the draft application
    createApplicationMutation.mutate(
      {
        userId,
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        notes: `Source: ${job.source}\nLocation: ${job.location}\nFit Score: ${job.fitScore}%`,
      },
      {
        onSuccess: (data) => {
          // Then generate documents for it
          generateDocumentsMutation.mutate(
            {
              userId,
              applicationId: data.id,
            },
            {
              onSuccess: () => {
                toast.success('Draft created and documents generated!', { id: toastId });
                navigate('/applications');
              },
              onError: (error) => {
                toast.error(`Draft created but document generation failed: ${error.message}`, { id: toastId });
                navigate('/applications');
              },
            }
          );
        },
        onError: (error) => {
          toast.error(`Failed to create draft: ${error.message}`, { id: toastId });
        },
      }
    );
  };

  const handleStartRadarScan = (job: JobResult) => {
    if (!userId) {
      toast.error('Please sign in to start Job Radar scan');
      return;
    }

    const toastId = toast.loading('Starting Job Radar scan...');

    // Validate applyUrl - only send if it's a valid URL
    let validApplyUrl: string | undefined = undefined;
    if (job.applyUrl) {
      try {
        new URL(job.applyUrl);
        validApplyUrl = job.applyUrl;
      } catch {
        // Invalid URL, leave as undefined
        console.warn('Invalid applyUrl, skipping:', job.applyUrl);
      }
    }

    startRadarScanMutation.mutate(
      {
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        location: job.location,
        description: job.description,
        salaryMin: job.salaryMin ?? undefined,
        salaryMax: job.salaryMax ?? undefined,
        applyUrl: validApplyUrl,
        scanTrigger: 'manual_search',
      },
      {
        onSuccess: (data) => {
          toast.success('Job Radar scan started!', { id: toastId });
          navigate(`/jobs/radar/${data.scanId}`);
        },
        onError: (error) => {
          toast.error(`Failed to start Job Radar scan: ${error.message}`, { id: toastId });
        },
      }
    );
  };

  // Load saved preferences
  const preferencesQuery = api.jobs.getJobPreferences.useQuery(
    undefined,
    { enabled: !!userId }
  );

  // Load preferences into state when available
  useEffect(() => {
    if (preferencesQuery.data) {
      if (preferencesQuery.data.lastQuery) setQuery(preferencesQuery.data.lastQuery);
      if (preferencesQuery.data.lastLocation) setLocation(preferencesQuery.data.lastLocation);
    }
  }, [preferencesQuery.data]);

  const savePreferencesMutation = api.jobs.saveJobPreferences.useMutation();

  useEffect(() => {
    const sync = () => setMinJobFitPercent(readMinJobFitPercent());
    window.addEventListener('storage', sync);
    window.addEventListener('mvh-min-fit-changed', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('mvh-min-fit-changed', sync);
    };
  }, []);

  const utils = api.useUtils();
  const startCvJobsFlow = useCallback(() => {
    setUrlSearchParams({});
    setPendingJobsSearchAfterCv(true);
    void utils.profile.getProfile.invalidate();
  }, [utils, setUrlSearchParams]);

  const profileQuery = api.profile.getProfile.useQuery(undefined, {
    enabled: !!userId,
    staleTime: 15_000,
  });

  const sessionQuery = api.jobSessions.getStatus.useQuery(
    { userId },
    { enabled: !!userId }
  );
  const sessions = (sessionQuery.data ?? []) as SessionStatus[];

  const searchQuery = api.jobs.search.useQuery(
    searchParams ?? { query: '', location: 'United Kingdom', sources: ['reed'] },
    { enabled: searchParams !== null }
  );

  const jobPreferencesQuery = api.jobs.getJobPreferences.useQuery(undefined, {
    enabled: !!userId,
  });

  const saveJobPreferencesMutation = api.jobs.saveJobPreferences.useMutation();

  // Load saved preferences on mount
  useEffect(() => {
    if (!userId || preferencesLoaded || !jobPreferencesQuery.data) return;
    const prefs = jobPreferencesQuery.data;
    if (prefs.lastQuery) {
      setQuery(prefs.lastQuery);
    }
    if (prefs.lastLocation) {
      setLocation(prefs.lastLocation);
    }
    setPreferencesLoaded(true);
  }, [userId, jobPreferencesQuery.data, preferencesLoaded]);

  const profileSearchFingerprint = useMemo(() => {
    const p = profileQuery.data as ProfileSnapshot | undefined;
    if (!p) return '';
    return JSON.stringify({
      jt: (p.experiences?.[0]?.jobTitle ?? '').slice(0, 80),
      sk: (p.skills ?? []).slice(0, 8).join('|'),
      sm: (p.personalInfo?.summary ?? '').slice(0, 120),
    });
  }, [profileQuery.data]);

  // CV upload/import: session marker (survives navigation) or same-tab custom event.
  useEffect(() => {
    if (!userId) return;
    if (!hasPendingCvJobsSearchMarker()) return;
    startCvJobsFlow();
  }, [userId, startCvJobsFlow]);

  useEffect(() => {
    if (!userId) return;
    const onCvSync = () => {
      startCvJobsFlow();
    };
    window.addEventListener('multivohub:cv-sync-jobs', onCvSync);
    return () => window.removeEventListener('multivohub:cv-sync-jobs', onCvSync);
  }, [userId, startCvJobsFlow]);

  // After profile/CV data exists, replace placeholder tiles with a real search (until the user runs Search manually).
  useEffect(() => {
    if (!userId || profileQuery.isLoading || profileQuery.isError) return;
    if (pendingJobsSearchAfterCv && profileQuery.isFetching) return;
    if (searchParams !== null) return;

    // If user has saved preferences, use those instead of deriving from profile
    if (preferencesQuery.data && preferencesQuery.data.lastQuery) {
      return; // User preferences already loaded, don't override
    }

    const profile = profileQuery.data as ProfileSnapshot | undefined;
    const q = deriveJobSearchQueryFromProfile(profile);
    if (!q.trim()) return;

    setQuery(q);
    // Update URL params to persist search results
    setUrlSearchParams({
      q,
      loc: location,
      sources: sources.join(','),
    });
  }, [
    userId,
    profileQuery.isLoading,
    profileQuery.isError,
    profileQuery.isFetching,
    profileSearchFingerprint,
    location,
    sources,
    searchParams,
    pendingJobsSearchAfterCv,
    preferencesQuery.data,
    setUrlSearchParams,
  ]);

  useEffect(() => {
    if (!pendingJobsSearchAfterCv) return;
    if (profileQuery.isFetching) return;
    const q = deriveJobSearchQueryFromProfile(profileQuery.data as ProfileSnapshot | undefined);
    if (!q.trim() && searchParams === null) {
      clearPendingCvJobsSearchMarker();
      setPendingJobsSearchAfterCv(false);
      return;
    }
    if (searchParams !== null && !searchQuery.isFetching) {
      clearPendingCvJobsSearchMarker();
      setPendingJobsSearchAfterCv(false);
    }
  }, [
    pendingJobsSearchAfterCv,
    profileQuery.isFetching,
    profileQuery.data,
    searchParams,
    searchQuery.isFetching,
  ]);

  const saveManualMutation = api.jobs.saveManual.useMutation({
    onSuccess: () => {
      setShowManualModal(false);
      setManualForm({ title: '', company: '', location: '', applyUrl: '' });
    },
  });

  const handleSearch = () => {
    // Save preferences when user searches
    if (userId) {
      saveJobPreferencesMutation.mutate({
        query,
        location,
      });
    }
    // Update URL params to persist search results
    setUrlSearchParams({
      q: query,
      loc: location,
      sources: sources.join(','),
    });
  };

  const handleClearSearch = () => {
    setUrlSearchParams({});
    setQuery('');
    setLocation('United Kingdom');
    setSources(['adzuna', 'cv-library', 'findajob', 'glassdoor', 'gumtree', 'indeed', 'jooble', 'linkedin', 'monster', 'reed', 'totaljobs']);
  };

  const handleSaveSearch = () => {
    if (userId) {
      savePreferencesMutation.mutate({ query, location });
    }
  };

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

  const searchData = normalizeJobsSearchData(searchQuery.data);
  const jobResults = searchData.jobs;
  const providerDiagnostics = searchData.providerDiagnostics ?? [];
  const visibleJobs = useMemo(
    () => jobResults.filter((j) => j.fitScore >= minJobFitPercent),
    [jobResults, minJobFitPercent],
  );
  const jobIds = visibleJobs.map((j) => j.id);
  const indeedStatus = sessions.find((s) => s.provider === 'indeed');
  const gumtreeStatus = sessions.find((s) => s.provider === 'gumtree');
  const glassdoorStatus = sessions.find((s) => s.provider === 'glassdoor');
  const linkedinStatus = sessions.find((s) => s.provider === 'linkedin');

  const usesSessionBoardInSearch = sources.some((source) => SOURCE_META[source].requiresSession);
  const sessionBoardGap = sources.some((source) => {
    if (!SOURCE_META[source].requiresSession) return false;
    return !sessions.find((session) => session.provider === source)?.isActive;
  });
  const sessionBoardsReady = usesSessionBoardInSearch && !sessionBoardGap;

  const jobStatusQuery = api.jobs.getUserJobStatuses.useQuery(
    { userId, jobIds },
    { enabled: !!userId && jobIds.length > 0 }
  );
  const jobStatusMap = (jobStatusQuery.data ?? {}) as Record<string, string>;

  useEffect(() => {
    const openSessions = () => setShowSessions(true);
    window.addEventListener('multivohub:open-job-sessions', openSessions);
    return () => window.removeEventListener('multivohub:open-job-sessions', openSessions);
  }, []);

  if (!isLoaded) {
    return <div className="flex h-48 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Jobs Discovery</h1>
          <p className="mt-1 text-slate-400">AI-powered matching across Reed, Adzuna, Jooble, Indeed & Gumtree.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowSessions((v) => !v)}
            title={
              sessionBoardGap
                ? 'Finish session setup so selected boards can search.'
                : sessionBoardsReady
                  ? 'Provider sessions are active for your current search sources.'
                  : 'Open provider sessions when you enable sources that require cookies.'
            }
            className={`flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium transition ${sessionBoardGap
              ? 'motion-safe:animate-session-warn border-red-900/70 bg-gradient-to-br from-red-950/90 to-orange-950/60 text-orange-50 motion-reduce:animate-none'
              : sessionBoardsReady
                ? 'motion-safe:animate-session-ok border-teal-900/80 bg-gradient-to-br from-emerald-950/95 to-teal-950/80 text-teal-50 motion-reduce:animate-none'
                : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
          >
            <Cookie className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
            Sessions
            {sessions.filter((s) => s.isActive).length > 0 && (
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[9px] font-bold text-white ring-1 ring-emerald-400/40">
                {sessions.filter((s) => s.isActive).length}
              </span>
            )}
          </button>
          <button
            onClick={() => setShowManualModal(true)}
            className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
          >
            <Plus className="h-4 w-4" />
            Add Manual
          </button>
        </div>
      </div>

      {pendingJobsSearchAfterCv && (
        <div className="flex items-center gap-3 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-3 text-sm text-indigo-100">
          <Loader2 className="h-5 w-5 shrink-0 animate-spin text-indigo-300" aria-hidden />
          <p>
            {profileQuery.isFetching
              ? 'Syncing your profile from your CV…'
              : searchQuery.isFetching
                ? 'Searching for jobs that match your updated profile…'
                : 'Starting job search from your CV…'}
          </p>
        </div>
      )}

      {/* Session panels */}
      {showSessions && userId && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Provider sessions — some job boards require saved browser cookies</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <SessionPanel provider="indeed" status={indeedStatus} userId={userId} />
            <SessionPanel provider="gumtree" status={gumtreeStatus} userId={userId} />
            <SessionPanel provider="glassdoor" status={glassdoorStatus} userId={userId} />
            <SessionPanel provider="linkedin" status={linkedinStatus} userId={userId} />
          </div>
        </div>
      )}

      {/* Search Controls */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Job title, skill, or keyword..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
              className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-44 rounded-xl border border-white/10 bg-white/5 pl-9 pr-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
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
          <button
            onClick={() => {
              const profile = profileQuery.data as ProfileSnapshot | undefined;
              const skillsQuery = deriveSkillsBasedJobSearchQuery(profile);
              if (skillsQuery.trim()) {
                setQuery(skillsQuery);
                setUrlSearchParams({
                  q: skillsQuery,
                  loc: location,
                  sources: sources.join(','),
                });
              }
            }}
            disabled={searchQuery.isFetching || !profileQuery.data?.skills?.length}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
            title="Search jobs by combining your target role, latest role, and top profile skills"
          >
            <Sparkles className="h-4 w-4" />
            Search by Skills
          </button>
          {searchParams && (
            <button
              onClick={handleClearSearch}
              className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500/20"
              title="Clear search results"
            >
              <XCircle className="h-4 w-4" />
              Clear
            </button>
          )}
          {userId && (
            <button
              onClick={handleSaveSearch}
              disabled={savePreferencesMutation.isPending}
              className="flex items-center gap-2 rounded-xl border border-emerald-600/50 bg-emerald-600/10 px-4 py-2 text-sm font-semibold text-emerald-400 transition hover:bg-emerald-600/20 disabled:opacity-60"
              title="Save this search for next time"
            >
              {savePreferencesMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : savePreferencesMutation.isSuccess ? (
                <Check className="h-4 w-4" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {savePreferencesMutation.isSuccess ? 'Saved!' : 'Save'}
            </button>
          )}
        </div>

        {/* Source toggles */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-slate-500 uppercase tracking-wider">Sources:</span>
          {ALL_SOURCES.map((source) => {
            const meta = SOURCE_META[source];
            const needsSession = meta.requiresSession;
            const hasSession = needsSession
              ? sessions.some((s) => s.provider === source && s.isActive)
              : true;
            const sessionTip = SESSION_BOARD_TOOLTIP[source];
            return (
              <label
                key={source}
                title={sessionTip}
                className={`flex items-center gap-1.5 cursor-pointer ${sessionTip ? 'cursor-help' : ''} ${needsSession && !hasSession ? 'opacity-50' : ''}`}
              >
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
                    <span
                      className="ml-1 text-xs opacity-60"
                      title={
                        sessionTip ??
                        'Connect this job board via Sessions (cookie button), then enable it here.'
                      }
                    >
                      ⚠
                    </span>
                  )}
                </span>
              </label>
            );
          })}
        </div>

        {/* Date filter */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 uppercase tracking-wider">Posted:</span>
          <select
            value={maxDaysOld ?? ''}
            onChange={(e) => setMaxDaysOld(e.target.value ? Number(e.target.value) : undefined)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
          >
            <option value="">Any time</option>
            <option value="1">Today</option>
            <option value="7">Last 7 days</option>
            <option value="14">Last 14 days</option>
            <option value="30">Last 30 days</option>
          </select>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="jobs-min-fit" className="text-xs font-medium text-slate-300">
              Minimum fit score: {minJobFitPercent}%
            </label>
            <Link to="/profile" className="text-[10px] text-indigo-400 hover:text-indigo-300">
              Same slider on Profile
            </Link>
          </div>
          <input
            id="jobs-min-fit"
            type="range"
            min={0}
            max={100}
            step={5}
            value={minJobFitPercent}
            onChange={(e) => {
              const n = Number(e.target.value);
              setMinJobFitPercent(n);
              window.localStorage.setItem(MIN_JOB_FIT_LOCAL_KEY, String(n));
              window.dispatchEvent(new Event('mvh-min-fit-changed'));
            }}
            className="w-full accent-indigo-500"
          />
          <p className="text-[10px] text-slate-500">Listings below this threshold are hidden. Matches the value stored under {MIN_JOB_FIT_LOCAL_KEY}.</p>
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
                : pendingJobsSearchAfterCv && deriveJobSearchQueryFromProfile(profileQuery.data as ProfileSnapshot | undefined)
                  ? 'Preparing Search From Your CV…'
                  : profileQuery.isLoading
                    ? 'Loading Your Profile…'
                    : deriveJobSearchQueryFromProfile(profileQuery.data as ProfileSnapshot | undefined)
                      ? 'Searching From Your Profile…'
                      : pendingJobsSearchAfterCv
                        ? 'CV Synced — Add A Job Title Or Skills On Your Profile, Then Search'
                        : 'Placeholder Cards — Add Experience, Skills, Or Summary On Profile, Then Search'}
            </p>
          )}
        </div>

        <ProviderDiagnosticsPanel diagnostics={providerDiagnostics} />

        {jobResults.length > 0 && visibleJobs.length === 0 && (
          <p className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
            Every listing is below your minimum fit. Lower the slider (here or on Profile) to see more roles.
          </p>
        )}

        <div className="space-y-5">
          {jobResults.length > 0
            ? visibleJobs.map((job) => {
              const isExpanded = expandedJobId === job.id;
              const isSaved = savedJobs.has(job.id);

              return isExpanded ? (
                <JobCardExpanded
                  key={job.id}
                  job={job}
                  applicationStatus={jobStatusMap[job.id]}
                  isSaved={isSaved}
                  onToggleSave={() => handleToggleSave(job.id)}
                  onCollapse={() => setExpandedJobId(null)}
                  onCreateDraft={() => handleCreateDraft(job)}
                  onTailorResume={() => handleTailorResume(job)}
                  onStartRadarScan={() => handleStartRadarScan(job)}
                  isCreatingDraft={createApplicationMutation.isPending}
                  isTailoringResume={generateDocumentsMutation.isPending}
                  isStartingRadarScan={startRadarScanMutation.isPending}
                  fitAnalysis={expandedJobFitQuery.data?.fit.breakdown ? {
                    skillsMatch: expandedJobFitQuery.data.fit.breakdown.skillsMatch,
                    experienceMatch: expandedJobFitQuery.data.fit.breakdown.experienceMatch,
                    salaryMatch: expandedJobFitQuery.data.fit.breakdown.salaryMatch,
                    cultureMatch: expandedJobFitQuery.data.fit.breakdown.cultureMatch,
                    strengths: expandedJobFitQuery.data.fit.strengths,
                    gaps: expandedJobFitQuery.data.fit.gaps,
                    extractedRequirements: expandedJobFitQuery.data.fit.extractedRequirements,
                  } : undefined}
                />
              ) : (
                <JobCardCompact
                  key={job.id}
                  job={job}
                  applicationStatus={jobStatusMap[job.id]}
                  isSaved={isSaved}
                  onToggleSave={() => handleToggleSave(job.id)}
                  onExpand={() => setExpandedJobId(job.id)}
                  onCreateDraft={() => handleCreateDraft(job)}
                  isExpanded={false}
                  isCreatingDraft={createApplicationMutation.isPending}
                  onFitScoreClick={() => setExplainJobId(job.id)}
                />
              );
            })
            : Array.from({ length: JOB_CARD_PLACEHOLDER_COUNT }, (_, i) => (
              <JobCardPlaceholder
                key={`job-placeholder-${i}`}
                pulsing={searchQuery.isFetching || (pendingJobsSearchAfterCv && profileQuery.isFetching)}
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
