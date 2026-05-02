import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Send, Bot, User, RefreshCw, X, Volume2, VolumeX,
  MessageSquarePlus, Mic, MicOff, Sparkles,
  FileText, TrendingUp, Briefcase, DollarSign, ChevronDown,
} from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCareerAssistantStore } from '@/stores/careerAssistantStore';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

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

async function speakText(text: string): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/api/interview/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text.slice(0, 500) }),
      credentials: 'include',
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    await new Promise<void>((resolve) => {
      const audio = new Audio(url);
      audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
      audio.onerror = () => { URL.revokeObjectURL(url); resolve(); };
      void audio.play().catch(() => resolve());
    });
  } catch { /* non-fatal */ }
}

// ─── Mode config ─────────────────────────────────────────────────────────────

type Mode = 'general' | 'cv' | 'interview' | 'salary';

const MODES: { id: Mode; label: string; color: string; bg: string; desc: string }[] = [
  { id: 'general',   label: 'General',   color: 'text-violet-300', bg: 'bg-violet-500/20 border-violet-500/40',   desc: 'Any career topic' },
  { id: 'cv',        label: 'CV',        color: 'text-indigo-300', bg: 'bg-indigo-500/20 border-indigo-500/40',   desc: 'CV feedback & tips' },
  { id: 'interview', label: 'Interview', color: 'text-amber-300',  bg: 'bg-amber-500/20  border-amber-500/40',    desc: 'Prep & practice' },
  { id: 'salary',    label: 'Salary',    color: 'text-emerald-300',bg: 'bg-emerald-500/20 border-emerald-500/40', desc: 'Negotiation help' },
];

// ─── Quick actions ────────────────────────────────────────────────────────────

const QUICK: { icon: typeof FileText; label: string; desc: string; prompt: string; mode: Mode; grad: string }[] = [
  {
    icon: FileText,
    label: 'Review my CV',
    desc: 'Targeted feedback for your target role',
    prompt: 'Review my CV for a Senior Frontend role',
    mode: 'cv',
    grad: 'from-indigo-600/30 to-indigo-500/10 border-indigo-500/25 hover:border-indigo-400/50',
  },
  {
    icon: DollarSign,
    label: 'Salary negotiation',
    desc: 'Scripts & strategies to maximise your offer',
    prompt: 'How should I negotiate my salary effectively?',
    mode: 'salary',
    grad: 'from-emerald-600/30 to-emerald-500/10 border-emerald-500/25 hover:border-emerald-400/50',
  },
  {
    icon: Briefcase,
    label: 'Interview prep',
    desc: 'Behavioural & technical question practice',
    prompt: 'Prepare me for a behavioural interview',
    mode: 'interview',
    grad: 'from-amber-600/30 to-amber-500/10 border-amber-500/25 hover:border-amber-400/50',
  },
  {
    icon: TrendingUp,
    label: 'Job strategy',
    desc: 'Smart search, positioning & pipeline advice',
    prompt: 'What are the best job search strategies right now?',
    mode: 'general',
    grad: 'from-violet-600/30 to-violet-500/10 border-violet-500/25 hover:border-violet-400/50',
  },
];

const MAX_ROWS = 5;
const LH = 24;

// ─── Sub-components ───────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex items-end gap-3 px-5 py-2">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600">
        <Sparkles className="h-4 w-4 text-white" />
      </div>
      <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-white/10 bg-white/[0.06] px-5 py-3.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 rounded-full bg-indigo-400"
            style={{ animation: `bounce 1s ${i * 0.18}s infinite` }}
          />
        ))}
      </div>
    </div>
  );
}

