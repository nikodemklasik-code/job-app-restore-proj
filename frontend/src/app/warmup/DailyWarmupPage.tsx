import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import {
  Flame, Mic, MicOff, RefreshCw, CheckCircle,
  ChevronRight, Timer, Star, Zap, Sparkles, Crown, ArrowLeft,
  MessageSquare, Users, BarChart2,
} from 'lucide-react';
import { api } from '@/lib/api';
import type { WarmupTier } from './warmupTierCatalog';
import { WARMUP_TIERS } from './warmupTierCatalog';

// ─── Questions ────────────────────────────────────────────────────────────────

const WARMUP_QUESTIONS = [
  'Tell me about a time you solved a difficult problem under pressure.',
  'Describe a project you\'re most proud of and your specific role in it.',
  'What is one professional skill you\'re actively improving right now?',
  'Tell me about a time you had to influence someone without direct authority.',
  'Describe a mistake you made and what you learned from it.',
  'How do you prioritise when you have too many competing tasks?',
  'Tell me about a time you received critical feedback and how you responded.',
  'What\'s the most complex thing you\'ve ever had to explain simply?',
  'Describe a time you worked with a difficult team member. What did you do?',
  'What does success look like to you in your next role?',
  'Tell me about a time you had to make a decision with incomplete information.',
  'Describe a moment when you went beyond what was expected of you.',
  'What is a skill your teammates rely on you most for?',
  'Tell me about a time you delivered results despite limited resources.',
  'How do you approach learning something completely new?',
];

// ─── Constants ────────────────────────────────────────────────────────────────

const COOLDOWN_SECONDS = 3;
const STREAK_KEY = 'warmup_streak';
const LAST_DATE_KEY = 'warmup_last_date';
const FREE_DONE_KEY = 'warmup_free_done_date';

// ─── Tier visuals ─────────────────────────────────────────────────────────────

