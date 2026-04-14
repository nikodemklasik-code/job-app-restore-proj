import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import {
  Shield,
  CreditCard,
  Bell,
  Plug,
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
  Anchor,
  PanelLeftClose,
  Lock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useSettingsStore } from '@/stores/settingsStore';
import { useThemeStore } from '@/stores/themeStore';
import { api } from '@/lib/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EmailProvider = 'gmail' | 'outlook' | 'yahoo' | 'custom';

interface ProviderPreset {
  label: string;
  logo: string;
  host: string;
  port: number;
}

const PROVIDER_PRESETS: Record<EmailProvider, ProviderPreset> = {
  gmail: { label: 'Gmail', logo: 'G', host: 'smtp.gmail.com', port: 587 },
  outlook: { label: 'Outlook', logo: 'O', host: 'smtp-mail.outlook.com', port: 587 },
  yahoo: { label: 'Yahoo', logo: 'Y', host: 'smtp.mail.yahoo.com', port: 587 },
  custom: { label: 'Custom SMTP', logo: '#', host: '', port: 587 },
};

// ---------------------------------------------------------------------------
// Quick links
// ---------------------------------------------------------------------------

const QUICK_LINKS = [
  { label: 'Security & Passkeys', icon: Shield, href: '/security' },
  { label: 'Billing & Credits', icon: CreditCard, href: '/billing' },
];

// ---------------------------------------------------------------------------
// Toggle switch component
// ---------------------------------------------------------------------------

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
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

