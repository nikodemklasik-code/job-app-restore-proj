import { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import {
  Shield,
  CreditCard,
  Bell,
  ChevronRight,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  Loader2,
  Accessibility,
  Sun,
  Moon,
  Glasses,
  Leaf,
  Sparkles,
  Contrast,
  PanelLeftClose,
  Lock,
  Mail,
  MessageCircle,
  Briefcase,
  Settings2,
  Zap,
  Activity,
  Database,
  UserCog,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useSettingsStore } from '@/stores/settingsStore';
import { JobSourcesSettingsTab } from '@/app/settings/JobSourcesSettingsTab';
import { useThemeStore, THEME_CHOICES, type ThemeId } from '@/stores/themeStore';
import { api } from '@/lib/api';
import { isTrpcUnauthorizedError } from '@/lib/trpc-auth-redirect';
import { resolveActiveSettingsTab } from './settingsTabFromUrl';
import { UserProductSettingsTab } from './UserProductSettingsTab';
import AutoApplyPage from '@/app/autopilot/AutoApplyPage';

// ─── Types ────────────────────────────────────────────────────────────────────

type EmailProvider = 'gmail' | 'outlook' | 'yahoo' | 'custom';

interface ProviderPreset {
  label: string;
  logo: string;
  host: string;
  port: number;
}

const PROVIDER_PRESETS: Record<EmailProvider, ProviderPreset> = {
  gmail:   { label: 'Gmail',       logo: 'G', host: 'smtp.gmail.com',          port: 587 },
  outlook: { label: 'Outlook',     logo: 'O', host: 'smtp-mail.outlook.com',    port: 587 },
  yahoo:   { label: 'Yahoo',       logo: 'Y', host: 'smtp.mail.yahoo.com',      port: 587 },
  custom:  { label: 'Custom SMTP', logo: '#', host: '',                         port: 587 },
};

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
        checked ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
      }`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeading({ icon: Icon, title, desc }: { icon: typeof Mail; title: string; desc?: string }) {
  return (
    <div className="flex items-center gap-3 pb-1">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-white">{title}</h3>
        {desc && <p className="text-xs text-slate-500">{desc}</p>}
      </div>
    </div>
  );
}

// ─── Consent row ─────────────────────────────────────────────────────────────

function ConsentRow({
  label, desc, checked, onChange,
}: { label: string; desc: string; checked: boolean; onChange: () => void }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-white/8 bg-white/[0.03] p-4 transition hover:bg-white/[0.05]">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-200">{label}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{desc}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

// ─── Email Settings ───────────────────────────────────────────────────────────

function EmailSettingsTab({ userId }: { userId: string }) {
  const { user, isLoaded: userLoaded } = useUser();
  const accountEmail = user?.primaryEmailAddress?.emailAddress?.trim() ?? '';

  const [provider, setProvider] = useState<EmailProvider | null>(null);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [fromName, setFromName] = useState('');
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState(587);
  const [showPass, setShowPass] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; error?: string } | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const utils = api.useUtils();

  const { data: existingSettings, isLoading: loadingSettings } = api.emailSettings.getSettings.useQuery(
    { userId }, { enabled: !!userId },
  );
  const saveMutation   = api.emailSettings.saveSettings.useMutation();
  const testMutation   = api.emailSettings.testConnection.useMutation();
  const removeMutation = api.emailSettings.removeSettings.useMutation();

  useEffect(() => {
    if (!userLoaded || loadingSettings) return;
    if (existingSettings) {
      const prov = existingSettings.provider as EmailProvider;
      setProvider(prov);
      setSmtpUser(existingSettings.smtpUser?.trim() || accountEmail || '');
      setFromName(existingSettings.fromName ?? '');
      setSmtpHost(existingSettings.smtpHost ?? '');
      setSmtpPort(existingSettings.smtpPort ?? 587);
      return;
    }
    if (accountEmail) setSmtpUser(accountEmail);
  }, [userLoaded, loadingSettings, existingSettings, accountEmail]);

  const handleProviderSelect = (p: EmailProvider) => {
    setProvider(p);
    const preset = PROVIDER_PRESETS[p];
    setSmtpHost(preset.host);
    setSmtpPort(preset.port);
    setTestResult(null);
    setSaveStatus('idle');
  };

  const handleSaveAndTest = async () => {
    if (!provider) return;
    setSaveStatus('saving');
    setTestResult(null);
    try {
      await saveMutation.mutateAsync({
        userId, provider,
        smtpHost: provider === 'custom' ? smtpHost : undefined,
        smtpPort: provider === 'custom' ? smtpPort : undefined,
        smtpUser,
        smtpPass: smtpPass || undefined,
        fromName: fromName || undefined,
      });
      setSaveStatus('saved');
      const result = await testMutation.mutateAsync({ userId });
      setTestResult(result);
      void utils.emailSettings.getSettings.invalidate({ userId });
    } catch {
      setSaveStatus('error');
    }
  };

  const handleRemove = async () => {
    await removeMutation.mutateAsync({ userId });
    setProvider(null); setSmtpUser(''); setSmtpPass(''); setFromName('');
    setSmtpHost(''); setSmtpPort(587); setTestResult(null); setSaveStatus('idle');
    void utils.emailSettings.getSettings.invalidate({ userId });
  };

  const statusBadge = () => {
    if (loadingSettings) return null;
    if (existingSettings?.isVerified)
      return <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 border border-emerald-500/20"><CheckCircle2 className="h-3.5 w-3.5" /> Connected</span>;
    if (existingSettings)
      return <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400 border border-red-500/20"><XCircle className="h-3.5 w-3.5" /> Not verified</span>;
    return <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400 border border-amber-500/20"><AlertTriangle className="h-3.5 w-3.5" /> Not configured</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SectionHeading icon={Mail} title="Email / SMTP" desc="Outgoing email for automated follow-ups and cover letters" />
        {statusBadge()}
      </div>

      {/* Provider tiles */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {(Object.entries(PROVIDER_PRESETS) as [EmailProvider, ProviderPreset][]).map(([key, preset]) => (
          <button
            key={key}
            type="button"
            onClick={() => handleProviderSelect(key)}
            className={`flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all ${
              provider === key
                ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300'
                : 'border-white/8 bg-white/[0.03] text-slate-400 hover:border-white/15 hover:text-white'
            }`}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-lg font-bold">{preset.logo}</span>
            <span className="text-xs font-medium">{preset.label}</span>
          </button>
        ))}
      </div>

      {provider && (
        <div className="space-y-4 rounded-2xl border border-white/8 bg-white/[0.02] p-5">
          {(provider === 'gmail' || provider === 'outlook') && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/8 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              <p className="text-xs text-amber-300">Use an <strong>App Password</strong>, not your regular account password.</p>
            </div>
          )}
          {provider === 'custom' && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">SMTP Host</label>
                <input type="text" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} placeholder="smtp.example.com"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none focus:border-indigo-500/50" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">SMTP Port</label>
                <input type="number" value={smtpPort} onChange={(e) => setSmtpPort(Number(e.target.value))} placeholder="587"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/50" />
              </div>
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">SMTP User (email)</label>
            <input type="email" value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} placeholder="you@example.com"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none focus:border-indigo-500/50" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">Password / App Password</label>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} value={smtpPass} onChange={(e) => setSmtpPass(e.target.value)}
                placeholder={existingSettings ? '••••••••  (leave blank to keep current)' : 'App password'}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 pr-10 text-sm text-white placeholder:text-slate-600 outline-none focus:border-indigo-500/50" />
              <button type="button" onClick={() => setShowPass((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">From Name</label>
            <input type="text" value={fromName} onChange={(e) => setFromName(e.target.value)} placeholder="Your Name"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none focus:border-indigo-500/50" />
          </div>

          {testResult && (
            <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${testResult.ok ? 'border-emerald-500/25 bg-emerald-500/8 text-emerald-300' : 'border-red-500/25 bg-red-500/8 text-red-300'}`}>
              {testResult.ok ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <XCircle className="h-4 w-4 shrink-0" />}
              {testResult.ok ? 'Connection successful ✓' : (testResult.error ?? 'Connection failed')}
            </div>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button type="button" onClick={() => void handleSaveAndTest()} disabled={saveMutation.isPending || testMutation.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60">
              {(saveMutation.isPending || testMutation.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
              {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' && testMutation.isPending ? 'Testing…' : 'Save & Test'}
            </button>
            {existingSettings && (
              <button type="button" onClick={() => void handleRemove()} disabled={removeMutation.isPending}
                className="inline-flex items-center gap-2 rounded-xl border border-red-500/25 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/10 disabled:opacity-60">
                {removeMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Remove
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Telegram Settings ────────────────────────────────────────────────────────

function TelegramSettingsTab({ userId }: { userId: string }) {
  const [chatId, setChatId] = useState('');
  const [notifyOnApply, setNotifyOnApply] = useState(true);
  const [notifyOnReply, setNotifyOnReply] = useState(true);
  const [notifyOnInterview, setNotifyOnInterview] = useState(true);
  const [verifyResult, setVerifyResult] = useState<{ ok: boolean; error?: string } | null>(null);
  const [testResult, setTestResult] = useState<{ ok: boolean } | null>(null);

  const utils = api.useUtils();
  const { data: existingSettings, isLoading: loadingSettings } = api.telegram.getSettings.useQuery({ userId }, { enabled: !!userId });
  const saveMutation     = api.telegram.saveSettings.useMutation();
  const verifyMutation   = api.telegram.verify.useMutation();
  const sendTestMutation = api.telegram.sendTest.useMutation();
  const removeMutation   = api.telegram.removeSettings.useMutation();

  useEffect(() => {
    if (existingSettings) {
      setChatId(existingSettings.chatId ?? '');
      setNotifyOnApply(existingSettings.notifyOnApply ?? true);
      setNotifyOnReply(existingSettings.notifyOnReply ?? true);
      setNotifyOnInterview(existingSettings.notifyOnInterview ?? true);
    }
  }, [existingSettings]);

  const handleVerifySave = async () => {
    setVerifyResult(null); setTestResult(null);
    await saveMutation.mutateAsync({ userId, chatId, notifyOnApply, notifyOnReply, notifyOnInterview });
    const result = await verifyMutation.mutateAsync({ userId });
    setVerifyResult(result);
    void utils.telegram.getSettings.invalidate({ userId });
  };

  const handleSendTest = async () => {
    setTestResult(null);
    const result = await sendTestMutation.mutateAsync({ userId });
    setTestResult(result);
  };

  const handleDisconnect = async () => {
    await removeMutation.mutateAsync({ userId });
    setChatId(''); setNotifyOnApply(true); setNotifyOnReply(true); setNotifyOnInterview(true);
    setVerifyResult(null); setTestResult(null);
    void utils.telegram.getSettings.invalidate({ userId });
  };

  const isActive = existingSettings?.isActive;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SectionHeading icon={MessageCircle} title="Telegram Notifications" desc="Get instant job application alerts via @MultivoHubBot" />
        {!loadingSettings && (
          isActive
            ? <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400"><CheckCircle2 className="h-3.5 w-3.5" /> Active</span>
            : <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400"><AlertTriangle className="h-3.5 w-3.5" /> Not connected</span>
        )}
      </div>

      {/* Setup steps */}
      <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Setup — 4 steps</p>
        <ol className="space-y-2.5 text-sm text-slate-300">
          {[
            <>Open Telegram · search <strong>@MultivoHubBot</strong></>,
            <>Send <code className="rounded bg-white/10 px-1 text-xs">/start</code> to the bot</>,
            <>Copy your <strong>Chat ID</strong> from the bot's reply</>,
            <>Paste below → click <strong>Verify & Save</strong></>,
          ].map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-bold text-indigo-300">{i + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-400">Chat ID</label>
        <input type="text" value={chatId} onChange={(e) => setChatId(e.target.value)} placeholder="e.g. 123456789"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-indigo-500/50" />
      </div>

      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Notify me when…</p>
        {[
          { label: 'New application sent',    value: notifyOnApply,     setter: () => setNotifyOnApply((v) => !v) },
          { label: 'Reply received',          value: notifyOnReply,     setter: () => setNotifyOnReply((v) => !v) },
          { label: 'Interview scheduled',     value: notifyOnInterview, setter: () => setNotifyOnInterview((v) => !v) },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
            <span className="text-sm text-slate-300">{item.label}</span>
            <Toggle checked={item.value} onChange={item.setter} />
          </div>
        ))}
      </div>

      {verifyResult && (
        <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${verifyResult.ok ? 'border-emerald-500/25 bg-emerald-500/8 text-emerald-300' : 'border-red-500/25 bg-red-500/8 text-red-300'}`}>
          {verifyResult.ok ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <XCircle className="h-4 w-4 shrink-0" />}
          {verifyResult.ok ? 'Chat ID verified ✓' : (verifyResult.error ?? 'Verification failed')}
        </div>
      )}
      {testResult && (
        <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${testResult.ok ? 'border-emerald-500/25 bg-emerald-500/8 text-emerald-300' : 'border-red-500/25 bg-red-500/8 text-red-300'}`}>
          {testResult.ok ? <Send className="h-4 w-4 shrink-0" /> : <XCircle className="h-4 w-4 shrink-0" />}
          {testResult.ok ? 'Test message sent — check your Telegram!' : 'Failed to send test message'}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => void handleVerifySave()} disabled={!chatId.trim() || saveMutation.isPending || verifyMutation.isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60">
          {(saveMutation.isPending || verifyMutation.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
          Verify & Save
        </button>
        {existingSettings && (
          <>
            <button type="button" onClick={() => void handleSendTest()} disabled={sendTestMutation.isPending}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5 disabled:opacity-60">
              {sendTestMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send Test
            </button>
            <button type="button" onClick={() => void handleDisconnect()} disabled={removeMutation.isPending}
              className="inline-flex items-center gap-2 rounded-xl border border-red-500/25 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/10 disabled:opacity-60">
              {removeMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Disconnect
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── System Readiness ─────────────────────────────────────────────────────────

function SystemReadinessTab({ userId }: { userId: string }) {
  const { data: profile, isError: profileQueryError, error: profileQueryErr, refetch: refetchProfile, isFetching: profileRefetching } =
    api.profile.getProfile.useQuery(undefined, { enabled: !!userId });
  const { data: emailSettings } = api.emailSettings.getSettings.useQuery({ userId }, { enabled: !!userId });
  const { data: latestCv } = api.cv.getLatest.useQuery({ userId }, { enabled: !!userId });

  const profileScore = (() => {
    if (!profile) return 0;
    const checks = [!!profile.personalInfo.fullName, !!profile.personalInfo.summary, profile.skills.length > 0];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  })();

  const items = [
    { label: 'Profile',            value: profileScore },
    { label: 'Email Integration',  value: emailSettings ? 100 : 0 },
    { label: 'CV Upload',          value: latestCv ? 100 : 0 },
    { label: 'Job Sources',        value: 60 },
  ];

  const getStatus = (v: number) => v === 100 ? 'Ready' : v > 0 ? 'In Progress' : 'Missing';
  const sessionOk = !!profile && !profileQueryError;

  return (
    <div className="space-y-6">
      <SectionHeading icon={Activity} title="System Readiness" desc="Check that all app components are connected and working" />

      {/* API session check */}
      <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-200">API session (Clerk → server)</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Confirms your sign-in token is accepted by the backend. Use after "Authentication required" errors.
            </p>
          </div>
          <button type="button" onClick={() => void refetchProfile()} disabled={!userId || profileRefetching}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/10 disabled:opacity-60">
            {profileRefetching && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Check session
          </button>
        </div>
        {profileQueryError && (
          <p className="mt-3 text-xs text-red-400">
            {isTrpcUnauthorizedError(profileQueryErr)
              ? 'The server did not accept your session. Open Sign in from the menu and try again.'
              : profileQueryErr instanceof Error ? profileQueryErr.message : 'Request failed.'}
          </p>
        )}
        {sessionOk && !profileRefetching && (
          <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" /> Server recognises your account.
          </p>
        )}
      </div>

      {/* Component bars */}
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.label}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="font-medium text-slate-300">{item.label}</span>
              <span className={`text-xs font-semibold ${item.value === 100 ? 'text-emerald-400' : item.value > 0 ? 'text-amber-400' : 'text-red-400'}`}>
                {getStatus(item.value)}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/8">
              <div className={`h-full rounded-full transition-all ${item.value === 100 ? 'bg-emerald-500' : item.value > 0 ? 'bg-indigo-500' : 'bg-slate-700'}`}
                style={{ width: `${item.value}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Appearance (Accessibility) ───────────────────────────────────────────────

const THEME_ICONS: Record<ThemeId, typeof Moon> = {
  'soft-dark': Moon,
  'soft-light': Sun,
  'calm-blue': Contrast,
  sage: Leaf,
  'warm-sand': Sparkles,
  'accessible-contrast': Glasses,
};

function AppearanceTab() {
  const { theme, setTheme, focusMode, setFocusMode } = useThemeStore();

  return (
    <div className="space-y-8">
      {/* Theme */}
      <div className="space-y-4">
        <SectionHeading icon={Accessibility} title="Colour Theme" desc="Pick a palette that fits your eyes and focus style" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {THEME_CHOICES.map(({ id, label, hint }) => {
            const Icon = THEME_ICONS[id];
            const isActive = theme === id;
            return (
              <button key={id} type="button" onClick={() => setTheme(id)} aria-pressed={isActive}
                className={`group flex flex-col items-start gap-3 rounded-2xl border p-4 text-left transition-all ${
                  isActive
                    ? 'border-indigo-500/50 bg-indigo-500/10'
                    : 'border-white/8 bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.05]'
                }`}
              >
                <div className="flex w-full items-center gap-3">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${isActive ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-400 group-hover:bg-white/10'}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{label}</span>
                      {isActive && <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-300">Active</span>}
                    </div>
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-slate-500">{hint}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Focus Mode */}
      <div className="space-y-4">
        <SectionHeading icon={PanelLeftClose} title="Focus Mode" desc="Hide the sidebar to reduce distraction" />
        <div className="flex items-start justify-between gap-4 rounded-2xl border border-white/8 bg-white/[0.03] p-5">
          <div>
            <p className="text-sm font-medium text-slate-200">Hide sidebar navigation</p>
            <p className="mt-0.5 text-xs text-slate-500">
              Hides the left sidebar. Toggle it back on from the header at any time.
            </p>
          </div>
          <Toggle checked={focusMode} onChange={() => setFocusMode(!focusMode)} />
        </div>
      </div>

      {/* Reduced Motion */}
      <div className="space-y-4">
        <SectionHeading icon={Sparkles} title="Reduced Motion" desc="Managed by your OS accessibility settings" />
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5 text-sm text-slate-400 space-y-2">
          <p>MultivoHub automatically respects <strong className="text-slate-300">Reduce Motion</strong> from your OS.</p>
          <ul className="space-y-1 text-xs text-slate-500">
            <li><strong className="text-slate-400">macOS:</strong> System Settings → Accessibility → Display → Reduce Motion</li>
            <li><strong className="text-slate-400">Windows:</strong> Settings → Accessibility → Visual effects → Animation effects</li>
            <li><strong className="text-slate-400">iOS:</strong> Settings → Accessibility → Motion → Reduce Motion</li>
            <li><strong className="text-slate-400">Android:</strong> Settings → Accessibility → Remove animations</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// ─── Consent / Privacy tab ────────────────────────────────────────────────────

const CONSENT_KEY = 'mvh-consents';
function loadConsents() {
  try { const raw = localStorage.getItem(CONSENT_KEY); if (raw) return JSON.parse(raw) as Record<string, boolean>; } catch { /* ignore */ }
  return {};
}
function saveConsents(c: Record<string, boolean>) { localStorage.setItem(CONSENT_KEY, JSON.stringify(c)); }

function PrivacyConsentTab() {
  const saved = loadConsents();
  const [consentLinkedin, setConsentLinkedin] = useState(saved.linkedin ?? false);
  const [consentFacebook, setConsentFacebook] = useState(saved.facebook ?? false);
  const [consentInstagram, setConsentInstagram] = useState(saved.instagram ?? false);
  const [consentSmtp, setConsentSmtp] = useState(saved.smtp ?? false);
  const [consentImapTracking, setConsentImapTracking] = useState(saved.imapTracking ?? false);
  const [consentImapOffers, setConsentImapOffers] = useState(saved.imapOffers ?? false);
  const [consentAutoApply, setConsentAutoApply] = useState(saved.autoApply ?? false);
  const [consentPush, setConsentPush] = useState(saved.push ?? false);

  const toggle = (key: string, current: boolean, setter: (v: boolean) => void) => {
    const next = !current; setter(next);
    const c = loadConsents(); c[key] = next; saveConsents(c);
  };

  return (
    <div className="space-y-8">
      {/* Social */}
      <div className="space-y-3">
        <SectionHeading icon={UserCog} title="Social Profile Analysis" desc="Allow AI to analyse your public profiles for better job matching" />
        {[
          { key: 'linkedin',  label: 'LinkedIn',  desc: 'Analyse your public work history and professional network.',      checked: consentLinkedin,  setter: setConsentLinkedin },
          { key: 'facebook',  label: 'Facebook',  desc: 'Analyse public professional interests and career activity.',     checked: consentFacebook,  setter: setConsentFacebook },
          { key: 'instagram', label: 'Instagram', desc: 'Analyse your public personal brand for role alignment.',         checked: consentInstagram, setter: setConsentInstagram },
        ].map(({ key, label, desc, checked, setter }) => (
          <ConsentRow key={key} label={label} desc={desc} checked={checked} onChange={() => toggle(key, checked, setter)} />
        ))}
      </div>

      {/* Email & inbox */}
      <div className="space-y-3">
        <SectionHeading icon={Mail} title="Email & Inbox" desc="Control what AI may do with your email account" />
        <ConsentRow
          label="Outgoing emails (SMTP)"
          desc="Allow MultivoHub to send applications, cover letters and follow-ups from your configured email address. Configure in the Integrations tab."
          checked={consentSmtp}
          onChange={() => toggle('smtp', consentSmtp, setConsentSmtp)}
        />
        <ConsentRow
          label="Incoming mail — application tracking (IMAP)"
          desc="AI reads incoming emails to detect employer replies (invites, rejections, offers) and automatically updates application statuses. Message bodies are processed locally and never stored."
          checked={consentImapTracking}
          onChange={() => toggle('imapTracking', consentImapTracking, setConsentImapTracking)}
        />
        <ConsentRow
          label="Incoming mail — inbound job offers"
          desc="AI detects recruiter emails with job opportunities and surfaces them in Job Listings. Only extracted job metadata is stored (title, company, salary range) — no email content."
          checked={consentImapOffers}
          onChange={() => toggle('imapOffers', consentImapOffers, setConsentImapOffers)}
        />
      </div>

      {/* Auto-apply */}
      <div className="space-y-3">
        <SectionHeading icon={Zap} title="Auto-Apply" desc="Let AI submit applications on your behalf" />
        <ConsentRow
          label="Automatic job applications"
          desc="Allow AI to submit applications for roles meeting your auto-apply threshold (set in Profile & Goals). You will be notified of every submission."
          checked={consentAutoApply}
          onChange={() => toggle('autoApply', consentAutoApply, setConsentAutoApply)}
        />
      </div>

      {/* Push */}
      <div className="space-y-3">
        <SectionHeading icon={Bell} title="Push Notifications" desc="Browser alerts for job activity and reminders" />
        <ConsentRow
          label="Browser push notifications"
          desc="Receive alerts for interview invites, application updates, matched jobs and daily warmup reminders. Your browser will ask for permission."
          checked={consentPush}
          onChange={async () => {
            if (!consentPush) {
              const perm = await Notification.requestPermission();
              if (perm !== 'granted') return;
            }
            toggle('push', consentPush, setConsentPush);
          }}
        />
      </div>

      <p className="text-xs text-slate-600">
        We never sell your data. See our{' '}
        <Link to="/privacy" className="text-indigo-400 hover:underline">Privacy Policy</Link>,{' '}
        <Link to="/terms" className="text-indigo-400 hover:underline">Terms</Link>, and{' '}
        <Link to="/cookies" className="text-indigo-400 hover:underline">Cookie Policy</Link>.
      </p>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function SettingsHub() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useUser();
  const userId = user?.id ?? '';

  const tabFromUrl = searchParams.get('tab');
  const activeTab = resolveActiveSettingsTab(tabFromUrl);

  const onTabChange = (value: string) => {
    if (value === 'overview') setSearchParams({}, { replace: true });
    else setSearchParams({ tab: value }, { replace: true });
  };

  const { emailNotifications, loadSettings, toggleEmailNotifications } = useSettingsStore();
  useEffect(() => { void loadSettings(); }, [loadSettings]);

  // Overview quick links
  const OVERVIEW_LINKS = [
    { label: 'Security, passkeys & 2FA', icon: Shield,     href: '/security', desc: 'Manage sign-in methods and two-factor' },
    { label: 'Billing & Credits',        icon: CreditCard, href: '/billing',  desc: 'Plans, usage and payment methods' },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Configure your workspace, integrations and preferences.</p>
      </div>

      <Tabs value={activeTab} onValueChange={onTabChange}>
        {/* ── Tab bar ── */}
        <TabsList className="flex-wrap gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="accessibility">Appearance</TabsTrigger>
          <TabsTrigger value="privacy">Privacy & Consent</TabsTrigger>
          <TabsTrigger value="email">Integrations</TabsTrigger>
          <TabsTrigger value="sources">Job Sources</TabsTrigger>
          <TabsTrigger value="server">App Preferences</TabsTrigger>
          <TabsTrigger value="auto-apply">Auto Apply</TabsTrigger>
          <TabsTrigger value="readiness">System</TabsTrigger>
        </TabsList>

        {/* ══ OVERVIEW ══════════════════════════════════════════════════════════ */}
        <TabsContent value="overview">
          <div className="space-y-5">
            {/* Quick links */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {OVERVIEW_LINKS.map((link) => (
                <button key={link.href} onClick={() => void navigate(link.href)}
                  className="group flex items-center gap-4 rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-left transition-all hover:border-white/15 hover:bg-white/[0.06]">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 transition group-hover:bg-indigo-500/15">
                    <link.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white">{link.label}</p>
                    <p className="text-xs text-slate-500">{link.desc}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-600 transition group-hover:text-indigo-400" />
                </button>
              ))}
            </div>

            {/* Notifications */}
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
              <div className="mb-4 flex items-center gap-3">
                <Bell className="h-4 w-4 text-indigo-400" />
                <span className="text-sm font-semibold text-white">Notifications</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-200">Email notifications</p>
                  <p className="text-xs text-slate-500">Updates about jobs, interviews and alerts</p>
                </div>
                <Toggle checked={emailNotifications} onChange={toggleEmailNotifications} />
              </div>
            </div>

            {/* Quick setting tiles */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Appearance',      tab: 'accessibility', icon: Accessibility },
                { label: 'Privacy',         tab: 'privacy',       icon: Lock },
                { label: 'Integrations',    tab: 'email',         icon: Mail },
                { label: 'Job Sources',     tab: 'sources',       icon: Briefcase },
                { label: 'App Preferences', tab: 'server',        icon: Settings2 },
                { label: 'Auto Apply',      tab: 'auto-apply',    icon: Zap },
                { label: 'System',          tab: 'readiness',     icon: Database },
              ].map(({ label, tab, icon: Icon }) => (
                <button key={tab} onClick={() => onTabChange(tab)}
                  className="flex flex-col items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-left transition hover:border-white/15 hover:bg-white/[0.06]">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-300">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ══ APPEARANCE ════════════════════════════════════════════════════════ */}
        <TabsContent value="accessibility">
          <AppearanceTab />
        </TabsContent>

        {/* ══ PRIVACY & CONSENT ════════════════════════════════════════════════ */}
        <TabsContent value="privacy">
          <PrivacyConsentTab />
        </TabsContent>

        {/* ══ INTEGRATIONS (Email + Telegram) ══════════════════════════════════ */}
        <TabsContent value="email">
          <div className="space-y-10">
            {userId
              ? <EmailSettingsTab userId={userId} />
              : <p className="text-sm text-slate-500">Loading…</p>}
            <div className="border-t border-white/8 pt-8">
              {userId
                ? <TelegramSettingsTab userId={userId} />
                : <p className="text-sm text-slate-500">Loading…</p>}
            </div>
          </div>
        </TabsContent>

        {/* ══ JOB SOURCES ═══════════════════════════════════════════════════════ */}
        <TabsContent value="sources">
          {userId
            ? <JobSourcesSettingsTab userId={userId} />
            : <p className="text-sm text-slate-500">Loading…</p>}
        </TabsContent>

        {/* ══ APP PREFERENCES ══════════════════════════════════════════════════ */}
        <TabsContent value="server">
          <div className="space-y-4">
            <SectionHeading icon={Settings2} title="App Preferences" desc="Preferences stored per account in MySQL" />
            <UserProductSettingsTab />
          </div>
        </TabsContent>

        {/* ══ AUTO APPLY ════════════════════════════════════════════════════════ */}
        <TabsContent value="auto-apply">
          <AutoApplyPage />
        </TabsContent>

        {/* ══ SYSTEM ════════════════════════════════════════════════════════════ */}
        <TabsContent value="readiness">
          {userId
            ? <SystemReadinessTab userId={userId} />
            : <p className="text-sm text-slate-500">Loading…</p>}
        </TabsContent>
      </Tabs>
    </div>
  );
}
