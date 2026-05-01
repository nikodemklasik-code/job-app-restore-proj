import { useState, useEffect, useRef, useCallback } from 'react';
import { Flame, Mic, MicOff, RefreshCw, CheckCircle, ChevronRight, Timer, Star, Volume2 } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

// ─── Question bank ─────────────────────────────────────────────────────────────

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

// ─── TTS & STT ────────────────────────────────────────────────────────────────

async function readAloud(text: string): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/api/interview/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text.slice(0, 300) }),
      credentials: 'include',
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    await new Promise<void>((resolve) => {
      const audio = new Audio(url);
      audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
      audio.onerror  = () => { URL.revokeObjectURL(url); resolve(); };
      void audio.play().catch(() => resolve());
    });
  } catch { /* non-fatal */ }
}

async function transcribeAudio(blob: Blob): Promise<string> {
  try {
    const form = new FormData();
    form.append('audio', blob, 'audio.webm');
    const res = await fetch(`${API_BASE}/api/interview/transcribe`, {
      method: 'POST', body: form, credentials: 'include',
    });
    if (!res.ok) return '';
    const data = await res.json() as { transcript?: string };
    return data.transcript ?? '';
  } catch { return ''; }
}

// ─── Scoring ───────────────────────────────────────────────────────────────────

interface WarmupResult {
  score: number;
  label: string;
  whatWorked: string[];
  toImprove: string[];
  interviewTip: string;
}

function scoreWarmup(transcript: string): WarmupResult {
  const t = transcript.trim().toLowerCase();
  if (!t) return { score: 0, label: 'No answer', whatWorked: [], toImprove: ['Record or type your answer to get feedback.'], interviewTip: '' };

  let score = 50;
  const words = t.split(/\s+/).length;

  if (words >= 80) score += 15;
  else if (words >= 50) score += 8;
  else if (words < 20) score -= 15;

  const hasSituation = /\b(when|at the time|there was|during|in my previous|back in|last year)\b/.test(t);
  const hasAction = /\b(i (did|decided|implemented|built|led|created|wrote|fixed|reached out|set up|introduced|proposed|developed|organized))\b/.test(t);
  const hasResult = /\b(result(ed)?|achiev|improv|reduc|increas|saved|success|by \d|percent|outcome|delivered|launched)\b/.test(t);
  const fillers = (t.match(/\b(um|uh|like|you know|kind of|sort of)\b/g) ?? []).length;

  if (hasSituation) score += 8;
  if (hasAction) score += 10;
  if (hasResult) score += 12;
  score -= fillers * 4;
  score = Math.max(20, Math.min(100, Math.round(score)));

  const whatWorked: string[] = [];
  const toImprove: string[] = [];

  if (hasSituation) whatWorked.push('You set the scene — the interviewer knows the context.');
  else toImprove.push('Add context: start with "At my previous company…" or "Last year when I was working on…"');

  if (hasAction) whatWorked.push('You described your own actions clearly — this shows ownership.');
  else toImprove.push('Make your personal contribution explicit: use "I did…", "I decided…", "I built…"');

  if (hasResult) whatWorked.push('You included an outcome — interviewers value seeing what your actions achieved.');
  else toImprove.push('Close with a result: "As a result…", "This led to…". Add a number if possible.');

  if (words >= 60) whatWorked.push('Good answer length — enough detail to be convincing.');
  else if (words < 30) toImprove.push('Aim for at least 60–100 words. An answer this short lacks evidence.');

  if (fillers > 2) toImprove.push(`You used ${fillers} filler word${fillers !== 1 ? 's' : ''} (um, uh, like). Pause silently instead.`);

  let interviewTip: string;
  if (!hasResult && !hasSituation) interviewTip = '🎯 In the real interview: structure as STAR — Situation, Task, Action, Result.';
  else if (!hasResult) interviewTip = '🎯 In the real interview: always land on a result. "As a result, we achieved X."';
  else if (!hasSituation) interviewTip = '🎯 In the real interview: open with a brief context-setter — one sentence on where you were.';
  else if (fillers > 2) interviewTip = '🎯 In the real interview: pause rather than fill silence with "um". It sounds more professional.';
  else interviewTip = '🎯 In the real interview: add one specific metric to your result. Numbers make answers memorable.';

  const label = score >= 85 ? 'Excellent' : score >= 70 ? 'Good' : score >= 55 ? 'Developing' : 'Needs work';
  return { score, label, whatWorked, toImprove, interviewTip };
}

