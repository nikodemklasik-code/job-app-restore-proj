import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, User, Briefcase, Mic, ChevronRight, X,
  Upload, Search, ClipboardList, CheckCircle, Bot,
} from 'lucide-react';

const STORAGE_KEY = 'multivohub_onboarding_done';

export function hasCompletedOnboarding(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function markOnboardingDone(): void {
  try {
    localStorage.setItem(STORAGE_KEY, 'true');
  } catch {
    // ignore storage errors
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
      "Your AI-powered career workspace. We help you find great roles, prepare for interviews, and land the job — faster.",
    aiTip:
      "Hey! I'm your AI guide 👋 I'll walk you through the key features in under 2 minutes. You can revisit any section from the sidebar at any time.",
  },
  {
    icon: User,
    title: 'Step 1 — Set up your CV Studio',
    description:
      "Upload your CV (PDF) and we'll auto-fill your profile. Your data powers CV generation, cover letters, and job matching.",
    aiTip:
      "Pro tip: the more complete your CV Studio is, the better your job match scores. Even a rough CV is fine — you can always refine it later inside the editor.",
    cta: 'Go to CV Studio',
    route: '/profile',
  },
  {
    icon: Search,
    title: 'Step 2 — Discover Jobs',
    description:
      'Search live jobs from Reed, Adzuna, Jooble, and more. Each result shows an AI-calculated fit score based on your profile.',
    aiTip:
      "I calculate a fit score (0–100%) for every listing using your skills, title, and experience. Green = strong match. Focus there first to save time.",
    cta: 'Browse Jobs',
    route: '/jobs',
  },
  {
    icon: ClipboardList,
    title: 'Step 3 — Track Applications',
    description:
      'Add jobs to your pipeline and track them through stages: Saved → Applied → In Review → Interview → Offer. Never lose track.',
    aiTip:
      "Treat your pipeline like a Kanban board. Moving a card to 'Expired' or 'Closed' keeps your focus on live opportunities — no clutter, no confusion.",
    cta: 'Open Pipeline',
    route: '/applications',
  },
  {
    icon: Mic,
    title: 'Step 4 — Practice Interviews',
    description:
      'Use Interview Ready to practice with an AI coach. Choose from Behavioral, Technical, HR, Case Study, and more. Get instant STAR feedback.',
    aiTip:
      "I score every answer on STAR structure, clarity, and confidence. Candidates who practice 3+ sessions see measurably better real-interview outcomes. Let's go! 💪",
    cta: 'Start Practicing',
    route: '/interview',
  },
  {
    icon: Briefcase,
    title: "You're all set!",
    description:
      'Explore the sidebar to discover all tools: Career Assistant, Style Studio, Review Queue, and more. Good luck! 🚀',
    aiTip:
      "You're ready! Remember: I'm always one click away in Career Assistant if you need strategy advice, help writing a cover letter, or just want to think out loud. You've got this!",
    cta: 'Go to Dashboard',
    route: '/dashboard',
  },
];

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

// ── Component ──────────────────────────────────────────────────────────────

interface OnboardingModalProps {
  onClose: () => void;
}

export default function OnboardingModal({ onClose }: OnboardingModalProps) {
  const [step, setStep] = useState(0);
  const [animEnabled] = useState(
    () => !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const navigate = useNavigate();
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const Icon = current.icon;
  const typedTip = useTypingText(current.aiTip, animEnabled);

  function handleNext() {
    if (isLast) {
      markOnboardingDone();
      onClose();
      if (current.route) void navigate(current.route);
    } else {
      setStep((s) => s + 1);
    }
  }

  function handleCta() {
    if (current.route) {
      markOnboardingDone();
      onClose();
      void navigate(current.route);
    } else {
      handleNext();
    }
  }

  function handleSkip() {
    markOnboardingDone();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome onboarding"
    >
      <div className="relative mx-4 w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-8 shadow-2xl">
        {/* Skip */}
        <button
          onClick={handleSkip}
          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full text-slate-500 transition hover:bg-white/10 hover:text-slate-300"
          aria-label="Skip onboarding"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Progress dots */}
        <div className="mb-6 flex items-center justify-center gap-2">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              aria-label={`Go to step ${i + 1}`}
              className={[
                'h-2 rounded-full transition-all',
                i === step
                  ? 'w-6 bg-indigo-500'
                  : i < step
                  ? 'w-2 bg-indigo-400/60'
                  : 'w-2 bg-white/20',
              ].join(' ')}
            />
          ))}
        </div>

        {/* Icon */}
        <div className="mb-5 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/20">
            <Icon className="h-8 w-8 text-indigo-400" />
          </div>
        </div>

        {/* Content */}
        <h2 className="mb-3 text-center text-xl font-bold text-white">{current.title}</h2>
        <p className="mb-5 text-center text-sm leading-relaxed text-slate-400">{current.description}</p>

        {/* AI Guide bubble */}
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

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {current.cta && current.route && (
            <button
              onClick={handleCta}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              {isLast ? <CheckCircle className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
              {current.cta}
            </button>
          )}
          <button
            onClick={handleNext}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/10"
          >
            {isLast ? 'Finish' : 'Next'}
            {!isLast && <ChevronRight className="h-4 w-4" />}
          </button>
        </div>

        {/* Step count */}
        <p className="mt-5 text-center text-xs text-slate-600">
          {step + 1} / {STEPS.length}
        </p>
      </div>
    </div>
  );
}
