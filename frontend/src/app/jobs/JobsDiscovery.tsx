import { useEffect, useMemo, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api';
import toast from '@/lib/toast';
import type { ProfileSnapshot } from '../../../../shared/profile';
import {
  AlertCircle,
  Bookmark,
  BookmarkCheck,
  Briefcase,
  ExternalLink,
  Loader2,
  MapPin,
  Radar,
  Search,
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
  description?: string;
  postedAt?: string;
  employerSignals?: {
    riskLevel: 'low' | 'medium' | 'high';
    trustLevel: 'verified' | 'likely_legit' | 'review' | 'risky';
    trustReasons: string[];
    riskReasons: string[];
  };
};

type ProviderDiagnostic = {
  provider: string;
  label: string;
  status: 'ok' | 'empty' | 'missing_session' | 'expired' | 'blocked' | 'http_error' | 'error';
  message: string;
  count: number;
  durationMs: number | null;
  error?: string;
};

type JobsSearchResponse = {
  jobs: JobResult[];
  providerDiagnostics?: ProviderDiagnostic[];
};

const DEFAULT_LOCATION = 'United Kingdom';
const DEFAULT_SOURCES = ['adzuna', 'cv-library', 'findajob', 'glassdoor', 'gumtree', 'indeed', 'jooble', 'linkedin', 'monster', 'reed', 'totaljobs'] as const;
type Source = (typeof DEFAULT_SOURCES)[number];

const SOURCE_META: Record<Source, { label: string; requiresSession: boolean }> = {
  adzuna: { label: 'Adzuna', requiresSession: false },
  'cv-library': { label: 'CV-Library', requiresSession: false },
  findajob: { label: 'Find a Job', requiresSession: false },
  glassdoor: { label: 'Glassdoor', requiresSession: true },
  gumtree: { label: 'Gumtree', requiresSession: true },
  indeed: { label: 'Indeed', requiresSession: true },
  jooble: { label: 'Jooble', requiresSession: false },
  linkedin: { label: 'LinkedIn', requiresSession: true },
  monster: { label: 'Monster UK', requiresSession: false },
  reed: { label: 'Reed', requiresSession: false },
  totaljobs: { label: 'Totaljobs', requiresSession: false },
};

function normalizeJobsSearchData(data: unknown): JobsSearchResponse {
  if (Array.isArray(data)) return { jobs: data as JobResult[], providerDiagnostics: [] };
  const maybe = data as Partial<JobsSearchResponse> | undefined;
  return {
    jobs: Array.isArray(maybe?.jobs) ? maybe.jobs : [],
    providerDiagnostics: Array.isArray(maybe?.providerDiagnostics) ? maybe.providerDiagnostics : [],
  };
}

function deriveDreamRole(profile: ProfileSnapshot | undefined): string {
  const target = profile?.careerGoals?.targetJobTitle?.trim();
  if (target) return target;
  return profile?.experiences?.[0]?.jobTitle?.trim() ?? '';
}

function deriveAiQuery(profile: ProfileSnapshot | undefined): string {
  if (!profile) return '';
  const role = deriveDreamRole(profile);
  const skills = (profile.skills ?? []).map((skill) => skill.trim()).filter(Boolean);
  if (role && skills.length > 0) return `${role} ${skills.slice(0, 2).join(' ')}`.trim();
  if (role) return role;
  if (skills.length > 0) return `${skills[0]} developer`;
  return '';
}

function formatSalary(job: JobResult): string {
  if (job.salaryMin && job.salaryMax) return `£${job.salaryMin.toLocaleString()}–£${job.salaryMax.toLocaleString()}`;
  if (job.salaryMin) return `From £${job.salaryMin.toLocaleString()}`;
  if (job.salaryMax) return `Up to £${job.salaryMax.toLocaleString()}`;
  return 'Salary not listed';
}

function formatPostedAt(postedAt?: string): string {
  if (!postedAt) return 'Date unavailable';
  const date = new Date(postedAt);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function buildRadarReason(job: JobResult): string {
  if (job.fitScore >= 85) return 'Strong match for your target role and current profile.';
  if (job.salaryMin || job.salaryMax) return 'Visible salary gives you a faster go / no-go decision.';
  if (job.employerSignals?.riskLevel === 'high') return 'Relevant listing, but risk signals need review before you spend time.';
  return 'Relevant role worth screening before you open a deeper review.';
}

function ProviderDiagnosticsPanel({ diagnostics }: { diagnostics: ProviderDiagnostic[] }) {
  const visible = diagnostics.filter((diagnostic) => diagnostic.status !== 'ok' || diagnostic.count === 0);
  if (visible.length === 0) return null;

  const toneClass: Record<ProviderDiagnostic['status'], string> = {
    ok: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100',
    empty: 'border-slate-500/20 bg-slate-500/10 text-slate-200',
    missing_session: 'border-amber-500/20 bg-amber-500/10 text-amber-100',
    expired: 'border-red-500/20 bg-red-500/10 text-red-100',
    blocked: 'border-orange-500/20 bg-orange-500/10 text-orange-100',
    http_error: 'border-red-500/20 bg-red-500/10 text-red-100',
    error: 'border-red-500/20 bg-red-500/10 text-red-100',
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-4 w-4 text-amber-300" />
        <div>
          <h3 className="text-sm font-semibold text-white">Search Diagnostics</h3>
          <p className="text-xs text-slate-500">Some providers returned nothing or need session repair.</p>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((diagnostic) => (
          <div key={`${diagnostic.provider}-${diagnostic.status}`} className={`rounded-xl border px-3 py-2 text-xs ${toneClass[diagnostic.status]}`}>
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

function JobsSectionTabs() {
  return (
    <div className="flex flex-wrap gap-2">
      <span className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-950">Jobs Search</span>
      <Link to="/job-radar" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10">
        Job Radar
      </Link>
    </div>
  );
}

export default function JobsDiscovery() {
  const { user, isLoaded } = useUser();
  const userId = user?.id;
  const navigate = useNavigate();
  const [urlSearchParams, setUrlSearchParams] = useSearchParams();

  const [query, setQuery] = useState(() => urlSearchParams.get('q') ?? '');
  const [location, setLocation] = useState(() => urlSearchParams.get('loc') ?? DEFAULT_LOCATION);
  const [days, setDays] = useState(() => urlSearchParams.get('days') ?? '');
  const [sources, setSources] = useState<Source[]>(() => {
    const raw = (urlSearchParams.get('sources') ?? '').split(',').filter(Boolean);
    const valid = raw.filter((item): item is Source => (DEFAULT_SOURCES as readonly string[]).includes(item));
    return valid.length > 0 ? valid : [...DEFAULT_SOURCES];
  });

  const profileQuery = api.profile.getProfile.useQuery(undefined, { enabled: !!userId, staleTime: 15_000 });
  const savedJobsQuery = api.jobs.getSavedJobs.useQuery(undefined, { enabled: !!userId });
  const sessionsQuery = api.jobSessions.getStatus.useQuery({ userId: userId ?? '' }, { enabled: !!userId });

  const sessionProviders = useMemo(() => new Set((sessionsQuery.data ?? []).filter((session) => session.isActive).map((session) => session.provider)), [sessionsQuery.data]);
  const selectedSessionGap = sources.some((source) => SOURCE_META[source].requiresSession && !sessionProviders.has(source));

  const searchParams = useMemo(() => {
    const q = urlSearchParams.get('q')?.trim();
    if (!q) return null;
    const sourceParam = (urlSearchParams.get('sources') ?? '').split(',').filter(Boolean);
    const selectedSources = sourceParam.filter((item): item is Source => (DEFAULT_SOURCES as readonly string[]).includes(item));
    return {
      query: q,
      location: urlSearchParams.get('loc')?.trim() || DEFAULT_LOCATION,
      sources: selectedSources.length > 0 ? selectedSources : [...DEFAULT_SOURCES],
      maxDaysOld: urlSearchParams.get('days') ? Number(urlSearchParams.get('days')) : undefined,
      userId: userId || undefined,
      limit: 24,
    };
  }, [urlSearchParams, userId]);

  const jobsQuery = api.jobs.search.useQuery(searchParams ?? { query: '', location: DEFAULT_LOCATION, sources: ['reed'], limit: 24 }, { enabled: searchParams !== null });
  const saveJobMutation = api.jobs.saveJob.useMutation();
  const unsaveJobMutation = api.jobs.unsaveJob.useMutation();
  const startRadarScanMutation = api.jobRadar.startScan.useMutation();

  const searchData = normalizeJobsSearchData(jobsQuery.data);
  const jobs = searchData.jobs;
  const diagnostics = searchData.providerDiagnostics ?? [];
  const savedIds = new Set((savedJobsQuery.data ?? []).map((item) => item.job.id));

  const profile = profileQuery.data as ProfileSnapshot | undefined;
  const dreamRole = deriveDreamRole(profile);
  const aiQuery = deriveAiQuery(profile);

  const canSearch = query.trim().length > 0 && sources.length > 0;

  function syncUrl(nextQuery: string, nextLocation: string, nextSources: Source[], nextDays: string) {
    const params = new URLSearchParams();
    if (nextQuery.trim()) params.set('q', nextQuery.trim());
    if (nextLocation.trim()) params.set('loc', nextLocation.trim());
    if (nextSources.length > 0) params.set('sources', nextSources.join(','));
    if (nextDays) params.set('days', nextDays);
    setUrlSearchParams(params);
  }

  function handleSearch() {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      toast.error('Enter a job title, keyword, or skill first.');
      return;
    }
    if (sources.length === 0) {
      toast.error('Select at least one source.');
      return;
    }
    syncUrl(trimmedQuery, location, sources, days);
  }

  function handleQuickSearch(nextQuery: string) {
    if (!nextQuery.trim()) {
      toast.error('Your profile does not yet contain enough information for this search.');
      return;
    }
    setQuery(nextQuery);
    syncUrl(nextQuery, location, sources, days);
  }

  function handleClear() {
    setQuery('');
    setLocation(DEFAULT_LOCATION);
    setDays('');
    setSources([...DEFAULT_SOURCES]);
    setUrlSearchParams({});
  }

  function toggleSource(source: Source) {
    setSources((prev) => {
      if (prev.includes(source)) {
        if (prev.length === 1) return prev;
        return prev.filter((item) => item !== source);
      }
      return [...prev, source];
    });
  }

  function handleToggleSave(jobId: string) {
    if (!userId) {
      toast.error('Sign in to save jobs.');
      return;
    }
    if (savedIds.has(jobId)) {
      unsaveJobMutation.mutate({ jobId }, { onSuccess: () => savedJobsQuery.refetch() });
      return;
    }
    saveJobMutation.mutate({ jobId }, { onSuccess: () => savedJobsQuery.refetch() });
  }

  function handleStartRadarScan(job: JobResult) {
    if (!userId) {
      toast.error('Sign in to run Job Radar.');
      return;
    }

    let validApplyUrl: string | undefined;
    if (job.applyUrl) {
      try {
        validApplyUrl = new URL(job.applyUrl).toString();
      } catch {
        validApplyUrl = undefined;
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
          toast.success('Job Radar scan started.');
          navigate(`/jobs/radar/${data.scanId}`);
        },
        onError: (error) => {
          toast.error(`Could not start radar scan: ${error.message}`);
        },
      },
    );
  }

  useEffect(() => {
    setQuery(urlSearchParams.get('q') ?? '');
    setLocation(urlSearchParams.get('loc') ?? DEFAULT_LOCATION);
    setDays(urlSearchParams.get('days') ?? '');
    const raw = (urlSearchParams.get('sources') ?? '').split(',').filter(Boolean);
    const valid = raw.filter((item): item is Source => (DEFAULT_SOURCES as readonly string[]).includes(item));
    if (valid.length > 0) setSources(valid);
  }, [urlSearchParams]);

  if (!isLoaded) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-indigo-500/25 bg-gradient-to-br from-indigo-500/12 via-slate-900/40 to-violet-900/20 p-6 md:p-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-indigo-300/25 bg-indigo-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-200">
              <Briefcase className="h-3.5 w-3.5" />
              Jobs · Search Mode
            </p>
            <h1 className="mt-3 text-3xl font-bold text-white md:text-4xl">Search Jobs Without Wrestling The UI</h1>
            <p className="mt-3 text-sm text-slate-300 md:text-base">
              Use Jobs Search for broad discovery and fast screening. Use Job Radar for deeper review, stronger fit checks, and saved lead triage.
            </p>
          </div>
          <div className="space-y-3 xl:min-w-[340px]">
            <JobsSectionTabs />
            <div className="grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => handleQuickSearch(dreamRole)} className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-left text-sm text-emerald-50 transition hover:bg-emerald-500/15">
                <div className="flex items-center gap-2 font-semibold"><Target className="h-4 w-4" /> Dream Job</div>
                <p className="mt-1 text-xs text-emerald-100/80">{dreamRole || 'Set target role in Profile first.'}</p>
              </button>
              <Link to="/job-radar" className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-left text-sm text-cyan-50 transition hover:bg-cyan-500/15">
                <div className="flex items-center gap-2 font-semibold"><Radar className="h-4 w-4" /> Open Job Radar</div>
                <p className="mt-1 text-xs text-cyan-100/80">Deep review, risk checks, saved leads, recent scans.</p>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-5 md:p-6 space-y-4">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_240px_auto]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Enter') handleSearch(); }}
              placeholder="Search by title, keyword, or skill"
              className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Enter') handleSearch(); }}
              placeholder="Location"
              className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={handleSearch} disabled={jobsQuery.isFetching || !canSearch} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60">
              {jobsQuery.isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Search
            </button>
            <button type="button" onClick={handleClear} className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/10">
              Clear
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Posted</span>
          <select value={days} onChange={(event) => setDays(event.target.value)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Any time</option>
            <option value="1">Today</option>
            <option value="7">Last 7 days</option>
            <option value="14">Last 14 days</option>
            <option value="30">Last 30 days</option>
          </select>
          <span className={`rounded-full px-3 py-1 text-[11px] font-medium ${selectedSessionGap ? 'bg-amber-500/15 text-amber-200' : 'bg-emerald-500/15 text-emerald-200'}`}>
            {selectedSessionGap ? 'Some selected sources need session repair' : 'Selected sources ready'}
          </span>
          {userId && (
            <Link to="/jobs/saved" className="ml-auto rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/10">
              Open Saved Jobs
            </Link>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {DEFAULT_SOURCES.map((source) => {
            const active = sources.includes(source);
            const locked = SOURCE_META[source].requiresSession && !sessionProviders.has(source);
            return (
              <button
                key={source}
                type="button"
                onClick={() => toggleSource(source)}
                disabled={locked}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${active ? 'border-indigo-400/40 bg-indigo-500/15 text-indigo-100' : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'} ${locked ? 'cursor-not-allowed opacity-45' : ''}`}
                title={locked ? 'This provider needs a saved session in Jobs.' : SOURCE_META[source].label}
              >
                {SOURCE_META[source].label}
              </button>
            );
          })}
        </div>
      </section>

      <ProviderDiagnosticsPanel diagnostics={diagnostics} />

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Listings</h2>
            <p className="text-sm text-slate-500">
              {jobsQuery.isFetching
                ? 'Searching across selected sources…'
                : searchParams === null
                  ? 'Run a search to load listings.'
                  : jobs.length === 0
                    ? 'No listings for this search yet.'
                    : `${jobs.length} listing${jobs.length === 1 ? '' : 's'} found`}
            </p>
          </div>
          {userId && savedJobsQuery.data && (
            <p className="text-sm text-slate-500">Saved leads: {savedJobsQuery.data.length}</p>
          )}
        </div>

        {jobsQuery.isFetching ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="h-72 animate-pulse rounded-3xl border border-white/10 bg-white/5" />
            ))}
          </div>
        ) : searchParams === null ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] p-10 text-center">
            <p className="text-base font-semibold text-white">Start with a real search</p>
            <p className="mt-2 text-sm text-slate-500">Jobs is for quick, practical job search. Job Radar is for deeper review after you have a lead worth examining.</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] p-10 text-center">
            <p className="text-base font-semibold text-white">No listings matched this search</p>
            <p className="mt-2 text-sm text-slate-500">Try broader keywords, more sources, or a wider location.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {jobs.map((job) => {
              const isSaved = savedIds.has(job.id);
              return (
                <article key={job.id} className="flex h-full flex-col rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] transition hover:border-indigo-400/30">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{job.title}</h3>
                      <p className="mt-1 text-sm text-slate-400">{job.company}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${job.fitScore >= 80 ? 'bg-emerald-500/15 text-emerald-200' : job.fitScore >= 60 ? 'bg-amber-500/15 text-amber-200' : 'bg-rose-500/15 text-rose-200'}`}>
                      Fit {job.fitScore}%
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-slate-300">
                    <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-500" /> {job.location || 'Location unavailable'}</div>
                    <div className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-slate-500" /> {job.workMode || 'Work mode not stated'}</div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-white/8 px-3 py-1 text-xs text-slate-300">{job.source}</span>
                    <span className="rounded-full bg-white/8 px-3 py-1 text-xs text-slate-300">{formatPostedAt(job.postedAt)}</span>
                    <span className="rounded-full bg-white/8 px-3 py-1 text-xs text-slate-300">{formatSalary(job)}</span>
                  </div>

                  <div className="mt-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/8 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-200">Why This Is On Your Radar</p>
                    <p className="mt-1 text-sm text-slate-200">{buildRadarReason(job)}</p>
                  </div>

                  {job.employerSignals && (
                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-xl border border-white/10 bg-black/15 p-3">
                        <p className="text-slate-500">Trust</p>
                        <p className="mt-1 font-semibold capitalize text-white">{job.employerSignals.trustLevel.replace('_', ' ')}</p>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-black/15 p-3">
                        <p className="text-slate-500">Risk</p>
                        <p className="mt-1 font-semibold capitalize text-white">{job.employerSignals.riskLevel}</p>
                      </div>
                    </div>
                  )}

                  <div className="mt-auto pt-5 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => handleToggleSave(job.id)} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10">
                        {isSaved ? <BookmarkCheck className="h-4 w-4 text-emerald-300" /> : <Bookmark className="h-4 w-4" />}
                        {isSaved ? 'Saved' : 'Save'}
                      </button>
                      <button type="button" onClick={() => handleStartRadarScan(job)} disabled={startRadarScanMutation.isPending} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60">
                        {startRadarScanMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}
                        Radar
                      </button>
                    </div>
                    <a href={job.applyUrl || '#'} target="_blank" rel="noreferrer" className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition ${job.applyUrl ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/15' : 'pointer-events-none border-white/10 bg-white/5 text-slate-500'}`}>
                      <ExternalLink className="h-4 w-4" />
                      {job.applyUrl ? 'Open Listing' : 'No Apply Link'}
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
