import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { ClerkProvider, useAuth } from '@clerk/clerk-react';
import { setAuthTokenGetter } from './auth-token';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function MissingClerkKeyScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-center text-slate-100">
      <div className="max-w-md rounded-2xl border border-white/10 bg-slate-900/80 p-8 shadow-sm backdrop-blur-sm">
        <h1 className="mb-3 text-lg font-semibold tracking-tight">Sign-in is not configured</h1>
        <p className="text-sm text-slate-400">
          Set <code className="rounded bg-slate-800 px-1.5 py-0.5 text-xs text-indigo-200">VITE_CLERK_PUBLISHABLE_KEY</code>{' '}
          in your environment (for example <code className="rounded bg-slate-800 px-1.5 py-0.5 text-xs">frontend/.env</code>)
          and restart the dev server.
        </p>
      </div>
    </div>
  );
}

interface ClerkRootProviderProps {
  children: ReactNode;
}

function ClerkTokenBridge() {
  const { getToken } = useAuth();

  useEffect(() => {
    setAuthTokenGetter(async () => getToken());
    return () => { setAuthTokenGetter(null); };
  }, [getToken]);

  return null;
}

export function ClerkRootProvider({ children }: ClerkRootProviderProps) {
  if (!clerkPubKey) {
    return <MissingClerkKeyScreen />;
  }

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      signInUrl="/auth"
      signUpUrl="/auth"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
    >
      <ClerkTokenBridge />
      {children}
    </ClerkProvider>
  );
}
