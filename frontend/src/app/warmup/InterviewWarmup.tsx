import { useState, useEffect, useRef, useCallback } from 'react';
import { Flame, Mic, MicOff, RefreshCw, CheckCircle, ChevronRight, Timer, Star, Zap, Brain, BarChart2, Users, Target } from 'lucide-react';

// ─── Question bank by category ────────────────────────────────────────────────

const QUESTION_BANK: Record<string, string[]> = {
  behavioural: [
    "Tell me about a time you solved a difficult problem under pressure.",
    "Tell me about a time you had to influence someone without direct authority.",
    "Describe a mistake you made and what you learned from it.",
    "Tell me about a time you received critical feedback and how you responded.",
    "Tell me about a time you had to make a decision with incomplete information.",
    "Describe a moment when you went beyond what was expected of you.",
    "Tell me about a time you delivered results despite limited resources.",
    "Describe a time you worked with a difficult team member. What did you do?",
    "Tell me about a time you failed to meet a deadline. What happened?",
    "Describe a situation where you had to adapt quickly to a major change.",
  ],
  technical: [
    "Walk me through how you would debug a performance issue in a production system.",
    "How do you approach writing code that others will maintain?",
    "Describe your experience with version control and branching strategies.",
    "How do you ensure the quality and reliability of your code?",
    "Walk me through a technical decision you made and the trade-offs involved.",
    "How do you stay up to date with changes in your technical field?",
    "Describe a time you introduced a new technology or tool to your team.",
    "How do you approach breaking down a large technical problem?",
    "Tell me about the most complex system you've built or contributed to.",
    "How do you handle disagreements about technical approaches with colleagues?",
  ],
  motivation: [
    "What does success look like to you in your next role?",
    "What is one professional skill you're actively improving right now?",
    "Why are you looking to make a move at this point in your career?",
    "What kind of work environment brings out your best performance?",
    "Where do you see yourself in three years?",
    "What attracted you to this industry or field?",
    "How do you stay motivated when work gets repetitive or tough?",
    "What type of manager or leadership style do you thrive under?",
    "What does a meaningful workday look like to you?",
    "What is the most important thing you're looking for in your next role?",
  ],
  situational: [
    "How would you prioritise if you had three critical deadlines on the same day?",
    "What would you do if you disagreed with a decision made by your manager?",
    "How would you handle a team member who is consistently underperforming?",
    "What would you do in your first 30 days in a new role?",
    "How would you approach a project where requirements kept changing?",
    "What would you do if you realised mid-project that the approach was wrong?",
    "How would you handle a situation where a client was unhappy with your work?",
    "What would you do if you were asked to do something you thought was unethical?",
    "How would you manage stakeholders with conflicting priorities?",
    "What would you do if your team resisted a change you were leading?",
  ],
};

const CATEGORIES = [
  { key: 'behavioural', label: 'Behavioural', icon: Users,    color: '#818cf8', desc: 'STAR-method past experiences' },
  { key: 'technical',   label: 'Technical',   icon: Brain,    color: '#38bdf8', desc: 'Problem-solving & craft' },
  { key: 'motivation',  label: 'Motivation',  icon: Target,   color: '#34d399', desc: 'Goals & career fit' },
  { key: 'situational', label: 'Situational', icon: BarChart2, color: '#fbbf24', desc: 'Hypothetical scenarios' },
] as const;

type Category = keyof typeof QUESTION_BANK;

const ANSWER_TIME_SECONDS = 60;
const COOLDOWN_SECONDS = 3;
const STREAK_KEY = 'warmup_streak';
const LAST_DATE_KEY = 'warmup_last_date';

// ─── Scoring ──────────────────────────────────────────────────────────────────

