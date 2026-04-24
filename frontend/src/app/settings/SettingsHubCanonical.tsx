import { useEffect, useMemo, useState, type ElementType, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import {
  Bot,
  Bell,
  CheckCircle2,
  Database,
  Loader2,
  Lock,
  Mail,
  Save,
  Settings,
  Shield,
  User,
} from 'lucide-react';
import { api } from '@/lib/api';
import { JobSourcesSettingsTab } from './JobSourcesSettingsTab';

type SettingsTab = 'account' | 'notifications' | 'email' | 'privacy' | 'ai' | 'job-sources' | 'security';

type SettingsSnapshot = {
  emailNotifications: boolean;
  pushNotifications: boolean;
  weeklyDigest: boolean;
  marketingEmails: boolean;
  autoSaveDocuments: boolean;
  darkMode: boolean;
  themeMode: 'system' | 'light' | 'dark';
  assistantTone: 'balanced' | 'concise' | 'supportive';
  timezone: string;
  language: string;
  privacyMode: boolean;
  shareProfileAnalytics: boolean;
  blockedCompanyDomains: string[];
};

const DEFAULT_SETTINGS: SettingsSnapshot = {
  emailNotifications: true,
  pushNotifications: true,
  weeklyDigest: true,
  marketingEmails: false,
  autoSaveDocuments: true,
  darkMode: false,
  themeMode: 'system',
  assistantTone: 'balanced',
  timezone: 'Europe/London',
  language: 'en-GB',
  privacyMode: false,
  shareProfileAnalytics: false,
  blockedCompanyDomains: [],
};

const TABS: Array<{ id: SettingsTab; label: string; icon: ElementType; purpose: string }> = [
  { id: 'account', label: 'Account', icon: User, purpose: 'Identity, locale, and account entry points.' },
  { id: 'notifications', label: 'Notifications', icon: Bell, purpose: 'Email, push, digest, and marketing preferences.' },
  { id: 'email', label: 'Email', icon: Mail, purpose: 'Outgoing email behaviour and SMTP setup entry.' },
  { id: 'privacy', label: 'Privacy & Consent', icon: Shield, purpose: 'Privacy mode, analytics consent, and blocked companies.' },
  { id: 'ai', label: 'AI', icon: Bot, purpose: 'Assistant tone, document autosave, and model-facing preferences.' },
  { id: 'job-sources', label: 'Job Sources', icon: Database, purpose: 'Server-backed sources used by Jobs discovery.' },
  { id: 'security', label: 'Security', icon: Lock, purpose: 'Visible security, passkey, and 2FA entrypoint.' },
];

const TAB_ALIASES: Record<string, SettingsTab> = {
  account: 'account',
  notifications: 'notifications',
  notification: 'notifications',
  email: 'email',
  smtp: 'email',
  privacy: 'privacy',
  consent: 'privacy',
  ai: 'ai',
  assistant: 'ai',
  'job-sources': 'job-sources',
  sources: 'job-sources',
  jobsources: 'job-sources',
  security: 'security',
  passkeys: 'security',
  'auto-apply': 'job-sources',
};

function normalizeTab(value: string | null): SettingsTab {
  if (!value) return 'account';
  return TAB_ALIASES[value.toLowerCase()] ?? 'account';
}

function Toggle({ checked, disabled, onChange }: { checked: boolean; disabled?: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onChange}
      aria-pressed={checked}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition focus:outline-none focus:ring-2 focus:ring-indigo-400/60 disabled:cursor-not-allowed disabled:opacity-50 ${checked ? 'bg-indigo-600' : 'bg-slate-700'}`}
    >
      <span className={`h-4 w-4 rounded-full bg-white shadow transition ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

function FieldRow({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="mt-1 text-xs leading-5 text-slate-400">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  disabled,
  onToggle,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <FieldRow title={title} description={description}>
      <Toggle checked={checked} disabled={disabled} onChange={onToggle} />
    </FieldRow>
  );
}

function StatusBadge({ saving, saved }: { saving: boolean; saved: boolean }) {
  if (saving) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-indigo-400/25 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-200">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving
      </span>
    );
  }
  if (saved) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
        <CheckCircle2 className="h-3.5 w-3.5" /> Saved
      </span>
    );
  }
  return null;
}

function toForm(data: SettingsSnapshot | undefined): SettingsSnapshot {
  return { ...DEFAULT_SETTINGS, ...(data ?? {}) };
}