// ─── Streak helpers ───────────────────────────────────────────────────────────

function getTodayStr() { return new Date().toISOString().slice(0, 10); }

function loadStreak(): number {
  try {
    const last = localStorage.getItem(LAST_DATE_KEY);
    const streak = parseInt(localStorage.getItem(STREAK_KEY) ?? '0', 10);
    if (!last) return 0;
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (last === getTodayStr() || last === yesterday) return streak;
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

// ─── Waveform visualiser ──────────────────────────────────────────────────────

function MicWaveform({ stream }: { stream: MediaStream | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    if (!stream) return;
    const ctx = new AudioContext();
    const src = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 64;
    src.connect(analyser);
    analyserRef.current = analyser;

    const data = new Uint8Array(analyser.frequencyBinCount);

    function draw() {
      rafRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(data);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const c = canvas.getContext('2d');
      if (!c) return;
      c.clearRect(0, 0, canvas.width, canvas.height);
      const barW = canvas.width / data.length * 2;
      data.forEach((val, i) => {
        const h = (val / 255) * canvas.height;
        const x = i * (barW + 1);
        c.fillStyle = `rgba(99,102,241,${0.4 + val / 255 * 0.6})`;
        c.fillRect(x, canvas.height - h, barW, h);
      });
    }
    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      void ctx.close();
    };
  }, [stream]);

  if (!stream) return null;

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={40}
      className="w-full rounded-lg"
      style={{ height: 40 }}
    />
  );
}

// ─── Session duration selector ────────────────────────────────────────────────

const SESSION_DURATIONS = [30, 45, 60] as const;
type SessionDuration = typeof SESSION_DURATIONS[number];

// ─── Main component ───────────────────────────────────────────────────────────

type Phase = 'ready' | 'countdown' | 'recording' | 'transcribing' | 'reviewing' | 'done';

