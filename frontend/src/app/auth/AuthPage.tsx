import { useState } from 'react';
import { useSignIn, useSignUp } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, KeyRound, Github, Eye, EyeOff, Shield, Zap, LayoutDashboard, Mic } from 'lucide-react';

/* ─── Apple SVG icon ─── */
const AppleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701z" />
  </svg>
);

/* ─── Floating feature card ─── */
const FloatCard = ({ icon, title, desc, accent }: { icon: React.ReactNode; title: string; desc: string; accent: string }) => (
  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-xl">
    <div className={`mb-2 flex items-center gap-2 text-sm font-semibold ${accent}`}>
      {icon}
      {title}
    </div>
    <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
  </div>
);

/* ─── Monitor device with product screenshot ─── */
const DeviceMockup = () => {
  const [playing, setPlaying] = useState(false);
  const demoUrl = (import.meta.env.VITE_AUTH_DEMO_VIDEO_URL as string | undefined)?.trim() ?? '';

  return (
    <div className="relative mx-auto w-[340px]">
      {/* Glow behind monitor */}
      <div className="absolute inset-0 -z-10 blur-3xl opacity-30 bg-gradient-to-b from-indigo-600 via-purple-700 to-transparent rounded-full scale-110" />

      {/* Monitor frame */}
      <div className="relative rounded-2xl border border-white/20 bg-gradient-to-b from-slate-700 to-slate-800 p-2 shadow-2xl ring-1 ring-white/5">
        {/* Notch / camera */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-px h-1.5 w-16 rounded-b-full bg-slate-900/80" />

        {/* Screen */}
        <div className="relative overflow-hidden rounded-xl aspect-[16/10] bg-slate-900">
          {playing && demoUrl ? (
            <iframe
              title="Multivohub demo"
              src={`https://www.youtube.com/embed/${demoUrl}?autoplay=1`}
              className="absolute inset-0 h-full w-full"
              allow="autoplay; fullscreen"
            />
          ) : (
            <>
              {/* Fake dashboard screenshot */}
              <img
                src="https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-60"
              />
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/60 via-slate-900/40 to-purple-900/60" />

              {/* Fake UI bars */}
              <div className="absolute inset-0 p-3 flex flex-col gap-2">
                <div className="flex gap-2">
                  <div className="h-2 w-16 rounded bg-indigo-500/40" />
                  <div className="h-2 w-24 rounded bg-white/10" />
                  <div className="ml-auto h-2 w-8 rounded bg-emerald-500/40" />
                </div>
                <div className="flex gap-2 mt-1">
                  {['96%', '89%', '92%'].map((v) => (
                    <div key={v} className="flex-1 rounded-xl bg-white/5 border border-white/10 p-2">
                      <div className="text-[10px] font-bold text-indigo-300">{v}</div>
                      <div className="mt-1 h-1 rounded bg-indigo-500/30" />
                    </div>
                  ))}
                </div>
                <div className="mt-auto flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-medium text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live
                  </span>
                  <span className="text-[9px] text-slate-400">Multivohub workspace</span>
                </div>
              </div>

              {/* Play button if video configured */}
              {demoUrl && (
                <button
                  onClick={() => setPlaying(true)}
                  className="absolute inset-0 flex items-center justify-center group"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur border border-white/20 group-hover:bg-white/20 transition-all shadow-xl">
                    <svg viewBox="0 0 24 24" fill="white" className="h-5 w-5 ml-0.5"><path d="M8 5v14l11-7z" /></svg>
                  </div>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Monitor stand */}
      <div className="mx-auto mt-1 w-16 h-3 rounded-b-lg bg-gradient-to-b from-slate-700 to-slate-800 border border-white/10" />
      <div className="mx-auto w-24 h-1 rounded-full bg-slate-700/60 border border-white/10 shadow" />

      {/* Floating video cards */}
      <div className="absolute -right-4 top-4 w-28 rounded-xl border border-white/10 bg-slate-900/80 backdrop-blur p-2 shadow-xl">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[9px] text-slate-400">Recording</span>
        </div>
        <div className="text-[10px] font-semibold text-white">Interview Ready</div>
        <div className="mt-1 h-1 rounded-full bg-indigo-500/40 w-3/4" />
      </div>

      <div className="absolute -left-4 bottom-8 w-28 rounded-xl border border-white/10 bg-slate-900/80 backdrop-blur p-2 shadow-xl">
        <div className="text-[9px] text-slate-400 mb-1">Job Fit Score</div>
        <div className="text-lg font-bold text-emerald-400">96%</div>
        <div className="mt-1 h-1 rounded-full bg-emerald-500/40" />
      </div>
    </div>
  );
};

export default function AuthPage() {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      if (mode === 'sign-in') {
        const result = await signIn?.create({ identifier: email, password });
        if (result?.status === 'complete') void navigate('/dashboard');
      } else {
        const result = await signUp?.create({ emailAddress: email, password });
        if (result?.status === 'complete') void navigate('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = async (provider: 'oauth_google' | 'oauth_apple' | 'oauth_github') => {
    try {
      await signIn?.authenticateWithRedirect({
        strategy: provider,
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/dashboard',
      });
    } catch {
      setError('OAuth failed. Please try again.');
    }
  };

  return (
    <div className="flex min-h-screen" style={{ background: '#020617' }}>

      {/* ── Left panel — Komposo hero ── */}
      <div className="relative hidden flex-1 overflow-hidden lg:flex lg:flex-col">
        {/* Background image + gradients */}
        <img
          src="https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg?auto=compress&cs=tinysrgb&w=1600"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900/80 to-indigo-950/60" />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(#6366f1 1px,transparent 1px),linear-gradient(90deg,#6366f1 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
        {/* Glow blobs */}
        <div className="absolute top-1/4 left-1/3 h-72 w-72 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-56 w-56 rounded-full bg-purple-700/15 blur-3xl" />

        {/* Content */}
        <div className="relative z-10 flex h-full flex-col px-12 py-10">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-display text-base font-bold text-white tracking-tight">MultivoHub</span>
            <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-medium text-indigo-400">Career workspace</span>
          </div>

          {/* Center — device mockup + floating cards */}
          <div className="flex flex-1 flex-col items-center justify-center gap-6 py-8">
            {/* Top floating cards */}
            <div className="grid w-full max-w-md grid-cols-2 gap-3">
              <FloatCard
                icon={<Shield className="h-3.5 w-3.5" />}
                title="Privacy first"
                desc="Passkeys, 2FA and clear data controls."
                accent="text-emerald-400"
              />
              <FloatCard
                icon={<Zap className="h-3.5 w-3.5" />}
                title="Less chaos"
                desc="One place for profile, jobs, applications."
                accent="text-indigo-400"
              />
            </div>

            {/* Monitor */}
            <DeviceMockup />

            {/* Bottom floating cards */}
            <div className="grid w-full max-w-md grid-cols-2 gap-3">
              <FloatCard
                icon={<Mic className="h-3.5 w-3.5" />}
                title="Interview Ready"
                desc="AI-coached practice with real feedback."
                accent="text-violet-400"
              />
              <FloatCard
                icon={<LayoutDashboard className="h-3.5 w-3.5" />}
                title="Full pipeline"
                desc="Track every application, stage by stage."
                accent="text-amber-400"
              />
            </div>
          </div>

          {/* Footer headline */}
          <div className="space-y-3">
            <h1 className="font-display text-3xl font-bold text-white leading-tight">
              Your career process,<br />
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                in one clear space.
              </span>
            </h1>
            <p className="text-sm text-slate-400 max-w-sm">
              From CV and profile through discovery, applications, and interview practice — structured tools with UK-oriented job search in mind.
            </p>
            <div className="flex gap-2 flex-wrap">
              {['Profile & CV', 'Interview Ready', 'Career AI', 'Job Tracking'].map((pill) => (
                <span key={pill} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                  {pill}
                </span>
              ))}
            </div>
          </div>

          <p className="mt-6 text-xs text-slate-600">© 2026 MultivoHub. All rights reserved.</p>
        </div>
      </div>

      {/* ── Right panel — auth form ── */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-10 lg:w-[460px] lg:border-l lg:border-white/5">
        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="font-display text-base font-bold text-white">MultivoHub</span>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-7">
            <h2 className="font-display text-2xl font-bold text-white">
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

          {/* OAuth — 3 providers */}
          <div className="mb-4 grid grid-cols-3 gap-2">
            <button
              onClick={() => void handleOAuth('oauth_google')}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-medium text-slate-300 transition-colors hover:bg-white/10"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>
            <button
              onClick={() => void handleOAuth('oauth_apple')}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-medium text-slate-300 transition-colors hover:bg-white/10"
            >
              <AppleIcon />
              Apple
            </button>
            <button
              onClick={() => void handleOAuth('oauth_github')}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-medium text-slate-300 transition-colors hover:bg-white/10"
            >
              <Github className="h-4 w-4" />
              GitHub
            </button>
          </div>

          <div className="relative my-4 flex items-center">
            <div className="flex-1 border-t border-white/10" />
            <span className="mx-3 text-xs text-slate-500">or with email</span>
            <div className="flex-1 border-t border-white/10" />
          </div>

          {/* Email + password form */}
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-colors"
            />

            {/* Password with show/hide toggle */}
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="flex h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 pr-11 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
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
                  Loading...
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
              {mode === 'sign-in' ? 'Create one now' : 'Sign in'}
            </button>
          </p>

          <p className="mt-6 text-center text-[10px] text-slate-600">
            By continuing you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
