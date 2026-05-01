import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Send, Bot, User, RefreshCw, X, Volume2, VolumeX,
  MessageSquarePlus, Mic, MicOff, Sparkles,
  FileText, TrendingUp, Briefcase, DollarSign,
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
      audio.onerror  = () => { URL.revokeObjectURL(url); resolve(); };
      void audio.play().catch(() => resolve());
    });
  } catch { /* TTS is non-fatal */ }
}

// ── Quick actions ─────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  {
    icon: FileText,
    label: 'CV Review',
    desc: 'Get tailored feedback on your CV',
    prompt: 'Review my CV for a Senior Frontend role',
    mode: 'cv' as const,
    color: 'text-indigo-400',
    ring: 'border-indigo-500/25 hover:border-indigo-400/50 hover:bg-indigo-500/10',
  },
  {
    icon: DollarSign,
    label: 'Salary Negotiation',
    desc: 'Strategies to maximise your offer',
    prompt: 'How should I negotiate my salary effectively?',
    mode: 'salary' as const,
    color: 'text-emerald-400',
    ring: 'border-emerald-500/25 hover:border-emerald-400/50 hover:bg-emerald-500/10',
  },
  {
    icon: Briefcase,
    label: 'Interview Prep',
    desc: 'Practice behavioural and technical questions',
    prompt: 'Prepare me for a behavioural interview',
    mode: 'interview' as const,
    color: 'text-amber-400',
    ring: 'border-amber-500/25 hover:border-amber-400/50 hover:bg-amber-500/10',
  },
  {
    icon: TrendingUp,
    label: 'Job Strategy',
    desc: 'Smarter search and positioning advice',
    prompt: 'What are the best job search strategies right now?',
    mode: 'general' as const,
    color: 'text-violet-400',
    ring: 'border-violet-500/25 hover:border-violet-400/50 hover:bg-violet-500/10',
  },
];

const MAX_TEXTAREA_ROWS = 5;
const LINE_HEIGHT_PX = 24;

// ── Typing indicator ──────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20">
        <Sparkles className="h-4 w-4 text-white" />
      </div>
      <div className="rounded-2xl rounded-bl-sm border border-white/[0.08] bg-white/5 px-4 py-3">
        <div className="flex h-4 items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────────

function MessageBubble({
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
    <div className={`flex items-end gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-lg ${
        isUser
          ? 'bg-indigo-600 shadow-indigo-500/25'
          : 'bg-gradient-to-br from-indigo-500 to-violet-600 shadow-indigo-500/20'
      }`}>
        {isUser
          ? <User className="h-4 w-4 text-white" />
          : <Sparkles className="h-4 w-4 text-white" />
        }
      </div>

      <div className={`flex max-w-[78%] flex-col gap-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'rounded-br-sm bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
            : 'rounded-bl-sm border border-white/[0.08] bg-white/5 text-slate-200'
        }`}>
          {msg.text}
        </div>
        {!isUser && (
          <button
            onClick={() => onSpeak(msg.id, msg.text)}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] text-slate-500 transition-colors hover:bg-white/5 hover:text-indigo-400"
          >
            {speakingId === msg.id
              ? <><VolumeX className="h-3 w-3" /> Stop</>
              : <><Volume2 className="h-3 w-3" /> Read aloud</>
            }
          </button>
        )}
      </div>
    </div>
  );
}

// ── Empty state with inline quick actions ─────────────────────────────────────