function Bubble({
  msg,
  speakingId,
  onSpeak,
}: {
  msg: { id: string; role: string; text: string };
  speakingId: string | null;
  onSpeak: (id: string, text: string) => void;
}) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex items-end gap-3 px-5 py-1 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-lg ${
        isUser
          ? 'bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-indigo-500/20'
          : 'bg-gradient-to-br from-violet-500 to-indigo-600 shadow-violet-500/20'
      }`}>
        {isUser ? <User className="h-4 w-4 text-white" /> : <Sparkles className="h-4 w-4 text-white" />}
      </div>

      {/* Bubble */}
      <div className={`flex max-w-[76%] flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'rounded-br-sm bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-500/20'
            : 'rounded-bl-sm border border-white/[0.09] bg-white/[0.05] text-slate-100 shadow-sm'
        }`}>
          {msg.text}
        </div>
        {!isUser && (
          <button
            onClick={() => onSpeak(msg.id, msg.text)}
            className="flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] text-slate-600 transition-colors hover:text-indigo-400"
          >
            {speakingId === msg.id
              ? <><VolumeX className="h-3 w-3" /> Stop</>
              : <><Volume2 className="h-3 w-3" /> Read aloud</>}
          </button>
        )}
      </div>
    </div>
  );
}

function EmptyState({
  onPick,
  isSending,
}: {
  onPick: (prompt: string, mode: Mode) => void;
  isSending: boolean;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-10 px-6 py-16">
      {/* Hero */}
      <div className="text-center">
        <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 blur-xl opacity-50" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-2xl shadow-indigo-500/40">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white">AI Career Assistant</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-400">
          Ask anything about your career, CV, salary, or interview prep — grounded in your profile and documents.
        </p>
        <div className="mx-auto mt-4 flex w-fit items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-4 py-1.5">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          <span className="text-xs font-medium text-emerald-300">GPT-4o · Assistant online</span>
        </div>
      </div>

      {/* Quick starters */}
      <div className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
        {QUICK.map((q) => {
          const Icon = q.icon;
          return (
            <button
              key={q.label}
              type="button"
              disabled={isSending}
              onClick={() => !isSending && onPick(q.prompt, q.mode)}
              className={`group flex items-start gap-4 rounded-2xl border bg-gradient-to-br p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-40 ${q.grad}`}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 transition group-hover:bg-white/15">
                <Icon className="h-4.5 w-4.5 text-white/80" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">{q.label}</p>
                <p className="mt-0.5 text-xs leading-snug text-white/50">{q.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Module routing — spec: suggest other modules */}
      <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-600">
        <span>Or go deeper:</span>
        <Link to="/interview" className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-slate-400 transition hover:border-amber-500/30 hover:text-amber-300">
          Interview Practice
        </Link>
        <Link to="/coach" className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-slate-400 transition hover:border-indigo-500/30 hover:text-indigo-300">
          AI Coach
        </Link>
        <Link to="/warmup" className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-slate-400 transition hover:border-orange-500/30 hover:text-orange-300">
          Daily Warmup
        </Link>
        <Link to="/documents" className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-slate-400 transition hover:border-emerald-500/30 hover:text-emerald-300">
          Document Lab
        </Link>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type PrefillState = {
  prefill?: { text: string; mode?: Mode; autoSend?: boolean };
};

export default function AssistantPage() {
  const { isSignedIn } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const prefillConsumedRef = useRef(false);

  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('general');
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showModes, setShowModes] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const { messages, status, error, loadHistory, sendMessage, resetError, clearMessages } =
    useCareerAssistantStore();

  const isSending = status === 'sending';
  const isLoading = status === 'syncing';
  const activeMode = MODES.find((m) => m.id === mode)!;

  useEffect(() => {
    if (isSignedIn) void loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn]);

  useEffect(() => {
    if (!isSignedIn || prefillConsumedRef.current) return;
    const state = (location.state as PrefillState | null) ?? null;
    const prefill = state?.prefill;
    if (!prefill?.text) return;
    prefillConsumedRef.current = true;
    const m = prefill.mode ?? 'general';
    setMode(m);
    if (prefill.autoSend === false) setInput(prefill.text);
    else void sendMessage(prefill.text, m);
    navigate(location.pathname, { replace: true, state: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, location.state]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const max = MAX_ROWS * LH + 20;
    el.style.height = `${Math.min(el.scrollHeight, max)}px`;
    el.style.overflowY = el.scrollHeight > max ? 'auto' : 'hidden';
  }, [input]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setIsTranscribing(true);
        const tx = await transcribeAudio(blob);
        setIsTranscribing(false);
        if (tx.trim()) {
          setInput((prev) => prev ? `${prev} ${tx.trim()}` : tx.trim());
          textareaRef.current?.focus();
        }
      };
      recorderRef.current = rec;
      rec.start();
      setIsRecording(true);
    } catch { /* mic denied */ }
  }, []);

  const stopRecording = useCallback(() => {
    recorderRef.current?.stop();
    setIsRecording(false);
  }, []);

  const toggleRecording = useCallback(() => {
    if (isRecording) stopRecording();
    else void startRecording();
  }, [isRecording, startRecording, stopRecording]);

  const handleSend = async () => {
    if (!input.trim() || isSending) return;
    const text = input.trim();
    setInput('');
    await sendMessage(text, mode);
  };

  const handleQuickStart = async (prompt: string, m: Mode) => {
    setMode(m);
    await sendMessage(prompt, m);
  };

  const handleSpeak = async (msgId: string, text: string) => {
    if (speakingMsgId === msgId) { setSpeakingMsgId(null); return; }
    setSpeakingMsgId(msgId);
    await speakText(text);
    setSpeakingMsgId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSend(); }
  };

  return (
    <div className="flex h-[calc(100dvh-5rem)] min-h-[600px] flex-col">

      {/* ═══ Top bar ═══════════════════════════════════════════════════════════ */}
      <div className="relative shrink-0 overflow-hidden rounded-t-3xl border border-b-0 border-white/10">
        {/* Gradient strip */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-950/80 via-slate-900/90 to-violet-950/80" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />

        <div className="relative flex items-center justify-between gap-4 px-5 py-3.5">
          {/* Left: identity */}
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
              <Bot className="h-5 w-5 text-white" />
              <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight text-white">AI Career Assistant</h1>
              <p className="text-[11px] text-slate-400">GPT-4o · Ask anything career-related</p>
            </div>
          </div>

          {/* Right: controls */}
          <div className="flex items-center gap-2">
            {/* Mode pill (collapsed) */}
            <button
              type="button"
              onClick={() => setShowModes((v) => !v)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${activeMode.bg} ${activeMode.color}`}
            >
              {activeMode.label}
              <ChevronDown className={`h-3 w-3 transition-transform ${showModes ? 'rotate-180' : ''}`} />
            </button>

            <button
              onClick={() => clearMessages?.()}
              title="New conversation"
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:bg-white/10 hover:text-white"
            >
              <MessageSquarePlus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New</span>
            </button>

            <button
              onClick={() => void loadHistory()}
              disabled={isLoading}
              title="Refresh"
              className="flex h-7 w-7 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Mode dropdown */}
        {showModes && (
          <div className="relative border-t border-white/[0.06] bg-slate-950/60 px-5 py-2.5">
            <div className="flex flex-wrap gap-2">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => { setMode(m.id); setShowModes(false); }}
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                    mode === m.id ? m.bg + ' ' + m.color : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  {m.label}
                  <span className="text-[10px] opacity-60">{m.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ═══ Error banner ══════════════════════════════════════════════════════ */}
      {error && (
        <div className="shrink-0 border-x border-white/10 bg-red-950/30 px-4 py-2">
          <div className="flex items-center justify-between gap-3 text-sm text-red-300">
            <span>{error}</span>
            <button onClick={resetError} className="shrink-0 rounded p-0.5 hover:bg-red-500/20">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ═══ Chat area ═════════════════════════════════════════════════════════ */}
      <div className="relative min-h-0 flex-1 overflow-y-auto border-x border-white/10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.08),transparent)]">
        {isLoading ? (
          <div className="flex h-full items-center justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <span key={i} className="h-2.5 w-2.5 animate-bounce rounded-full bg-indigo-400/60"
                style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <EmptyState onPick={(p, m) => void handleQuickStart(p, m)} isSending={isSending} />
        ) : (
          <div className="space-y-2 py-5">
            {messages.map((msg) => (
              <Bubble
                key={msg.id}
                msg={msg}
                speakingId={speakingMsgId}
                onSpeak={(id, text) => void handleSpeak(id, text)}
              />
            ))}
            {isSending && <TypingDots />}
            <div ref={messagesEndRef} className="h-2" />
          </div>
        )}
      </div>

      {/* ═══ Input bar ═════════════════════════════════════════════════════════ */}
      <div className="shrink-0 rounded-b-3xl border border-t-0 border-white/10 bg-slate-950/80 px-4 pb-4 pt-3 backdrop-blur-sm">
        {/* Active mode chip */}
        <div className="mb-2 flex items-center gap-2">
          <span className={`rounded-lg border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${activeMode.bg} ${activeMode.color}`}>
            {activeMode.label} mode
          </span>
          <span className="text-[11px] text-slate-600">{activeMode.desc}</span>
        </div>

        {/* Input row */}
        <div className="flex items-end gap-2">
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              rows={1}
              placeholder={
                isTranscribing ? 'Transcribing…' :
                isRecording    ? 'Recording — click mic to stop' :
                                 'Ask anything career-related…'
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSending || isTranscribing}
              className="min-h-[46px] w-full resize-none rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-indigo-400/50 focus:bg-white/[0.07] disabled:opacity-50 transition-colors"
              style={{ lineHeight: `${LH}px`, overflowY: 'hidden' }}
            />
            {isRecording && (
              <span className="absolute right-3 top-3.5 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
              </span>
            )}
          </div>

          {/* Mic */}
          <button
            onClick={toggleRecording}
            disabled={isSending || isTranscribing}
            title={isRecording ? 'Stop recording' : 'Voice input'}
            className={`flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-2xl border transition-all disabled:opacity-40 ${
              isRecording
                ? 'border-rose-500/40 bg-rose-500/15 text-rose-300 shadow-lg shadow-rose-500/20'
                : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>

          {/* Send */}
          <button
            onClick={() => void handleSend()}
            disabled={isSending || !input.trim()}
            className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25 transition-all hover:from-indigo-400 hover:to-violet-500 hover:shadow-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-2 text-center text-[10px] text-slate-700">
          Enter to send · Shift+Enter for new line · Mic for voice
        </p>
      </div>
    </div>
  );
}
