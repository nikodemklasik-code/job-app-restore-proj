import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plug, Loader2, CheckCircle2, AlertCircle, ShieldCheck, Globe2, KeyRound } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useJobSourceSettingsStore } from '@/stores/jobSourceSettingsStore';

const METHOD_CONSENT_STORAGE_KEY = 'mvh-job-search-method-consent-v1';

type MethodConsent = {
  allowOfficialApis: boolean;
  allowBrowserSearch: boolean;
};

function readMethodConsent(userId: string): MethodConsent {
  if (typeof window === 'undefined') return { allowOfficialApis: false, allowBrowserSearch: false };
  try {
    const raw = window.localStorage.getItem(`${METHOD_CONSENT_STORAGE_KEY}:${userId}`);
    if (!raw) return { allowOfficialApis: false, allowBrowserSearch: false };
    const parsed = JSON.parse(raw) as Partial<MethodConsent>;
    return {
      allowOfficialApis: Boolean(parsed.allowOfficialApis),
      allowBrowserSearch: Boolean(parsed.allowBrowserSearch),
    };
  } catch {
    return { allowOfficialApis: false, allowBrowserSearch: false };
  }
}

function writeMethodConsent(userId: string, next: MethodConsent) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(`${METHOD_CONSENT_STORAGE_KEY}:${userId}`, JSON.stringify(next));
}

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 ${
        checked ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

export function JobSourcesSettingsTab({ userId }: { userId: string }) {
  const { providers, isLoading, load, toggle } = useJobSourceSettingsStore();
  const [methodConsent, setMethodConsent] = useState<MethodConsent>(() => readMethodConsent(userId));

  useEffect(() => {
    void load(userId);
    setMethodConsent(readMethodConsent(userId));
  }, [userId, load]);

  const updateMethodConsent = (patch: Partial<MethodConsent>) => {
    const next = { ...methodConsent, ...patch };
    setMethodConsent(next);
    writeMethodConsent(userId, next);
  };

  const externalProviders = useMemo(
    () => providers.filter((p) => p.isExternalProvider),
    [providers],
  );
  const productSources = useMemo(
    () => providers.filter((p) => !p.isExternalProvider),
    [providers],
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" /> Job Search Sources &amp; Permissions
          </CardTitle>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Enable the access methods MultivoHub may use for AI-assisted job search. API search is preferred when
            available. Browser-based search is used only when needed, such as when a provider does not offer API access,
            API access is incomplete, or an API temporarily fails.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-indigo-600 dark:text-indigo-300" />
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Use official job APIs when available</p>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                    Search supported providers through structured API access where possible. This may send selected search
                    criteria, profile preferences, location, role targets, salary expectations, and filters to supported providers.
                  </p>
                </div>
                <Toggle
                  checked={methodConsent.allowOfficialApis}
                  onChange={() => updateMethodConsent({ allowOfficialApis: !methodConsent.allowOfficialApis })}
                />
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Globe2 className="h-4 w-4 text-indigo-600 dark:text-indigo-300" />
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Use browser-based web search when needed</p>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                    Search public job pages when API access is unavailable or insufficient. This may read public job pages,
                    search result pages, employer career pages, job boards, and recruitment pages.
                  </p>
                </div>
                <Toggle
                  checked={methodConsent.allowBrowserSearch}
                  onChange={() => updateMethodConsent({ allowBrowserSearch: !methodConsent.allowBrowserSearch })}
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-xs leading-relaxed text-indigo-900 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-200">
            <div className="flex gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Provider selection remains separate from method consent. A provider can be selected only when at least one
                method it can use is allowed. No hidden provider access.
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plug className="h-4 w-4" /> Job Boards & Aggregators
          </CardTitle>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Choose the external job sources you want MultivoHub to use. Method permissions above control whether API
            access and/or browser public web search may be used for those sources.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && externalProviders.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading provider status…
            </div>
          ) : (
            externalProviders.map((p) => {
              const supportsApi = Boolean(p.requiresApiKey) || !p.requiresSession;
              const supportsBrowser = Boolean(p.requiresSession) || !p.requiresApiKey;
              const apiAllowed = supportsApi && methodConsent.allowOfficialApis;
              const browserAllowed = supportsBrowser && methodConsent.allowBrowserSearch;
              const hasAllowedMethod = apiAllowed || browserAllowed;
              const methodSummary = [
                supportsApi ? `API ${methodConsent.allowOfficialApis ? 'allowed' : 'blocked'}` : null,
                supportsBrowser ? `Browser ${methodConsent.allowBrowserSearch ? 'allowed' : 'blocked'}` : null,
              ].filter(Boolean).join(' · ');

              return (
              <div
                key={p.name}
                className="flex flex-col gap-3 rounded-xl border border-slate-100 p-4 dark:border-slate-800 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-lg" aria-hidden>
                      {p.icon}
                    </span>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{p.label}</p>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      {p.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{p.description}</p>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    Allowed methods: <span className={hasAllowedMethod ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}>{methodSummary || 'No available method'}</span>
                  </p>
                  {p.requiresApiKey ? (
                    <p className="text-xs text-slate-500">
                      <span className="font-medium text-slate-700 dark:text-slate-300">Server env:</span>{' '}
                      <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px] dark:bg-slate-900">{p.requiresApiKey}</code>
                      {' — '}
                      If missing or invalid, this feed is skipped on search.
                    </p>
                  ) : null}
                  {p.requiresSession ? (
                    <p className="text-xs text-slate-500">
                      Requires an active browser session. Connect on the{' '}
                      <Link to="/jobs" className="font-medium text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-400">
                        Jobs
                      </Link>{' '}
                      page.
                    </p>
                  ) : null}
                  <div className="flex items-center gap-1.5 text-xs">
                    {p.readiness.ready ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <span className="font-medium text-emerald-800 dark:text-emerald-200">Ready</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                        <span className="text-amber-900 dark:text-amber-100">
                          <span className="font-medium">Not ready:</span> {p.readiness.reason ?? 'Unknown'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
                  <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                    {p.isEnabled ? 'Consented' : hasAllowedMethod ? 'Off' : 'Method blocked'}
                  </span>
                  <Toggle
                    checked={p.isEnabled}
                    onChange={() => void toggle(userId, p.name, !p.isEnabled)}
                    disabled={isLoading || !hasAllowedMethod}
                  />
                </div>
              </div>
            );})
          )}
        </CardContent>
      </Card>

      {productSources.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Product Sources</CardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              These are internal product features, not external job board consent switches.
            </p>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {productSources.map((p) => (
              <div key={p.name} className="rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span aria-hidden>{p.icon}</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{p.label}</span>
                </div>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{p.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Government And Benefits Links</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 text-sm">
          <a
            href="https://findajob.dwp.gov.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-400"
          >
            UK Find a Job (DWP)
          </a>
          <span className="text-slate-400">·</span>
          <a
            href="https://www.gov.uk/sign-in-universal-credit"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-400"
          >
            Universal Credit Sign In
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
