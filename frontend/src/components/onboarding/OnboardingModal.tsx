import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  User,
  Briefcase,
  Mic,
  ChevronRight,
  X,
  Search,
  ClipboardList,
  CheckCircle,
  Bot,
  PanelTop,
  Volume2,
  VolumeX,
  ChevronUp,
  FileText,
  LayoutGrid,
} from 'lucide-react';

const STORAGE_KEY = 'multivohub_onboarding_done';
const SESSION_UI_KEY = 'multivohub_onboarding_ui';
const SESSION_STEP_KEY = 'multivohub_onboarding_step';

export function hasCompletedOnboarding(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function readOnboardingSessionUi(): 'minimized' | null {
  try {
    return sessionStorage.getItem(SESSION_UI_KEY) === 'minimized' ? 'minimized' : null;
  } catch {
    return null;
  }
}

export function readOnboardingSessionStep(): number | null {
  try {
    const raw = sessionStorage.getItem(SESSION_STEP_KEY);
    if (raw == null) return null;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function markOnboardingDone(): void {
  try {
    localStorage.setItem(STORAGE_KEY, 'true');
  } catch {
    // ignore storage errors
  }
}

function clearOnboardingSession(): void {
  try {
    sessionStorage.removeItem(SESSION_UI_KEY);
    sessionStorage.removeItem(SESSION_STEP_KEY);
  } catch {
    // ignore
  }
}

/** Clear only the minimized UI flag so the next visit opens fullscreen while keeping step in session. */
export function clearOnboardingMinimizedFlag(): void {
  try {
    sessionStorage.removeItem(SESSION_UI_KEY);
  } catch {
    // ignore
  }
}

export function completeOnboardingForever(): void {
  markOnboardingDone();
  clearOnboardingSession();
}

function persistOnboardingSessionMinimized(step: number): void {
  try {
    sessionStorage.setItem(SESSION_UI_KEY, 'minimized');
    sessionStorage.setItem(SESSION_STEP_KEY, String(step));
  } catch {
    // ignore
  }
}

function persistStepOnly(step: number): void {
  try {
    sessionStorage.setItem(SESSION_STEP_KEY, String(step));
  } catch {
    // ignore
  }
}

// ── Steps ──────────────────────────────────────────────────────────────────

interface Step {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  aiTip: string;
  cta?: string;
  route?: string;
}

const STEPS: Step[] = [
  {
    icon: Sparkles,
    title: 'Welcome to MultivoHub',
    description:
      'Your AI-powered career workspace. We help you find great roles, prepare for interviews, and land the job — faster. Stay signed in: if you ever see Authentication required, use Sign in again from the user menu or the auth page — you will return to where you left off. Sending applications from your own email is separate: configure Settings → Email and SMTP after you are signed in.',
    aiTip:
      "Hey! I'm your AI guide. I'll walk you through the key features in under 2 minutes. You can revisit any section from the sidebar at any time. If something says Authentication required, that is your account session with the server — sign in again, then open Settings → System Readiness and use Check API session to confirm the server recognises you.",
  },
  {
    icon: User,
    title: 'Step 1 — Set up your CV Studio',
    description:
      "Upload your CV (PDF) and we'll auto-fill your profile. Your data powers CV generation, cover letters, and job matching.",
    aiTip:
      'The more complete your CV Studio is, the better your job match scores. Even a rough CV is fine — you can refine it later in the editor.',
    cta: 'Go to CV Studio',
    route: '/profile',
  },
  {
    icon: Search,
    title: 'Step 2 — Discover Jobs',
    description:
      'Search live jobs from Reed, Adzuna, Jooble, and more. Each result shows an AI-calculated fit score based on your profile.',
    aiTip:
      'I calculate a fit score for every listing using your skills, title, and experience. Strong matches show in green — focus there first to save time.',
    cta: 'Browse Jobs',
    route: '/jobs',
  },
  {
    icon: ClipboardList,
    title: 'Step 3 — Track Applications',
    description:
      'Add jobs to your pipeline and track them through stages: Saved → Applied → In Review → Interview → Offer. Never lose track.',
    aiTip:
      "Treat your pipeline like a Kanban board. Move stale cards to Expired or Closed so you stay focused on live opportunities.",
    cta: 'Open pipeline board',
    route: '/applications/board',
  },
  {
    icon: Mic,
    title: 'Step 4 — Practice Interviews',
    description:
      'Use Interview Ready to practice with an AI coach. Choose from Behavioral, Technical, HR, Case Study, and more. Get instant STAR feedback.',
    aiTip:
      'Every answer is scored on STAR structure, clarity, and confidence. Candidates who practice several sessions often feel calmer in real interviews.',
    cta: 'Start Practicing',
    route: '/practice/interview',
  },
  {
    icon: Briefcase,
    title: "You're all set!",
    description:
      'Explore the sidebar to discover all tools: Career Assistant, Style Studio, Review Queue, and more. Good luck with your search.',
    aiTip:
      "You're ready. I am always one click away in Career Assistant if you need strategy advice, cover letter help, or a thinking partner.",
    cta: 'Go to Dashboard',
    route: '/dashboard',
  },
];

export const ONBOARDING_STEP_COUNT = STEPS.length;

function stepCtaIcon(stepIndex: number, isLast: boolean) {
  if (isLast) return CheckCircle;
  const s = STEPS[stepIndex];
  if (s.route === '/profile') return FileText;
  if (s.route === '/jobs') return Search;
  if (s.route === '/applications/board') return LayoutGrid;
  if (s.route === '/practice/interview') return Mic;
  if (s.route === '/dashboard') return ChevronRight;
  return ChevronRight;
}

function stripForSpeech(text: string): string {
  return text.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').replace(/\s+/g, ' ').trim();
}

function speakOnboardingBlock(text: string, onEnd?: () => void): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    onEnd?.();
    return;
  }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(stripForSpeech(text));
  u.lang = 'en-GB';
  u.rate = 0.95;
  u.onend = () => onEnd?.();
  u.onerror = () => onEnd?.();
  window.speechSynthesis.speak(u);
}

function stopOnboardingSpeech(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

// ── Typing animation hook ──────────────────────────────────────────────────

function useTypingText(text: string, enabled: boolean): string {
  const [displayed, setDisplayed] = useState('');
  const indexRef = useRef(0);

  useEffect(() => {
    setDisplayed('');
    indexRef.current = 0;
    if (!enabled) {
      setDisplayed(text);
      return;
    }
    const interval = setInterval(() => {
      indexRef.current += 1;
      setDisplayed(text.slice(0, indexRef.current));
      if (indexRef.current >= text.length) clearInterval(interval);
    }, 18);
    return () => clearInterval(interval);
  }, [text, enabled]);

  return displayed;
}

// ── Minimized dock ─────────────────────────────────────────────────────────

export interface OnboardingDockProps {
  step: number;
  onExpand: () => void;
  onDontShowAgain: () => void;
}

export function OnboardingDock({ step, onExpand, onDontShowAgain }: OnboardingDockProps) {
  const [speaking, setSpeaking] = useState(false);
  const safeStep = Math.min(Math.max(step, 0), STEPS.length - 1);
  const current = STEPS[safeStep]!;

  const listenLabel = useCallback(() => {
    return `${current.title}. ${current.description} ${current.aiTip}`;
  }, [current]);

  const toggleListen = () => {
    if (speaking) {
      stopOnboardingSpeech();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    speakOnboardingBlock(listenLabel(), () => setSpeaking(false));
  };

  useEffect(() => () => stopOnboardingSpeech(), []);

  return (
    <div
      className="fixed bottom-6 left-6 z-[60] flex max-w-md flex-col gap-2 rounded-2xl border border-indigo-500/30 bg-slate-900/95 p-3 shadow-2xl backdrop-blur-md sm:flex-row sm:items-center"
      role="region"
      aria-label="Onboarding minimized"
    >
      <div className="min-w-0 flex-1 px-1">
        <p className="text-xs font-medium text-indigo-300">Setup guide</p>
        <p className="truncate text-sm font-semibold text-white">{current.title}</p>
        <p className="text-[10px] text-slate-500">
          Step {safeStep + 1} of {STEPS.length} · Tap expand to continue
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
        <button
          type="button"
          onClick={toggleListen}
          disabled={typeof window !== 'undefined' && !window.speechSynthesis}
          title={speaking ? 'Stop' : 'Listen to this step'}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {speaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          {speaking ? 'Stop' : 'Listen'}
        </button>
        <button
          type="button"
          onClick={onExpand}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500"
        >
          <PanelTop className="h-4 w-4" />
          Expand
        </button>
        <button
          type="button"
          onClick={onDontShowAgain}
          className="rounded-lg px-2 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-500 hover:text-slate-300"
        >
          Don&apos;t show again
        </button>
      </div>
    </div>
  );
}

// ── Fullscreen modal ───────────────────────────────────────────────────────

export interface OnboardingModalProps {
  step: number;
  onStepChange: (step: number) => void;
  onMinimize: () => void;
  onFullyDismiss: () => void;
}

export default function OnboardingModal({ step, onStepChange, onMinimize, onFullyDismiss }: OnboardingModalProps) {
  const [animEnabled] = useState(
    () => !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [speaking, setSpeaking] = useState(false);
  const navigate = useNavigate();
  const safeStep = Math.min(Math.max(step, 0), STEPS.length - 1);
  const current = STEPS[safeStep]!;
  const isLast = safeStep === STEPS.length - 1;
  const Icon = current.icon;
  const typedTip = useTypingText(current.aiTip, animEnabled);

  const fullSpeechText = `${current.title}. ${current.description} ${current.aiTip}`;

  const toggleListen = () => {
    if (speaking) {
      stopOnboardingSpeech();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    speakOnboardingBlock(fullSpeechText, () => setSpeaking(false));
  };

  useEffect(() => () => stopOnboardingSpeech(), []);

  function finishAndDismiss(navigateTo?: string) {
    stopOnboardingSpeech();
    markOnboardingDone();
    clearOnboardingSession();
    onFullyDismiss();
    if (navigateTo) void navigate(navigateTo);
  }

  function handleNext() {
    stopOnboardingSpeech();
    if (isLast) {
      const dest = current.route;
      finishAndDismiss(dest);
    } else {
      const next = safeStep + 1;
      onStepChange(next);
      persistStepOnly(next);
    }
  }

  function handleCta() {
    stopOnboardingSpeech();
    if (current.route) {
      persistOnboardingSessionMinimized(safeStep);
      onMinimize();
      void navigate(current.route);
    } else {
      handleNext();
    }
  }

  function handleSkip() {
    finishAndDismiss();
  }

  const CtaIcon = stepCtaIcon(safeStep, isLast);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome onboarding"
    >
      <div className="relative mx-4 w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-8 shadow-2xl">
        <div className="absolute right-12 top-4 flex items-center gap-1">
          <button
            type="button"
            onClick={toggleListen}
            disabled={typeof window !== 'undefined' && !window.speechSynthesis}
            title={speaking ? 'Stop reading' : 'Listen to this step'}
            aria-label={speaking ? 'Stop reading' : 'Listen to this step'}
            className="flex h-7 w-7 items-center justify-center rounded-full text-slate-500 transition hover:bg-white/10 hover:text-slate-300 disabled:opacity-40"
          >
            {speaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => {
              stopOnboardingSpeech();
              persistOnboardingSessionMinimized(safeStep);
              onMinimize();
            }}
            title="Minimize and keep working (e.g. upload a document)"
            aria-label="Minimize onboarding"
            className="flex h-7 w-7 items-center justify-center rounded-full text-slate-500 transition hover:bg-white/10 hover:text-slate-300"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={handleSkip}
          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full text-slate-500 transition hover:bg-white/10 hover:text-slate-300"
          aria-label="Skip onboarding"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-6 flex items-center justify-center gap-2">
          {STEPS.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                onStepChange(i);
                persistStepOnly(i);
              }}
              aria-label={`Go to step ${i + 1}`}
              className={[
                'h-2 rounded-full transition-all',
                i === safeStep ? 'w-6 bg-indigo-500' : i < safeStep ? 'w-2 bg-indigo-400/60' : 'w-2 bg-white/20',
              ].join(' ')}
            />
          ))}
        </div>

        <div className="mb-5 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/20">
            <Icon className="h-8 w-8 text-indigo-400" />
          </div>
        </div>

        <h2 className="mb-3 text-center text-xl font-bold text-white">{current.title}</h2>
        <p className="mb-5 text-center text-sm leading-relaxed text-slate-400">{current.description}</p>

        <div className="mb-7 flex gap-3 rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-4">
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <p
            className="text-xs leading-relaxed text-indigo-200"
            aria-live="polite"
            aria-label="AI guide tip"
          >
            {typedTip}
            {animEnabled && typedTip.length < current.aiTip.length && (
              <span className="ml-0.5 inline-block h-3 w-0.5 animate-pulse bg-indigo-400" aria-hidden="true" />
            )}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {current.cta && current.route && (
            <button
              type="button"
              onClick={handleCta}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              {isLast ? <CheckCircle className="h-4 w-4" /> : <CtaIcon className="h-4 w-4" />}
              {current.cta}
            </button>
          )}
          <button
            type="button"
            onClick={handleNext}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/10"
          >
            {isLast ? 'Finish' : 'Next'}
            {!isLast && <ChevronRight className="h-4 w-4" />}
          </button>
        </div>

        <p className="mt-5 text-center text-xs text-slate-600">
          {safeStep + 1} / {STEPS.length}
        </p>
      </div>
    </div>
  );
}
