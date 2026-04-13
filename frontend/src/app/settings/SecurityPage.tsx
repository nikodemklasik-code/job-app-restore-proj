import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import type { TOTPResource } from '@clerk/shared/types';
import QRCode from 'qrcode';
import { KeyRound, Monitor, Smartphone, Laptop, Clock, ShieldAlert, CheckCircle2, ShieldCheck, ShieldOff, Copy, Eye, EyeOff } from 'lucide-react';
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

type TotpStep = 'idle' | 'setup' | 'verify' | 'backup-codes';

export default function SecurityPage() {
  const { user, isLoaded } = useUser();
  const userId = user?.id ?? null;
  const { passkeys, activeSessions, isLoading, error, loadSecurityData, revokeSession, removePasskey } = useSecurityStore();

  // 2FA state
  const [totpStep, setTotpStep] = useState<TotpStep>('idle');
  const [totpResource, setTotpResource] = useState<TOTPResource | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [verifyCode, setVerifyCode] = useState('');
  const [totpError, setTotpError] = useState<string | null>(null);
  const [totpLoading, setTotpLoading] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  useEffect(() => {
    if (!isLoaded || !userId) return;
    void loadSecurityData(userId);
  }, [isLoaded, userId, loadSecurityData]);

  const startTotpSetup = async () => {
    if (!user) return;
    setTotpError(null);
    setTotpLoading(true);
    try {
      const totp = await user.createTOTP();
      setTotpResource(totp);
      if (totp.uri) {
        const dataUrl = await QRCode.toDataURL(totp.uri, { width: 200, margin: 1 });
        setQrDataUrl(dataUrl);
      }
      setTotpStep('setup');
    } catch (e) {
      setTotpError(e instanceof Error ? e.message : 'Failed to initialise 2FA');
    } finally {
      setTotpLoading(false);
    }
  };

  const verifyTotp = async () => {
    if (!user || !verifyCode.trim()) return;
    setTotpError(null);
    setTotpLoading(true);
    try {
      const result = await user.verifyTOTP({ code: verifyCode.trim() });
      setBackupCodes(result.backupCodes ?? []);
      setTotpStep('backup-codes');
      setVerifyCode('');
    } catch (e) {
      setTotpError('Invalid code — please try again.');
    } finally {
      setTotpLoading(false);
    }
  };

  const disableTotp = async () => {
    if (!user) return;
    setTotpError(null);
    setTotpLoading(true);
    try {
      await user.disableTOTP();
      setTotpStep('idle');
      setTotpResource(null);
      setQrDataUrl('');
    } catch (e) {
      setTotpError(e instanceof Error ? e.message : 'Failed to disable 2FA');
    } finally {
      setTotpLoading(false);
    }
  };

  const copySecret = async () => {
    if (!totpResource?.secret) return;
    await navigator.clipboard.writeText(totpResource.secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const cancelSetup = () => {
    setTotpStep('idle');
    setTotpResource(null);
    setQrDataUrl('');
    setVerifyCode('');
    setTotpError(null);
  };

  if (!isLoaded || isLoading) return <div className="flex h-48 items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" /></div>;
  if (!userId) return <div className="py-12 text-center text-slate-500">Sign in to view security settings</div>;

  const totpEnabled = user?.twoFactorEnabled ?? false;

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

      {/* ── Two-Factor Authentication ───────────────────────────────────────── */}
      <Card className="border-slate-100 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-indigo-500" />
            Two-Factor Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Status bar */}
          {totpStep === 'idle' && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {totpEnabled ? (
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950">
                    <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  </div>
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800">
                    <ShieldOff className="h-5 w-5 text-slate-400" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    {totpEnabled ? '2FA is enabled' : '2FA is disabled'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {totpEnabled
                      ? 'Your account is protected with an authenticator app.'
                      : 'Add an extra layer of security with an authenticator app.'}
                  </p>
                </div>
              </div>
              {totpEnabled ? (
                <Button variant="outline" size="sm" onClick={() => void disableTotp()} disabled={totpLoading} className="text-red-600 hover:border-red-300 hover:bg-red-50 dark:text-red-400">
                  {totpLoading ? 'Disabling…' : 'Disable 2FA'}
                </Button>
              ) : (
                <Button size="sm" onClick={() => void startTotpSetup()} disabled={totpLoading}>
                  {totpLoading ? 'Loading…' : 'Enable 2FA'}
                </Button>
              )}
            </div>
          )}

          {/* Setup step — show QR + secret */}
          {totpStep === 'setup' && totpResource && (
            <div className="space-y-5">
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Step 1 — Scan with your authenticator app</p>
                <p className="mt-0.5 text-xs text-slate-400">Use Google Authenticator, Authy, 1Password, or any TOTP app.</p>
              </div>

              {qrDataUrl && (
                <div className="flex justify-center">
                  <div className="rounded-xl border border-slate-100 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                    <img src={qrDataUrl} alt="TOTP QR code" className="h-48 w-48" />
                  </div>
                </div>
              )}

              {totpResource.secret && (
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                  <p className="mb-1.5 text-xs text-slate-400">Manual entry key</p>
                  <div className="flex items-center gap-2">
                    <code className={`flex-1 font-mono text-sm tracking-widest text-slate-700 dark:text-slate-300 ${showSecret ? '' : 'select-none blur-sm'}`}>
                      {totpResource.secret}
                    </code>
                    <button onClick={() => setShowSecret((v) => !v)} className="shrink-0 rounded p-1 text-slate-400 hover:text-slate-600">
                      {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <button onClick={() => void copySecret()} className="shrink-0 rounded p-1 text-slate-400 hover:text-slate-600">
                      <Copy className="h-4 w-4" />
                    </button>
                    {copiedSecret && <span className="text-xs text-emerald-500">Copied!</span>}
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Step 2 — Enter the 6-digit code</p>
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-36 rounded-xl border border-slate-200 bg-white px-4 py-2 text-center font-mono text-lg tracking-[0.3em] text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                  <Button onClick={() => void verifyTotp()} disabled={verifyCode.length !== 6 || totpLoading}>
                    {totpLoading ? 'Verifying…' : 'Verify & Enable'}
                  </Button>
                  <Button variant="outline" onClick={cancelSetup}>Cancel</Button>
                </div>
              </div>

              {totpError && <p className="text-sm text-red-500">{totpError}</p>}
            </div>
          )}

          {/* Backup codes */}
          {totpStep === 'backup-codes' && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-xl bg-emerald-50 p-4 dark:bg-emerald-950/30">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">2FA enabled successfully!</p>
                  <p className="mt-0.5 text-xs text-slate-500">Save your backup codes somewhere safe. Each can be used once if you lose access to your authenticator app.</p>
                </div>
              </div>

              {backupCodes.length > 0 && (
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                  <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-400">Backup codes</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {backupCodes.map((code) => (
                      <code key={code} className="rounded bg-white px-2 py-1 font-mono text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {code}
                      </code>
                    ))}
                  </div>
                </div>
              )}

              <Button onClick={() => setTotpStep('idle')} className="w-full">Done</Button>
            </div>
          )}

          {totpError && totpStep === 'idle' && <p className="text-sm text-red-500">{totpError}</p>}
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
