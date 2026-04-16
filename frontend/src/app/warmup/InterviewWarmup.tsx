import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import {
  Flame,
  Mic,
  MicOff,
  RefreshCw,
  CheckCircle,
  ChevronRight,
  Timer,
  Star,
  Zap,
  Sparkles,
  Crown,
} from 'lucide-react';
import { api } from '@/lib/api';

// ─── Question bank ────────────────────────────────────────────────────────────

const WARMUP_QUESTIONS = [
  "Tell me about a time you solved a difficult problem under pressure.",
  "Describe a project you're most proud of and your specific role in it.",
  "What is one professional skill you're actively improving right now?",
  "Tell me about a time you had to influence someone without direct authority.",
  "Describe a mistake you made and what you learned from it.",
  "How do you prioritise when you have too many competing tasks?",
  "Tell me about a time you received critical feedback and how you responded.",
  "What's the most complex thing you've ever had to explain simply?",
  "Describe a time you worked with a difficult team member. What did you do?",
  "What does success look like to you in your next role?",
  "Tell me about a time you had to make a decision with incomplete information.",
  "Describe a moment when you went beyond what was expected of you.",
  "What is a skill your teammates rely on you most for?",
  "Tell me about a time you delivered results despite limited resources.",
  "How do you approach learning something completely new?",
];

const COOLDOWN_SECONDS = 3;
const STREAK_KEY = 'warmup_streak';
const LAST_DATE_KEY = 'warmup_last_date';
const FREE_DONE_KEY = 'warmup_free_done_date';

export type WarmupCategory = 'behavioural' | 'technical' | 'motivation' | 'situational';

const CATEGORY_LABEL: Record<WarmupCategory, string> = {
  behavioural: 'Behavioural',
  technical: 'Technical',
  motivation: 'Motivation',
  situational: 'Situational',
};

export type WarmupTier = {
  id: string;
  seconds: number;
  credits: number;
  title: string;
  subtitle: string;
  accent: 'amber' | 'sky' | 'violet' | 'rose';
  icon: 'zap' | 'timer' | 'sparkles' | 'crown';
};

const WARMUP_TIERS: WarmupTier[] = [
  {
    id: 'spark',
    seconds: 15,
    credits: 0,
    title: 'Quick spark',
    subtitle: 'One question · 15s answer · No category · Free once per day',
    accent: 'amber',
    icon: 'zap',
  },
  {
    id: 'focus',
    seconds: 30,
    credits: 30,
    title: 'Focus',
    subtitle: '30s answer · Pick a category · Sharper practice',
    accent: 'sky',
    icon: 'timer',
  },
  {
    id: 'depth',
    seconds: 45,
    credits: 45,
    title: 'Depth',
    subtitle: '45s answer · Category focus · Richer story',
    accent: 'violet',
    icon: 'sparkles',
  },
  {
    id: 'full',
    seconds: 60,
    credits: 60,
    title: 'Full minute',
    subtitle: '60s answer · Maximum time to land STAR',
    accent: 'rose',
    icon: 'crown',
  },
];

const ACCENT_RING: Record<WarmupTier['accent'], string> = {
  amber: 'from-amber-500/40 via-orange-500/20 to-amber-600/30',
  sky: 'from-sky-500/40 via-cyan-500/20 to-sky-600/30',
  violet: 'from-violet-500/40 via-purple-500/20 to-indigo-600/30',
  rose: 'from-rose-500/40 via-fuchsia-500/20 to-pink-600/30',
};

const ACCENT_GLOW: Record<WarmupTier['accent'], string> = {
  amber: 'shadow-[0_0_40px_-8px_rgba(251,191,36,0.45)]',
  sky: 'shadow-[0_0_40px_-8px_rgba(56,189,248,0.4)]',
  violet: 'shadow-[0_0_40px_-8px_rgba(139,92,246,0.45)]',
  rose: 'shadow-[0_0_40px_-8px_rgba(244,63,94,0.4)]',
};

// ─── Scoring (client-side) ───────────────────────────────────────────────────

