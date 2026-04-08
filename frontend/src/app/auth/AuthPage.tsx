import { useState } from 'react';
import { useSignIn, useSignUp } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, KeyRound, Github, Chrome } from 'lucide-react';

export default function AuthPage() {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      setError('OAuth failed');
    }
  };

  return (
    <div className="flex min-h-screen" style={{ background: '#020617' }}>
      {/* Left panel — hero */}
      <div className="hidden flex-1 flex-col justify-between p-12 lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="font-display text-lg font-bold text-white">MultivoHub</span>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: '12k+', sub: 'Active Users' },
              { label: '4.9', sub: 'App Rating' },
              { label: '3×', sub: 'Faster Hiring' },
              { label: '85%', sub: 'Avg Fit Score' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                <p className="font-display text-3xl font-bold text-white">{stat.label}</p>
                <p className="mt-1 text-sm text-slate-400">{stat.sub}</p>
              </div>
            ))}
          </div>

          <div>
            <h2 className="font-display text-4xl font-bold text-white leading-tight">
              Organise your<br />career process
            </h2>
            <p className="mt-3 text-slate-400">
              AI-powered job tracking, interview coaching, and career intelligence — all in one workspace.
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-600">© 2026 MultivoHub. All rights reserved.</p>
      </div>

      {/* Right panel — form */}
      <div className="flex w-full flex-col items-center justify-center p-8 lg:w-[460px] lg:border-l lg:border-white/5">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="font-display text-2xl font-bold text-white">
              {mode === 'sign-in' ? 'Welcome back' : 'Create workspace'}
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              {mode === 'sign-in' ? 'Sign in to your career workspace' : 'Start your career journey'}
            </p>
          </div>

          {/* Passkey */}
          <button className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-3 text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20">
            <KeyRound className="h-4 w-4" />
            Continue with Passkey
          </button>

          <div className="relative my-4 flex items-center">
            <div className="flex-1 border-t border-white/10" />
            <span className="mx-3 text-xs text-slate-500">or continue with</span>
            <div className="flex-1 border-t border-white/10" />
          </div>

          {/* OAuth */}
          <div className="mb-4 grid grid-cols-2 gap-2">
            <button
              onClick={() => void handleOAuth('oauth_google')}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10"
            >
              <Chrome className="h-4 w-4" />
              Google
            </button>
            <button
              onClick={() => void handleOAuth('oauth_github')}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10"
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

          {/* Email form */}
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="flex h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />

            {error && <p className="text-xs text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
            >
              {isLoading ? 'Loading...' : mode === 'sign-in' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-slate-500">
            {mode === 'sign-in' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              onClick={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}
              className="text-indigo-400 hover:text-indigo-300"
            >
              {mode === 'sign-in' ? 'Create one now' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