function scoreWarmup(transcript: string): { score: number; tip: string; label: string } {
  const t = transcript.trim().toLowerCase();
  if (!t) return { score: 0, tip: 'No answer recorded.', label: 'No answer' };

  let score = 50;
  const words = t.split(/\s+/).length;

  if (words >= 80) score += 15;
  else if (words >= 50) score += 8;
  else if (words < 20) score -= 15;

  const hasSituation = /\b(when|at the time|there was|during|in my previous|back in|last year)\b/.test(t);
  const hasAction = /\b(i (did|decided|implemented|built|led|created|wrote|fixed|reached out|set up|introduced|proposed|developed|organized))\b/.test(t);
  const hasResult = /\b(result(ed)?|achiev|improv|reduc|increas|saved|success|by \d|percent|outcome|delivered|launched)\b/.test(t);
  if (hasSituation) score += 8;
  if (hasAction) score += 10;
  if (hasResult) score += 12;

  const fillers = (t.match(/\b(um|uh|like|you know|kind of|sort of)\b/g) ?? []).length;
  score -= fillers * 4;

  score = Math.max(20, Math.min(100, Math.round(score)));

  let tip: string;
  let label: string;
  if (score >= 85) { label = 'Excellent'; tip = 'Great structure and clear delivery. Try to add a quantified result next time.'; }
  else if (score >= 70) { label = 'Good'; tip = 'Solid answer. Strengthen your result with specific numbers or impact.'; }
  else if (score >= 55) { label = 'Developing'; tip = !hasResult ? 'Close with the outcome — what was the result or impact?' : !hasAction ? 'Make your own actions clearer: "I did…" statements help.' : 'Add more detail and slow down.'; }
  else { label = 'Needs work'; tip = 'Structure your answer: Situation → Task → Action → Result. Try recording it again.'; }

  return { score, tip, label };
}

// ─── Streak helpers ───────────────────────────────────────────────────────────

function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadStreak(): number {
  try {
    const last = localStorage.getItem(LAST_DATE_KEY);
    const streak = parseInt(localStorage.getItem(STREAK_KEY) ?? '0', 10);
    if (!last) return 0;
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (last === getTodayStr()) return streak;
    if (last === yesterday) return streak;
    return 0;
  } catch { return 0; }
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
  } catch { return currentStreak; }
}

function doneToday(): boolean {
  try { return localStorage.getItem(LAST_DATE_KEY) === getTodayStr(); } catch { return false; }
}

// ─── Main component ────────────────────────────────────────────────────────────

type Phase = 'select' | 'ready' | 'countdown' | 'recording' | 'reviewing' | 'done';

