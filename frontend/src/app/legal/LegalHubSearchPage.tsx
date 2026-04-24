import { useMemo, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import {
  AlertTriangle,
  ExternalLink,
  FileDown,
  Landmark,
  Loader2,
  Scale,
  Search,
  Shield,
  Sparkles,
} from 'lucide-react';
import { api } from '@/lib/api';

const POPULAR_TOPICS = [
  'constructive dismissal',
  'subject access request recruitment',
  'right to work checks',
  'zero-hours contract rights',
  'agency worker regulations 12 weeks',
  'reasonable adjustments at work',
  'ACAS early conciliation',
  'IR35 contractor status',
];

const QUICK_LINKS = [
  {
    label: 'ACAS Early Conciliation',
    href: 'https://www.acas.org.uk/early-conciliation',
  },
  {
    label: 'ICO Data Rights',
    href: 'https://ico.org.uk',
  },
  {
    label: 'GOV.UK Employment Rights',
    href: 'https://www.gov.uk/browse/working',
  },
  {
    label: 'Employment Tribunal',
    href: 'https://www.gov.uk/employment-tribunals',
  },
];

function decodePdf(base64: string, filename: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function LegalHubSearchPage() {
  const { isSignedIn } = useUser();
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [includeGroundedSummary, setIncludeGroundedSummary] = useState(true);
  const scopeSummary = api.legalHub.scopeSummary.useQuery();
  const searchQuery = api.legalHub.search.useQuery(
    {
      query: submittedQuery,
      limit: 8,
      includeGroundedSummary,
    },
    {
      enabled: submittedQuery.trim().length >= 2,
      refetchOnWindowFocus: false,
    },
  );
  const exportPdf = api.legalHub.exportPdf.useMutation({
    onSuccess: (data) => decodePdf(data.base64, data.filename ?? 'legal-hub-search.pdf'),
  });

  const hits = searchQuery.data?.hits ?? [];
  const groundedSummary = searchQuery.data?.groundedSummary;
  const currentScope = searchQuery.data?.scope ?? scopeSummary.data;
  const canSearch = query.trim().length >= 2;

  const statusText = useMemo(() => {
    if (!submittedQuery) return 'Search the legal catalogue directly here.';
    if (searchQuery.isLoading) return 'Searching approved legal sources…';
    if (searchQuery.isError) return 'Search failed. Try a shorter or clearer query.';
    if (hits.length === 0) return 'No direct catalogue hits yet. Try a more specific legal phrase.';
    return `${hits.length} result${hits.length === 1 ? '' : 's'} found for “${submittedQuery}”.`;
  }, [hits.length, searchQuery.isError, searchQuery.isLoading, submittedQuery]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 md:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-200">
              <Scale className="h-3.5 w-3.5" />
              Legal Hub
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-white">Grounded legal search for UK job seekers</h1>
            <p className="mt-3 text-sm leading-7 text-slate-300 md:text-base">
              This screen searches the Legal Hub catalogue directly. It stays in Legal Hub and returns approved source hits,
              instead of wandering off into the assistant like a bored intern.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300 lg:w-[340px]">
            <div className="flex items-center gap-2 font-semibold text-white">
              <Shield className="h-4 w-4 text-emerald-300" />
              Search scope
            </div>
            <p className="mt-2 leading-6 text-slate-300">
              {currentScope?.scopeLabel ?? 'Approved Legal Hub sources only.'}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Guidance only. This is not legal representation or a solicitor-client service.
            </p>
          </div>
        </div>
      </section>

      <section id="legal-search" className="rounded-3xl border border-indigo-500/20 bg-indigo-500/[0.06] p-5 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="flex-1">
            <label htmlFor="legal-search-input" className="mb-2 block text-sm font-semibold text-white">
              Search approved legal topics
            </label>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
              <Search className="h-4 w-4 shrink-0 text-indigo-300" />
              <input
                id="legal-search-input"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && canSearch) setSubmittedQuery(query.trim());
                }}
                placeholder="e.g. constructive dismissal after grievance"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
              />
            </div>
            <p className="mt-2 text-xs text-slate-400">Use legal phrases, rights, tribunal terms, ACAS procedures or recruiter and GDPR topics.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="flex items-center gap-2 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={includeGroundedSummary}
                onChange={(event) => setIncludeGroundedSummary(event.target.checked)}
                className="rounded border-white/20 bg-slate-950/50"
              />
              Add grounded AI summary
            </label>
            <button
              type="button"
              onClick={() => setSubmittedQuery(query.trim())}
              disabled={!canSearch || searchQuery.isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {searchQuery.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Search law
            </button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {POPULAR_TOPICS.map((topic) => (
            <button
              key={topic}
              type="button"
              onClick={() => {
                setQuery(topic);
                setSubmittedQuery(topic);
              }}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              {topic}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">Search results</p>
                <p className="mt-1 text-sm text-slate-400">{statusText}</p>
              </div>
              {submittedQuery && isSignedIn ? (
                <button
                  type="button"
                  onClick={() => exportPdf.mutate({ query: submittedQuery, userId: 'current-user' })}
                  disabled={exportPdf.isPending}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10 disabled:opacity-50"
                >
                  {exportPdf.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
                  Export PDF
                </button>
              ) : null}
            </div>
          </div>

          {searchQuery.isError ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                Legal search failed. Try a shorter query or a more standard legal phrase.
              </div>
            </div>
          ) : null}

          {groundedSummary ? (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.07] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Sparkles className="h-4 w-4 text-emerald-300" />
                Grounded summary
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-emerald-50/95">{groundedSummary.text}</p>
            </div>
          ) : null}

          {submittedQuery && !searchQuery.isLoading && hits.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-8 text-center">
              <Landmark className="mx-auto h-8 w-8 text-slate-500" />
              <p className="mt-3 text-base font-semibold text-white">No direct hits yet</p>
              <p className="mt-2 text-sm text-slate-400">
                Try narrower phrases like “subject access request recruiter”, “agency worker 12 weeks” or “reasonable adjustments interview”.
              </p>
            </div>
          ) : null}

          <div className="space-y-3">
            {hits.map((hit) => (
              <article key={`${hit.title}-${hit.url}-${hit.score}`} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{hit.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{hit.tier === 'core' ? 'Core legal source' : 'Optional legal source'}</p>
                  </div>
                  <a
                    href={hit.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 transition hover:bg-white/10 hover:text-white"
                  >
                    Open source
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-300">{hit.snippet}</p>
              </article>
            ))}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-sm font-semibold text-white">Popular legal topics</p>
            <div className="mt-3 space-y-2">
              {POPULAR_TOPICS.map((topic) => (
                <button
                  key={`side-${topic}`}
                  type="button"
                  onClick={() => {
                    setQuery(topic);
                    setSubmittedQuery(topic);
                  }}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-xs text-slate-300 transition hover:bg-white/10 hover:text-white"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-sm font-semibold text-white">Official links</p>
            <div className="mt-3 space-y-2">
              {QUICK_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/10 hover:text-white"
                >
                  <span>{link.label}</span>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                </a>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.07] p-4 text-xs leading-6 text-amber-50/95">
            <p className="font-semibold text-white">Important</p>
            <p className="mt-2">
              Legal Hub is for grounded guidance and source discovery. It is not a solicitor, not a tribunal claim service,
              and not a replacement for ACAS or qualified legal advice where timing is critical.
            </p>
          </div>
        </aside>
      </section>
    </div>
  );
}
