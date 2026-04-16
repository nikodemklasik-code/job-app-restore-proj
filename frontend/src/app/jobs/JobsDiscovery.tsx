import { useCallback, useEffect, useMemo, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { api } from '@/lib/api';
import {
  clearPendingCvJobsSearchMarker,
  hasPendingCvJobsSearchMarker,
} from '@/lib/jobsAfterCvSync';
import type { ProfileSnapshot } from '../../../../shared/profile';
import { Search, MapPin, DollarSign, Plus, ExternalLink, Loader2, Cookie, CheckCircle2, XCircle, AlertCircle, ChevronDown, ChevronUp, Sparkles, Wifi, BookOpen, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

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
    confidenceScore: number;
    level: 'low' | 'medium' | 'high';
    safeForAutomation: boolean;
    reasons: string[];
  };
};

type SessionStatus = { id: string; provider: string; isActive: boolean; lastTestedAt: Date | null; updatedAt: Date };

const ALL_SOURCES = ['reed', 'adzuna', 'jooble', 'indeed', 'gumtree'] as const;
type Source = (typeof ALL_SOURCES)[number];

const SOURCE_META: Record<Source, { label: string; color: string; requiresSession: boolean; url: string }> = {
  reed: { label: 'Reed', color: 'bg-rose-500/20 text-rose-400', requiresSession: false, url: '' },
  adzuna: { label: 'Adzuna', color: 'bg-amber-500/20 text-amber-400', requiresSession: false, url: '' },
  jooble: { label: 'Jooble', color: 'bg-sky-500/20 text-sky-400', requiresSession: false, url: '' },
  indeed: { label: 'Indeed', color: 'bg-blue-500/20 text-blue-400', requiresSession: true, url: 'https://www.indeed.co.uk' },
  gumtree: { label: 'Gumtree', color: 'bg-green-500/20 text-green-400', requiresSession: true, url: 'https://www.gumtree.com/jobs' },
};


/** Build a search string from saved profile / CV data so Jobs can auto-load listings. */
function deriveJobSearchQueryFromProfile(profile: ProfileSnapshot | undefined): string {
  if (!profile) return '';
  const exp = profile.experiences?.[0];
  if (exp?.jobTitle?.trim()) return exp.jobTitle.trim().slice(0, 120);
  const skills = (profile.skills ?? []).filter((s) => s?.trim());
  if (skills.length > 0) return skills.slice(0, 5).join(' ').slice(0, 120);
  const summary = profile.personalInfo?.summary?.trim();
  if (summary) return summary.split(/\s+/).slice(0, 14).join(' ').slice(0, 120);
  return '';
}

function formatSalary(min: number | null, max: number | null): string | null {
  if (!min && !max) return null;
  if (min && max) return `£${Math.round(min / 1000)}k–£${Math.round(max / 1000)}k`;
  if (min) return `£${Math.round(min / 1000)}k+`;
  return `up to £${Math.round((max ?? 0) / 1000)}k`;
}

function fitBadgeClass(score: number): string {
  if (score >= 80) return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
  if (score >= 60) return 'border-amber-500/30 bg-amber-500/10 text-amber-300';
  return 'border-red-500/30 bg-red-500/10 text-red-300';
}

// ── Application status badge ──────────────────────────────────────────────────