const TIER_STYLES: Record<WarmupTier['accent'], {
  grad: string; ring: string; badge: string; glow: string; text: string;
}> = {
  amber:  { grad: 'from-amber-500/20 to-orange-600/10',  ring: 'border-amber-500/30 hover:border-amber-400/60',  badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',  glow: 'shadow-amber-500/15',  text: 'text-amber-300' },
  sky:    { grad: 'from-sky-500/20 to-cyan-600/10',       ring: 'border-sky-500/30 hover:border-sky-400/60',       badge: 'bg-sky-500/15 text-sky-300 border-sky-500/30',         glow: 'shadow-sky-500/15',    text: 'text-sky-300' },
  violet: { grad: 'from-violet-500/20 to-purple-600/10', ring: 'border-violet-500/30 hover:border-violet-400/60', badge: 'bg-violet-500/15 text-violet-300 border-violet-500/30', glow: 'shadow-violet-500/15', text: 'text-violet-300' },
  rose:   { grad: 'from-rose-500/20 to-pink-600/10',     ring: 'border-rose-500/30 hover:border-rose-400/60',     badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',       glow: 'shadow-rose-500/15',   text: 'text-rose-300' },
};

// ─── Scoring ──────────────────────────────────────────────────────────────────

function scoreWarmup(transcript: string): { score: number; tip: string; label: string } {
  const t = transcript.trim().toLowerCase();
  if (!t) return { score: 0, tip: 'No answer recorded.', label: 'No answer' };
  let score = 50;
  const words = t.split(/\s+/).length;
  if (words >= 80) score += 15;
  else if (words >= 50) score += 8;
  else if (words < 20) score -= 15;
  const hasSit = /\b(when|at the time|there was|during|in my previous|back in|last year)\b/.test(t);
  const hasAct = /\b(i (did|decided|implemented|built|led|created|wrote|fixed|reached out|set up|introduced|proposed|developed|organized))\b/.test(t);
  const hasRes = /\b(result(ed)?|achiev|improv|reduc|increas|saved|success|by \d|percent|outcome|delivered|launched)\b/.test(t);
  if (hasSit) score += 8;
  if (hasAct) score += 10;
  if (hasRes) score += 12;
  const fillers = (t.match(/\b(um|uh|like|you know|kind of|sort of)\b/g) ?? []).length;
  score -= fillers * 4;
  score = Math.max(20, Math.min(100, Math.round(score)));
  let tip: string;
  let label: string;
  if (score >= 85) { label = 'Excellent'; tip = 'Great structure and clear delivery. Try to add a quantified result next time.'; }
  else if (score >= 70) { label = 'Good'; tip = 'Solid answer. Strengthen your result with specific numbers or impact.'; }
  else if (score >= 55) { label = 'Developing'; tip = !hasRes ? 'Close with the outcome — what was the result or impact?' : !hasAct ? 'Make your own actions clearer: "I did…" statements help.' : 'Add more detail and slow down.'; }
  else { label = 'Needs work'; tip = 'Structure your answer: Situation → Task → Action → Result. Try recording it again.'; }
  return { score, tip, label };
}

// ─── Streak helpers ───────────────────────────────────────────────────────────

function getTodayStr() { return new Date().toISOString().slice(0, 10); }

function loadStreak(): number {
  try {
    const last = localStorage.getItem(LAST_DATE_KEY);
    const streak = parseInt(localStorage.getItem(STREAK_KEY) ?? '0', 10);
    if (!last) return 0;
    const today = getTodayStr();
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (last === today || last === yesterday) return streak;
    return 0;
  } catch { return 0; }
}

function markTodayDone(current: number): number {
  try {
    const last = localStorage.getItem(LAST_DATE_KEY);
    const today = getTodayStr();
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (last === today) return current;
    const next = last === yesterday ? current + 1 : 1;
    localStorage.setItem(STREAK_KEY, String(next));
    localStorage.setItem(LAST_DATE_KEY, today);
    return next;
  } catch { return current; }
}

function freeSparkDoneToday(): boolean {
  try { return localStorage.getItem(FREE_DONE_KEY) === getTodayStr(); } catch { return false; }
}

function markFreeSparkDone(): void {
  try { localStorage.setItem(FREE_DONE_KEY, getTodayStr()); } catch { /* ignore */ }
}

// ─── TierIcon ─────────────────────────────────────────────────────────────────

function TierIcon({ icon }: { icon: WarmupTier['icon'] }) {
  const c = 'h-6 w-6';
  if (icon === 'zap') return <Zap className={c} />;
  if (icon === 'timer') return <Timer className={c} />;
  if (icon === 'sparkles') return <Sparkles className={c} />;
  return <Crown className={c} />;
}

// ─── Score ring SVG ───────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const color = score >= 80 ? '#34d399' : score >= 60 ? '#fbbf24' : '#f87171';
  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 45 ? 'Developing' : 'Needs work';

  return (
    <div className="relative flex h-28 w-28 flex-col items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="112" height="112" viewBox="0 0 112 112">
        <circle cx="56" cy="56" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
        <circle
          cx="56" cy="56" r={r} fill="none"
          stroke={color} strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circ}`}
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
      </svg>
      <span className="relative text-3xl font-black text-white">{score}</span>
      <span className="relative text-[10px] font-semibold uppercase tracking-wide" style={{ color }}>{label}</span>
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = 'ready' | 'countdown' | 'recording' | 'reviewing' | 'done';
type Screen = 'pick' | 'run';
type WarmupCategory = 'behavioural' | 'technical' | 'motivation' | 'situational';

const CATEGORY_LABELS: Record<WarmupCategory, string> = {
  behavioural: 'Behavioural',
  technical: 'Technical',
  motivation: 'Motivation',
  situational: 'Situational',
};

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function DailyWarmupPage() {
  const { user, isLoaded } = useUser();
  const userId = user?.id ?? '';

  const [screen, setScreen] = useState<Screen>('pick');
  const [tier, setTier] = useState<WarmupTier | null>(null);
  const [category, setCategory] = useState<WarmupCategory | null>(null);
  const [phase, setPhase] = useState<Phase>('ready');
  const [question, setQuestion] = useState('');
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
  const credits = creditsQuery.data?.credits ?? null;

  const pickQuestion = useCallback(() => {
    setQuestion(WARMUP_QUESTIONS[Math.floor(Math.random() * WARMUP_QUESTIONS.length)]);
  }, []);

  useEffect(() => { if (screen === 'run') pickQuestion(); }, [screen, pickQuestion]);

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
      rec.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      rec.start();
    } catch { /* mic denied */ }
  }, []);

  useEffect(() => {
    if (phase !== 'countdown' || screen !== 'run') return;
    setCountdown(COOLDOWN_SECONDS);
    const t = setInterval(() => setCountdown((c) => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; }), 1000);
    const start = setTimeout(() => void startRecording(), COOLDOWN_SECONDS * 1000);
    return () => { clearInterval(t); clearTimeout(start); };
  }, [phase, screen, startRecording]);

  useEffect(() => {
    if (phase !== 'recording' || screen !== 'run') return;
    setTimeLeft(answerSeconds);
    timerRef.current = setInterval(() => setTimeLeft((t) => { if (t <= 1) { stopRecording(); return 0; } return t - 1; }), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, screen, answerSeconds, stopRecording]);

  const handleSubmitText = () => {
    const txt = textareaRef.current?.value.trim() ?? transcript.trim();
    setTranscript(txt);
    const r = scoreWarmup(txt);
    setResult(r);
    const newStreak = markTodayDone(streak);
    setStreak(newStreak);
    if (tier && tier.credits === 0 && tier.seconds === 15) markFreeSparkDone();
    setPhase('done');
    void creditsQuery.refetch();
  };

  const handleReset = () => { pickQuestion(); setTranscript(''); setResult(null); setPhase('ready'); setCreditError(null); };

  const backToLobby = () => {
    setScreen('pick'); setTier(null); setCategory(null);
    setPhase('ready'); setTranscript(''); setResult(null); setCreditError(null);
  };

  const selectTier = (t: WarmupTier) => {
    setCreditError(null);
    if (t.credits === 0 && freeSparkDoneToday()) return;
    setTier(t);
    setCategory(t.credits > 0 ? 'behavioural' : null);
    setScreen('run'); setPhase('ready'); pickQuestion();
  };

  const startPractice = async () => {
    setCreditError(null);
    if (!tier) return;
    if (tier.credits > 0) {
      if (!category) { setCreditError('Pick a question category first.'); return; }
      if (!userId) { setCreditError('Sign in to use credit sessions.'); return; }
      try {
        await deductMutation.mutateAsync({ userId, amount: tier.credits, feature: 'warmup_session' });
        void creditsQuery.refetch();
      } catch (e) {
        setCreditError(e instanceof Error ? e.message : 'Could not start session.');
        return;
      }
    }
    setPhase('countdown');
  };

  const timerColor = timeLeft <= 10 ? '#f87171' : timeLeft <= 20 ? '#fbbf24' : '#34d399';
  const timerPct = timeLeft / answerSeconds;

  if (!isLoaded) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-slate-500">Loading…</p>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LOBBY
  // ═══════════════════════════════════════════════════════════════════════════
  if (screen === 'pick') {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Hero */}
        <div className="relative mb-8 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-orange-950/30 px-7 py-8 sm:px-10">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-orange-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 left-0 h-48 w-80 rounded-full bg-amber-500/8 blur-3xl" />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-xl shadow-orange-500/30">
                <Flame className="h-7 w-7 text-white" />
              </div>
              <div>
                <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full border border-orange-500/25 bg-orange-500/10 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-orange-300">
                  <Flame className="h-3 w-3" /> Daily Readiness
                </div>
                <h1 className="text-2xl font-bold text-white">Daily Warmup</h1>
                <p className="mt-1 max-w-sm text-sm text-slate-400">
                  Pick a timed run, record your answer, keep your streak alive.
                </p>
              </div>
            </div>

            {/* Streak + credits */}
            <div className="flex shrink-0 items-center gap-3">
              <div className={`flex flex-col items-center rounded-2xl border px-5 py-3 ${streak > 0 ? 'border-orange-500/30 bg-orange-500/10' : 'border-white/10 bg-white/5'}`}>
                <Flame className={`mb-1 h-5 w-5 ${streak > 0 ? 'text-orange-400' : 'text-slate-600'}`} />
                <span className={`text-2xl font-black leading-none ${streak > 0 ? 'text-orange-300' : 'text-slate-600'}`}>{streak}</span>
                <span className="text-[10px] uppercase tracking-wide text-slate-500">day streak</span>
              </div>
              {userId && credits !== null && (
                <div className="flex flex-col items-center rounded-2xl border border-indigo-500/20 bg-indigo-500/8 px-5 py-3">
                  <Zap className="mb-1 h-5 w-5 text-indigo-300" />
                  <span className="text-2xl font-black leading-none text-indigo-200">{credits.toLocaleString()}</span>
                  <Link to="/billing" className="text-[10px] uppercase tracking-wide text-slate-500 hover:text-indigo-300">credits</Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tier cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {WARMUP_TIERS.map((t) => {
            const st = TIER_STYLES[t.accent];
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
                  'group relative flex flex-col overflow-hidden rounded-2xl border bg-gradient-to-br p-6 text-left transition-all',
                  st.grad, st.ring,
                  disabled ? 'cursor-not-allowed opacity-50' : `hover:-translate-y-1 hover:shadow-xl ${st.glow}`,
                ].join(' ')}
              >
                {/* Icon + badge */}
                <div className="mb-4 flex items-start justify-between">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border bg-white/5 ${st.badge}`}>
                    <TierIcon icon={t.icon} />
                  </div>
                  <div className={`rounded-full border px-2.5 py-1 text-xs font-bold tabular-nums ${st.badge}`}>
                    {t.seconds}s
                  </div>
                </div>

                <h3 className="text-base font-bold text-white">{t.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">{t.subtitle}</p>

                <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                  {t.credits === 0
                    ? <span className="text-xs font-bold uppercase tracking-wide text-emerald-400">Free</span>
                    : <span className={`text-xs font-bold ${st.text}`}>{t.credits} credits</span>
                  }
                  {freeBlocked && <span className="text-[10px] text-slate-500">Done today ✓</span>}
                  {needsAuth && <span className="text-[10px] text-slate-500">Sign in required</span>}
                  {!freeBlocked && t.credits > 0 && !affordable && !needsAuth && (
                    <span className="text-[10px] text-red-400">Not enough credits</span>
                  )}
                  {!disabled && (
                    <ChevronRight className={`h-4 w-4 transition-transform group-hover:translate-x-0.5 ${st.text}`} />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <p className="mt-6 text-xs text-slate-600">
          Longer tracks live in{' '}
          <Link to="/skills" className="font-medium text-indigo-400 hover:text-indigo-300 hover:underline underline-offset-2">
            Skill Lab
          </Link>.
          Daily Warmup is a short daily ritual — not a substitute for deep practice.
        </p>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SESSION
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5 px-4 py-8">

      {/* Top nav */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={backToLobby}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-300"
        >
          <ArrowLeft className="h-4 w-4" /> All modes
        </button>
        <div className="flex items-center gap-2">
          {tier && (
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${TIER_STYLES[tier.accent].badge}`}>
              {tier.title} · {tier.seconds}s
            </span>
          )}
          <div className={`flex items-center gap-1.5 rounded-full border px-3 py-1 ${streak > 0 ? 'border-orange-500/30 bg-orange-500/10' : 'border-white/10 bg-white/5'}`}>
            <Flame className={`h-3.5 w-3.5 ${streak > 0 ? 'text-orange-400' : 'text-slate-600'}`} />
            <span className={`text-xs font-bold ${streak > 0 ? 'text-orange-300' : 'text-slate-600'}`}>{streak}d</span>
          </div>
        </div>
      </div>

      {/* Free tier already done */}
      {tier?.credits === 0 && freeSparkDoneToday() && phase === 'ready' && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/8 px-5 py-4">
          <CheckCircle className="h-5 w-5 shrink-0 text-emerald-400" />
          <p className="text-sm text-emerald-300">
            Free spark already used today. Come back tomorrow or use a credit session.
          </p>
        </div>
      )}

      {/* Question card — always visible */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 px-7 py-6">
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-indigo-500/10 blur-2xl" />
        <div className="relative">
          <div className="mb-3 flex items-center gap-2">
            <Star className="h-3.5 w-3.5 text-indigo-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Today's question</span>
            {category && (
              <span className="rounded-full border border-indigo-500/25 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-300">
                {CATEGORY_LABELS[category]}
              </span>
            )}
          </div>
          <p className="text-lg font-semibold leading-relaxed text-white">{question}</p>
        </div>
      </div>

      {/* Category picker */}
      {needsCategory && phase === 'ready' && (
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Question category</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(CATEGORY_LABELS) as WarmupCategory[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                  category === c
                    ? 'border-indigo-500/50 bg-indigo-500/20 text-indigo-200'
                    : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white'
                }`}
              >
                {CATEGORY_LABELS[c]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Credit error */}
      {creditError && (
        <div className="rounded-2xl border border-red-500/25 bg-red-500/10 px-5 py-3 text-sm text-red-300">
          {creditError}{' '}
          <Link to="/billing" className="font-semibold text-red-200 underline underline-offset-2">Top up →</Link>
        </div>
      )}

      {/* ── READY ── */}
      {phase === 'ready' && (
        <div className="flex flex-col gap-3">
          <button
            onClick={() => void startPractice()}
            disabled={deductMutation.isPending || (tier?.credits === 0 && freeSparkDoneToday()) || (needsCategory && !category)}
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl py-4 text-base font-bold text-white shadow-xl transition-all hover:-translate-y-0.5 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)', boxShadow: '0 8px 24px -4px rgba(249,115,22,0.35)' }}
          >
            {deductMutation.isPending ? 'Starting…' : <><Mic className="h-5 w-5" /> Start recording ({answerSeconds}s)</>}
          </button>

          {tier && tier.credits === 0 && (
            <>
              <div className="relative flex items-center gap-3">
                <div className="flex-1 border-t border-white/10" />
                <span className="text-xs text-slate-600">or type your answer</span>
                <div className="flex-1 border-t border-white/10" />
              </div>
              <textarea
                ref={textareaRef}
                placeholder="Type your answer here (free spark only)…"
                className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-indigo-500/50 transition-colors"
                rows={5}
              />
              <button
                onClick={handleSubmitText}
                disabled={freeSparkDoneToday()}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
              >
                Submit text · skip mic
              </button>
            </>
          )}
        </div>
      )}

      {/* ── COUNTDOWN ── */}
      {phase === 'countdown' && (
        <div className="flex flex-col items-center gap-5 py-8">
          <div
            className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-orange-500/40"
            style={{ boxShadow: '0 0 48px -8px rgba(249,115,22,0.5)' }}
          >
            <span className="text-6xl font-black text-orange-400" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {countdown}
            </span>
          </div>
          <p className="text-sm text-slate-400">Get ready to answer…</p>
        </div>
      )}

      {/* ── RECORDING ── */}
      {phase === 'recording' && (
        <div className="flex flex-col items-center gap-6 py-4">
          {/* Timer ring */}
          <div className="relative flex h-32 w-32 items-center justify-center">
            <svg className="absolute inset-0 -rotate-90" width="128" height="128" viewBox="0 0 128 128">
              <circle cx="64" cy="64" r="52" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
              <circle
                cx="64" cy="64" r="52" fill="none"
                stroke={timerColor} strokeWidth="10" strokeLinecap="round"
                strokeDasharray={`${timerPct * 2 * Math.PI * 52} ${2 * Math.PI * 52}`}
                style={{ transition: 'stroke-dasharray 0.9s linear, stroke 0.3s' }}
              />
            </svg>
            <div className="relative flex flex-col items-center">
              <span className="text-3xl font-black" style={{ color: timerColor, fontVariantNumeric: 'tabular-nums' }}>
                {timeLeft}s
              </span>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-semibold text-red-400">REC</span>
              </div>
            </div>
          </div>

          <button
            onClick={stopRecording}
            className="flex items-center gap-2 rounded-2xl border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
          >
            <MicOff className="h-4 w-4" /> Stop early
          </button>

          <div className="w-full">
            <p className="mb-2 text-xs text-slate-600">Or type your answer:</p>
            <textarea
              ref={textareaRef}
              placeholder="Type here…"
              className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-indigo-500/50 transition-colors"
              rows={4}
            />
          </div>
        </div>
      )}

      {/* ── REVIEWING ── */}
      {phase === 'reviewing' && (
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
            <p className="mb-2 text-sm font-medium text-slate-300">Paste or type your answer below for a score:</p>
            <textarea
              ref={textareaRef}
              defaultValue={transcript}
              placeholder="What you said…"
              className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-indigo-500/50 transition-colors"
              rows={6}
            />
          </div>
          <button
            onClick={handleSubmitText}
            className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold text-white transition hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 8px 24px -4px rgba(99,102,241,0.3)' }}
          >
            <ChevronRight className="h-4 w-4" /> Get my score
          </button>
        </div>
      )}

      {/* ── DONE ── */}
      {phase === 'done' && result && (
        <div className="flex flex-col gap-4">
          {/* Score card */}
          <div className="flex items-center gap-6 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 px-7 py-6">
            <ScoreRing score={result.score} />
            <div className="flex-1">
              <p className="text-base font-bold text-white">{result.label}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{result.tip}</p>
            </div>
          </div>

          {/* Streak */}
          {streak > 0 && (
            <div className="flex items-center gap-3 rounded-2xl border border-orange-500/20 bg-orange-500/8 px-5 py-3.5">
              <Flame className="h-5 w-5 shrink-0 text-orange-400" />
              <p className="text-sm text-orange-300">
                {streak === 1
                  ? 'Great start — come back tomorrow to build your streak.'
                  : `${streak}-day streak 🔥 — keep going.`}
              </p>
            </div>
          )}

          {/* Follow-up CTAs — spec requires handoff to Coach / Interview / Reports */}
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Continue your practice</p>
            <div className="grid grid-cols-3 gap-2">
              <Link
                to="/coach"
                className="flex flex-col items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-center text-xs font-medium text-slate-300 transition hover:border-indigo-500/40 hover:bg-indigo-500/10 hover:text-indigo-200"
              >
                <MessageSquare className="h-5 w-5 text-indigo-400" />
                <span>Coach</span>
              </Link>
              <Link
                to="/interview"
                className="flex flex-col items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-center text-xs font-medium text-slate-300 transition hover:border-amber-500/40 hover:bg-amber-500/10 hover:text-amber-200"
              >
                <Users className="h-5 w-5 text-amber-400" />
                <span>Interview</span>
              </Link>
              <Link
                to="/reports"
                className="flex flex-col items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-center text-xs font-medium text-slate-300 transition hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-200"
              >
                <BarChart2 className="h-5 w-5 text-emerald-400" />
                <span>Reports</span>
              </Link>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 py-3.5 text-sm font-semibold text-slate-300 transition hover:bg-white/5"
          >
            <RefreshCw className="h-4 w-4" /> Same mode · new question
          </button>
          <button
            type="button"
            onClick={backToLobby}
            className="w-full py-2 text-sm font-medium text-indigo-400 transition hover:text-indigo-300"
          >
            Choose another mode →
          </button>
        </div>
      )}

      {/* Disclaimer at bottom */}
      <p className="text-center text-[11px] leading-relaxed text-slate-700 mt-4">
        Scores are estimated client-side. They reflect structural patterns — not a replacement for real-world feedback.
        Answers are not stored on our servers unless explicitly saved.
      </p>
    </div>
  );
}
