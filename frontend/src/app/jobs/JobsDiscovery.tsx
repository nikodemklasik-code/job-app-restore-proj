import { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { api } from '@/lib/api';
import { Search, MapPin, Building2, DollarSign, Plus, ExternalLink, Loader2, Cookie, CheckCircle2, XCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

type JobResult = {
  id: string;
  title: string;
  company: string;
  location: string;
  salaryMin: number | null;
  salaryMax: number | null;
  source: string;
  applyUrl: string;
  fitScore: number;
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

function fitBadgeClass(score: number): string {
  if (score >= 80) return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
  if (score >= 60) return 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30';
  return 'bg-white/10 text-slate-400 border border-white/10';
}

function formatSalary(min: number | null, max: number | null): string | null {
  if (!min && !max) return null;
  if (min && max) return `£${Math.round(min / 1000)}k–£${Math.round(max / 1000)}k`;
  if (min) return `£${Math.round(min / 1000)}k+`;
  return `up to £${Math.round((max ?? 0) / 1000)}k`;
}

// ── Session setup panel for Indeed / Gumtree ─────────────────────────────────

function SessionPanel({ provider, status, userId }: {
  provider: 'indeed' | 'gumtree';
  status: SessionStatus | undefined;
  userId: string;
}) {
  const [open, setOpen] = useState(false);
  const [cookies, setCookies] = useState('');
  const utils = api.useUtils();

  const meta = SOURCE_META[provider];

  const saveMutation = api.jobSessions.saveCookies.useMutation({
    onSuccess: () => { setCookies(''); void utils.jobSessions.getStatus.invalidate(); },
  });

  const testMutation = api.jobSessions.testSession.useMutation({
    onSuccess: () => { void utils.jobSessions.getStatus.invalidate(); },
  });

  const removeMutation = api.jobSessions.remove.useMutation({
    onSuccess: () => { void utils.jobSessions.getStatus.invalidate(); },
  });

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-3">
          <Cookie className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-medium text-white">{meta.label} session</span>
          {status ? (
            status.isActive
              ? <span className="flex items-center gap-1 text-xs text-emerald-400"><CheckCircle2 className="h-3.5 w-3.5" />Active</span>
              : <span className="flex items-center gap-1 text-xs text-red-400"><XCircle className="h-3.5 w-3.5" />Expired</span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-slate-500"><AlertCircle className="h-3.5 w-3.5" />Not configured</span>
          )}
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>

      {open && (
        <div className="border-t border-white/10 px-4 py-4 space-y-3">
          <div className="rounded-lg bg-indigo-500/10 border border-indigo-500/20 p-3 text-xs text-indigo-300 space-y-1">
            <p className="font-semibold">How to get cookies:</p>
            <ol className="list-decimal list-inside space-y-0.5 text-indigo-200/80">
              <li>Open <a href={meta.url} target="_blank" rel="noopener noreferrer" className="underline">{meta.url}</a> and sign in</li>
              <li>Open DevTools → Application → Cookies → Copy all cookie values</li>
              <li>Or use the EditThisCookie extension → Export → paste below</li>
            </ol>
          </div>

          <textarea
            value={cookies}
            onChange={(e) => setCookies(e.target.value)}
            placeholder={`Paste your ${meta.label} cookies here…`}
            rows={3}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 font-mono"
          />

          <div className="flex gap-2">
            <button
              onClick={() => saveMutation.mutate({ userId, provider, cookies })}
              disabled={!cookies.trim() || saveMutation.isPending}
              className="flex-1 rounded-xl bg-indigo-600 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
            >
              {saveMutation.isPending ? 'Saving…' : 'Save cookies'}
            </button>
            {status && (
              <>
                <button
                  onClick={() => testMutation.mutate({ userId, provider })}
                  disabled={testMutation.isPending}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/10 disabled:opacity-60"
                >
                  {testMutation.isPending ? '…' : 'Test'}
                </button>
                <button
                  onClick={() => removeMutation.mutate({ userId, provider })}
                  disabled={removeMutation.isPending}
                  className="rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-400 transition hover:bg-red-500/10 disabled:opacity-60"
                >
                  Remove
                </button>
              </>
            )}
          </div>

          {testMutation.data && (
            <p className={`text-xs ${testMutation.data.ok ? 'text-emerald-400' : 'text-red-400'}`}>
              {testMutation.data.reason}
            </p>
          )}
          {saveMutation.isError && (
            <p className="text-xs text-red-400">{String(saveMutation.error)}</p>
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
  const indeedStatus = sessions.find((s) => s.provider === 'indeed');
  const gumtreeStatus = sessions.find((s) => s.provider === 'gumtree');

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
                  {needsSession && !hasSession && <span className="ml-1 text-[9px] opacity-60">(no session)</span>}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Error */}
      {searchQuery.isError && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          {searchQuery.error instanceof Error ? searchQuery.error.message : 'Search failed'}
        </p>
      )}

      {/* Results */}
      {searchQuery.isFetching ? (
        <div className="flex h-48 items-center justify-center">
          <div className="text-center space-y-2">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto" />
            <p className="text-sm text-slate-500">Searching {sources.join(', ')}…</p>
          </div>
        </div>
      ) : jobResults.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {jobResults.map((job) => {
            const salary = formatSalary(job.salaryMin, job.salaryMax);
            const srcMeta = SOURCE_META[job.source as Source];
            return (
              <div key={job.id} className="rounded-2xl border border-white/10 bg-white/5 p-5 flex flex-col gap-3 transition hover:border-white/20 hover:bg-white/[0.07]">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                    <Building2 className="h-5 w-5 text-slate-400" />
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${fitBadgeClass(job.fitScore)}`}>
                    {job.fitScore}% fit
                  </span>
                </div>

                <div>
                  <h3 className="font-semibold text-white leading-tight">{job.title}</h3>
                  <p className="text-sm text-slate-400 mt-0.5">{job.company}</p>
                </div>

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
                  <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium ${srcMeta?.color ?? 'bg-white/10 text-slate-400'}`}>
                    {srcMeta?.label ?? job.source}
                  </span>
                </div>

                {job.applyUrl && (
                  <a
                    href={job.applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-auto flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
                  >
                    Apply
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            );
          })}
        </div>
      ) : searchParams !== null ? (
        <div className="flex h-48 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-500">
          No jobs found. Try different keywords or locations.
        </div>
      ) : (
        <div className="flex h-48 items-center justify-center rounded-2xl border-2 border-dashed border-white/10 text-slate-500">
          Enter a search query above and click Search to find jobs.
        </div>
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
