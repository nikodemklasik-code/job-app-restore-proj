import { useMemo } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import type { ProfileSnapshot } from '../../../../shared/profile';
import {
  Activity,
  AlertTriangle,
  Bookmark,
  Briefcase,
  ExternalLink,
  Loader2,
  Radar,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  Target,
} from 'lucide-react';

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
  postedAt?: string;
  employerSignals?: {
    riskLevel: 'low' | 'medium' | 'high';
    trustLevel: 'verified' | 'likely_legit' | 'review' | 'risky';
    riskReasons: string[];
    trustReasons: string[];
  };
};

type JobsSearchResponse = { jobs: JobResult[] };

function normalizeJobsSearchData(data: unknown): JobsSearchResponse {
  if (Array.isArray(data)) return { jobs: data as JobResult[] };
  const maybe = data as Partial<JobsSearchResponse> | undefined;
  return { jobs: Array.isArray(maybe?.jobs) ? maybe.jobs : [] };
}

function deriveRadarQuery(profile: ProfileSnapshot | undefined): string {
  const target = profile?.careerGoals?.targetJobTitle?.trim();
  if (target) return target;
  const latestRole = profile?.experiences?.[0]?.jobTitle?.trim();
  if (latestRole) return latestRole;
  const skills = (profile?.skills ?? []).map((skill) => skill.trim()).filter(Boolean);
  if (skills.length > 0) return `${skills[0]} developer`;
  return '';
}

function formatSalary(job: JobResult): string {
  if (job.salaryMin && job.salaryMax) return `£${job.salaryMin.toLocaleString()}–£${job.salaryMax.toLocaleString()}`;
  if (job.salaryMin) return `From £${job.salaryMin.toLocaleString()}`;
  if (job.salaryMax) return `Up to £${job.salaryMax.toLocaleString()}`;
  return 'Salary not listed';
}

function radarReason(job: JobResult): string {
  if (job.fitScore >= 85) return 'High fit and ready for a deeper review.';
  if ((job.salaryMin ?? 0) > 0 || (job.salaryMax ?? 0) > 0) return 'Visible salary makes this lead easier to prioritise.';
  if (job.employerSignals?.riskLevel === 'high') return 'Relevant role, but risk signals need a sanity check first.';
  return 'Worth a first-pass screen before you commit time.';
}

function JobsSectionTabs() {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        to="/jobs"
        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10"
      >
        Jobs Search
      </Link>
      <Link
        to="/job-radar"
        className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition"
      >
        Job Radar
      </Link>
    </div>
  );
}