function scoreWarmup(transcript: string): { score: number; tip: string; label: string } {
  const t = transcript.trim().toLowerCase();
  if (!t) return { score: 0, tip: 'No answer recorded.', label: 'No answer' };

  let score = 50;
  const words = t.split(/\s+/).length;

  if (words >= 80) score += 15;
  else if (words >= 50) score += 8;
  else if (words < 20) score -= 15;

  const hasSituation = /\b(when|at the time|there was|during|in my previous|back in|last year)\b/.test(t);
  const hasAction =
    /\b(i (did|decided|implemented|built|led|created|wrote|fixed|reached out|set up|introduced|proposed|developed|organized))\b/.test(t);
  const hasResult =
    /\b(result(ed)?|achiev|improv|reduc|increas|saved|success|by \d|percent|outcome|delivered|launched)\b/.test(t);
  if (hasSituation) score += 8;
  if (hasAction) score += 10;
  if (hasResult) score += 12;

  const fillers = (t.match(/\b(um|uh|like|you know|kind of|sort of)\b/g) ?? []).length;
  score -= fillers * 4;

  score = Math.max(20, Math.min(100, Math.round(score)));

  let tip: string;
  let label: string;
  if (score >= 85) {
    label = 'Excellent';
    tip = 'Great structure and clear delivery. Try to add a quantified result next time.';
  } else if (score >= 70) {
    label = 'Good';
    tip = 'Solid answer. Strengthen your result with specific numbers or impact.';
  } else if (score >= 55) {
    label = 'Developing';
    tip = !hasResult
      ? 'Close with the outcome — what was the result or impact?'
      : !hasAction
        ? 'Make your own actions clearer: "I did…" statements help.'
        : 'Add more detail and slow down.';
  } else {
    label = 'Needs work';
    tip = 'Structure your answer: Situation → Task → Action → Result. Try recording it again.';
  }

  return { score, tip, label };
}

// ─── Streak & free-tier helpers ───────────────────────────────────────────────

function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadStreak(): number {
  try {
    const last = localStorage.getItem(LAST_DATE_KEY);
    const streak = parseInt(localStorage.getItem(STREAK_KEY) ?? '0', 10);
    if (!last) return 0;
    const today = getTodayStr();
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (last === today) return streak;
    if (last === yesterday) return streak;
    return 0;
  } catch {
    return 0;
  }
}

function markTodayDone(currentStreak: number): number {
  try {
    const last = localStorage.getItem(LAST_DATE_KEY);
    const today = getTodayStr();
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    let newStreak = currentStreak;
    if (last !== today) {
      newStreak = last === yesterday ? currentStreak + 1 : 1;
      localStorage.setItem(STREAK_KEY, String(newStreak));
      localStorage.setItem(LAST_DATE_KEY, today);
    }
    return newStreak;
  } catch {
    return currentStreak;
  }
}

function freeSparkDoneToday(): boolean {
  try {
    return localStorage.getItem(FREE_DONE_KEY) === getTodayStr();
  } catch {
    return false;
  }
}

