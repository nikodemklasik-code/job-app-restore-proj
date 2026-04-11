import { useEffect, useMemo, useState } from 'react';
import { useClerk, useSignIn, useSignUp } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  KeyRound,
  Eye,
  EyeOff,
  Shield,
  Zap,
  LayoutDashboard,
  Mic,
  Brain,
  TrendingUp,
} from 'lucide-react';

/* ─── Inline SVGs ──────────────────────────────────────────────────────────── */
const AppleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="currentColor">
    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701z" />
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

/* ─── Compact ticker card ───────────────────────────────────────────────────── */
function TickerCard({
  icon,
  title,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  accent: string;
}) {
  return (
    <div
      className="shrink-0 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-lg"
      style={{ width: 180, padding: '8px 12px' }}
    >
      <div className={`flex items-center gap-2 text-xs font-semibold ${accent}`}>
        {icon}
        {title}
      </div>
    </div>
  );
}

/* ─── Default demo clips (GitHub user-attachments) ─────────────────────────── */
const DEFAULT_DEMO_VIDEOS = [
  'https://github.com/user-attachments/assets/5c8ac658-4640-46d7-96dc-a59b5e4f7c37',
  'https://github.com/user-attachments/assets/ed7c9e22-8c6a-42df-b742-213dfe4506f1',
  'https://github.com/user-attachments/assets/283d4ac4-55d8-47a1-ba08-4c6ab6dc6491',
  'https://github.com/user-attachments/assets/0dceb343-d3d4-449f-8768-646a609db683',
  'https://github.com/user-attachments/assets/8d14fc65-7f8a-42c3-a9d9-33d04eb0ecfc',
  'https://github.com/user-attachments/assets/b3bbbd6b-5e8c-4052-a57c-d80ce337272c',
  'https://github.com/user-attachments/assets/0746d7f6-a6b5-4f27-8db0-7e7381b2dcec',
  'https://github.com/user-attachments/assets/7ea8eeb7-5b43-4fd3-bca6-3ed20c1f4ff9',
  'https://github.com/user-attachments/assets/fe7b5210-b949-4eb8-b1f4-3d4449ab53f1',
];