export default function InterviewWarmup() {
  const [phase, setPhase] = useState<Phase>('ready');
  const [question, setQuestion] = useState('');
  const [countdown, setCountdown] = useState(COOLDOWN_SECONDS);
  const [sessionDuration, setSessionDuration] = useState<SessionDuration>(60);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [transcript, setTranscript] = useState('');
  const [result, setResult] = useState<WarmupResult | null>(null);
  const [streak, setStreak] = useState(loadStreak);
  const [alreadyDone] = useState(doneToday);
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [isReading, setIsReading] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const pickQuestion = useCallback(() => {
    setQuestion(WARMUP_QUESTIONS[Math.floor(Math.random() * WARMUP_QUESTIONS.length)] ?? '');
  }, []);

  useEffect(() => { pickQuestion(); }, [pickQuestion]);

  // Countdown phase
  useEffect(() => {
    if (phase !== 'countdown') return;
    setCountdown(COOLDOWN_SECONDS);
    const t = setInterval(() => setCountdown((c) => c <= 1 ? (clearInterval(t), 0) : c - 1), 1000);
    const start = setTimeout(() => void startRecording(), COOLDOWN_SECONDS * 1000);
    return () => { clearInterval(t); clearTimeout(start); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Recording timer
  useEffect(() => {
    if (phase !== 'recording') return;
    setTimeLeft(sessionDuration);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { stopRecording(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, sessionDuration]);

  const startRecording = async () => {
    setPhase('recording');
    chunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicStream(stream);
      const rec = new MediaRecorder(stream);
      recorderRef.current = rec;
      rec.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      rec.start();
    } catch {
      // Mic denied — go straight to reviewing (text mode)
      setMicStream(null);
      setPhase('reviewing');
    }
  };

  const stopRecording = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);

    const rec = recorderRef.current;
    if (rec && rec.state !== 'inactive') {
      rec.stop();
      rec.stream.getTracks().forEach((t) => t.stop());
    }
    setMicStream(null);
    setPhase('transcribing');

    // Auto-transcribe
    await new Promise<void>((resolve) => setTimeout(resolve, 300)); // wait for last chunk
    const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
    if (blob.size > 1000) {
      const text = await transcribeAudio(blob);
      setTranscript(text);
      setPhase('reviewing');
    } else {
      setTranscript('');
      setPhase('reviewing');
    }
  }, []);

  const handleSubmitText = () => {
    const txt = textareaRef.current?.value.trim() ?? transcript.trim();
    const final = txt || transcript;
    setTranscript(final);
    setResult(scoreWarmup(final));
    setStreak(markTodayDone(streak));
    setPhase('done');
  };

  const handleReset = () => {
    pickQuestion();
    setTranscript('');
    setResult(null);
    setPhase('ready');
  };

  const handleReadAloud = async () => {
    if (isReading) return;
    setIsReading(true);
    await readAloud(question);
    setIsReading(false);
  };

  const scoreColor = (s: number) => s >= 80 ? '#34d399' : s >= 60 ? '#fbbf24' : '#f87171';
  const timerColor = timeLeft <= 10 ? '#f87171' : timeLeft <= 20 ? '#fbbf24' : '#34d399';
  const timerPct = (timeLeft / sessionDuration) * 100;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-8">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-500/25 p-2.5">
            <Flame className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Daily Warmup</h1>
            <p className="text-sm text-slate-400">5-minute daily practice · STAR method · AI scoring</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: streak > 0 ? 'rgba(249,115,22,0.15)' : 'rgba(100,116,139,0.15)', border: `1px solid ${streak > 0 ? 'rgba(249,115,22,0.4)' : 'rgba(100,116,139,0.3)'}` }}>
          <Flame className="h-4 w-4" style={{ color: streak > 0 ? '#f97316' : '#64748b' }} />
          <span className="text-sm font-bold" style={{ color: streak > 0 ? '#fdba74' : '#64748b' }}>{streak}</span>
          <span className="text-xs ml-0.5" style={{ color: streak > 0 ? '#9a3412' : '#475569' }}>day streak</span>
        </div>
      </div>

      {/* ── Already done today ───────────────────────────────────────── */}
      {alreadyDone && phase === 'ready' && (
        <div className="rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)' }}>
          <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
          <p className="text-sm text-emerald-300">You've completed today's warmup! Come back tomorrow to keep your streak going.</p>
        </div>
      )}

      {/* ── Question card ────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm p-6 hover:border-indigo-500/30 transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-indigo-500/20 p-2">
              <Star className="h-3.5 w-3.5 text-indigo-400" />
            </div>
            <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">Today's Question</span>
          </div>
          {/* Read aloud button */}
          <button
            onClick={() => void handleReadAloud()}
            disabled={isReading}
            title="Read question aloud"
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-indigo-300 hover:border-indigo-500/40 hover:bg-white/10 transition-all disabled:opacity-50"
          >
            <Volume2 className={`h-3 w-3 ${isReading ? 'text-indigo-400 animate-pulse' : ''}`} />
            {isReading ? 'Reading…' : 'Read aloud'}
          </button>
        </div>
        <p className="text-lg font-medium text-white leading-relaxed">{question}</p>
      </div>

      {/* ── Session duration (ready phase only) ─────────────────────── */}
      {phase === 'ready' && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 shrink-0">Session:</span>
          <div className="flex gap-1.5">
            {SESSION_DURATIONS.map((d) => (
              <button
                key={d}
                onClick={() => setSessionDuration(d)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  sessionDuration === d
                    ? 'bg-indigo-600 text-white shadow shadow-indigo-500/25'
                    : 'border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {d}s
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── READY ───────────────────────────────────────────────────── */}
      {phase === 'ready' && (
        <div className="flex flex-col gap-3">
          <button
            onClick={() => setPhase('countdown')}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-base transition-all hover:scale-[1.01] active:scale-[0.99]"
            style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)', color: '#fff' }}
          >
            <Mic className="h-5 w-5" /> Start ({sessionDuration}s)
          </button>
          <p className="text-xs text-slate-500 text-center">Or type your answer below and submit manually.</p>
          <textarea
            ref={textareaRef}
            placeholder="Type your answer here if you prefer text…"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 resize-none"
            rows={5}
          />
          <div className="flex gap-2">
            <button onClick={handleSubmitText} className="flex-1 py-2.5 rounded-xl font-semibold text-sm border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors">
              Submit Text Answer
            </button>
            <button onClick={handleReset} className="px-3 py-2.5 rounded-xl border border-slate-700 text-slate-500 hover:bg-slate-800 transition-colors" title="New question">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── COUNTDOWN ───────────────────────────────────────────────── */}
      {phase === 'countdown' && (
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="text-7xl font-black" style={{ color: '#f97316', fontVariantNumeric: 'tabular-nums' }}>{countdown}</div>
          <p className="text-sm text-slate-400">Get ready to answer…</p>
        </div>
      )}

      {/* ── RECORDING ───────────────────────────────────────────────── */}
      {phase === 'recording' && (
        <div className="flex flex-col gap-4">
          {/* Timer bar */}
          <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <div className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm font-semibold text-red-400">Recording</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Timer className="h-4 w-4" style={{ color: timerColor }} />
                <span className="text-2xl font-black" style={{ color: timerColor, fontVariantNumeric: 'tabular-nums' }}>{timeLeft}s</span>
              </div>
            </div>
            {/* Progress bar */}
            <div className="h-1 w-full bg-red-500/10">
              <div
                className="h-full transition-all duration-1000"
                style={{ width: `${timerPct}%`, backgroundColor: timerColor }}
              />
            </div>
          </div>

          {/* Waveform */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Mic className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
              <span className="text-xs text-slate-400">Live audio</span>
            </div>
            <MicWaveform stream={micStream} />
            {!micStream && (
              <div className="flex gap-1 justify-center py-2">
                {[3,5,7,4,6,8,5,4,7,6,3,5].map((h, i) => (
                  <div key={i} className="w-1.5 rounded-full bg-indigo-500/40 animate-pulse" style={{ height: h * 3, animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
            )}
          </div>

          <p className="text-xs text-slate-500 text-center">Speak clearly. Will auto-transcribe when done.</p>

          <button
            onClick={() => void stopRecording()}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <MicOff className="h-4 w-4" /> Stop & Transcribe
          </button>
        </div>
      )}

      {/* ── TRANSCRIBING ────────────────────────────────────────────── */}
      {phase === 'transcribing' && (
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
          <p className="text-sm text-slate-400">Transcribing your answer…</p>
        </div>
      )}

      {/* ── REVIEWING ───────────────────────────────────────────────── */}
      {phase === 'reviewing' && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-slate-400">
            {transcript ? 'Transcription complete — edit if needed:' : 'Type out your answer:'}
          </p>
          <textarea
            ref={textareaRef}
            defaultValue={transcript}
            placeholder="Your answer…"
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

      {/* ── DONE ────────────────────────────────────────────────────── */}
      {phase === 'done' && result && (
        <div className="flex flex-col gap-4">
          {/* Score */}
          <div className="flex items-center gap-6 px-6 py-6 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm" style={{ animation: 'fadeIn 0.6s ease-out' }}>
            <div className="shrink-0 flex flex-col items-center justify-center w-24 h-24 rounded-2xl border border-indigo-500/30 bg-indigo-500/10">
              <span className="text-4xl font-black" style={{ color: scoreColor(result.score), fontVariantNumeric: 'tabular-nums' }}>{result.score}</span>
              <span className="text-xs text-slate-500 mt-1">out of 100</span>
            </div>
            <div className="flex-1">
              <p className="text-lg font-bold text-white mb-1">{result.label}</p>
              <p className="text-sm text-slate-400">Evaluated for STAR structure, clarity, and impact</p>
            </div>
          </div>

          {result.whatWorked.length > 0 && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 space-y-2 backdrop-blur-sm">
              <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2.5">✓ What worked</p>
              {result.whatWorked.map((w, i) => <p key={i} className="text-sm text-emerald-300 leading-relaxed">• {w}</p>)}
            </div>
          )}

          {result.toImprove.length > 0 && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 space-y-2 backdrop-blur-sm">
              <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2.5">↑ To improve</p>
              {result.toImprove.map((t, i) => <p key={i} className="text-sm text-red-300 leading-relaxed">• {t}</p>)}
            </div>
          )}

          {result.interviewTip && (
            <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-5 py-4 backdrop-blur-sm">
              <p className="text-sm text-indigo-300 leading-relaxed">{result.interviewTip}</p>
            </div>
          )}

          {streak > 0 && (
            <div className="flex items-center gap-3 px-5 py-4 rounded-xl border border-orange-500/30 bg-orange-500/10 backdrop-blur-sm">
              <Flame className="h-5 w-5 text-orange-400 shrink-0 animate-pulse" />
              <p className="text-sm text-orange-300">
                {streak === 1 ? '🎉 Great start! Come back tomorrow to build your streak.' : `🔥 ${streak}-day streak! Keep it going!`}
              </p>
            </div>
          )}

          <button onClick={handleReset} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors">
            <RefreshCw className="h-4 w-4" /> Try Another Question
          </button>
        </div>
      )}
    </div>
  );
}
