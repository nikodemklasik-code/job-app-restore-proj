import { useEffect, useMemo, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ThemeMode, AssistantTone, UpdateUserProductSettingsInput } from '@/types/settings';

function ToggleRow(props: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-xl border border-slate-100 p-4 dark:border-slate-800">
      <div>
        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{props.label}</div>
        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{props.description}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={props.checked}
        disabled={props.disabled}
        onClick={() => props.onChange(!props.checked)}
        className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition ${
          props.checked ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'
        } ${props.disabled ? 'cursor-not-allowed opacity-60' : ''}`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
            props.checked ? 'left-6' : 'left-1'
          }`}
        />
      </button>
    </label>
  );
}

function parseDomains(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(/\r?\n|,/)
        .map((item) => item.trim().toLowerCase())
        .filter((item) => item.length > 0),
    ),
  );
}

export function UserProductSettingsTab() {
  const { user, isLoaded } = useUser();
  const enabled = Boolean(isLoaded && user?.id);

  const query = api.settings.getSettings.useQuery(undefined, {
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
  const utils = api.useUtils();
  const mutation = api.settings.updateSettings.useMutation({
    async onSuccess() {
      await utils.settings.getSettings.invalidate();
    },
  });

  const [form, setForm] = useState<UpdateUserProductSettingsInput | null>(null);
  const [domainText, setDomainText] = useState('');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!query.data) return;
    const d = query.data;
    setForm({
      emailNotifications: d.emailNotifications,
      pushNotifications: d.pushNotifications,
      weeklyDigest: d.weeklyDigest,
      marketingEmails: d.marketingEmails,
      autoSaveDocuments: d.autoSaveDocuments,
      darkMode: d.darkMode,
      themeMode: d.themeMode as ThemeMode,
      assistantTone: d.assistantTone as AssistantTone,
      timezone: d.timezone,
      language: d.language,
      privacyMode: d.privacyMode,
      shareProfileAnalytics: d.shareProfileAnalytics,
      blockedCompanyDomains: d.blockedCompanyDomains,
    });
    setDomainText(d.blockedCompanyDomains.join('\n'));
    setSaveMessage(null);
  }, [query.data]);

  const normalizedDomains = useMemo(() => parseDomains(domainText), [domainText]);

  if (!enabled || query.isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (query.isError) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-rose-600 dark:text-rose-400">{query.error.message}</CardContent>
      </Card>
    );
  }

  if (!form) {
    return null;
  }

  const isPhantom = query.data?.id === 'not-installed';

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveMessage(null);
    mutation.mutate(
      {
        ...form,
        blockedCompanyDomains: normalizedDomains,
      },
      {
        onSuccess: () => setSaveMessage('Saved.'),
        onError: (err) => setSaveMessage(err.message),
      },
    );
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {isPhantom ? (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
          The <code className="rounded bg-black/20 px-1">user_settings</code> table is not on this database yet.
          Saving is disabled until <code className="rounded bg-black/20 px-1">backend/sql/user_settings.sql</code> is
          applied.
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <ToggleRow
            label="Email notifications"
            description="Account and workflow updates by email."
            checked={form.emailNotifications}
            disabled={mutation.isPending || isPhantom}
            onChange={(v) => setForm((p) => (p ? { ...p, emailNotifications: v } : p))}
          />
          <ToggleRow
            label="Push notifications"
            description="Time-sensitive in-app or device notifications."
            checked={form.pushNotifications}
            disabled={mutation.isPending || isPhantom}
            onChange={(v) => setForm((p) => (p ? { ...p, pushNotifications: v } : p))}
          />
          <ToggleRow
            label="Weekly digest"
            description="Weekly summary of activity and pipeline."
            checked={form.weeklyDigest}
            disabled={mutation.isPending || isPhantom}
            onChange={(v) => setForm((p) => (p ? { ...p, weeklyDigest: v } : p))}
          />
          <ToggleRow
            label="Marketing emails"
            description="Product updates and feature announcements."
            checked={form.marketingEmails}
            disabled={mutation.isPending || isPhantom}
            onChange={(v) => setForm((p) => (p ? { ...p, marketingEmails: v } : p))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Experience</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <ToggleRow
            label="Auto-save documents"
            description="Persist supported document edits automatically."
            checked={form.autoSaveDocuments}
            disabled={mutation.isPending || isPhantom}
            onChange={(v) => setForm((p) => (p ? { ...p, autoSaveDocuments: v } : p))}
          />
          <ToggleRow
            label="Dark mode preference"
            description="Stored preference (app theme may still follow global theme store)."
            checked={form.darkMode}
            disabled={mutation.isPending || isPhantom}
            onChange={(v) => setForm((p) => (p ? { ...p, darkMode: v } : p))}
          />
          <label className="grid gap-2 rounded-xl border border-slate-100 p-4 dark:border-slate-800">
            <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Theme mode</span>
            <select
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              value={form.themeMode}
              disabled={mutation.isPending || isPhantom}
              onChange={(e) =>
                setForm((p) => (p ? { ...p, themeMode: e.target.value as ThemeMode } : p))
              }
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </label>
          <label className="grid gap-2 rounded-xl border border-slate-100 p-4 dark:border-slate-800">
            <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Assistant tone</span>
            <select
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              value={form.assistantTone}
              disabled={mutation.isPending || isPhantom}
              onChange={(e) =>
                setForm((p) => (p ? { ...p, assistantTone: e.target.value as AssistantTone } : p))
              }
            >
              <option value="concise">Concise</option>
              <option value="balanced">Balanced</option>
              <option value="detailed">Detailed</option>
            </select>
          </label>
          <label className="grid gap-2 rounded-xl border border-slate-100 p-4 dark:border-slate-800 md:col-span-2">
            <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Timezone</span>
            <input
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              value={form.timezone}
              disabled={mutation.isPending || isPhantom}
              onChange={(e) => setForm((p) => (p ? { ...p, timezone: e.target.value } : p))}
            />
          </label>
          <label className="grid gap-2 rounded-xl border border-slate-100 p-4 dark:border-slate-800 md:col-span-2">
            <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Language</span>
            <input
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              value={form.language}
              disabled={mutation.isPending || isPhantom}
              onChange={(e) => setForm((p) => (p ? { ...p, language: e.target.value } : p))}
            />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Privacy</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <ToggleRow
            label="Privacy mode"
            description="Reduce telemetry surface where supported."
            checked={form.privacyMode}
            disabled={mutation.isPending || isPhantom}
            onChange={(v) => setForm((p) => (p ? { ...p, privacyMode: v } : p))}
          />
          <ToggleRow
            label="Share profile analytics"
            description="Allow aggregated analytics for fit recommendations."
            checked={form.shareProfileAnalytics}
            disabled={mutation.isPending || isPhantom}
            onChange={(v) => setForm((p) => (p ? { ...p, shareProfileAnalytics: v } : p))}
          />
          <label className="grid gap-2 md:col-span-2">
            <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
              Blocked company domains (one per line; server validates)
            </span>
            <textarea
              rows={5}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              value={domainText}
              disabled={mutation.isPending || isPhantom}
              onChange={(e) => setDomainText(e.target.value)}
            />
          </label>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-h-[1.25rem] text-sm text-slate-600 dark:text-slate-400">
          {saveMessage ? <span>{saveMessage}</span> : null}
        </div>
        <button
          type="submit"
          disabled={mutation.isPending || isPhantom}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {mutation.isPending ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  );
}