const STATUS_META: Record<string, { label: string; color: string }> = {
  draft:            { label: 'Draft',          color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
  prepared:         { label: 'Prepared',       color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  sent:             { label: 'Applied',        color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
  follow_up_sent:   { label: 'Follow-up sent', color: 'bg-violet-500/20 text-violet-400 border-violet-500/30' },
  interview:        { label: 'Interview',      color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  accepted:         { label: 'Offer',          color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  rejected:         { label: 'Rejected',       color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  expired:          { label: 'Expired',        color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  closed:           { label: 'Closed',         color: 'bg-slate-600/20 text-slate-500 border-slate-600/30' },
  archived:         { label: 'Archived',       color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30' },
  unavailable:      { label: 'Unavailable',    color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
};

function ApplicationStatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { label: status, color: 'bg-white/10 text-slate-400 border-white/10' };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${meta.color}`}>
      {meta.label}
    </span>
  );
}

// ── Company profile card ───────────────────────────────────────────────────────

function CompanyCard({ companyName, jobTitle }: { companyName: string; jobTitle: string }) {
  const query = api.jobs.getCompanyProfile.useQuery(
    { companyName, jobTitle },
    { enabled: !!companyName }
  );

  if (query.isLoading) {
    return (
      <div className="flex items-center gap-2 py-2 text-xs text-slate-500">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Loading company profile…
      </div>
    );
  }

  const profile = query.data;
  if (!profile) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2 text-xs">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-white">{companyName}</span>
        <div className="flex gap-1.5">
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-slate-400">{profile.industry}</span>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-slate-400">{profile.size}</span>
        </div>
      </div>
      <p className="text-slate-400 leading-relaxed">{profile.culture}</p>
      <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400 mb-1">Interview style</p>
        <p className="text-slate-300 leading-relaxed">{profile.interviewStyle}</p>
      </div>
    </div>
  );
}

// ── Job results grid: placeholder tiles (same shell as JobCard, empty content) ─

const JOB_CARD_PLACEHOLDER_COUNT = 6;

function JobCardPlaceholder({ pulsing }: { pulsing?: boolean }) {
  return (
    <div
      className={`flex flex-col gap-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5 ${
        pulsing ? 'animate-pulse' : ''
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

// ── Job card component ────────────────────────────────────────────────────────

function JobCard({
  job,
  applicationStatus,
  userId,
  onExplainFit,
}: {
  job: JobResult;
  applicationStatus?: string;
  userId: string;
  onExplainFit: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showCompany, setShowCompany] = useState(false);
  const salary = formatSalary(job.salaryMin, job.salaryMax);
  const srcMeta = SOURCE_META[job.source as Source];
  const scam = job.scamAnalysis;
  const requirements: string[] = job.requirements ?? [];

  const postedDate = job.postedAt
    ? (() => {
        const d = new Date(job.postedAt);
        const diffDays = Math.floor((Date.now() - d.getTime()) / 86400000);
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      })()
    : null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 flex flex-col gap-0 transition hover:border-white/20 hover:bg-white/[0.07] overflow-hidden">
      {/* Card header */}
      <div className="p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-lg font-bold text-slate-300">
            {job.company.charAt(0).toUpperCase()}
          </div>
          <div className="flex items-center gap-1.5">
            {applicationStatus && <ApplicationStatusBadge status={applicationStatus} />}
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${fitBadgeClass(job.fitScore)}`}>
              {job.fitScore}% fit
            </span>
            {scam && (
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${scam.level === 'low' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : scam.level === 'medium' ? 'border-amber-500/30 bg-amber-500/10 text-amber-300' : 'border-red-500/30 bg-red-500/10 text-red-300'}`}>
                Risk {scam.riskScore}%
              </span>
            )}
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-white leading-tight">{job.title}</h3>
          <button
            onClick={() => setShowCompany((v) => !v)}
            className="flex items-center gap-1 mt-0.5 text-sm text-slate-400 hover:text-slate-200 transition"
          >
            {job.company}
            <ChevronRight className={`h-3 w-3 transition-transform ${showCompany ? 'rotate-90' : ''}`} />
          </button>
        </div>

        {scam && scam.level !== 'low' && (
          <span className={`inline-flex w-fit items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${scam.level === 'high' ? 'border-red-500/40 bg-red-500/15 text-red-300' : 'border-amber-500/40 bg-amber-500/15 text-amber-400'}`}>
            {scam.level === 'high' ? 'Blocked by scam protection' : 'Manual review recommended'}
          </span>
        )}

        {/* Company card (lazy) */}
        {showCompany && (
          <CompanyCard companyName={job.company} jobTitle={job.title} />
        )}

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          {job.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {job.location}
            </span>
          )}
          {salary && (
            <span className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {salary}
            </span>
          )}
          {job.workMode && (
            <span className="flex items-center gap-1 rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-medium capitalize text-slate-400">
              <Wifi className="h-3 w-3" />
              {job.workMode}
            </span>
          )}
          {postedDate && (
            <span className="text-slate-500">{postedDate}</span>
          )}
          <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium ${srcMeta?.color ?? 'bg-white/10 text-slate-400'}`}>
            {srcMeta?.label ?? job.source}
          </span>
        </div>
      </div>

      {/* Expandable skills section */}
      <div className="border-t border-white/5">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-2.5 text-xs text-slate-400 hover:text-white hover:bg-white/5 transition"
        >
          <span className="font-medium">
            {requirements.length > 0 ? `${requirements.length} required skills` : 'Skills & requirements'}
          </span>
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>

        {expanded && (
          <div className="px-5 pb-4 space-y-3">
            {requirements.length > 0 ? (
              <>
                <div className="flex flex-wrap gap-1.5">
                  {requirements.map((req, i) => (
                    <span
                      key={i}
                      className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] font-medium text-slate-300"
                    >
                      {req}
                    </span>
                  ))}
                </div>
                <Link
                  to="/skills"
                  className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition w-fit"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  Learn these skills in Skills Lab →
                </Link>
              </>
            ) : (
              <div className="text-xs text-slate-500 space-y-1.5">
                <p>No requirements extracted yet.</p>
                <button
                  onClick={() => onExplainFit(job.id)}
                  className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition"
                  disabled={!userId}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Analyse fit to extract requirements
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-5 pb-5 pt-2 mt-auto flex flex-col gap-2">
        <button
          onClick={() => onExplainFit(job.id)}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 py-2 text-xs font-medium text-indigo-400 transition hover:bg-indigo-500/20"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Why this match?
        </button>
        {job.applyUrl && (
          <a
            href={job.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            Apply
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
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
  const [searchParams, setSearchParams] = useState<{
    query: string;
    location: string;
    sources: string[];
    userId?: string;
  } | null>(null);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [manualForm, setManualForm] = useState({ title: '', company: '', location: '', applyUrl: '' });
  const [explainJobId, setExplainJobId] = useState<string | null>(null);
  /** After CV upload/import elsewhere: wait for profile refetch, then re-run profile-derived search. */
  const [pendingJobsSearchAfterCv, setPendingJobsSearchAfterCv] = useState(false);

  const utils = api.useUtils();
  const startCvJobsFlow = useCallback(() => {
    setSearchParams(null);
    setPendingJobsSearchAfterCv(true);
    void utils.profile.getProfile.invalidate();
  }, [utils]);

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
    const profile = profileQuery.data as ProfileSnapshot | undefined;
    const q = deriveJobSearchQueryFromProfile(profile);
    if (!q.trim()) return;

    setQuery(q);
    setSearchParams({
      query: q,
      location,
      sources: [...sources],
      userId: userId || undefined,
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
    setSearchParams({ query, location, sources: [...sources], userId: userId || undefined });
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
            onClick={() => setShowSessions((v) => !v)}
            className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10"
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
          <p className="text-xs text-slate-500 uppercase tracking-wider">Provider sessions — Indeed &amp; Gumtree require your browser cookies</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <SessionPanel provider="indeed" status={indeedStatus} userId={userId} />
            <SessionPanel provider="gumtree" status={gumtreeStatus} userId={userId} />
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
              {jobResults.length} listing{jobResults.length === 1 ? '' : 's'}
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

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {jobResults.length > 0
            ? jobResults.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  applicationStatus={jobStatusMap[job.id]}
                  userId={userId}
                  onExplainFit={setExplainJobId}
                />
              ))
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