export default function SettingsHubCanonical() {
  const { user, isSignedIn } = useUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = normalizeTab(searchParams.get('tab'));
  const utils = api.useUtils();
  const settingsQuery = api.settings.getSettings.useQuery(undefined, {
    enabled: Boolean(isSignedIn),
    refetchOnWindowFocus: false,
  });
  const updateSettings = api.settings.updateSettings.useMutation({
    onSuccess: async () => {
      setSavedPulse(true);
      await utils.settings.getSettings.invalidate();
      window.setTimeout(() => setSavedPulse(false), 1800);
    },
  });

  const [form, setForm] = useState<SettingsSnapshot>(DEFAULT_SETTINGS);
  const [domainDraft, setDomainDraft] = useState('');
  const [savedPulse, setSavedPulse] = useState(false);

  useEffect(() => {
    if (settingsQuery.data) setForm(toForm(settingsQuery.data as SettingsSnapshot));
  }, [settingsQuery.data]);

  const save = (next: SettingsSnapshot) => {
    setForm(next);
    updateSettings.mutate(next);
  };

  const patch = <K extends keyof SettingsSnapshot>(key: K, value: SettingsSnapshot[K]) => {
    save({ ...form, [key]: value });
  };

  const addBlockedDomain = () => {
    const domain = domainDraft.trim().toLowerCase();
    if (!domain) return;
    const nextDomains = Array.from(new Set([...form.blockedCompanyDomains, domain])).sort();
    setDomainDraft('');
    patch('blockedCompanyDomains', nextDomains);
  };

  const removeBlockedDomain = (domain: string) => {
    patch('blockedCompanyDomains', form.blockedCompanyDomains.filter((item) => item !== domain));
  };

  const tabPurpose = useMemo(() => TABS.find((tab) => tab.id === activeTab)?.purpose ?? '', [activeTab]);
  const disabled = updateSettings.isPending || settingsQuery.isLoading;

  if (!isSignedIn) {
    return <div className="flex items-center justify-center py-24 text-sm text-slate-500">Sign in to manage settings.</div>;
  }

  if (settingsQuery.isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 animate-pulse rounded-3xl bg-white/5" />
        <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
          <div className="h-96 animate-pulse rounded-3xl bg-white/5" />
          <div className="h-96 animate-pulse rounded-3xl bg-white/5" />
        </div>
      </div>
    );
  }

  if (settingsQuery.isError) {
    return (
      <section className="rounded-3xl border border-rose-400/25 bg-rose-500/10 p-6">
        <h1 className="text-xl font-semibold text-rose-100">Settings failed to load</h1>
        <p className="mt-2 text-sm text-rose-50/80">{settingsQuery.error.message}</p>
        <button
          type="button"
          onClick={() => void settingsQuery.refetch()}
          className="mt-4 inline-flex items-center rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-400"
        >
          Retry
        </button>
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 md:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-200">
              <Settings className="h-3.5 w-3.5" />
              Settings
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-white">Account, consent, AI, notifications, and sources.</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 md:text-base">
              One control surface for user preferences. Every switch on this page writes through the server settings contract,
              because UI-only toggles are just lies with rounded corners.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4 text-sm text-slate-300 lg:w-[340px]">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-white">Current section</p>
              <StatusBadge saving={updateSettings.isPending} saved={savedPulse} />
            </div>
            <p className="mt-2 text-slate-400">{tabPurpose}</p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <nav className="rounded-3xl border border-white/10 bg-white/[0.035] p-3 lg:sticky lg:top-4 lg:self-start">
          <div className="space-y-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSearchParams({ tab: tab.id })}
                  className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm transition ${
                    active
                      ? 'border border-indigo-400/30 bg-indigo-500/15 text-white'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="font-semibold">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        <section className="min-w-0 rounded-3xl border border-white/10 bg-white/[0.025] p-4 md:p-5">
          {activeTab === 'account' ? (
            <div className="space-y-4">
              <FieldRow title="Signed-in account" description="Identity comes from Clerk and is shown here as read-only account context.">
                <div className="text-right text-sm text-slate-300">
                  <p className="font-semibold text-white">{user?.fullName ?? user?.username ?? 'Account'}</p>
                  <p className="text-xs text-slate-500">{user?.primaryEmailAddress?.emailAddress ?? 'No primary email'}</p>
                </div>
              </FieldRow>
              <FieldRow title="Language" description="Used by product copy, generated guidance defaults, and locale-aware formatting.">
                <select
                  value={form.language}
                  disabled={disabled}
                  onChange={(event) => patch('language', event.target.value)}
                  className="rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none"
                >
                  <option value="en-GB">English UK</option>
                  <option value="en-US">English US</option>
                  <option value="pl-PL">Polish</option>
                </select>
              </FieldRow>
              <FieldRow title="Timezone" description="Controls digest timing, reminders, and date display defaults.">
                <input
                  value={form.timezone}
                  disabled={disabled}
                  onChange={(event) => setForm({ ...form, timezone: event.target.value })}
                  onBlur={(event) => patch('timezone', event.target.value.trim() || 'UTC')}
                  className="w-56 rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none"
                />
              </FieldRow>
            </div>
          ) : null}

          {activeTab === 'notifications' ? (
            <div className="space-y-4">
              <ToggleRow title="Email notifications" description="Receive application, review, and product notifications by email." checked={form.emailNotifications} disabled={disabled} onToggle={() => patch('emailNotifications', !form.emailNotifications)} />
              <ToggleRow title="Push notifications" description="Allow browser or device push notifications where supported." checked={form.pushNotifications} disabled={disabled} onToggle={() => patch('pushNotifications', !form.pushNotifications)} />
              <ToggleRow title="Weekly digest" description="Summarise applications, practice, and recommended next actions weekly." checked={form.weeklyDigest} disabled={disabled} onToggle={() => patch('weeklyDigest', !form.weeklyDigest)} />
              <ToggleRow title="Marketing emails" description="Consent to product news and non-essential promotional email." checked={form.marketingEmails} disabled={disabled} onToggle={() => patch('marketingEmails', !form.marketingEmails)} />
            </div>
          ) : null}

          {activeTab === 'email' ? (
            <div className="space-y-4">
              <ToggleRow title="Use email notifications" description="Server-backed switch for whether app email notifications are enabled." checked={form.emailNotifications} disabled={disabled} onToggle={() => patch('emailNotifications', !form.emailNotifications)} />
              <FieldRow title="SMTP and sending account" description="Detailed SMTP setup remains available in the existing email integration surface; this settings tab keeps email preference state canonical.">
                <Link to="/settings?tab=email" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10">
                  <Mail className="h-4 w-4" /> Email settings active
                </Link>
              </FieldRow>
              <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm leading-6 text-amber-50/90">
                SMTP credentials are sensitive. The backend email settings router owns connection tests and encrypted storage; do not fake this with a local toggle.
              </div>
            </div>
          ) : null}

          {activeTab === 'privacy' ? (
            <div className="space-y-4">
              <ToggleRow title="Privacy mode" description="Reduce optional sharing and analytics surfaces across the product." checked={form.privacyMode} disabled={disabled} onToggle={() => patch('privacyMode', !form.privacyMode)} />
              <ToggleRow title="Share profile analytics" description="Allow aggregated profile usage signals to improve recommendations." checked={form.shareProfileAnalytics} disabled={disabled} onToggle={() => patch('shareProfileAnalytics', !form.shareProfileAnalytics)} />
              <FieldRow title="Blocked company domains" description="Jobs from these company domains should be filtered or de-prioritised by discovery surfaces.">
                <div className="flex gap-2">
                  <input
                    value={domainDraft}
                    disabled={disabled}
                    onChange={(event) => setDomainDraft(event.target.value)}
                    onKeyDown={(event) => { if (event.key === 'Enter') addBlockedDomain(); }}
                    placeholder="example.com"
                    className="w-48 rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500"
                  />
                  <button type="button" disabled={disabled || !domainDraft.trim()} onClick={addBlockedDomain} className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Add</button>
                </div>
              </FieldRow>
              {form.blockedCompanyDomains.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {form.blockedCompanyDomains.map((domain) => (
                    <button key={domain} type="button" disabled={disabled} onClick={() => removeBlockedDomain(domain)} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/10">
                      {domain} ×
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {activeTab === 'ai' ? (
            <div className="space-y-4">
              <FieldRow title="Assistant tone" description="Controls default style for assistant support where supported by backend prompts.">
                <select
                  value={form.assistantTone}
                  disabled={disabled}
                  onChange={(event) => patch('assistantTone', event.target.value as SettingsSnapshot['assistantTone'])}
                  className="rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none"
                >
                  <option value="balanced">Balanced</option>
                  <option value="concise">Concise</option>
                  <option value="supportive">Supportive</option>
                </select>
              </FieldRow>
              <FieldRow title="Theme mode" description="Server-backed theme preference. Local theme rendering may still sync separately in the shell.">
                <select
                  value={form.themeMode}
                  disabled={disabled}
                  onChange={(event) => patch('themeMode', event.target.value as SettingsSnapshot['themeMode'])}
                  className="rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none"
                >
                  <option value="system">System</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </FieldRow>
              <ToggleRow title="Auto-save generated documents" description="Persist generated CV, cover letter, and document outputs where supported." checked={form.autoSaveDocuments} disabled={disabled} onToggle={() => patch('autoSaveDocuments', !form.autoSaveDocuments)} />
            </div>
          ) : null}

          {activeTab === 'job-sources' ? <JobSourcesSettingsTab userId={user?.id ?? ''} /> : null}

          {activeTab === 'security' ? (
            <div className="space-y-4">
              <FieldRow title="Security centre" description="Passkeys, 2FA, active sessions, and sensitive account controls are visible from here.">
                <Link to="/security" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
                  <Lock className="h-4 w-4" /> Open Security
                </Link>
              </FieldRow>
              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <p className="text-sm font-semibold text-white">Security is not buried</p>
                <p className="mt-1 text-sm leading-6 text-slate-400">
                  The canonical Settings spec requires security to be discoverable from Settings. This tab is the explicit entrypoint,
                  while the full sensitive controls stay in the dedicated Security screen.
                </p>
              </div>
            </div>
          ) : null}

          <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-slate-500">
            <span>Settings are loaded from `settings.getSettings` and saved through `settings.updateSettings`.</span>
            <span className="inline-flex items-center gap-1.5"><Save className="h-3.5 w-3.5" /> Autosave on change</span>
          </div>
        </section>
      </div>
    </div>
  );
}
