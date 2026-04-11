import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, User, Briefcase, Mic, ChevronRight, X,
  Upload, Search, ClipboardList, CheckCircle,
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
  cta?: string;
  route?: string;
}

const STEPS: Step[] = [
  {
    icon: Sparkles,
    title: 'Welcome to MultivoHub',
    description:
      "Your AI-powered career workspace. We help you find great roles, prepare for interviews, and land the job — faster.",
  },
  {
    icon: User,
    title: 'Step 1 — Set up your CV Studio',
    description:
      "Upload your CV (PDF) and we'll auto-fill your profile. Your data powers CV generation, cover letters, and job matching.",
    cta: 'Go to CV Studio',
    route: '/profile',
  },
  {
    icon: Search,
    title: 'Step 2 — Discover Jobs',
    description:
      'Search live jobs from Reed, Adzuna, Jooble, and more. Each result shows an AI-calculated fit score based on your profile.',
    cta: 'Browse Jobs',
    route: '/jobs',
  },
  {
    icon: ClipboardList,
    title: 'Step 3 — Track Applications',
    description:
      'Add jobs to your pipeline and track them through stages: Saved → Applied → In Review → Interview → Offer. Never lose track.',
    cta: 'Open Pipeline',
    route: '/applications',
  },
  {
    icon: Mic,
    title: 'Step 4 — Practice Interviews',
    description:
      'Use Interview Ready to practice with an AI coach. Choose from Behavioral, Technical, HR, Case Study, and more. Get instant STAR feedback.',
    cta: 'Start Practicing',
    route: '/interview',
  },
  {
    icon: Briefcase,
    title: "You're all set!",
    description:
      'Explore the sidebar to discover all tools: AI Assistant, Style Studio, Salary Calculator, Job Radar, and more. Good luck! 🚀',
    cta: 'Go to Dashboard',
    route: '/dashboard',
  },
];

// ── Component ──────────────────────────────────────────────────────────────

interface OnboardingModalProps {
  onClose: () => void;
}

export default function OnboardingModal({ onClose }: OnboardingModalProps) {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const Icon = current.icon;

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
        <p className="mb-8 text-center text-sm leading-relaxed text-slate-400">{current.description}</p>

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
