import { useEffect, useRef, useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import { Volume2, VolumeX } from 'lucide-react';
import { api } from '@/lib/api';
import { useThemeStore } from '@/stores/themeStore';
import Sidebar from './Sidebar';
import Header from './Header';
import OnboardingModal, { hasCompletedOnboarding } from '../onboarding/OnboardingModal';

// ─── Text-to-Speech floating button ──────────────────────────────────────────
function TTSButton() {
  const [speaking, setSpeaking] = useState(false);

  const speak = () => {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const heading =
      document.querySelector('h1')?.textContent ??
      document.querySelector('h2')?.textContent ??
      document.title;
    const mainEl = document.querySelector('main, [role="main"], .page-content');
    const text = mainEl?.textContent?.replace(/\s+/g, ' ').trim().slice(0, 600) ?? heading ?? document.title;
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'en-US';
    utt.rate = 0.9;
    utt.onend = () => setSpeaking(false);
    utt.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utt);
    setSpeaking(true);
  };

  return (
    <button
      onClick={speak}
      title={speaking ? 'Stop reading' : 'Read page aloud'}
      aria-label={speaking ? 'Stop reading' : 'Read page aloud'}
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        borderRadius: '50%',
        width: 48,
        height: 48,
        background: speaking ? '#dc2626' : '#6366f1',
        border: 'none',
        boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 0.2s',
      }}
    >
      {speaking
        ? <VolumeX style={{ width: 22, height: 22, color: '#fff' }} />
        : <Volume2 style={{ width: 22, height: 22, color: '#fff' }} />}
    </button>
  );
}

export default function AppShell() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const { focusMode } = useThemeStore();
  const ensureFromClerk = api.profile.ensureFromClerk.useMutation();
  const ensuredForClerkId = useRef<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!userLoaded || !user) return;
    const email = user.primaryEmailAddress?.emailAddress;
    if (!email) return;
    if (ensuredForClerkId.current === user.id) return;
    ensuredForClerkId.current = user.id;
    const display =
      user.fullName?.trim() ||
      [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
      undefined;
    ensureFromClerk.mutate({ userId: user.id, email, fullName: display });
    if (!hasCompletedOnboarding()) {
      setShowOnboarding(true);
    }
  }, [userLoaded, user, ensureFromClerk]);

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Skip-to-content link for keyboard / screen-reader users */}
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>

      {!focusMode && <Sidebar />}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main id="main-content" className="flex-1 overflow-y-auto" tabIndex={-1}>
          <div className="mx-auto max-w-6xl p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
      <TTSButton />
      {showOnboarding && <OnboardingModal onClose={() => setShowOnboarding(false)} />}
    </div>
  );
}
