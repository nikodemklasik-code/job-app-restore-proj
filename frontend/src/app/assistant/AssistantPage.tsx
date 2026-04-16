import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Send, Bot, User, RefreshCw, X, Volume2, VolumeX,
  MessageSquarePlus, Mic, MicOff, Sparkles,
  FileText, TrendingUp, Briefcase, DollarSign, ChevronRight, Route, Link2,
} from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useCareerAssistantStore } from '@/stores/careerAssistantStore';
import type { AssistantResponseMeta } from '../../../../shared/assistant';

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
    prompt: 'Review my CV for a Senior Frontend role',
    mode: 'cv' as const,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10 border-indigo-500/20',
  },
  {
    icon: DollarSign,
    label: 'Salary Negotiation',
    prompt: 'How should I negotiate my salary effectively?',
    mode: 'salary' as const,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
  },
  {
    icon: Briefcase,
    label: 'Interview Prep',
    prompt: 'Prepare me for a behavioural interview',
    mode: 'interview' as const,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
  },
  {
    icon: TrendingUp,
    label: 'Job Strategy',
    prompt: 'What are the best job search strategies right now?',
    mode: 'general' as const,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10 border-violet-500/20',
  },
];

const MAX_TEXTAREA_ROWS = 5;
const LINE_HEIGHT_PX = 24;

// ── Typing indicator ──────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3" style={{ opacity: 1 }}>
      {/* Avatar */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20">
        <Sparkles className="h-4 w-4 text-white" />
      </div>
      <div className="rounded-2xl rounded-bl-sm border border-white/8 bg-white/5 px-4 py-3">
        <div className="flex gap-1.5 items-center h-4">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce"
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
    <div
      className={`flex items-end gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
      style={{ opacity: 1 }}
    >
      {/* Avatar */}
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

      {/* Bubble + actions */}
      <div className={`flex max-w-[78%] flex-col gap-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'rounded-br-sm bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
            : 'rounded-bl-sm border border-white/8 bg-white/5 text-slate-200'
        }`}>
          {msg.text}
        </div>

        {/* TTS for AI messages */}
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

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ onAction, isSending }: {
  onAction: (prompt: string, mode: 'general' | 'cv' | 'interview' | 'salary') => void;
  isSending: boolean;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 px-4 py-8">
      {/* Hero */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-xl shadow-indigo-500/30">
          <Sparkles className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-xl font-bold text-white">Career Assistant</h2>
        <p className="mt-1.5 text-sm text-slate-400">
          Chat uses GPT-4o with modes: general, CV, interview, salary — same as the backend assistant router.
        </p>
        <div className="mx-auto mt-3 flex w-fit items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-medium text-emerald-400">Online</span>
        </div>
      </div>

      {/* Quick actions */}
      <div className="w-full max-w-lg">
        <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
          Quick start
        </p>
        <div className="grid grid-cols-2 gap-3">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={() => !isSending && onAction(action.prompt, action.mode)}
                disabled={isSending}
                className={`group flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-all hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 ${action.bg}`}
              >
                <div className={`rounded-xl p-2 ${action.bg}`}>
                  <Icon className={`h-4 w-4 ${action.color}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{action.label}</p>
                  <p className="mt-0.5 text-xs text-slate-500 leading-snug line-clamp-2">
                    {action.prompt}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-slate-600 text-center">
        Follow-up messages keep full conversation context
      </p>
    </div>
  );
}

