import { useState } from 'react';
import { useSignIn, useSignUp } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, KeyRound, Eye, EyeOff, Shield, Zap, LayoutDashboard, Mic, Brain, TrendingUp } from 'lucide-react';

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

/* ─── Floating feature card ─────────────────────────────────────────────────── */
function FloatCard({
  icon,
  title,
  desc,
  accent,
  delay = '0s',
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  accent: string;
  delay?: string;
}) {
  return (
    <div
      className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-xl animate-float"
      style={{ animationDelay: delay }}
    >
      <div className={`mb-1.5 flex items-center gap-2 text-sm font-semibold ${accent}`}>
        {icon}
        {title}
      </div>
      <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
    </div>
  );
}

/* ─── Monitor with looping video / screenshot ────────────────────────────────── */
function DeviceMockup() {
  const rawUrl = (import.meta.env.VITE_AUTH_DEMO_VIDEO_URL as string | undefined)?.trim() ?? '';

  // Accept YouTube watch URLs, youtu.be, or direct mp4/webm
  function toEmbedUrl(raw: string): string | null {
    try {
      const u = new URL(raw);
      if (u.hostname === 'youtu.be') return `https://www.youtube.com/embed/${u.pathname.slice(1)}?autoplay=1&loop=1&playlist=${u.pathname.slice(1)}&mute=1`;
      if (u.hostname.includes('youtube.com')) {
        const v = u.searchParams.get('v');
        if (v) return `https://www.youtube.com/embed/${v}?autoplay=1&loop=1&playlist=${v}&mute=1`;
      }
    } catch {}
    return null;
  }

  const embedUrl = rawUrl ? toEmbedUrl(rawUrl) : null;
  const isDirectVideo = /\.(mp4|webm|ogg)(\?|$)/i.test(rawUrl);

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
              title="Multivohub demo"
              src={embedUrl}
              className="absolute inset-0 h-full w-full"
              allow="autoplay; fullscreen"
              allowFullScreen
            />
          ) : isDirectVideo ? (
            <video
              className="absolute inset-0 h-full w-full object-cover"
              src={rawUrl}
              autoPlay
              loop
              muted
              playsInline
            />
          ) : (
            <>
              <img
                src="https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-50"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/70 via-slate-900/50 to-purple-900/70" />
              {/* Fake UI */}
              <div className="absolute inset-0 p-3 flex flex-col gap-2">
                <div className="flex gap-2 items-center">
                  <div className="h-1.5 w-14 rounded bg-indigo-500/50" />
                  <div className="h-1.5 w-20 rounded bg-white/10" />
                  <div className="ml-auto h-1.5 w-8 rounded bg-emerald-500/50" />
                </div>
                <div className="flex gap-2 mt-1">
                  {['96%', '89%', '92%'].map((v) => (
                    <div key={v} className="flex-1 rounded-xl bg-white/5 border border-white/10 p-2">
                      <div className="text-[10px] font-bold text-indigo-300">{v}</div>
                      <div className="mt-1 h-1 rounded bg-indigo-500/30" />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-1">
                  <div className="flex-1 h-12 rounded-xl bg-white/5 border border-white/10" />
                  <div className="flex-1 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/20" />
                </div>
                <div className="mt-auto flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-medium text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
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

/* ─── Auth page ──────────────────────────────────────────────────────────────── */
export default function AuthPage() {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { signIn, isLoaded: signInLoaded } = useSignIn();
  const { signUp, isLoaded: signUpLoaded } = useSignUp();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInLoaded || !signUpLoaded) return;
    setIsLoading(true);
    setError(null);
    try {
      if (mode === 'sign-in') {
        const result = await signIn!.create({ identifier: email, password });
        if (result.status === 'complete') void navigate('/dashboard');
        else setError('Sign-in requires additional steps. Please try again.');
      } else {
        const result = await signUp!.create({
          emailAddress: email,
          password,
          firstName: firstName || undefined,
        });
        if (result.status === 'complete') {
          void navigate('/dashboard');
        } else if (result.status === 'missing_requirements') {
          // Email verification required
          await signUp!.prepareEmailAddressVerification({ strategy: 'email_code' });
          setError('Check your email for a verification code to complete sign-up.');
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      setError(msg.replace(/^Error: /, ''));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = async (provider: 'oauth_google' | 'oauth_apple' | 'oauth_facebook' | 'oauth_linkedin_oidc') => {
    if (!signInLoaded) return;
    try {
      await signIn!.authenticateWithRedirect({
        strategy: provider,
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/dashboard',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OAuth sign-in failed. Please try again.');
    }
  };

  const cards = [
    { icon: <Shield className="h-3.5 w-3.5" />, title: 'Privacy first', desc: 'Passkeys, 2FA and clear data controls.', accent: 'text-emerald-400', delay: '0s' },
    { icon: <Zap className="h-3.5 w-3.5" />, title: 'Less chaos', desc: 'One place for profile, jobs and applications.', accent: 'text-indigo-400', delay: '0.4s' },
    { icon: <Mic className="h-3.5 w-3.5" />, title: 'Interview Ready', desc: 'AI-coached practice with real feedback.', accent: 'text-violet-400', delay: '0.8s' },
    { icon: <Brain className="h-3.5 w-3.5" />, title: 'Career AI', desc: 'Intelligent assistant that learns from you.', accent: 'text-amber-400', delay: '1.2s' },
    { icon: <LayoutDashboard className="h-3.5 w-3.5" />, title: 'Full pipeline', desc: 'Track every application, stage by stage.', accent: 'text-rose-400', delay: '1.6s' },
    { icon: <TrendingUp className="h-3.5 w-3.5" />, title: 'Job scoring', desc: 'AI fit score on every listing.', accent: 'text-sky-400', delay: '2s' },
  ];

  return (
    <>
      {/* Inject keyframe animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes floatIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes blobPulse {
          0%, 100% { transform: scale(1) translate(0,0); opacity: .18; }
          50%       { transform: scale(1.15) translate(10px,-10px); opacity: .28; }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        .animate-floatIn {
          animation: floatIn .6s ease both;
        }
        .blob-pulse {
          animation: blobPulse 7s ease-in-out infinite;
        }
      `}</style>

      <div className="flex min-h-screen overflow-hidden" style={{ background: '#020617' }}>

        {/* ── LEFT PANEL ─────────────────────────────────────────────────────── */}
        <div className="relative hidden lg:flex flex-1 overflow-hidden">

          {/* Backgrounds */}
          <img
            src="https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg?auto=compress&cs=tinysrgb&w=1600"
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-10 pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900/90 to-indigo-950/70 pointer-events-none" />
          {/* Grid */}
          <div
            className="absolute inset-0 opacity-[0.035] pointer-events-none"
            style={{ backgroundImage: 'linear-gradient(#6366f1 1px,transparent 1px),linear-gradient(90deg,#6366f1 1px,transparent 1px)', backgroundSize: '44px 44px' }}
          />
          {/* Glow blobs */}
          <div className="blob-pulse absolute top-1/4 left-1/4 h-80 w-80 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />
          <div className="blob-pulse absolute bottom-1/3 right-1/3 h-64 w-64 rounded-full bg-purple-700/15 blur-3xl pointer-events-none" style={{ animationDelay: '3.5s' }} />

          {/* Content — full height flex column */}
          <div className="relative z-10 flex h-full w-full flex-col px-10 py-10">

            {/* Logo */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-base text-white tracking-tight">MultivoHub</span>
              <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-medium text-indigo-400">Career workspace</span>
            </div>

            {/* Centre: monitor + cards side-by-side */}
            <div className="flex flex-1 items-center justify-center gap-8 min-h-0">

              {/* Monitor */}
              <DeviceMockup />

              {/* 6 cards stacked on the right of monitor */}
              <div className="flex flex-col gap-3 w-[190px] shrink-0">
                {cards.map((c) => (
                  <FloatCard key={c.title} {...c} />
                ))}
              </div>
            </div>

            {/* Bottom text — always visible, never overlaps */}
            <div className="shrink-0 pt-6 space-y-3 animate-floatIn" style={{ animationDelay: '0.3s' }}>
              <h1 className="text-2xl font-bold text-white leading-tight">
                Your career process,{' '}
                <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  in one clear space.
                </span>
              </h1>
              <p className="text-sm text-slate-400 max-w-md">
                From CV and profile through discovery, applications, and interview practice — structured tools with UK-oriented job search in mind.
              </p>
              <div className="flex gap-2 flex-wrap">
                {['Profile & CV', 'Interview Ready', 'Career AI', 'Job Tracking', 'Auto-Apply'].map((pill) => (
                  <span key={pill} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                    {pill}
                  </span>
                ))}
              </div>
              <p className="text-xs text-slate-700">© 2026 MultivoHub. All rights reserved.</p>
            </div>

          </div>
        </div>

        {/* ── RIGHT PANEL — auth form ──────────────────────────────────────── */}
        <div className="flex w-full flex-col items-center justify-center px-6 py-10 lg:w-[440px] lg:border-l lg:border-white/5 overflow-y-auto">

          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-bold text-white">MultivoHub</span>
          </div>

          <div className="w-full max-w-sm">
            {/* Heading */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white">
                {mode === 'sign-in' ? 'Welcome back' : 'Create workspace'}
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                {mode === 'sign-in' ? 'Sign in to your career workspace' : 'Start your career journey today'}
              </p>
            </div>

            {/* Passkey */}
            <button className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-3 text-sm font-medium text-emerald-400 transition-all hover:bg-emerald-500/20 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10">
              <KeyRound className="h-4 w-4" />
              Continue with Passkey
            </button>

            <div className="relative my-4 flex items-center">
              <div className="flex-1 border-t border-white/10" />
              <span className="mx-3 text-xs text-slate-500">or continue with</span>
              <div className="flex-1 border-t border-white/10" />
            </div>

            {/* OAuth — Google + Apple + Facebook + LinkedIn */}
            <div className="mb-4 grid grid-cols-2 gap-2">
              <button
                onClick={() => void handleOAuth('oauth_google')}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-medium text-slate-300 transition hover:bg-white/10"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </button>
              <button
                onClick={() => void handleOAuth('oauth_apple')}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-medium text-slate-300 transition hover:bg-white/10"
              >
                <AppleIcon />
                Apple
              </button>
              <button
                onClick={() => void handleOAuth('oauth_facebook')}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-medium text-slate-300 transition hover:bg-white/10"
              >
                <FacebookIcon />
                Facebook
              </button>
              <button
                onClick={() => void handleOAuth('oauth_linkedin_oidc')}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-medium text-slate-300 transition hover:bg-white/10"
              >
                <LinkedInIcon />
                LinkedIn
              </button>
            </div>

            <div className="relative my-4 flex items-center">
              <div className="flex-1 border-t border-white/10" />
              <span className="mx-3 text-xs text-slate-500">or with email</span>
              <div className="flex-1 border-t border-white/10" />
            </div>

            {/* Form */}
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
              {mode === 'sign-up' && (
                <input
                  type="text"
                  placeholder="First name (optional)"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="flex h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-colors"
                />
              )}
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="flex h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-colors"
              />
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
                  className="flex h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 pr-11 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {mode === 'sign-in' && (
                <div className="text-right">
                  <button type="button" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                    Forgot password?
                  </button>
                </div>
              )}

              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-xs text-red-400">
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
                ) : mode === 'sign-in' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <p className="mt-5 text-center text-xs text-slate-500">
              {mode === 'sign-in' ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button
                onClick={() => { setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in'); setError(null); }}
                className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                {mode === 'sign-in' ? 'Create one' : 'Sign in'}
              </button>
            </p>

            <p className="mt-5 text-center text-[10px] text-slate-600">
              By continuing you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>

      </div>
    </>
  );
}