export default function InterviewWarmup() {
  const [category, setCategory] = useState<Category | null>(null);
  const [phase, setPhase] = useState<Phase>('select');
  const [question, setQuestion] = useState<string>('');
  const [countdown, setCountdown] = useState(COOLDOWN_SECONDS);
  const [timeLeft, setTimeLeft] = useState(ANSWER_TIME_SECONDS);
  const [transcript, setTranscript] = useState('');
  const [result, setResult] = useState<ReturnType<typeof scoreWarmup> | null>(null);
  const [streak, setStreak] = useState(loadStreak);
  const [alreadyDone] = useState(doneToday);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const pickQuestion = useCallback((cat: Category) => {
    const pool = QUESTION_BANK[cat];
    const q = pool[Math.floor(Math.random() * pool.length)];
    setQuestion(q);
  }, []);

  const handleSelectCategory = (cat: Category) => {
    setCategory(cat);
    pickQuestion(cat);
    setPhase('ready');
    setTranscript('');
    setResult(null);
  };

  // Countdown before recording
  useEffect(() => {
    if (phase !== 'countdown') return;
    setCountdown(COOLDOWN_SECONDS);
    const t = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(t); return 0; }
        return c - 1;
      });
    }, 1000);
    const start = setTimeout(() => startRecording(), COOLDOWN_SECONDS * 1000);
    return () => { clearInterval(t); clearTimeout(start); };
  }, [phase]);

  // Answer timer
  useEffect(() => {
    if (phase !== 'recording') return;
    setTimeLeft(ANSWER_TIME_SECONDS);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { stopRecording(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  const startRecording = async () => {
    setPhase('recording');
    chunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      recorderRef.current = rec;
      rec.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      rec.start();
    } catch {
      // mic denied — fall back to text input
    }
  };

  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
      recorderRef.current.stream.getTracks().forEach((t) => t.stop());
    }
    setPhase('reviewing');
  }, []);

  const handleSubmitText = () => {
    const txt = textareaRef.current?.value.trim() ?? transcript.trim();
    setTranscript(txt);
    const r = scoreWarmup(txt);
    setResult(r);
    const newStreak = markTodayDone(streak);
    setStreak(newStreak);
    setPhase('done');
  };

  const handleReset = () => {
    setPhase('select');
    setCategory(null);
    setTranscript('');
    setResult(null);
  };

  const handleNewQuestion = () => {
    if (category) {
      pickQuestion(category);
      setPhase('ready');
      setTranscript('');
      setResult(null);
    }
  };

  const scoreColor = (s: number) => s >= 80 ? '#34d399' : s >= 60 ? '#fbbf24' : '#f87171';
  const timerColor = timeLeft <= 10 ? '#f87171' : timeLeft <= 20 ? '#fbbf24' : '#34d399';

  const activeCat = category ? CATEGORIES.find(c => c.key === category) : null;

  return (
    <div className="max-w-xl mx-auto px-4 py-8 flex flex-col gap-6">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #f97316, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Flame style={{ width: 20, height: 20, color: '#fff' }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Daily Coach</h1>
            <p className="text-xs text-slate-400">60-second daily practice · one question at a time</p>
          </div>
        </div>
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
          style={{ background: streak > 0 ? 'rgba(249,115,22,0.15)' : 'rgba(100,116,139,0.15)', border: `1px solid ${streak > 0 ? 'rgba(249,115,22,0.4)' : 'rgba(100,116,139,0.3)'}` }}
        >
          <Flame className="h-3.5 w-3.5" style={{ color: streak > 0 ? '#f97316' : '#64748b' }} />
          <span className="text-sm font-bold" style={{ color: streak > 0 ? '#fdba74' : '#64748b' }}>{streak}</span>
          <span className="text-xs" style={{ color: streak > 0 ? '#9a3412' : '#475569' }}>day streak</span>
        </div>
      </div>

      {/* ── Already done banner ──────────────────────────────────────────────── */}
      {alreadyDone && phase === 'select' && (
        <div className="rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)' }}>
          <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
          <p className="text-sm text-emerald-300">You've completed today's session! You can still practise more below.</p>
        </div>
      )}

      {/* ── Phase: select category ───────────────────────────────────────────── */}
      {phase === 'select' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-400" />
            <p className="text-sm font-semibold text-white">Choose a category to practise</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.key}
                  onClick={() => handleSelectCategory(cat.key as Category)}
                  className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:bg-white/10 hover:border-white/20"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: cat.color + '20' }}>
                    <Icon className="h-4.5 w-4.5" style={{ color: cat.color }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{cat.label}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{cat.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Active category pill + question ─────────────────────────────────── */}
      {phase !== 'select' && activeCat && (
        <>
          {/* Category pill with back */}
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
              style={{ background: activeCat.color + '20', color: activeCat.color, border: `1px solid ${activeCat.color}40` }}
            >
              <activeCat.icon className="h-3 w-3" />
              {activeCat.label}
            </div>
            {(phase === 'ready' || phase === 'done') && (
              <button
                onClick={handleReset}
                className="text-xs text-slate-500 hover:text-slate-300 transition underline underline-offset-2"
              >
                Change category
              </button>
            )}
          </div>

          {/* Question card */}
          <div className="rounded-2xl px-6 py-5" style={{ background: 'rgba(15,23,42,0.9)', border: '1px solid #1e293b' }}>
            <div className="flex items-center gap-2 mb-3">
              <Star className="h-3.5 w-3.5 text-indigo-400" />
              <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wide">Practice Question</span>
            </div>
            <p className="text-base font-medium text-white leading-relaxed">{question}</p>
          </div>
        </>
      )}

      {/* ── Phase: ready ─────────────────────────────────────────────────────── */}
      {phase === 'ready' && (
        <div className="flex flex-col gap-3">
          <button
            onClick={() => setPhase('countdown')}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-base transition-all"
            style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)', color: '#fff' }}
          >
            <Mic className="h-5 w-5" /> Start Recording (60 seconds)
          </button>
          <p className="text-xs text-slate-500 text-center">Or type your answer below and submit manually.</p>
          <textarea
            ref={textareaRef}
            placeholder="Type your answer here if you prefer text…"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 resize-none"
            rows={5}
          />
          <div className="flex gap-2">
            <button
              onClick={handleSubmitText}
              className="flex-1 py-2.5 rounded-xl font-semibold text-sm border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Submit Text Answer
            </button>
            <button
              onClick={handleNewQuestion}
              className="px-3 py-2.5 rounded-xl font-semibold text-sm border border-slate-700 text-slate-500 hover:bg-slate-800 transition-colors"
              title="Get a different question"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Phase: countdown ─────────────────────────────────────────────────── */}
      {phase === 'countdown' && (
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="text-6xl font-black" style={{ color: '#f97316', fontVariantNumeric: 'tabular-nums' }}>{countdown}</div>
          <p className="text-sm text-slate-400">Get ready to answer…</p>
        </div>
      )}

      {/* ── Phase: recording ─────────────────────────────────────────────────── */}
      {phase === 'recording' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-5 py-4 rounded-xl" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-semibold text-red-400">Recording</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Timer className="h-4 w-4" style={{ color: timerColor }} />
              <span className="text-2xl font-black" style={{ color: timerColor, fontVariantNumeric: 'tabular-nums' }}>{timeLeft}s</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 text-center">Speak clearly. Recording stops automatically at 0 seconds.</p>
          <button
            onClick={stopRecording}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <MicOff className="h-4 w-4" /> Stop Early
          </button>
          <div className="mt-2">
            <p className="text-xs text-slate-600 mb-2">Or type your answer instead:</p>
            <textarea
              ref={textareaRef}
              placeholder="Type here…"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 resize-none"
              rows={4}
            />
          </div>
        </div>
      )}

      {/* ── Phase: reviewing ─────────────────────────────────────────────────── */}
      {phase === 'reviewing' && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-slate-400">Recording stopped. Type out what you said to receive a score:</p>
          <textarea
            ref={textareaRef}
            defaultValue={transcript}
            placeholder="Type out what you said (or your answer)…"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 resize-none"
            rows={6}
          />
          <button
            onClick={handleSubmitText}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff' }}
          >
            <ChevronRight className="h-4 w-4" /> Get Score
          </button>
        </div>
      )}

      {/* ── Phase: done ──────────────────────────────────────────────────────── */}
      {phase === 'done' && result && (
        <div className="flex flex-col gap-4">
          {/* Score */}
          <div className="flex items-center gap-4 px-6 py-5 rounded-2xl" style={{ background: 'rgba(15,23,42,0.9)', border: '1px solid #1e293b' }}>
            <div className="shrink-0 flex flex-col items-center justify-center w-20 h-20 rounded-2xl" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)' }}>
              <span className="text-3xl font-black" style={{ color: scoreColor(result.score) }}>{result.score}</span>
              <span className="text-xs text-slate-500 mt-0.5">/ 100</span>
            </div>
            <div className="flex-1">
              <p className="text-base font-bold text-white mb-1">{result.label}</p>
              <p className="text-sm text-slate-400 leading-relaxed">{result.tip}</p>
            </div>
          </div>

          {/* Streak */}
          {streak > 0 && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)' }}>
              <Flame className="h-5 w-5 text-orange-400 shrink-0" />
              <p className="text-sm text-orange-300">
                {streak === 1 ? '🎉 Great start! Come back tomorrow to build your streak.' : `🔥 ${streak}-day streak! Keep going.`}
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleNewQuestion}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className="h-4 w-4" /> Another {activeCat?.label} Question
            </button>
            <button
              onClick={handleReset}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors"
            >
              Change Category
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