export default function JobRadar() {
  const { user } = useUser();
  const userId = user?.id;

  const profileQuery = api.profile.getProfile.useQuery(undefined, { enabled: !!userId, staleTime: 15_000 });
  const savedJobsQuery = api.jobs.getSavedJobs.useQuery(undefined, { enabled: !!userId });
  const recentScansQuery = api.jobRadar.getRecentScans.useQuery({ limit: 6 }, { enabled: !!userId });

  const profile = profileQuery.data as ProfileSnapshot | undefined;
  const derivedQuery = deriveRadarQuery(profile);

  const opportunitiesQuery = api.jobs.search.useQuery(
    {
      query: derivedQuery || 'software engineer',
      location: 'United Kingdom',
      sources: ['adzuna', 'cv-library', 'findajob', 'jooble', 'monster', 'reed', 'totaljobs'],
      userId: userId || undefined,
      limit: 8,
      maxDaysOld: 14,
    },
    {
      enabled: !!userId && !!derivedQuery,
      staleTime: 60_000,
    },
  );

  const searchData = normalizeJobsSearchData(opportunitiesQuery.data);
  const opportunities = searchData.jobs;

  const summary = useMemo(() => {
    const highFit = opportunities.filter((job) => job.fitScore >= 80).length;
    const riskSignals = opportunities.filter((job) => job.employerSignals?.riskLevel === 'high').length;
    const salaryVisible = opportunities.filter((job) => (job.salaryMin ?? 0) > 0 || (job.salaryMax ?? 0) > 0).length;
    return {
      highFit,
      riskSignals,
      salaryVisible,
      savedLeads: savedJobsQuery.data?.length ?? 0,
      recentScans: recentScansQuery.data?.length ?? 0,
    };
  }, [opportunities, recentScansQuery.data, savedJobsQuery.data]);

  const loading = profileQuery.isLoading || savedJobsQuery.isLoading || recentScansQuery.isLoading || opportunitiesQuery.isLoading;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-slate-900/40 to-indigo-900/20 p-6 md:p-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-200">
              <Radar className="h-3.5 w-3.5" />
              Jobs · Radar Mode
            </p>
            <h1 className="mt-3 text-3xl font-bold text-white md:text-4xl">Review The Strongest Leads Before They Eat Your Time</h1>
            <p className="mt-3 text-sm text-slate-300 md:text-base">
              Jobs Search is for breadth. Job Radar is for depth: fit signals, risk checks, saved leads, and recent scans that deserve a deeper look.
            </p>
          </div>
          <div className="space-y-3 xl:min-w-[340px]">
            <JobsSectionTabs />
            <div className="grid gap-3 sm:grid-cols-2">
              <Link to={derivedQuery ? `/jobs?q=${encodeURIComponent(derivedQuery)}&loc=${encodeURIComponent('United Kingdom')}` : '/jobs'} className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-50 transition hover:bg-cyan-500/15">
                <div className="flex items-center gap-2"><Search className="h-4 w-4" /> Back To Search</div>
                <p className="mt-1 text-xs font-normal text-cyan-100/80">{derivedQuery || 'Open Jobs and start searching.'}</p>
              </Link>
              <Link to="/jobs/saved" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                <div className="flex items-center gap-2"><Bookmark className="h-4 w-4" /> Saved Leads</div>
                <p className="mt-1 text-xs font-normal text-slate-400">Review saved jobs and start deep scans.</p>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          { label: 'High Fit Listings', value: summary.highFit, icon: Target },
          { label: 'Risk Signals', value: summary.riskSignals, icon: ShieldAlert },
          { label: 'Salary Visible', value: summary.salaryVisible, icon: Briefcase },
          { label: 'Saved Leads', value: summary.savedLeads, icon: Bookmark },
          { label: 'Recent Scans', value: summary.recentScans, icon: Activity },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500">{card.label}</p>
                  <p className="mt-3 text-4xl font-bold text-white">{card.value}</p>
                </div>
                <Icon className="h-5 w-5 text-cyan-300" />
              </div>
            </div>
          );
        })}
      </section>

      {loading ? (
        <div className="flex h-48 items-center justify-center rounded-3xl border border-white/10 bg-white/5">
          <Loader2 className="h-7 w-7 animate-spin text-cyan-300" />
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.8fr)_minmax(320px,0.9fr)]">
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-white">Opportunity Feed</h2>
                <p className="text-sm text-slate-500">Based on your profile role and recent fit signals.</p>
              </div>
              <Link to={derivedQuery ? `/jobs?q=${encodeURIComponent(derivedQuery)}&loc=${encodeURIComponent('United Kingdom')}` : '/jobs'} className="text-sm font-medium text-cyan-300 hover:text-cyan-200">
                Open Full Search
              </Link>
            </div>

            {derivedQuery && opportunities.length > 0 ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {opportunities.map((job) => (
                  <article key={job.id} className="flex h-full flex-col rounded-3xl border border-white/10 bg-white/5 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{job.title}</h3>
                        <p className="mt-1 text-sm text-slate-400">{job.company}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${job.fitScore >= 80 ? 'bg-emerald-500/15 text-emerald-200' : job.fitScore >= 60 ? 'bg-amber-500/15 text-amber-200' : 'bg-rose-500/15 text-rose-200'}`}>
                        Fit {job.fitScore}%
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
                      <span className="rounded-full bg-white/8 px-3 py-1">{job.location || 'Location unavailable'}</span>
                      <span className="rounded-full bg-white/8 px-3 py-1">{job.workMode || 'Work mode unknown'}</span>
                      <span className="rounded-full bg-white/8 px-3 py-1">{formatSalary(job)}</span>
                    </div>
                    <div className="mt-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/8 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-cyan-200">Why This Is On Your Radar</p>
                      <p className="mt-1 text-sm text-slate-200">{radarReason(job)}</p>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-xl border border-white/10 bg-black/15 p-3">
                        <p className="text-slate-500">Trust Signal</p>
                        <p className="mt-1 font-semibold capitalize text-white">{job.employerSignals?.trustLevel?.replace('_', ' ') || 'Unknown'}</p>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-black/15 p-3">
                        <p className="text-slate-500">Risk Signal</p>
                        <p className="mt-1 font-semibold capitalize text-white">{job.employerSignals?.riskLevel || 'Unknown'}</p>
                      </div>
                    </div>
                    <div className="mt-auto pt-5">
                      <a href={job.applyUrl || '#'} target="_blank" rel="noreferrer" className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition ${job.applyUrl ? 'border-cyan-500/20 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/15' : 'pointer-events-none border-white/10 bg-white/5 text-slate-500'}`}>
                        <ExternalLink className="h-4 w-4" />
                        {job.applyUrl ? 'Open Listing' : 'No Apply Link'}
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] p-10 text-center">
                <p className="text-base font-semibold text-white">No active opportunity feed yet</p>
                <p className="mt-2 text-sm text-slate-500">Set a target role on Profile, then open Jobs Search to load live listings.</p>
              </div>
            )}
          </section>

          <aside className="space-y-4">
            <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-cyan-300" />
                <h2 className="text-lg font-semibold text-white">Recent Scans</h2>
              </div>
              <div className="mt-4 space-y-3">
                {(recentScansQuery.data ?? []).length === 0 ? (
                  <p className="text-sm text-slate-500">No scans yet. Start one from Jobs Search or Saved Leads.</p>
                ) : (
                  recentScansQuery.data?.map((scan) => (
                    <Link key={scan.scanId} to={`/jobs/radar/${scan.scanId}`} className="block rounded-2xl border border-white/10 bg-black/15 p-4 transition hover:bg-white/5">
                      <p className="text-sm font-semibold text-white">{scan.jobTitle}</p>
                      <p className="mt-1 text-xs text-slate-400">{scan.company}</p>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="capitalize">{scan.status.replace('_', ' ')}</span>
                        <span>{new Date(scan.startedAt).toLocaleDateString('en-GB')}</span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-300" />
                <h2 className="text-lg font-semibold text-white">Radar Guidance</h2>
              </div>
              <ul className="mt-4 space-y-3 text-sm text-slate-300">
                <li className="rounded-2xl border border-white/10 bg-black/15 p-3">Use Jobs Search for fast discovery. Use Job Radar when a listing is strong enough to deserve a deep scan.</li>
                <li className="rounded-2xl border border-white/10 bg-black/15 p-3">Prioritise high fit + new, then salary-visible roles, then suspicious listings that need review.</li>
                <li className="rounded-2xl border border-white/10 bg-black/15 p-3">Saved leads should not become a graveyard. Either scan them, apply, or remove them.</li>
              </ul>
            </section>

            <section className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-300" />
                <div>
                  <h2 className="text-sm font-semibold text-amber-100">What Job Radar Is Not</h2>
                  <p className="mt-1 text-sm text-amber-50/85">Not a plain job board. Not a skill trend toy. Not a dead admin table. It should point you toward action.</p>
                </div>
              </div>
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}
