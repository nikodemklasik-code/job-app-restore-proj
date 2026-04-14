import { useState, useEffect, useRef, useCallback } from 'react';
import { Flame, Mic, MicOff, RefreshCw, CheckCircle, ChevronRight, Timer, Star } from 'lucide-react';

// ─── Question bank (drawn from all interview modes) ───────────────────────────

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

const ANSWER_TIME_SECONDS = 60;
const COOLDOWN_SECONDS = 3;
const STREAK_KEY = 'warmup_streak';
const LAST_DATE_KEY = 'warmup_last_date';

// ─── Simple scoring (client-side, no network) ─────────────────────────────────

function scoreWarmup(transcript: string): { score: number; tip: string; label: string } {
  const t = transcript.trim().toLowerCase();
  if (!t) return { score: 0, tip: 'No answer recorded.', label: 'No answer' };

  let score = 50;
  const words = t.split(/\s+/).length;

  // Length
  if (words >= 80) score += 15;
  else if (words >= 50) score += 8;
  else if (words < 20) score -= 15;

  // STAR signals
  const hasSituation = /\b(when|at the time|there was|during|in my previous|back in|last year)\b/.test(t);
  const hasAction = /\b(i (did|decided|implemented|built|led|created|wrote|fixed|reached out|set up|introduced|proposed|developed|organized))\b/.test(t);
  const hasResult = /\b(result(ed)?|achiev|improv|reduc|increas|saved|success|by \d|percent|outcome|delivered|launched)\b/.test(t);
  if (hasSituation) score += 8;
  if (hasAction) score += 10;
  if (hasResult) score += 12;

  // Filler words
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
    const today = getTodayStr();
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (last === today) return streak;
    if (last === yesterday) return streak; // still valid, not yet incremented today
    return 0; // broken streak
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

type Phase = 'ready' | 'countdown' | 'recording' | 'reviewing' | 'done';

export default function InterviewWarmup() {
  const [phase, setPhase] = useState<Phase>('ready');
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

  const pickQuestion = useCallback(() => {
    const q = WARMUP_QUESTIONS[Math.floor(Math.random() * WARMUP_QUESTIONS.length)];
    setQuestion(q);
  }, []);

  useEffect(() => { pickQuestion(); }, [pickQuestion]);

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
    pickQuestion();
    setTranscript('');
    setResult(null);
    setPhase('ready');
  };

  const scoreColor = (s: number) => s >= 80 ? '#34d399' : s >= 60 ? '#fbbf24' : '#f87171';
  const timerColor = timeLeft <= 10 ? '#f87171' : timeLeft <= 20 ? '#fbbf24' : '#34d399';

  // ── Layout shell ────────────────────────────────────────────────────────────

  return (
    <div className="max-w-xl mx-auto px-4 py-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #f97316, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Flame style={{ width: 20, height: 20, color: '#fff' }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Daily Coach</h1>
            <p className="text-xs text-slate-400">5-minute daily practice · one question · 60 seconds</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: streak > 0 ? 'rgba(249,115,22,0.15)' : 'rgba(100,116,139,0.15)', border: `1px solid ${streak > 0 ? 'rgba(249,115,22,0.4)' : 'rgba(100,116,139,0.3)'}` }}>
          <Flame className="h-3.5 w-3.5" style={{ color: streak > 0 ? '#f97316' : '#64748b' }} />
          <span className="text-sm font-bold" style={{ color: streak > 0 ? '#fdba74' : '#64748b' }}>{streak}</span>
          <span className="text-xs" style={{ color: streak > 0 ? '#9a3412' : '#475569' }}>day streak</span>
        </div>
      </div>

      {/* Already done today banner */}
      {alreadyDone && phase === 'ready' && (
        <div className="rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)' }}>
          <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
          <p className="text-sm text-emerald-300">You've completed today's warmup! Come back tomorrow to keep your streak going.</p>
        </div>
      )}

      {/* Question card */}
      <div className="rounded-2xl px-6 py-5" style={{ background: 'rgba(15,23,42,0.9)', border: '1px solid #1e293b' }}>
        <div className="flex items-center gap-2 mb-3">
          <Star className="h-3.5 w-3.5 text-indigo-400" />
          <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wide">Today's Question</span>
        </div>
        <p className="text-base font-medium text-white leading-relaxed">{question}</p>
      </div>

      {/* Phase: ready */}
      {phase === 'ready' && (
        <div className="flex flex-col gap-3">
          <button
            onClick={() => setPhase('countdown')}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-base transition-all"
            style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)', color: '#fff' }}
          >
            <Mic className="h-5 w-5" /> Start (60 seconds)
          </button>
          <p className="text-xs text-slate-500 text-center">Or type your answer below and submit manually.</p>
          <textarea
            ref={textareaRef}
            placeholder="Type your answer here if you prefer text…"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 resize-none"
            rows={5}
          />
          <button
            onClick={handleSubmitText}
            className="w-full py-2.5 rounded-xl font-semibold text-sm border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Submit Text Answer
          </button>
        </div>
      )}

      {/* Phase: countdown */}
      {phase === 'countdown' && (
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="text-6xl font-black" style={{ color: '#f97316', fontVariantNumeric: 'tabular-nums' }}>{countdown}</div>
          <p className="text-sm text-slate-400">Get ready to answer…</p>
        </div>
      )}

      {/* Phase: recording */}
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
          <p className="text-xs text-slate-500 text-center">Speak your answer clearly. Recording will stop automatically at 0 seconds.</p>
          <button
            onClick={stopRecording}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <MicOff className="h-4 w-4" /> Stop Early
          </button>
          {/* Text fallback */}
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

      {/* Phase: reviewing (text submission) */}
      {phase === 'reviewing' && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-slate-400">Recording stopped. If you used the mic, transcribe your answer below to get a score:</p>
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

      {/* Phase: done */}
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

          {/* Streak update */}
          {streak > 0 && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)' }}>
              <Flame className="h-5 w-5 text-orange-400 shrink-0" />
              <p className="text-sm text-orange-300">
                {streak === 1 ? '🎉 Great start! Come back tomorrow to build your streak.' : `🔥 ${streak}-day streak! Keep going.`}
              </p>
            </div>
          )}

          <button
            onClick={handleReset}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="h-4 w-4" /> Try Another Question
          </button>
        </div>
      )}
    </div>
  );
}