function EmptyState({
  onPick,
  isSending,
}: {
  onPick: (prompt: string, mode: 'general' | 'cv' | 'interview' | 'salary') => void;
  isSending: boolean;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 px-4 py-12">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-xl shadow-indigo-500/30">
          <Sparkles className="h-7 w-7 text-white" />
        </div>
        <h2 className="text-xl font-bold text-white">AI Career Assistant</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-400">
          Ask anything career-related or pick a topic to get started.
        </p>
        <div className="mx-auto mt-3 flex w-fit items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          <span className="text-xs font-medium text-emerald-400">Assistant online · GPT-4o</span>
        </div>
      </div>

      <div className="grid w-full max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              type="button"
              onClick={() => !isSending && onPick(action.prompt, action.mode)}
              disabled={isSending}
              className={`group flex flex-col items-start gap-2 rounded-2xl border bg-white/[0.03] p-4 text-left transition disabled:opacity-45 ${action.ring}`}
            >
              <div className={`flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 transition group-hover:bg-white/10 ${action.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">{action.label}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-slate-500">{action.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-slate-600">
        For grounded answers, upload your CV in{' '}
        <Link to="/documents" className="text-slate-400 underline-offset-2 hover:text-indigo-300 hover:underline">
          Document Lab
        </Link>
        .
      </p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type AssistantPrefillState = {
  prefill?: { text: string; mode?: 'general' | 'cv' | 'interview' | 'salary'; autoSend?: boolean };
};

export default function AssistantPage() {
  const { isSignedIn } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const prefillConsumedRef = useRef(false);

  const [input, setInput] = useState('');
  const [replyMode, setReplyMode] = useState<'general' | 'cv' | 'interview' | 'salary'>('general');
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const {
    messages,
    status,
    error,
    loadHistory,
    sendMessage,
    resetError,
    clearMessages,
  } = useCareerAssistantStore();

  const isSending = status === 'sending';
  const isLoading = status === 'syncing';

  useEffect(() => {
    if (isSignedIn) void loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn]);

  useEffect(() => {
    if (!isSignedIn) return;
    if (prefillConsumedRef.current) return;
    const state = (location.state as AssistantPrefillState | null) ?? null;
    const prefill = state?.prefill;
    if (!prefill?.text) return;
    prefillConsumedRef.current = true;
    const mode = prefill.mode ?? 'general';
    setReplyMode(mode);
    if (prefill.autoSend === false) {
      setInput(prefill.text);
    } else {
      void sendMessage(prefill.text, mode);
    }
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
    const maxHeight = MAX_TEXTAREA_ROWS * LINE_HEIGHT_PX + 20;
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [input]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setIsTranscribing(true);
        const transcript = await transcribeAudio(blob);
        setIsTranscribing(false);
        if (transcript.trim()) {
          setInput((prev) => prev ? `${prev} ${transcript.trim()}` : transcript.trim());
          textareaRef.current?.focus();
        }
      };
      recorderRef.current = recorder;
      recorder.start();
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
    const text = input;
    setInput('');
    await sendMessage(text, replyMode);
  };

  const handleQuickStart = async (prompt: string, mode: 'general' | 'cv' | 'interview' | 'salary') => {
    setReplyMode(mode);
    await sendMessage(prompt, mode);
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
    <div className="mx-auto flex h-[calc(100dvh-6rem)] min-h-[640px] max-w-4xl flex-col gap-0 overflow-hidden">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="shrink-0 rounded-t-3xl border border-b-0 border-white/10 bg-white/[0.04] px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight text-white">AI Career Assistant</h1>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                <span className="text-xs text-slate-400">GPT-4o · online</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => clearMessages?.()}
              title="New conversation"
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:bg-white/10 hover:text-white"
            >
              <MessageSquarePlus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New chat</span>
            </button>
            <button
              onClick={() => void loadHistory()}
              disabled={isLoading}
              title="Refresh"
              className="flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Error banner ────────────────────────────────────────────────────── */}
      {error && (
        <div className="shrink-0 border-x border-white/10 bg-white/[0.02] px-4 pt-3">
          <div className="flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
            <span>{error}</span>
            <button onClick={resetError} className="ml-3 rounded p-0.5 hover:bg-red-500/20">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Chat area ───────────────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto border-x border-white/10 bg-white/[0.02]">
        {isLoading ? (
          <div className="flex h-full items-center justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-indigo-400" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <EmptyState onPick={(p, m) => void handleQuickStart(p, m)} isSending={isSending} />
        ) : (
          <div className="space-y-5 p-5">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                speakingId={speakingMsgId}
                onSpeak={(id, text) => void handleSpeak(id, text)}
              />
            ))}
            {isSending && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* ── Input bar ───────────────────────────────────────────────────────── */}
      <div className="shrink-0 rounded-b-3xl border border-t-0 border-white/10 bg-slate-950/60 px-4 py-3 backdrop-blur-sm">
        {/* Mode pills */}
        <div className="mb-3 flex flex-wrap gap-1.5">
          {(
            [
              { id: 'general' as const, label: 'General' },
              { id: 'cv' as const, label: 'CV' },
              { id: 'interview' as const, label: 'Interview' },
              { id: 'salary' as const, label: 'Salary' },
            ]
          ).map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setReplyMode(m.id)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                replyMode === m.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Textarea + mic + send */}
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            rows={1}
            placeholder={
              isTranscribing ? 'Transcribing…' :
              isRecording    ? 'Recording… click mic to stop' :
                               'Ask anything career-related…'
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSending || isTranscribing}
            className="min-h-[44px] flex-1 resize-none rounded-xl border border-white/10 bg-slate-950/70 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-indigo-400/50 disabled:opacity-50"
            style={{ lineHeight: `${LINE_HEIGHT_PX}px`, overflowY: 'hidden' }}
          />
          <button
            onClick={toggleRecording}
            disabled={isSending || isTranscribing}
            title={isRecording ? 'Stop recording' : 'Voice input'}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition disabled:opacity-40 ${
              isRecording
                ? 'animate-pulse border-rose-400/40 bg-rose-500/15 text-rose-200'
                : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
          <button
            onClick={() => void handleSend()}
            disabled={isSending || !input.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Hint ────────────────────────────────────────────────────────────── */}
      <p className="shrink-0 pt-2 text-center text-[11px] text-slate-600">
        Enter to send · Shift+Enter for new line · Mic for voice
      </p>
    </div>
  );
}