/* ─── Monitor with looping video(s) / animated fallback ───────────────────── */
function DeviceMockup() {
  const multiRaw = (import.meta.env.VITE_AUTH_DEMO_VIDEO_URLS as string | undefined)?.trim() ?? '';
  const singleRaw = (import.meta.env.VITE_AUTH_DEMO_VIDEO_URL as string | undefined)?.trim() ?? '';
  const urlList = useMemo(
    () =>
      multiRaw
        ? multiRaw.split(',').map((s) => s.trim()).filter(Boolean)
        : singleRaw
          ? [singleRaw]
          : DEFAULT_DEMO_VIDEOS,
    [multiRaw, singleRaw],
  );
  const [clipIndex, setClipIndex] = useState(0);

  useEffect(() => {
    setClipIndex(0);
  }, [urlList]);

  const handleVideoEnded = () => {
    setClipIndex((i) => (i + 1) % urlList.length);
  };

  const rawUrl = urlList[clipIndex] ?? '';

  function toEmbedUrl(raw: string): string | null {
    try {
      const u = new URL(raw);
      if (u.hostname === 'youtu.be')
        return `https://www.youtube.com/embed/${u.pathname.slice(1)}?autoplay=1&loop=1&playlist=${u.pathname.slice(1)}&mute=1`;
      if (u.hostname.includes('youtube.com')) {
        const v = u.searchParams.get('v');
        if (v) return `https://www.youtube.com/embed/${v}?autoplay=1&loop=1&playlist=${v}&mute=1`;
      }
    } catch {
      /* ignore */
    }
    return null;
  }

  const embedUrl = rawUrl ? toEmbedUrl(rawUrl) : null;
  const isDirectVideo =
    /\.(mp4|webm|ogg)(\?|$)/i.test(rawUrl) ||
    rawUrl.includes('github.com/user-attachments/assets/');

  return (
    <div className="relative w-[320px] shrink-0">
      {/* Glow */}
      <div className="absolute inset-0 -z-10 blur-3xl opacity-25 bg-gradient-to-b from-indigo-500 via-purple-600 to-transparent rounded-full scale-125 pointer-events-none" />

      {/* Monitor frame */}
      <div className="relative rounded-2xl border border-white/15 bg-gradient-to-b from-slate-700 to-slate-800 p-[6px] shadow-2xl ring-1 ring-white/5">
        {/* Camera notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-1 w-12 rounded-b-full bg-slate-900/70" />

        {/* Screen */}
        <div className="relative overflow-hidden rounded-[14px] aspect-[16/10] bg-slate-900">
          {embedUrl ? (
            <iframe
              key={rawUrl}
              title="Multivohub demo"
              src={embedUrl}
              className="absolute inset-0 h-full w-full transition-opacity duration-700"
              allow="autoplay; fullscreen"
              allowFullScreen
            />
          ) : isDirectVideo ? (
            <video
              key={rawUrl}
              className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
              src={rawUrl}
              autoPlay
              muted
              playsInline
              onEnded={handleVideoEnded}
            />
          ) : (
            <>
              <img
                src="https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-50"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/70 via-slate-900/50 to-purple-900/70" />
              {/* Fake UI with animated bars */}
              <div className="absolute inset-0 p-3 flex flex-col gap-2">
                <div className="flex gap-2 items-center">
                  <div className="h-1.5 w-14 rounded bg-indigo-500/50" />
                  <div className="h-1.5 w-20 rounded bg-white/10" />
                  <div className="ml-auto h-1.5 w-8 rounded bg-emerald-500/50" />
                </div>
                <div className="flex gap-2 mt-1">
                  {(['96%', '89%', '92%'] as const).map((v, i) => (
                    <div key={v} className="flex-1 rounded-xl bg-white/5 border border-white/10 p-2">
                      <div className="text-[10px] font-bold text-indigo-300">{v}</div>
                      <div
                        className="mt-1 h-1 rounded bg-indigo-500/50 bar-grow"
                        style={{ animationDelay: `${i * 0.4}s` }}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-1">
                  <div className="flex-1 h-12 rounded-xl bg-white/5 border border-white/10" />
                  <div className="flex-1 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/20" />
                </div>
                <div className="mt-auto flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-medium text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 live-dot" />
                    Live
                  </span>
                  <span className="text-[9px] text-slate-400">Multivohub workspace</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Stand */}
      <div className="mx-auto mt-0.5 w-14 h-3 rounded-b-lg bg-gradient-to-b from-slate-700 to-slate-800 border border-white/10" />
      <div className="mx-auto w-20 h-[3px] rounded-full bg-slate-700/80 border border-white/10 shadow" />
    </div>
  );
}

function splitFullName(raw: string): { firstName?: string; lastName?: string } {
  const trimmed = raw.trim();
  if (!trimmed) return {};
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return { firstName: parts[0] };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

/* ─── Auth page ──────────────────────────────────────────────────────────────── */
export default function AuthPage() {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [awaitingEmailCode, setAwaitingEmailCode] = useState(false);
  /** Sign-in with password succeeded but Clerk requires e.g. email_code first factor */
  const [awaitingSignInCode, setAwaitingSignInCode] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setActive } = useClerk();
  const { signIn, isLoaded: signInLoaded } = useSignIn();
  const { signUp, isLoaded: signUpLoaded } = useSignUp();
  const navigate = useNavigate();

  const resetVerification = () => {
    setAwaitingEmailCode(false);
    setAwaitingSignInCode(false);
    setEmailCode('');
    setInfoMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInLoaded || !signUpLoaded) return;
    setIsLoading(true);
    setError(null);
    setInfoMessage(null);
    try {
      if (mode === 'sign-in') {
        const result = await signIn!.create({ identifier: email, password });
        if (result.status === 'complete' && result.createdSessionId) {
          await setActive({ session: result.createdSessionId });
          void navigate('/dashboard');
        } else {
          const si = signIn!;
          const status = result.status ?? si.status;

          if (status === 'needs_first_factor') {
            const emailFactor = si.supportedFirstFactors?.find((f) => f.strategy === 'email_code');
            const emailAddressId =
              emailFactor && 'emailAddressId' in emailFactor
                ? (emailFactor as { emailAddressId?: string }).emailAddressId
                : undefined;
            if (emailFactor && emailAddressId) {
              await si.prepareFirstFactor({
                strategy: 'email_code',
                emailAddressId,
              });
              setAwaitingSignInCode(true);
              setInfoMessage(
                'We sent a verification code to your email. Enter it below to finish signing in.',
              );
            } else if (emailFactor) {
              setError(
                'Email verification is required but the app could not determine which address to use. Try signing in with Google or another method, or contact support.',
              );
            } else {
              setError(
                'This account needs an extra sign-in step we do not support on this screen yet (for example phone or SSO). Try social sign-in or contact support.',
              );
            }
          } else if (status === 'needs_second_factor') {
            setError(
              'Two-factor authentication is required. Use your authenticator app or a backup code, or sign in with a social provider if your account allows it.',
            );
          } else if (status === 'needs_new_password') {
            setError(
              'You must set a new password before signing in. Use password recovery from your email or the “Forgot password” flow.',
            );
          } else {
            setError(
              `Sign-in could not complete (${status}). Please try again or use another sign-in method.`,
            );
          }
        }
      } else {
        const { firstName, lastName } = splitFullName(fullName);
        const result = await signUp!.create({
          emailAddress: email,
          password,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
        });
        if (result.status === 'complete' && result.createdSessionId) {
          await setActive({ session: result.createdSessionId });
          void navigate('/dashboard');
        } else if (result.status === 'missing_requirements') {
          await signUp!.prepareEmailAddressVerification({ strategy: 'email_code' });
          setAwaitingEmailCode(true);
          setInfoMessage('We sent a verification code to your email. Enter it below to finish creating your account.');
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      setError(msg.replace(/^Error: /, ''));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmailCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpLoaded || !signUp) return;
    const code = emailCode.trim();
    if (!code) {
      setError('Enter the code from your email.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === 'complete' && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        resetVerification();
        void navigate('/dashboard');
      } else {
        setError('Could not complete sign-up. Please try again or request a new code.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Verification failed';
      setError(msg.replace(/^Error: /, ''));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!signUpLoaded || !signUp) return;
    setIsLoading(true);
    setError(null);
    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setInfoMessage('A new code was sent to your email.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not resend code';
      setError(msg.replace(/^Error: /, ''));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySignInCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInLoaded || !signIn) return;
    const code = emailCode.trim();
    if (!code) {
      setError('Enter the code from your email.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'email_code',
        code,
      });
      if (result.status === 'complete' && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        resetVerification();
        void navigate('/dashboard');
      } else if (result.status === 'needs_second_factor') {
        setError(
          'Two-factor authentication is required after this step. Complete 2FA where your account is managed, or try another sign-in method.',
        );
      } else {
        setError(
          `Could not complete sign-in (${result.status}). Try again or request a new code.`,
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Verification failed';
      setError(msg.replace(/^Error: /, ''));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendSignInCode = async () => {
    if (!signInLoaded || !signIn) return;
    setIsLoading(true);
    setError(null);
    try {
      const emailFactor = signIn.supportedFirstFactors?.find((f) => f.strategy === 'email_code');
      const emailAddressId =
        emailFactor && 'emailAddressId' in emailFactor
          ? (emailFactor as { emailAddressId?: string }).emailAddressId
          : undefined;
      if (!emailAddressId) {
        setError('Could not resend code. Go back and sign in with email and password again.');
        return;
      }
      await signIn.prepareFirstFactor({
        strategy: 'email_code',
        emailAddressId,
      });
      setInfoMessage('A new code was sent to your email.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not resend code';
      setError(msg.replace(/^Error: /, ''));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = async (
    provider: 'oauth_google' | 'oauth_apple' | 'oauth_facebook' | 'oauth_linkedin_oidc',
  ) => {
    if (!signInLoaded || !signUpLoaded || !signIn || !signUp) return;
    try {
      const redirect = {
        strategy: provider,
        redirectUrl: `${window.location.origin}/sso-callback`,
        redirectUrlComplete: `${window.location.origin}/dashboard`,
      } as const;
      if (mode === 'sign-up') {
        await signUp.authenticateWithRedirect(redirect);
      } else {
        await signIn.authenticateWithRedirect(redirect);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in with provider failed. Please try again.');
    }
  };

  const tickerCards = [
    { icon: <Shield className="h-3.5 w-3.5" />, title: 'Privacy first', accent: 'text-emerald-400' },
    { icon: <Zap className="h-3.5 w-3.5" />, title: 'Less chaos', accent: 'text-indigo-400' },
    { icon: <Mic className="h-3.5 w-3.5" />, title: 'Interview Ready', accent: 'text-violet-400' },
    { icon: <Brain className="h-3.5 w-3.5" />, title: 'Career AI', accent: 'text-amber-400' },
    { icon: <LayoutDashboard className="h-3.5 w-3.5" />, title: 'Full pipeline', accent: 'text-rose-400' },
    { icon: <TrendingUp className="h-3.5 w-3.5" />, title: 'Job scoring', accent: 'text-sky-400' },
  ];

  // 3 copies of 6 cards = 18 total for seamless loop
  const tickerItems = [...tickerCards, ...tickerCards, ...tickerCards];

  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-6px); }
        }
        @keyframes floatIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes blobPulse {
          0%, 100% { transform: scale(1) translate(0, 0);        opacity: .18; }
          50%       { transform: scale(1.12) translate(8px, -8px); opacity: .26; }
        }
        @keyframes marqueeLoop {
          from { transform: translateX(0); }
          to   { transform: translateX(calc(-100% / 3)); }
        }
        @keyframes barGrow {
          0%, 100% { opacity: .5; transform: scaleX(1);    }
          50%       { opacity: 1; transform: scaleX(1.15); }
        }
        @keyframes fakePulse {
          0%, 100% { opacity: 1;   transform: scale(1);   }
          50%       { opacity: .4; transform: scale(1.4); }
        }
        /* All decorative animations are gated behind prefers-reduced-motion */
        @media (prefers-reduced-motion: no-preference) {
          .animate-float   { animation: float 4s ease-in-out infinite; }
          .animate-floatIn { animation: floatIn .6s ease both; }
          .blob-pulse      { animation: blobPulse 7s ease-in-out infinite; }
          .ticker-strip    { animation: marqueeLoop 42s linear infinite; }
          .bar-grow        { animation: barGrow 2.4s ease-in-out infinite; transform-origin: left; }
          .live-dot        { animation: fakePulse 1.6s ease-in-out infinite; }
        }
      `}</style>

      {/* Root — desktop: fixed viewport, no scroll; mobile: allow vertical scroll if needed */}
      <div
        className="flex min-h-screen w-full overflow-x-hidden overflow-y-auto lg:h-screen lg:min-h-0 lg:overflow-hidden"
        style={{ background: '#020617' }}
      >

        {/* ══════════════════════════════════════════════════════════════════════
            LEFT PANEL — visual (fixed viewport: logo → ticker → monitor → copy)
        ══════════════════════════════════════════════════════════════════════ */}
        <div className="relative hidden min-h-0 flex-1 flex-col overflow-hidden bg-[#020617] lg:flex lg:h-full">
          {/* Background image */}
          <img
            src="https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg?auto=compress&cs=tinysrgb&w=1600"
            alt=""
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.10]"
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, #020617 0%, rgba(15,23,42,.92) 55%, rgba(30,27,75,.72) 100%)',
            }}
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage:
                'linear-gradient(#6366f1 1px,transparent 1px),linear-gradient(90deg,#6366f1 1px,transparent 1px)',
              backgroundSize: '44px 44px',
            }}
          />
          <div
            className="blob-pulse pointer-events-none absolute left-[18%] top-[22%] h-80 w-80 rounded-full bg-indigo-500/20 blur-[80px]"
          />
          <div
            className="blob-pulse pointer-events-none absolute bottom-[28%] right-[22%] h-64 w-64 rounded-full bg-violet-600/15 blur-[80px]"
            style={{ animationDelay: '3.5s' }}
          />

          {/* Blend ticker / monitor into navy auth column */}
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-[18] w-24 sm:w-32"
            style={{
              background: 'linear-gradient(to left, #0a0f1e 0%, rgba(10,15,30,0.55) 45%, transparent 100%)',
            }}
          />

          {/* Logo — top, comfortable margin from viewport edge */}
          <div className="relative z-20 flex shrink-0 items-center gap-3 px-8 pb-2 pt-5 lg:px-10 lg:pt-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-semibold tracking-tight text-white">MultivoHub</span>
            <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-medium text-indigo-400">
              Career workspace
            </span>
          </div>

          {/* Center column: ticker above monitor, copy below — no page scroll */}
          <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center gap-5 px-6 pb-6 lg:gap-6 lg:px-10">
            {/* Ticker: enters from left, fades at both edges and into navy panel */}
            <div className="relative w-full max-w-xl shrink-0 overflow-hidden py-1">
              <div
                className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-16"
                style={{
                  background: 'linear-gradient(to right, #020617 0%, rgba(2,6,23,0.92) 40%, transparent 100%)',
                }}
              />
              <div
                className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-20 sm:w-24"
                style={{
                  background: 'linear-gradient(to left, #0a0f1e 0%, rgba(10,15,30,0.5) 50%, transparent 100%)',
                }}
              />
              <div
                className="ticker-strip flex w-max gap-3"
                style={{ paddingBottom: 4 }}
              >
                {tickerItems.map((card, i) => (
                  <TickerCard key={i} {...card} />
                ))}
              </div>
            </div>

            <div className="shrink-0 animate-floatIn">
              <DeviceMockup />
            </div>

            <div className="animate-floatIn mx-auto max-w-lg shrink-0 space-y-2.5 px-2 text-center lg:space-y-3">
              <h1 className="text-xl font-bold leading-tight text-white lg:text-2xl">
                Your career process,{' '}
                <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  in one clear space.
                </span>
              </h1>
              <p className="mx-auto text-xs leading-relaxed text-slate-400 sm:text-sm">
                From CV and profile through discovery, applications, and interview practice — structured tools with
                UK-oriented job search in mind.
              </p>
              <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
                {['Profile & CV', 'Interview Ready', 'Career AI', 'Job Tracking', 'Auto-Apply'].map((pill) => (
                  <span
                    key={pill}
                    className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] text-slate-300 sm:px-3 sm:py-1 sm:text-xs"
                  >
                    {pill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            RIGHT PANEL — auth form
        ══════════════════════════════════════════════════════════════════════ */}
        <div
          className="relative z-20 flex w-full min-w-0 max-w-[440px] shrink-0 flex-col overflow-y-auto overflow-x-hidden border-l border-white/5 bg-[#0a0f1e] px-7 lg:h-screen lg:min-h-0 lg:overflow-hidden lg:px-8"
          style={{ minHeight: '100vh' }}
        >
          {/* TOP — welcome block, fixed margin from top */}
          <div className="shrink-0 pt-5 lg:pt-6">
            {/* Mobile logo (only visible when left panel is hidden) */}
            <div className="mb-5 flex items-center gap-2 lg:hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="text-base font-bold text-white">MultivoHub</span>
            </div>

            <h2 className="text-2xl font-bold text-white">
              {mode === 'sign-in' ? 'Welcome back' : 'Create workspace'}
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              {mode === 'sign-in' ? 'Sign in to your career workspace' : 'Start your career journey today'}
            </p>
          </div>

          {/* MIDDLE — fits between welcome and policy; no scroll on full layout */}
          <div className="flex min-h-0 flex-1 flex-col justify-center gap-0 overflow-hidden py-4 lg:py-5">

            {/* Passkey */}
            <button className="mb-2.5 flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-2.5 text-sm font-medium text-emerald-400 transition-all hover:bg-emerald-500/20 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10">
              <KeyRound className="h-4 w-4" />
              Continue with Passkey
            </button>

            <div className="relative my-2.5 flex items-center">
              <div className="flex-1 border-t border-white/10" />
              <span className="mx-3 text-xs text-slate-500">or continue with</span>
              <div className="flex-1 border-t border-white/10" />
            </div>

            {/* OAuth grid */}
            <div className="mb-2.5 grid grid-cols-2 gap-2">
              <button
                onClick={() => void handleOAuth('oauth_google')}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/10"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Google
              </button>
              <button
                onClick={() => void handleOAuth('oauth_apple')}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/10"
              >
                <AppleIcon />
                Apple
              </button>
              <button
                onClick={() => void handleOAuth('oauth_facebook')}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/10"
              >
                <FacebookIcon />
                Facebook
              </button>
              <button
                onClick={() => void handleOAuth('oauth_linkedin_oidc')}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/10"
              >
                <LinkedInIcon />
                LinkedIn
              </button>
            </div>

            <div className="relative my-2.5 flex items-center">
              <div className="flex-1 border-t border-white/10" />
              <span className="mx-3 text-xs text-slate-500">or with email</span>
              <div className="flex-1 border-t border-white/10" />
            </div>

            {/* Email / password form, or email verification step */}
            {(mode === 'sign-up' && awaitingEmailCode) || (mode === 'sign-in' && awaitingSignInCode) ? (
              <form
                onSubmit={(e) =>
                  void (awaitingSignInCode ? handleVerifySignInCode(e) : handleVerifyEmailCode(e))
                }
                className="space-y-3"
              >
                {infoMessage && (
                  <div
                    role="status"
                    aria-live="polite"
                    className="rounded-xl border border-indigo-500/25 bg-indigo-500/10 px-4 py-2.5 text-xs text-indigo-200"
                  >
                    {infoMessage}
                  </div>
                )}
                <div className="space-y-1">
                  <label htmlFor="auth-code" className="block text-xs font-medium text-slate-400">
                    Verification code
                  </label>
                  <input
                    id="auth-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="6-digit code"
                    value={emailCode}
                    onChange={(e) => setEmailCode(e.target.value.replace(/\s/g, ''))}
                    aria-describedby={error ? 'auth-error' : undefined}
                    className="flex h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm tracking-widest text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-colors"
                  />
                </div>
                {error && (
                  <div
                    id="auth-error"
                    role="alert"
                    className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-xs text-red-400"
                  >
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition-all hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/25 disabled:opacity-60 active:scale-[0.98]"
                >
                  {isLoading ? 'Verifying…' : 'Verify & continue'}
                </button>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() =>
                    void (awaitingSignInCode ? handleResendSignInCode() : handleResendCode())
                  }
                  className="w-full rounded-xl border border-white/10 py-2.5 text-xs font-medium text-slate-300 transition hover:bg-white/5 disabled:opacity-60"
                >
                  Resend code
                </button>
              </form>
            ) : (
              <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
                {mode === 'sign-up' && (
                  <div className="space-y-1">
                    <label htmlFor="auth-fullname" className="block text-xs font-medium text-slate-400">
                      Full name <span className="text-slate-600">(optional)</span>
                    </label>
                    <input
                      id="auth-fullname"
                      type="text"
                      placeholder="Alex Morgan"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      autoComplete="name"
                      className="flex h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-colors"
                    />
                  </div>
                )}
                <div className="space-y-1">
                  <label htmlFor="auth-email" className="block text-xs font-medium text-slate-400">
                    Email address
                  </label>
                  <input
                    id="auth-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    aria-describedby={error ? 'auth-error' : undefined}
                    className="flex h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="auth-password" className="block text-xs font-medium text-slate-400">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="auth-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder={mode === 'sign-up' ? 'Create a password' : 'Your password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
                      aria-describedby={error ? 'auth-error' : undefined}
                      className="flex h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 pr-11 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      aria-pressed={showPassword}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {mode === 'sign-in' && (
                  <div className="text-right">
                    <button
                      type="button"
                      className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {error && (
                  <div
                    id="auth-error"
                    role="alert"
                    className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-xs text-red-400"
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition-all hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/25 disabled:opacity-60 active:scale-[0.98]"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Loading…
                    </span>
                  ) : mode === 'sign-in' ? (
                    'Sign In'
                  ) : (
                    'Create Account'
                  )}
                </button>
              </form>
            )}

            {/* Mode toggle */}
            <p className="mt-3 text-center text-xs text-slate-500">
              {mode === 'sign-in' ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button
                onClick={() => {
                  setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in');
                  setError(null);
                  resetVerification();
                }}
                className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                {mode === 'sign-in' ? 'Create one' : 'Sign in'}
              </button>
            </p>
          </div>

          {/* BOTTOM — policy, comfortable margin from viewport bottom */}
          <div className="shrink-0 pb-5 pt-2 lg:pb-6">
            <p className="text-center text-[10px] leading-relaxed text-slate-600">
              By continuing you agree to our{' '}
              <a
                href="/terms"
                className="text-indigo-500 hover:text-indigo-400 underline underline-offset-2 transition-colors"
              >
                Terms of Service
              </a>{' '}
              and{' '}
              <a
                href="/privacy"
                className="text-indigo-500 hover:text-indigo-400 underline underline-offset-2 transition-colors"
              >
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>

      </div>
    </>
  );
}