// ---------------------------------------------------------------------------
// Email Settings Tab
// ---------------------------------------------------------------------------

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
    { userId },
    { enabled: !!userId },
  );

  const saveMutation = api.emailSettings.saveSettings.useMutation();
  const testMutation = api.emailSettings.testConnection.useMutation();
  const removeMutation = api.emailSettings.removeSettings.useMutation();

  // From DB when present; otherwise default SMTP user to the signed-in account email (Clerk).
  useEffect(() => {
    if (!userLoaded || loadingSettings) return;
    if (existingSettings) {
      const prov = existingSettings.provider as EmailProvider;
      setProvider(prov);
      const savedUser = existingSettings.smtpUser?.trim();
      setSmtpUser(savedUser || accountEmail || '');
      setFromName(existingSettings.fromName ?? '');
      setSmtpHost(existingSettings.smtpHost ?? '');
      setSmtpPort(existingSettings.smtpPort ?? 587);
      return;
    }
    if (accountEmail) {
      setSmtpUser(accountEmail);
    }
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
        userId,
        provider,
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
    setProvider(null);
    setSmtpUser('');
    setSmtpPass('');
    setFromName('');
    setSmtpHost('');
    setSmtpPort(587);
    setTestResult(null);
    setSaveStatus('idle');
    void utils.emailSettings.getSettings.invalidate({ userId });
  };

  const statusBadge = () => {
    if (loadingSettings) return null;
    if (existingSettings?.isVerified) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5" /> Connected
        </span>
      );
    }
    if (existingSettings) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-400">
          <XCircle className="h-3.5 w-3.5" /> Not verified
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-400">
        <AlertTriangle className="h-3.5 w-3.5" /> Not configured
      </span>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Email &amp; SMTP Configuration</CardTitle>
          {statusBadge()}
        </div>
        <p className="text-sm text-slate-500">Configure outgoing email for automated follow-ups and cover letters.</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Provider cards */}
        <div>
          <p className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">Select provider</p>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {(Object.entries(PROVIDER_PRESETS) as [EmailProvider, ProviderPreset][]).map(([key, preset]) => (
              <button
                key={key}
                type="button"
                onClick={() => handleProviderSelect(key)}
                className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all ${
                  provider === key
                    ? 'border-indigo-500 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-950'
                    : 'border-slate-100 bg-white hover:border-indigo-100 dark:border-slate-800 dark:bg-slate-900'
                }`}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-lg font-bold dark:bg-slate-800">
                  {preset.logo}
                </span>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{preset.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        {provider && (
          <div className="space-y-4">
            {(provider === 'gmail' || provider === 'outlook') && (
              <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Use an <strong>App Password</strong>, not your regular account password.
                </p>
              </div>
            )}

            {provider === 'custom' && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    SMTP Host
                  </label>
                  <input
                    type="text"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    placeholder="smtp.example.com"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    SMTP Port
                  </label>
                  <input
                    type="number"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(Number(e.target.value))}
                    placeholder="587"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                SMTP User (email)
              </label>
              <input
                type="email"
                value={smtpUser}
                onChange={(e) => setSmtpUser(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Password / App Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={smtpPass}
                  onChange={(e) => setSmtpPass(e.target.value)}
                  placeholder={existingSettings ? '••••••••  (leave blank to keep current)' : 'App password'}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pr-10 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                From Name
              </label>
              <input
                type="text"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                placeholder="Your Name"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              />
            </div>

            {/* Test result */}
            {testResult && (
              <div
                className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
                  testResult.ok
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300'
                }`}
              >
                {testResult.ok ? (
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 flex-shrink-0" />
                )}
                {testResult.ok ? 'Connection successful ✓' : (testResult.error ?? 'Connection failed')}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => void handleSaveAndTest()}
                disabled={saveMutation.isPending || testMutation.isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
              >
                {(saveMutation.isPending || testMutation.isPending) && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' && testMutation.isPending ? 'Testing…' : 'Save & Test'}
              </button>

              {existingSettings && (
                <button
                  type="button"
                  onClick={() => void handleRemove()}
                  disabled={removeMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                >
                  {removeMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Remove
                </button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Telegram Settings Tab
// ---------------------------------------------------------------------------

function TelegramSettingsTab({ userId }: { userId: string }) {
  const [chatId, setChatId] = useState('');
  const [notifyOnApply, setNotifyOnApply] = useState(true);
  const [notifyOnReply, setNotifyOnReply] = useState(true);
  const [notifyOnInterview, setNotifyOnInterview] = useState(true);
  const [verifyResult, setVerifyResult] = useState<{ ok: boolean; error?: string } | null>(null);
  const [testResult, setTestResult] = useState<{ ok: boolean } | null>(null);

  const utils = api.useUtils();

  const { data: existingSettings, isLoading: loadingSettings } = api.telegram.getSettings.useQuery(
    { userId },
    { enabled: !!userId },
  );

  const saveMutation = api.telegram.saveSettings.useMutation();
  const verifyMutation = api.telegram.verify.useMutation();
  const sendTestMutation = api.telegram.sendTest.useMutation();
  const removeMutation = api.telegram.removeSettings.useMutation();

  useEffect(() => {
    if (existingSettings) {
      setChatId(existingSettings.chatId ?? '');
      setNotifyOnApply(existingSettings.notifyOnApply ?? true);
      setNotifyOnReply(existingSettings.notifyOnReply ?? true);
      setNotifyOnInterview(existingSettings.notifyOnInterview ?? true);
    }
  }, [existingSettings]);

  const handleVerifySave = async () => {
    setVerifyResult(null);
    setTestResult(null);
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
    setChatId('');
    setNotifyOnApply(true);
    setNotifyOnReply(true);
    setNotifyOnInterview(true);
    setVerifyResult(null);
    setTestResult(null);
    void utils.telegram.getSettings.invalidate({ userId });
  };

  const isActive = existingSettings?.isActive;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-bold">Job Hunter App</CardTitle>
            <p className="mt-1 text-sm text-slate-500">
              Get instant Telegram notifications about your job applications.
            </p>
          </div>
          {!loadingSettings && (
            isActive ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" /> Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                <AlertTriangle className="h-3.5 w-3.5" /> Not connected
              </span>
            )
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Setup steps */}
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Setup instructions</p>
          <ol className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
            <li className="flex gap-3">
              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300">
                1
              </span>
              Open Telegram, search for <strong>@MultivoHubBot</strong>
            </li>
            <li className="flex gap-3">
              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300">
                2
              </span>
              Send <code className="rounded bg-slate-200 px-1 dark:bg-slate-700">/start</code> to the bot
            </li>
            <li className="flex gap-3">
              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300">
                3
              </span>
              Copy your <strong>Chat ID</strong> from the bot&apos;s response
            </li>
            <li className="flex gap-3">
              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300">
                4
              </span>
              Paste it below and click <strong>Verify &amp; Save</strong>
            </li>
          </ol>
        </div>

        {/* Chat ID */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">Chat ID</label>
          <input
            type="text"
            value={chatId}
            onChange={(e) => setChatId(e.target.value)}
            placeholder="e.g. 123456789"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          />
        </div>

        {/* Notification toggles */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-slate-700 dark:text-slate-300">Notify me when…</p>
          {[
            { label: 'New application sent', value: notifyOnApply, setter: () => setNotifyOnApply((v) => !v) },
            { label: 'Reply received', value: notifyOnReply, setter: () => setNotifyOnReply((v) => !v) },
            { label: 'Interview scheduled', value: notifyOnInterview, setter: () => setNotifyOnInterview((v) => !v) },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <span className="text-sm text-slate-700 dark:text-slate-300">{item.label}</span>
              <Toggle checked={item.value} onChange={item.setter} />
            </div>
          ))}
        </div>

        {/* Result banners */}
        {verifyResult && (
          <div
            className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
              verifyResult.ok
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300'
            }`}
          >
            {verifyResult.ok ? (
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 flex-shrink-0" />
            )}
            {verifyResult.ok ? 'Chat ID verified successfully ✓' : (verifyResult.error ?? 'Verification failed')}
          </div>
        )}

        {testResult && (
          <div
            className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
              testResult.ok
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300'
            }`}
          >
            {testResult.ok ? <Send className="h-4 w-4 flex-shrink-0" /> : <XCircle className="h-4 w-4 flex-shrink-0" />}
            {testResult.ok ? 'Test message sent — check your Telegram!' : 'Failed to send test message'}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => void handleVerifySave()}
            disabled={!chatId.trim() || saveMutation.isPending || verifyMutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
          >
            {(saveMutation.isPending || verifyMutation.isPending) && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            Verify &amp; Save
          </button>

          {existingSettings && (
            <button
              type="button"
              onClick={() => void handleSendTest()}
              disabled={sendTestMutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {sendTestMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send Test Message
            </button>
          )}

          {existingSettings && (
            <button
              type="button"
              onClick={() => void handleDisconnect()}
              disabled={removeMutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
            >
              {removeMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Disconnect
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// System Readiness Tab
// ---------------------------------------------------------------------------

function SystemReadinessTab({ userId }: { userId: string }) {
  const { data: profile } = api.profile.getProfile.useQuery(
    undefined,
    { enabled: !!userId },
  );
  const { data: emailSettings } = api.emailSettings.getSettings.useQuery(
    { userId },
    { enabled: !!userId },
  );
  const { data: latestCv } = api.cv.getLatest.useQuery(
    { userId },
    { enabled: !!userId },
  );

  const profileScore = (() => {
    if (!profile) return 0;
    const checks = [
      !!profile.personalInfo.fullName,
      !!profile.personalInfo.summary,
      profile.skills.length > 0,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  })();

  const emailScore = emailSettings ? 100 : 0;
  const cvScore = latestCv ? 100 : 0;
  const jobSourcesScore = 60;

  const getStatus = (value: number) => {
    if (value === 100) return 'Ready';
    if (value > 0) return 'In Progress';
    return 'Missing';
  };

  const items = [
    { label: 'Profile', value: profileScore },
    { label: 'Email Integration', value: emailScore },
    { label: 'CV Upload', value: cvScore },
    { label: 'Job Sources', value: jobSourcesScore },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Readiness</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => (
          <div key={item.label}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-300">{item.label}</span>
              <span className="text-slate-400">{getStatus(item.value)}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className={`h-full rounded-full transition-all ${
                  item.value === 100 ? 'bg-emerald-500' : item.value > 0 ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
                style={{ width: `${item.value}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Accessibility Tab
// ---------------------------------------------------------------------------

const THEME_OPTIONS = [
  {
    id: 'light' as const,
    Icon: Sun,
    label: 'Light',
    description: 'Clean white background with blue accents. Default daytime theme.',
  },
  {
    id: 'dark' as const,
    Icon: Anchor,
    label: 'Dark',
    description: 'Deep navy with light blue accents. Default nighttime theme.',
  },
];

function AccessibilityTab() {
  const { theme, setTheme, focusMode, setFocusMode } = useThemeStore();

  return (
    <div className="space-y-6">
      {/* Theme picker */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Accessibility className="h-4 w-4" /> Colour Theme
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
            Choose the theme that works best for you. You can also toggle Light/Dark in the header.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {THEME_OPTIONS.map(({ id, Icon, label, description }) => {
              const isActive = theme === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTheme(id)}
                  aria-pressed={isActive}
                  className={`flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
                    isActive
                      ? 'border-indigo-400 bg-indigo-50 dark:border-indigo-600 dark:bg-indigo-950/40'
                      : 'border-slate-100 bg-white hover:border-indigo-100 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900'
                  }`}
                >
                  <div className="flex w-full items-center gap-2">
                    <Icon className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
                    <span className="font-medium text-slate-800 dark:text-slate-200">{label}</span>
                    {isActive && (
                      <span className="ml-auto rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                        ✓ Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Focus mode */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PanelLeftClose className="h-4 w-4" /> Focus Mode
          </CardTitle>
        </CardHeader>
        <CardContent>
          <label className="flex cursor-pointer items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Hide sidebar navigation</p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Hides the left sidebar so you can concentrate on the current task without
                distraction. The sidebar button in the header lets you toggle it on and off at
                any time.
              </p>
            </div>
            <Toggle checked={focusMode} onChange={() => setFocusMode(!focusMode)} />
          </label>
        </CardContent>
      </Card>

      {/* Reduced motion info */}
      <Card>
        <CardHeader>
          <CardTitle>Reduced Motion</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            MultivoHub automatically respects your operating system's{' '}
            <strong className="font-semibold text-slate-700 dark:text-slate-300">
              Reduce Motion
            </strong>{' '}
            accessibility setting. When enabled, all animations and transitions are disabled
            throughout the app. You can find this setting in:
          </p>
          <ul className="mt-3 space-y-1 text-sm text-slate-500 dark:text-slate-400">
            <li>
              <strong className="text-slate-700 dark:text-slate-300">macOS:</strong> System
              Settings → Accessibility → Display → Reduce Motion
            </li>
            <li>
              <strong className="text-slate-700 dark:text-slate-300">Windows:</strong> Settings
              → Accessibility → Visual effects → Animation effects
            </li>
            <li>
              <strong className="text-slate-700 dark:text-slate-300">Android:</strong> Settings
              → Accessibility → Remove animations
            </li>
            <li>
              <strong className="text-slate-700 dark:text-slate-300">iOS / iPadOS:</strong>{' '}
              Settings → Accessibility → Motion → Reduce Motion
            </li>
          </ul>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Selecting the <strong className="text-slate-700 dark:text-slate-300">Focus</strong>{' '}
            colour theme above also removes animations regardless of your OS setting.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main SettingsHub
// ---------------------------------------------------------------------------

const CONSENT_KEY = 'mvh-consents';

function loadConsents() {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (raw) return JSON.parse(raw) as Record<string, boolean>;
  } catch { /* ignore */ }
  return {};
}

function saveConsents(c: Record<string, boolean>) {
  localStorage.setItem(CONSENT_KEY, JSON.stringify(c));
}

export default function SettingsHub() {
  const navigate = useNavigate();
  const { user } = useUser();
  const userId = user?.id ?? '';

  const { emailNotifications, jobSources, loadSettings, toggleEmailNotifications, toggleJobSource } =
    useSettingsStore();

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  // ── Consent state ─────────────────────────────────────────────────────────
  const saved = loadConsents();
  const [consentLinkedin, setConsentLinkedin] = useState(saved.linkedin ?? false);
  const [consentFacebook, setConsentFacebook] = useState(saved.facebook ?? false);
  const [consentInstagram, setConsentInstagram] = useState(saved.instagram ?? false);
  const [consentSmtp, setConsentSmtp] = useState(saved.smtp ?? false);
  const [consentImapTracking, setConsentImapTracking] = useState(saved.imapTracking ?? false);
  const [consentImapOffers, setConsentImapOffers] = useState(saved.imapOffers ?? false);
  const [consentAutoApply, setConsentAutoApply] = useState(saved.autoApply ?? false);

  const toggleConsent = (key: string, current: boolean, setter: (v: boolean) => void) => {
    const next = !current;
    setter(next);
    const c = loadConsents();
    c[key] = next;
    saveConsents(c);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="mt-1 text-slate-500">Configure your workspace, integrations and preferences.</p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="privacy">Privacy &amp; Consents</TabsTrigger>
          <TabsTrigger value="accessibility">Accessibility</TabsTrigger>
          <TabsTrigger value="email">Email &amp; SMTP</TabsTrigger>
          <TabsTrigger value="telegram">Telegram</TabsTrigger>
          <TabsTrigger value="sources">Job Sources</TabsTrigger>
          <TabsTrigger value="readiness">System Readiness</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview">
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {QUICK_LINKS.map((link) => (
                <button
                  key={link.href}
                  onClick={() => void navigate(link.href)}
                  className="group flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 text-left transition-all hover:border-indigo-100 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950">
                    <link.icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <span className="flex-1 font-medium text-slate-800 dark:text-slate-200">{link.label}</span>
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600" />
                </button>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-4 w-4" /> Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <label className="flex cursor-pointer items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Email notifications</p>
                    <p className="text-xs text-slate-500">Receive updates about jobs, interviews and alerts</p>
                  </div>
                  <Toggle checked={emailNotifications} onChange={toggleEmailNotifications} />
                </label>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* PRIVACY & CONSENTS */}
        <TabsContent value="privacy">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-4 w-4" /> Consent Centre
                </CardTitle>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Control exactly what MultivoHub is allowed to do on your behalf. You can change these at any time.
                </p>
              </CardHeader>
              <CardContent className="space-y-5">

                {/* Social profile analysis */}
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Social Profile Analysis</p>
                  <div className="space-y-3">
                    {[
                      { key: 'linkedin', label: 'LinkedIn', desc: 'Analyse your public work history and professional network to improve job matching.', checked: consentLinkedin, setter: setConsentLinkedin },
                      { key: 'facebook', label: 'Facebook', desc: 'Analyse public professional interests and activity to identify career trends.', checked: consentFacebook, setter: setConsentFacebook },
                      { key: 'instagram', label: 'Instagram', desc: 'Analyse your public personal brand for alignment with target roles.', checked: consentInstagram, setter: setConsentInstagram },
                    ].map(({ key, label, desc, checked, setter }) => (
                      <div key={key} className="flex items-start justify-between gap-4 rounded-xl border border-slate-100 p-4 dark:border-slate-800">
                        <div>
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</p>
                          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{desc}</p>
                        </div>
                        <Toggle checked={checked} onChange={() => toggleConsent(key, checked, setter)} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Email & inbox */}
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Email &amp; Inbox</p>
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-100 p-4 dark:border-slate-800">
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Outgoing emails (SMTP)</p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          Allow MultivoHub to send job applications, cover letters and follow-up emails from your configured email address. Configure in the Email &amp; SMTP tab.
                        </p>
                      </div>
                      <Toggle checked={consentSmtp} onChange={() => toggleConsent('smtp', consentSmtp, setConsentSmtp)} />
                    </div>
                    <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-100 p-4 dark:border-slate-800">
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Incoming mail — application tracking (IMAP)</p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          Allow AI to read incoming emails to detect employer replies (interview invites, rejections, offers) and automatically update application statuses.
                          <br /><span className="text-indigo-400">How it works:</span> AI scans subject lines and senders matching known employers. Message bodies are processed locally and never stored or shared.
                        </p>
                      </div>
                      <Toggle checked={consentImapTracking} onChange={() => toggleConsent('imapTracking', consentImapTracking, setConsentImapTracking)} />
                    </div>
                    <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-100 p-4 dark:border-slate-800">
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Incoming mail — inbound job offers</p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          Allow AI to detect emails from recruiters containing job opportunities and surface them in Job Listings.
                          <br /><span className="text-indigo-400">How it works:</span> AI identifies recruiter patterns and job-related keywords. No email content is stored — only extracted job metadata (title, company, salary range).
                        </p>
                      </div>
                      <Toggle checked={consentImapOffers} onChange={() => toggleConsent('imapOffers', consentImapOffers, setConsentImapOffers)} />
                    </div>
                  </div>
                </div>

                {/* Auto-apply */}
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Auto-Apply</p>
                  <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-100 p-4 dark:border-slate-800">
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Automatic job applications</p>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        Allow AI to submit applications on your behalf for roles that meet your auto-apply threshold (set in Profile &amp; Goals). You will be notified of every submission.
                      </p>
                    </div>
                    <Toggle checked={consentAutoApply} onChange={() => toggleConsent('autoApply', consentAutoApply, setConsentAutoApply)} />
                  </div>
                </div>

                <p className="text-xs text-slate-400 dark:text-slate-500">
                  All data is processed securely. We never sell or share your data with third parties. See our{' '}
                  <a href="/legal/privacy" className="text-indigo-500 hover:underline">Privacy Policy</a> for full details.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ACCESSIBILITY */}
        <TabsContent value="accessibility">
          <AccessibilityTab />
        </TabsContent>

        {/* EMAIL */}
        <TabsContent value="email">
          {userId ? (
            <EmailSettingsTab userId={userId} />
          ) : (
            <p className="text-sm text-slate-500">Loading…</p>
          )}
        </TabsContent>

        {/* TELEGRAM */}
        <TabsContent value="telegram">
          {userId ? (
            <TelegramSettingsTab userId={userId} />
          ) : (
            <p className="text-sm text-slate-500">Loading…</p>
          )}
        </TabsContent>

        {/* JOB SOURCES */}
        <TabsContent value="sources">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plug className="h-4 w-4" /> Job Sources
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {jobSources.map((source) => (
                <div
                  key={source.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 p-4 dark:border-slate-800"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{source.name}</p>
                    <p className="text-xs text-slate-400">{source.connected ? 'Connected' : 'Not connected'}</p>
                  </div>
                  <Toggle checked={source.connected} onChange={() => toggleJobSource(source.id)} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SYSTEM READINESS */}
        <TabsContent value="readiness">
          {userId ? (
            <SystemReadinessTab userId={userId} />
          ) : (
            <p className="text-sm text-slate-500">Loading…</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
