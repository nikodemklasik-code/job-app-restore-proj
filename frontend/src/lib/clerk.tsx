import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { ClerkProvider, useAuth } from '@clerk/clerk-react';
import { setAuthTokenGetter } from './auth-token';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function MissingClerkKeyScreen() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f172a',
        color: '#fff',
        padding: '24px',
        textAlign: 'center',
      }}
    >
      <div>
        <h1 style={{ marginBottom: '12px' }}>Logowanie nie jest skonfigurowane</h1>
        <p style={{ opacity: 0.85 }}>
          Nie ustawiono VITE_CLERK_PUBLISHABLE_KEY.
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