function ContextSidebar({
  replyMode,
  messageCount,
  meta,
}: {
  replyMode: 'general' | 'cv' | 'interview' | 'salary';
  messageCount: number;
  meta: AssistantResponseMeta | null;
}) {
  const modeLabel =
    replyMode === 'cv' ? 'CV Support' :
    replyMode === 'interview' ? 'Interview Prep' :
    replyMode === 'salary' ? 'Salary & Negotiation' :
    'General Guidance';

  return (
    <aside className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Current Context</p>
        <p className="mt-1 text-sm font-medium text-white">{modeLabel}</p>
        <p className="mt-1 text-xs text-slate-400">Using profile and recent conversation context.</p>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
        <p className="text-xs text-slate-500">Conversation Depth</p>
        <p className="mt-0.5 text-sm font-semibold text-white">{messageCount} turns</p>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
        <p className="text-xs text-slate-500">Detected Intent</p>
        <p className="mt-0.5 text-sm text-slate-300">
          {meta?.detectedIntent ? meta.detectedIntent.replaceAll('_', ' ') : 'Guidance + Next Best Step'}
        </p>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
        <p className="text-xs text-slate-500">Linked Modules</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {(meta?.routeSuggestions?.map((route) => route.label) ?? ['Coach', 'Interview', 'Negotiation', 'Job Radar']).map((m) => (
            <span key={m} className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-slate-300">
              {m}
            </span>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
        <p className="text-xs text-slate-500">Safety Layer</p>
        <p className="mt-0.5 text-sm text-slate-300">{meta?.safetyNotes?.[0]?.text ?? 'General Career Guidance Only.'}</p>
      </div>
      {meta?.complianceFlags?.length ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
          <p className="text-xs text-amber-200">Compliance Flags</p>
          <p className="mt-0.5 text-xs text-amber-100">{meta.complianceFlags.join(' • ')}</p>
        </div>
      ) : null}
      {meta?.nextBestStep ? (
        <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-3">
          <p className="text-xs text-indigo-300">Next Best Step</p>
          <p className="mt-0.5 text-sm font-semibold text-white">{meta.nextBestStep}</p>
        </div>
      ) : null}
    </aside>
  );
}

function ActionRail({
  onRoute,
  meta,
}: {
  onRoute: (path: string, prompt: string, mode: 'general' | 'cv' | 'interview' | 'salary') => void;
  meta: AssistantResponseMeta | null;
}) {
  const routeForAction = (label: string): string => {
    const normalized = label.toLowerCase();
    if (normalized.includes('interview')) return '/interview';
    if (normalized.includes('negotiation') || normalized.includes('salary')) return '/negotiation';
    if (normalized.includes('style')) return '/style-studio';
    if (normalized.includes('profile')) return '/profile';
    if (normalized.includes('case')) return '/case-practice';
    if (normalized.includes('radar')) return '/job-radar';
    if (normalized.includes('application')) return '/applications';
    if (normalized.includes('coach')) return '/coach';
    return '/assistant';
  };
  const fallbackActions = [
    { label: 'Open Coach', path: '/coach', prompt: 'I need deeper confidence and narrative support.', mode: 'general' as const },
    { label: 'Open Interview', path: '/interview', prompt: 'Move me to mock interview practice.', mode: 'interview' as const },
    { label: 'Open Negotiation', path: '/negotiation', prompt: 'Help me prepare compensation and boundary language.', mode: 'salary' as const },
    { label: 'Open Job Radar', path: '/job-radar', prompt: 'Review this employer risk and fit signals.', mode: 'general' as const },
    { label: 'Open Applications Review', path: '/review', prompt: 'What should I follow up and when?', mode: 'general' as const },
    { label: 'Open Case Practice', path: '/case-practice', prompt: 'I want pressure-based case rehearsal.', mode: 'general' as const },
  ];
  const actions = meta?.suggestedActions?.length
    ? meta.suggestedActions.map((action) => ({
      label: action.label,
      path: action.route ?? routeForAction(action.label),
      prompt: action.prompt,
      mode: action.mode ?? ('general' as const),
    }))
    : fallbackActions;

  return (
    <section className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center gap-2">
        <Route className="h-4 w-4 text-indigo-400" />
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Suggested Actions</p>
      </div>
      {actions.slice(0, 3).map((action) => (
        <button
          key={action.label}
          type="button"
          onClick={() => onRoute(action.path, action.prompt, action.mode)}
          className="group flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-sm text-slate-200 transition hover:border-indigo-500/40 hover:bg-white/10"
        >
          <span>{action.label}</span>
          <ChevronRight className="h-4 w-4 text-slate-500 transition group-hover:text-indigo-400" />
        </button>
      ))}
      <details className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
        <summary className="cursor-pointer text-xs font-semibold text-slate-400">More Actions</summary>
        <div className="mt-2 space-y-2">
          {actions.slice(3).map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => onRoute(action.path, action.prompt, action.mode)}
              className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs text-slate-300 transition hover:bg-white/10"
            >
              <span>{action.label}</span>
              <Link2 className="h-3.5 w-3.5 text-slate-500" />
            </button>
          ))}
        </div>
      </details>
    </section>
  );
}

