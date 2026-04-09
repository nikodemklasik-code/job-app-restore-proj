import { useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { KeyRound, Monitor, Smartphone, Laptop, Clock, ShieldAlert, CheckCircle2 } from 'lucide-react';
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
  const { passkeys, activeSessions, isLoading, error, loadSecurityData, revokeSession, removePasskey } = useSecurityStore();

  useEffect(() => {
    if (!isLoaded || !userId) return;
    void loadSecurityData(userId);
  }, [isLoaded, userId, loadSecurityData]);

  if (!isLoaded || isLoading) return <div className="flex h-48 items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" /></div>;
  if (!userId) return <div className="py-12 text-center text-slate-500">Sign in to view security settings</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">Security &amp; Passkeys</h1>
        <p className="mt-1 text-slate-500">Manage your authentication methods and active sessions.</p>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-emerald-500" /> Passkeys</CardTitle>
            <Button variant="outline" size="sm">Add Passkey</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {passkeys.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-slate-100 p-8 text-center dark:border-slate-800">
              <KeyRound className="mx-auto mb-2 h-8 w-8 text-slate-300" />
              <p className="text-sm text-slate-500">No passkeys yet. Add one for passwordless login.</p>
            </div>
          ) : (
            passkeys.map((pk) => (
              <div key={pk.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-4 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950">
                    <KeyRound className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{pk.name}</p>
                    <p className="text-xs text-slate-400">Last used {formatDate(pk.lastUsed)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={pk.isActive ? 'success' : 'secondary'}>{pk.isActive ? 'Active' : 'Inactive'}</Badge>
                  <Button variant="outline" size="sm" onClick={() => void removePasskey(userId, pk.id)}>Remove</Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeSessions.length === 0 ? (
            <p className="text-sm text-slate-500">No active sessions found.</p>
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
                      <p className="text-xs text-slate-400">{session.location} · {formatDate(session.lastActive)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {session.isCurrent ? (
                      <Badge variant="success">Current</Badge>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => void revokeSession(userId, session.id)}>Revoke</Button>
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
          <CardTitle>Two-Factor Authentication</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Add an extra layer of security to your account.</p>
              <Badge variant="secondary" className="mt-1">Coming soon</Badge>
            </div>
            <Button variant="outline" disabled>Enable 2FA</Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Retention Status */}
      <Card className="border-slate-100 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-indigo-500" />
            Account Retention
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl bg-emerald-50 p-4 dark:bg-emerald-950/30">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">Account is active</p>
              <p className="mt-0.5 text-xs text-slate-500">Last login detected. Your data is safe.</p>
            </div>
          </div>
          <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
              <span className="flex items-center gap-2"><ShieldAlert className="h-3.5 w-3.5 text-amber-500" /> Warning email 1</span>
              <span className="text-xs text-slate-400">After 20 days of inactivity</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
              <span className="flex items-center gap-2"><ShieldAlert className="h-3.5 w-3.5 text-orange-500" /> Warning email 2</span>
              <span className="text-xs text-slate-400">After 40 days of inactivity</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
              <span className="flex items-center gap-2"><ShieldAlert className="h-3.5 w-3.5 text-red-500" /> Account deactivated</span>
              <span className="text-xs text-slate-400">After 45 days of inactivity</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2"><ShieldAlert className="h-3.5 w-3.5 text-red-700" /> Data permanently deleted</span>
              <span className="text-xs text-slate-400">After 60 days of inactivity</span>
            </div>
          </div>
          <p className="text-xs text-slate-400">
            Logging in at any time resets the inactivity counter. Active paid subscribers are never automatically deleted.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