function markFreeSparkDone(): void {
  try {
    localStorage.setItem(FREE_DONE_KEY, getTodayStr());
  } catch {
    /* ignore */
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type Phase = 'ready' | 'countdown' | 'recording' | 'reviewing' | 'done';
type Screen = 'pick' | 'run';

function TierIcon({ icon }: { icon: WarmupTier['icon'] }) {
  const c = 'h-6 w-6';
  if (icon === 'zap') return <Zap className={c} />;
  if (icon === 'timer') return <Timer className={c} />;
  if (icon === 'sparkles') return <Sparkles className={c} />;
  return <Crown className={c} />;
}

export default function InterviewWarmup() {
  const { user, isLoaded } = useUser();
  const userId = user?.id ?? '';

  const [screen, setScreen] = useState<Screen>('pick');
  const [tier, setTier] = useState<WarmupTier | null>(null);
  const [category, setCategory] = useState<WarmupCategory | null>(null);

  const [phase, setPhase] = useState<Phase>('ready');
  const [question, setQuestion] = useState<string>('');
  const [countdown, setCountdown] = useState(COOLDOWN_SECONDS);
  const [timeLeft, setTimeLeft] = useState(60);
  const [transcript, setTranscript] = useState('');
  const [result, setResult] = useState<ReturnType<typeof scoreWarmup> | null>(null);
  const [streak, setStreak] = useState(loadStreak);
  const [creditError, setCreditError] = useState<string | null>(null);

  const creditsQuery = api.billing.getCurrentPlan.useQuery({ userId }, { enabled: !!userId });
  const deductMutation = api.billing.deductCredits.useMutation();

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const answerSeconds = tier?.seconds ?? 60;
  const needsCategory = tier != null && tier.credits > 0;
  const canPickCategory = needsCategory;

  const pickQuestion = useCallback(() => {
    const q = WARMUP_QUESTIONS[Math.floor(Math.random() * WARMUP_QUESTIONS.length)];
    setQuestion(q);
  }, []);

  useEffect(() => {
    if (screen === 'run') pickQuestion();
  }, [screen, pickQuestion]);

  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
      recorderRef.current.stream.getTracks().forEach((tr) => tr.stop());
    }
    setPhase('reviewing');
  }, []);

  const startRecording = useCallback(async () => {
    setPhase('recording');
    chunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      recorderRef.current = rec;
      rec.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      rec.start();
    } catch {
      /* mic denied */
    }
  }, []);

  // Countdown before recording
  useEffect(() => {
    if (phase !== 'countdown' || screen !== 'run') return;
    setCountdown(COOLDOWN_SECONDS);
    const t = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(t);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    const start = setTimeout(() => {
      void startRecording();
    }, COOLDOWN_SECONDS * 1000);
    return () => {
      clearInterval(t);
      clearTimeout(start);
    };
  }, [phase, screen, startRecording]);

  // Answer timer
  useEffect(() => {
    if (phase !== 'recording' || screen !== 'run') return;
    setTimeLeft(answerSeconds);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          stopRecording();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, screen, answerSeconds, stopRecording]);

  const handleSubmitText = () => {
    const txt = textareaRef.current?.value.trim() ?? transcript.trim();
    setTranscript(txt);
    const r = scoreWarmup(txt);
    setResult(r);
    const newStreak = markTodayDone(streak);
    setStreak(newStreak);
    if (tier && tier.credits === 0 && tier.seconds === 15) {
      markFreeSparkDone();
    }
    setPhase('done');
    void creditsQuery.refetch();
  };

  const handleReset = () => {
    pickQuestion();
    setTranscript('');
    setResult(null);
    setPhase('ready');
    setCreditError(null);
  };

  const backToLobby = () => {
    setScreen('pick');
    setTier(null);
    setCategory(null);
    setPhase('ready');
    setTranscript('');
    setResult(null);
    setCreditError(null);
    pickQuestion();
  };

  const selectTier = (t: WarmupTier) => {
    setCreditError(null);
    if (t.credits === 0 && freeSparkDoneToday()) return;
    setTier(t);
    if (t.credits > 0) {
      setCategory('behavioural');
    } else {
      setCategory(null);
    }
    setScreen('run');
    setPhase('ready');
    pickQuestion();
  };

  const startPractice = async () => {
    setCreditError(null);
    if (!tier) return;
    if (tier.credits > 0) {
      if (!category) {
        setCreditError('Pick a question category first.');
        return;
      }
      if (!userId) {
        setCreditError('Sign in to use credit sessions.');
        return;
      }
      try {
        await deductMutation.mutateAsync({
          userId,
          amount: tier.credits,
          feature: 'warmup_session',
        });
        void creditsQuery.refetch();
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Could not start session.';
        setCreditError(msg);
        return;
      }
    }
    setPhase('countdown');
  };

  const scoreColor = (s: number) => (s >= 80 ? '#34d399' : s >= 60 ? '#fbbf24' : '#f87171');
  const timerColor = timeLeft <= 10 ? '#f87171' : timeLeft <= 20 ? '#fbbf24' : '#34d399';

  const credits = creditsQuery.data?.credits ?? null;

  if (!isLoaded) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-slate-500">Loading…</p>
      </div>
    );
  }

  // ── Lobby: tier picker ─────────────────────────────────────────────────────
  if (screen === 'pick') {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/95 via-slate-950 to-indigo-950/40 px-6 py-10 sm:px-10">
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-orange-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl" />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-orange-200">
                <Flame className="h-3.5 w-3.5" />
                Daily training
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Interview Warmup</h1>
              <p className="text-sm leading-relaxed text-slate-400">
                Pick a length that fits your day: a free 15-second spark, or longer runs that use AI credits for more
                room to practise. Build a streak with any session you finish.
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-stretch gap-3 sm:items-end">
              <div
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                style={{
                  background: streak > 0 ? 'rgba(249,115,22,0.12)' : 'rgba(100,116,139,0.1)',
                  borderColor: streak > 0 ? 'rgba(249,115,22,0.35)' : 'rgba(100,116,139,0.25)',
                }}
              >
                <Flame className="h-5 w-5 shrink-0" style={{ color: streak > 0 ? '#f97316' : '#64748b' }} />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Streak</p>
                  <p className="text-lg font-bold text-white">
                    {streak} <span className="text-sm font-normal text-slate-400">days</span>
                  </p>
                </div>
              </div>
              {userId && credits !== null && (
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-indigo-500/25 bg-indigo-500/10 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-indigo-300" />
                    <span className="text-sm text-slate-300">AI credits</span>
                  </div>
                  <span className="text-lg font-bold tabular-nums text-white">{credits.toLocaleString()}</span>
                </div>
              )}
              <Link
                to="/billing"
                className="text-center text-xs font-medium text-indigo-300 underline-offset-4 hover:text-indigo-200 hover:underline"
              >
                Top up or change plan
              </Link>
            </div>
          </div>

          <div className="relative mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {WARMUP_TIERS.map((t) => {
              const freeBlocked = t.credits === 0 && freeSparkDoneToday();
              const affordable = t.credits === 0 || credits === null || credits >= t.credits;
              const needsAuth = t.credits > 0 && !userId;
              const disabled = freeBlocked || (!affordable && t.credits > 0) || needsAuth;
              return (
                <button
                  key={t.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => selectTier(t)}
                  className={[
                    'group relative flex flex-col rounded-2xl border p-5 text-left transition-all',
                    'bg-slate-900/60 backdrop-blur-sm',
                    disabled ? 'cursor-not-allowed opacity-50' : 'hover:-translate-y-0.5 hover:border-white/20',
                    ACCENT_GLOW[t.accent],
                  ].join(' ')}
                  style={{ borderColor: 'rgba(255,255,255,0.08)' }}
                >
                  <div
                    className={`pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br opacity-40 ${ACCENT_RING[t.accent]}`}
                  />
                  <div className="relative flex flex-1 flex-col gap-3">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white`}
                      >
                        <TierIcon icon={t.icon} />
                      </span>
                      <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-bold tabular-nums text-white">
                        {t.seconds}s
                      </span>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">{t.title}</h2>
                      <p className="mt-1 text-xs leading-relaxed text-slate-400">{t.subtitle}</p>
                    </div>
                    <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-3">
                      {t.credits === 0 ? (
                        <span className="text-xs font-semibold uppercase tracking-wide text-emerald-400">Free</span>
                      ) : (
                        <span className="text-xs font-semibold text-amber-200">
                          {t.credits} credits
                        </span>
                      )}
                      {freeBlocked && (
                        <span className="text-[10px] font-medium text-slate-500">Done today</span>
                      )}
                      {needsAuth && (
                        <span className="text-[10px] text-slate-500">Sign in</span>
                      )}
                      {!freeBlocked && t.credits > 0 && !affordable && !needsAuth && (
                        <span className="text-[10px] text-red-400">Not enough credits</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── Session UI ─────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-xl px-4 py-8 flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={backToLobby}
          className="text-xs font-medium text-slate-500 hover:text-slate-300"
        >
          ← All modes
        </button>
        {tier && (
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
            {tier.seconds}s · {tier.credits === 0 ? 'Free' : `${tier.credits} credits`}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #f97316, #f59e0b)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Flame style={{ width: 20, height: 20, color: '#fff' }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Today&apos;s run</h1>
            <p className="text-xs text-slate-400">
              {tier?.title ?? 'Warmup'} · {answerSeconds}s to answer
            </p>
          </div>
        </div>
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
          style={{
            background: streak > 0 ? 'rgba(249,115,22,0.15)' : 'rgba(100,116,139,0.15)',
            border: `1px solid ${streak > 0 ? 'rgba(249,115,22,0.4)' : 'rgba(100,116,139,0.3)'}`,
          }}
        >
          <Flame className="h-3.5 w-3.5" style={{ color: streak > 0 ? '#f97316' : '#64748b' }} />
          <span className="text-sm font-bold" style={{ color: streak > 0 ? '#fdba74' : '#64748b' }}>
            {streak}
          </span>
          <span className="text-xs" style={{ color: streak > 0 ? '#9a3412' : '#475569' }}>
            day streak
          </span>
        </div>
      </div>

      {tier?.credits === 0 && freeSparkDoneToday() && phase === 'ready' && (
        <div
          className="rounded-xl px-4 py-3 flex items-center gap-3"
          style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)' }}
        >
          <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
          <p className="text-sm text-emerald-300">
            You&apos;ve already used today&apos;s free 15s spark. Pick a credit session or come back tomorrow.
          </p>
        </div>
      )}

      <div className="rounded-2xl px-6 py-5" style={{ background: 'rgba(15,23,42,0.9)', border: '1px solid #1e293b' }}>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Star className="h-3.5 w-3.5 text-indigo-400" />
          <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wide">Question</span>
          {canPickCategory && category && (
            <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-300">
              {CATEGORY_LABEL[category]}
            </span>
          )}
        </div>
        <p className="text-base font-medium text-white leading-relaxed">{question}</p>
      </div>

      {canPickCategory && phase === 'ready' && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Category</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(CATEGORY_LABEL) as WarmupCategory[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors ${
                  category === c
                    ? 'border-indigo-500/50 bg-indigo-500/20 text-indigo-200'
                    : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
                }`}
              >
                {CATEGORY_LABEL[c]}
              </button>
            ))}
          </div>
        </div>
      )}

      {creditError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {creditError}{' '}
          <Link to="/billing" className="font-semibold text-red-200 underline">
            Billing
          </Link>
        </div>
      )}

      {phase === 'ready' && (
        <div className="flex flex-col gap-3">
          <button
            onClick={() => void startPractice()}
            disabled={
              deductMutation.isPending ||
              (tier?.credits === 0 && freeSparkDoneToday()) ||
              (needsCategory && !category)
            }
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-base transition-all disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)', color: '#fff' }}
          >
            {deductMutation.isPending ? (
              'Starting…'
            ) : (
              <>
                <Mic className="h-5 w-5" /> Start ({answerSeconds}s)
              </>
            )}
          </button>
          <p className="text-xs text-slate-500 text-center">
            Credits are charged when you press Start on paid modes (30 / 45 / 60). Use Start first — text-only
            shortcuts are only on the free 15s mode.
          </p>
          {tier && tier.credits === 0 && (
            <>
              <textarea
                ref={textareaRef}
                placeholder="Or type your answer if you prefer text (free spark only)…"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 resize-none"
                rows={5}
              />
              <button
                onClick={handleSubmitText}
                disabled={freeSparkDoneToday()}
                className="w-full py-2.5 rounded-xl font-semibold text-sm border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                Submit text only (skip mic)
              </button>
            </>
          )}
        </div>
      )}

      {phase === 'countdown' && (
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="text-6xl font-black" style={{ color: '#f97316', fontVariantNumeric: 'tabular-nums' }}>
            {countdown}
          </div>
          <p className="text-sm text-slate-400">Get ready to answer…</p>
        </div>
      )}

      {phase === 'recording' && (
        <div className="flex flex-col gap-4">
          <div
            className="flex items-center justify-between px-5 py-4 rounded-xl"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}
          >
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-semibold text-red-400">Recording</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Timer className="h-4 w-4" style={{ color: timerColor }} />
              <span className="text-2xl font-black" style={{ color: timerColor, fontVariantNumeric: 'tabular-nums' }}>
                {timeLeft}s
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 text-center">
            Speak clearly. Recording stops automatically at 0 seconds.
          </p>
          <button
            onClick={stopRecording}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <MicOff className="h-4 w-4" /> Stop early
          </button>
          <div className="mt-2">
            <p className="text-xs text-slate-600 mb-2">Or type your answer:</p>
            <textarea
              ref={textareaRef}
              placeholder="Type here…"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 resize-none"
              rows={4}
            />
          </div>
        </div>
      )}

      {phase === 'reviewing' && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-slate-400">
            Recording stopped. If you used the mic, paste or type your answer below for a score:
          </p>
          <textarea
            ref={textareaRef}
            defaultValue={transcript}
            placeholder="What you said…"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 resize-none"
            rows={6}
          />
          <button
            onClick={handleSubmitText}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff' }}
          >
            <ChevronRight className="h-4 w-4" /> Get score
          </button>
        </div>
      )}

      {phase === 'done' && result && (
        <div className="flex flex-col gap-4">
          <div
            className="flex items-center gap-4 px-6 py-5 rounded-2xl"
            style={{ background: 'rgba(15,23,42,0.9)', border: '1px solid #1e293b' }}
          >
            <div
              className="shrink-0 flex flex-col items-center justify-center w-20 h-20 rounded-2xl"
              style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)' }}
            >
              <span className="text-3xl font-black" style={{ color: scoreColor(result.score) }}>
                {result.score}
              </span>
              <span className="text-xs text-slate-500 mt-0.5">/ 100</span>
            </div>
            <div className="flex-1">
              <p className="text-base font-bold text-white mb-1">{result.label}</p>
              <p className="text-sm text-slate-400 leading-relaxed">{result.tip}</p>
            </div>
          </div>

          {streak > 0 && (
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)' }}
            >
              <Flame className="h-5 w-5 text-orange-400 shrink-0" />
              <p className="text-sm text-orange-300">
                {streak === 1
                  ? 'Great start — come back tomorrow to build your streak.'
                  : `${streak}-day streak — keep going.`}
              </p>
            </div>
          )}

          <button
            onClick={handleReset}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="h-4 w-4" /> Same mode, new question
          </button>
          <button
            type="button"
            onClick={backToLobby}
            className="w-full py-2 text-sm font-medium text-indigo-400 hover:text-indigo-300"
          >
            Choose another mode
          </button>
        </div>
      )}
    </div>
  );
}