function RoutingBlocks({
  meta,
  onRoute,
}: {
  meta: AssistantResponseMeta | null;
  onRoute: (path: string, prompt: string, mode: 'general' | 'cv' | 'interview' | 'salary') => void;
}) {
  if (!meta?.routeSuggestions?.length) return null;

  return (
    <section className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300">Routing Suggestions</p>
      <div className="mt-3 space-y-2">
        {meta.routeSuggestions.map((route) => (
          <button
            key={`${route.route}-${route.label}`}
            type="button"
            onClick={() => onRoute(route.route, `Open ${route.label} for deeper workflow support.`, 'general')}
            className="flex w-full items-center justify-between rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-left transition hover:bg-white/10"
          >
            <div>
              <p className="text-sm font-semibold text-white">{route.label}</p>
              <p className="text-xs text-slate-400">{route.reason}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-indigo-300" />
          </button>
        ))}
      </div>
    </section>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AssistantPage() {
  const { isSignedIn } = useUser();
  const navigate = useNavigate();

  const [input, setInput] = useState('');
  const [replyMode, setReplyMode] = useState<'general' | 'cv' | 'interview' | 'salary'>('general');
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const { messages, status, error, loadHistory, sendMessage, resetError, clearMessages } =
    useCareerAssistantStore();

  const isSending = status === 'sending';
  const isLoading = status === 'syncing';

  useEffect(() => {
    if (isSignedIn) void loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn]);

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

  const handleRouteAction = (path: string, prompt: string, mode: 'general' | 'cv' | 'interview' | 'salary') => {
    void sendMessage(prompt, mode);
    void navigate(path);
  };
  const latestAssistantMeta =
    [...messages].reverse().find((msg) => msg.role === 'assistant' && msg.meta)?.meta ?? null;

  return (
    <div className="flex h-[calc(100vh-10rem)] flex-col gap-4">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">AI Career Assistant</h1>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-slate-400">GPT-4o · online</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => clearMessages?.()}
              title="New conversation"
              className="flex items-center gap-1.5 rounded-xl border border-white/8 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <MessageSquarePlus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New chat</span>
            </button>
            <button
              onClick={() => void loadHistory()}
              disabled={isLoading}
              title="Refresh"
              className="flex items-center justify-center rounded-xl border border-white/8 bg-white/5 p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-40"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* ── Error ───────────────────────────────────────────────────── */}
        {error && (
          <div className="flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
            <span>{error}</span>
            <button onClick={resetError} className="ml-3 rounded p-0.5 hover:bg-red-500/20">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* ── Conversation Panel ───────────────────────────────────── */}
          <div className="flex min-h-0 flex-col gap-4">
            <div className="flex-1 overflow-y-auto rounded-2xl border border-white/8 bg-white/[0.02]">
              {isLoading ? (
                <div className="flex h-full items-center justify-center gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <EmptyState
                  onAction={(prompt, mode) => void handleQuickStart(prompt, mode)}
                  isSending={isSending}
                />
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
                  <RoutingBlocks meta={latestAssistantMeta} onRoute={handleRouteAction} />
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </div>

          {/* ── Context + actions sidebar ────────────────────────────── */}
          <div className="hidden min-h-0 flex-col gap-4 overflow-y-auto lg:flex">
            <ContextSidebar replyMode={replyMode} messageCount={messages.length} meta={latestAssistantMeta} />
            <ActionRail onRoute={handleRouteAction} meta={latestAssistantMeta} />
          </div>
        </div>

        {/* ── Input bar ───────────────────────────────────────────────── */}
        <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
          <div className="flex flex-wrap gap-1.5">
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
          <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            rows={1}
            placeholder={
              isTranscribing ? 'Transcribing…' :
              isRecording    ? 'Recording… click mic to stop' :
                               'Ask anything career-related… (Shift+Enter for new line)'
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSending || isTranscribing}
            className="flex-1 resize-none bg-transparent text-sm text-white placeholder:text-slate-500 outline-none disabled:opacity-50"
            style={{ lineHeight: `${LINE_HEIGHT_PX}px`, overflowY: 'hidden' }}
          />

          <div className="flex shrink-0 items-center gap-1.5">
            {/* Mic */}
            <button
              onClick={toggleRecording}
              disabled={isSending || isTranscribing}
              title={isRecording ? 'Stop recording' : 'Voice input'}
              className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all disabled:opacity-40 ${
                isRecording
                  ? 'bg-red-500/20 text-red-400 ring-2 ring-red-500/30 animate-pulse'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>

            {/* Send */}
            <button
              onClick={() => void handleSend()}
              disabled={isSending || !input.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-500 disabled:opacity-40 disabled:shadow-none"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-600">
          Mode applies to typed messages · Enter to send · Shift+Enter for new line · Mic for voice
        </p>
    </div>
  );
}
