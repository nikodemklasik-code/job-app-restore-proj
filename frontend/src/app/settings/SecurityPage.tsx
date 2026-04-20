import { useEffect } from 'react';
import { UserProfile, useUser } from '@clerk/clerk-react';
import { KeyRound, Monitor, Smartphone, Laptop, Clock, ShieldAlert, CheckCircle2, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSecurityStore } from '@/stores/securityStore';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const deviceIcon = (device: string) => {
  if (/ios|iphone|ipad|mobile/i.test(device)) return Smartphone;
  if (/mac|laptop/i.test(device)) return Laptop;
  return Monitor;
};

export default function SecurityPage() {
  const { user, isLoaded } = useUser();
  const userId = user?.id ?? null;
  const { activeSessions, isLoading, error, loadSecurityData, revokeSession } = useSecurityStore();

  useEffect(() => {
    if (!isLoaded || !userId) return;
    void loadSecurityData(userId);
  }, [isLoaded, userId, loadSecurityData]);

  if (!isLoaded || isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }
  if (!userId) {
    return <div className="py-12 text-center text-slate-500">Sign in to view security settings.</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">Security, passkeys &amp; two-factor authentication</h1>
        <p className="mt-1 text-slate-500">
          Passkeys and two-factor authentication are configured in your account panel below (Clerk). The embedded panel uses English labels (Security, Passkeys, Two-step verification).
        </p>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Card className="border-emerald-100 dark:border-emerald-900/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <KeyRound className="h-5 w-5 text-emerald-500" />
            How to enable a passkey (passwordless sign-in)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
          <ol className="list-decimal space-y-2 pl-5 leading-relaxed">
            <li>Sign in the way you usually do (email and password, Google, and so on).</li>
            <li>
              Scroll to <strong className="text-slate-800 dark:text-slate-200">Your account profile (Clerk)</strong> on this page.
            </li>
            <li>
              Open the <strong className="text-slate-800 dark:text-slate-200">Security</strong> tab, find the passkeys / WebAuthn section, and add a new passkey (for example <em>Add passkey</em>).
            </li>
            <li>Complete the browser or system prompt (Touch ID, Face ID, Windows Hello, or a USB security key).</li>
            <li>
              On the app sign-in page you can then use <strong className="text-slate-800 dark:text-slate-200">Continue with Passkey</strong> when your device and browser support it.
            </li>
          </ol>
          <p className="rounded-lg border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-xs text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
            <strong>App administrators:</strong> in the{' '}
            <a href="https://dashboard.clerk.com" className="font-medium text-amber-900 underline underline-offset-2 dark:text-amber-200" target="_blank" rel="noreferrer">
              Clerk Dashboard
            </a>
            , enable passkeys (User &amp; authentication → Passkeys / WebAuthn). Otherwise the passkey section may not appear for users.
          </p>
        </CardContent>
      </Card>

      <Card className="border-indigo-100 dark:border-indigo-900/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-indigo-500" />
            How to enable two-factor authentication (2FA / MFA)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
          <ol className="list-decimal space-y-2 pl-5 leading-relaxed">
            <li>In the same account panel, open the <strong className="text-slate-800 dark:text-slate-200">Security</strong> tab.</li>
            <li>
              Find two-step verification (for example <strong className="text-slate-800 dark:text-slate-200">Two-step verification</strong> / MFA) and follow Clerk&apos;s steps — typically an authenticator app (TOTP) or SMS, depending on your Clerk project settings.
            </li>
            <li>
              After you enable it, store your <strong className="text-slate-800 dark:text-slate-200">backup codes</strong> somewhere safe (Clerk shows them during setup).
            </li>
            <li>
              If you sign in with Google, Apple, or another SSO provider, you can also enable 2FA{' '}
              <strong className="text-slate-800 dark:text-slate-200">on that provider&apos;s account</strong> — doing both is recommended.
            </li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your account profile (Clerk)</CardTitle>
          <p className="text-sm text-slate-500">
            Add or remove passkeys and turn on 2FA here. Changes apply immediately for signing in to this app.
          </p>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="flex min-h-[480px] justify-center">
            <UserProfile
              routing="hash"
              appearance={{
                variables: { colorPrimary: '#6366f1', borderRadius: '0.75rem' },
                elements: {
                  rootBox: 'w-full max-w-4xl',
                  card: 'shadow-sm border border-slate-200 dark:border-slate-700',
                },
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active sessions (workspace)</CardTitle>
          <p className="text-sm font-normal text-slate-500">
            This list is stored in the app database — it does not replace the full session list in Clerk. Use it to review and revoke entries we store for this workspace.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeSessions.length === 0 ? (
            <p className="text-sm text-slate-500">No workspace sessions on file.</p>
          ) : (
            activeSessions.map((session) => {
              const Icon = deviceIcon(session.device);
              return (
                <div key={session.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-4 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800">
                      <Icon className="h-5 w-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{session.device}</p>
                      <p className="text-xs text-slate-400">
                        {session.location} · {formatDate(session.lastActive)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {session.isCurrent ? (
                      <Badge variant="success">Current</Badge>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => void revokeSession(userId, session.id)}>
                        Revoke
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-100 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-indigo-500" />
            Account retention
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl bg-emerald-50 p-4 dark:bg-emerald-950/30">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">Account is active</p>
              <p className="mt-0.5 text-xs text-slate-500">Sign-in detected. Your data is handled according to the service policy.</p>
            </div>
          </div>
          <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
              <span className="flex items-center gap-2">
                <ShieldAlert className="h-3.5 w-3.5 text-amber-500" /> First warning email
              </span>
              <span className="text-xs text-slate-400">after about 20 days without sign-in</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
              <span className="flex items-center gap-2">
                <ShieldAlert className="h-3.5 w-3.5 text-orange-500" /> Second warning email
              </span>
              <span className="text-xs text-slate-400">after about 40 days without sign-in</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
              <span className="flex items-center gap-2">
                <ShieldAlert className="h-3.5 w-3.5 text-red-500" /> Account deactivated
              </span>
              <span className="text-xs text-slate-400">after about 45 days without sign-in</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ShieldAlert className="h-3.5 w-3.5 text-red-700" /> Data permanently deleted
              </span>
              <span className="text-xs text-slate-400">after about 60 days without sign-in</span>
            </div>
          </div>
          <p className="text-xs text-slate-400">
            Any sign-in resets the inactivity counter. Active paying subscribers are never automatically deleted.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
