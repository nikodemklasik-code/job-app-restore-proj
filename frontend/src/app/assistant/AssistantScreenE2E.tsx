import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Bot,
  Briefcase,
  ChevronRight,
  FileText,
  Loader2,
  Mic,
  MicOff,
  RefreshCw,
  Route,
  Send,
  Sparkles,
  User,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { SupportingMaterialsDisclaimer } from '@/components/SupportingMaterialsDisclaimer';
import { fetchBlob, postForm } from '@/lib/apiClient';
import { useCareerAssistantStore } from '@/stores/careerAssistantStore';
import type { AssistantHistoryMessage, AssistantMode, AssistantResponseMeta } from '../../../../shared/assistant';

const MAX_TEXTAREA_ROWS = 5;
const LINE_HEIGHT_PX = 24;

type AssistantPrefillState = {
  prefill?: { text: string; mode?: AssistantMode; autoSend?: boolean };
};

type TopicCard = {
  label: string;
  description: string;
  prompt: string;
  mode: AssistantMode;
  icon: React.ElementType;
};

const TOPICS: TopicCard[] = [
  {
    label: 'CV And Documents',
    description: 'Review, rewrite, or route to Document Lab.',
    prompt: 'Review my CV and tell me what to improve next.',
    mode: 'cv',
    icon: FileText,
  },
  {
    label: 'Interview Prep',
    description: 'Prepare answers, pressure, and next drills.',
    prompt: 'Prepare me for a behavioural interview and give me the next practice step.',
    mode: 'interview',
    icon: Bot,
  },
  {
    label: 'Applications',
    description: 'Follow-up, status, and decision support.',
    prompt: 'Help me decide what to do next with my applications.',
    mode: 'general',
    icon: Briefcase,
  },
  {
    label: 'Negotiation',
    description: 'Salary, boundary language, and offer framing.',
    prompt: 'Help me prepare salary and boundary language for a negotiation.',
    mode: 'salary',
    icon: Route,
  },
];

const FALLBACK_ACTIONS = [
  { label: 'Open Coach', path: '/coach', prompt: 'I need deeper coaching and a structured action plan.', mode: 'general' as AssistantMode },
  { label: 'Open Interview', path: '/interview', prompt: 'Move me to mock interview practice.', mode: 'interview' as AssistantMode },
  { label: 'Open Applications Review', path: '/applications-review', prompt: 'What should I follow up and when?', mode: 'general' as AssistantMode },
  { label: 'Open Negotiation', path: '/negotiation', prompt: 'Help me prepare compensation and boundary language.', mode: 'salary' as AssistantMode },
];

async function transcribeAudio(blob: Blob): Promise<string> {
  try {
    const form = new FormData();
    form.append('audio', blob, 'audio.webm');
    const data = await postForm<{ transcript?: string }>('/api/interview/transcribe', form);
    return data.transcript ?? '';
  } catch {
    return '';
  }
}

async function speakText(text: string): Promise<void> {
  try {
    const blob = await fetchBlob('/api/interview/tts', { text: text.slice(0, 500) });
    const url = URL.createObjectURL(blob);
    await new Promise<void>((resolve) => {
      const audio = new Audio(url);
      audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
      audio.onerror = () => { URL.revokeObjectURL(url); resolve(); };
      void audio.play().catch(() => resolve());
    });
  } catch {
    // Voice playback is optional. Text flow remains the source of truth.
  }
}

function normalizeRoute(path: string): string {
  if (path === '/review') return '/applications-review';
  if (path === '/case-practice') return '/case-study';
  if (path === '/style-studio') return '/documents/style-studio';
  return path;
}

function routeForAction(label: string): string {
  const normalized = label.toLowerCase();
  if (normalized.includes('interview')) return '/interview';
  if (normalized.includes('negotiation') || normalized.includes('salary')) return '/negotiation';
  if (normalized.includes('style')) return '/documents/style-studio';
  if (normalized.includes('profile')) return '/profile';
  if (normalized.includes('case')) return '/case-study';
  if (normalized.includes('radar')) return '/job-radar';
  if (normalized.includes('application') || normalized.includes('review')) return '/applications-review';
  if (normalized.includes('coach')) return '/coach';
  if (normalized.includes('document') || normalized.includes('cv')) return '/documents';
  return '/assistant';
}

function TopicPicker({ onPick, disabled }: { onPick: (topic: TopicCard) => void; disabled: boolean }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Start Here</p>
          <h2 className="text-sm font-semibold text-white">Choose one path, then continue in chat.</h2>
        </div>
        <span className="hidden rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300 sm:inline-flex">
          End-to-end flow
        </span>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        {TOPICS.map((topic) => {
          const Icon = topic.icon;
          return (
            <button
              key={topic.label}
              type="button"
              disabled={disabled}
              onClick={() => onPick(topic)}
              className="group min-h-[104px] rounded-2xl border border-white/10 bg-slate-950/35 p-3 text-left transition hover:border-indigo-400/50 hover:bg-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-300">
                <Icon className="h-4 w-4" />
              </div>
              <p className="text-sm font-semibold text-white">{topic.label}</p>
              <p className="mt-1 text-xs leading-snug text-slate-400">{topic.description}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function MessageBubble({
  message,
  speakingId,
  onSpeak,
}: {
  message: AssistantHistoryMessage;
  speakingId: string | null;
  onSpeak: (id: string, text: string) => void;
}) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isUser ? 'bg-indigo-600' : 'bg-gradient-to-br from-indigo-500 to-violet-600'}`}>
        {isUser ? <User className="h-4 w-4 text-white" /> : <Sparkles className="h-4 w-4 text-white" />}
      </div>
      <div className={`max-w-[78%] ${isUser ? 'items-end text-right' : 'items-start'} flex flex-col gap-1.5`}>
        <div className={`whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${isUser ? 'rounded-br-sm bg-indigo-600 text-white' : 'rounded-bl-sm border border-white/10 bg-white/[0.055] text-slate-200'}`}>
          {message.text}
        </div>
        {!isUser ? (
          <button
            type="button"
            onClick={() => onSpeak(message.id, message.text)}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] text-slate-500 transition hover:bg-white/5 hover:text-indigo-300"
          >
            {speakingId === message.id ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
            {speakingId === message.id ? 'Stop' : 'Read'}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600">
        <Sparkles className="h-4 w-4 text-white" />
      </div>
      <div className="rounded-2xl rounded-bl-sm border border-white/10 bg-white/[0.055] px-4 py-3">
        <div className="flex h-4 items-center gap-1.5">
          {[0, 1, 2].map((item) => (
            <span key={item} className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-300" style={{ animationDelay: `${item * 0.15}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyThread() {
  return (
    <div className="flex h-full min-h-[280px] items-center justify-center rounded-3xl border border-dashed border-white/10 bg-black/15 p-8 text-center">
      <div className="max-w-md">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-xl shadow-indigo-500/20">
          <Sparkles className="h-7 w-7 text-white" />
        </div>
        <h2 className="text-lg font-bold text-white">Ask, route, then continue in the right module.</h2>
        <p className="mt-2 text-sm text-slate-400">
          The assistant is the routing layer. For durable context, upload documents in{' '}
          <Link to="/documents" className="font-medium text-indigo-300 underline-offset-2 hover:underline">Document Lab</Link>.
        </p>
      </div>
    </div>
  );
}

function ContextPanel({ mode, meta, messageCount }: { mode: AssistantMode; meta: AssistantResponseMeta | null; messageCount: number }) {
  const modeLabel: Record<AssistantMode, string> = {
    general: 'General Guidance',
    cv: 'CV And Documents',
    interview: 'Interview Prep',
    salary: 'Salary And Negotiation',
  };
  const contextRefs = meta?.contextRefs ?? [];
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Context</p>
      <div className="mt-3 space-y-3">
        <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-3">
          <p className="text-xs text-slate-500">Current mode</p>
          <p className="mt-1 text-sm font-semibold text-white">{modeLabel[mode]}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-3">
          <p className="text-xs text-slate-500">Conversation turns</p>
          <p className="mt-1 text-sm font-semibold text-white">{messageCount}</p>
        </div>
        {meta?.nextBestStep ? (
          <div className="rounded-2xl border border-indigo-500/25 bg-indigo-500/10 p-3">
            <p className="text-xs text-indigo-300">Next Best Step</p>
            <p className="mt-1 text-sm font-semibold text-white">{meta.nextBestStep}</p>
          </div>
        ) : null}
        <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-3">
          <p className="text-xs text-slate-500">Grounding</p>
          {contextRefs.length > 0 ? (
            <ul className="mt-2 space-y-2">
              {contextRefs.slice(0, 4).map((ref) => (
                <li key={`${ref.type}-${ref.label}`} className="text-xs text-slate-300">
                  <span className="font-semibold text-white">{ref.label}:</span> {ref.value}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-slate-400">No extra context attached yet.</p>
          )}
        </div>
      </div>
    </section>
  );
}

function ActionPanel({ meta, onRoute }: { meta: AssistantResponseMeta | null; onRoute: (path: string, prompt: string, mode: AssistantMode) => void }) {
  const suggestions = meta?.suggestedActions?.length
    ? meta.suggestedActions.map((action) => ({
      label: action.cta ?? action.label,
      path: normalizeRoute(action.route ?? routeForAction(action.label)),
      prompt: action.prompt,
      mode: action.mode ?? 'general',
    }))
    : FALLBACK_ACTIONS;
  const routes = meta?.routeSuggestions ?? [];

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
      <div className="flex items-center gap-2">
        <Route className="h-4 w-4 text-indigo-300" />
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Next Actions</p>
      </div>
      <div className="mt-3 space-y-2">
        {suggestions.slice(0, 4).map((action) => (
          <button
            key={`${action.label}-${action.path}`}
            type="button"
            onClick={() => onRoute(action.path, action.prompt, action.mode)}
            className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/35 px-3 py-2.5 text-left text-sm text-slate-200 transition hover:border-indigo-400/50 hover:bg-indigo-500/10"
          >
            <span>{action.label}</span>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-500 group-hover:text-indigo-300" />
          </button>
        ))}
      </div>
      {routes.length > 0 ? (
        <div className="mt-4 border-t border-white/10 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Routing</p>
          <div className="mt-2 space-y-2">
            {routes.slice(0, 3).map((route) => (
              <button
                key={`${route.route}-${route.label}`}
                type="button"
                onClick={() => onRoute(normalizeRoute(route.route), `Open ${route.label} for deeper workflow support.`, 'general')}
                className="w-full rounded-2xl border border-indigo-500/20 bg-indigo-500/10 px-3 py-2 text-left transition hover:bg-indigo-500/15"
              >
                <p className="text-sm font-semibold text-white">{route.label}</p>
                <p className="mt-0.5 text-xs text-slate-400">{route.reason}</p>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function SafetyNotice({ meta, onNewChat, onOpenCasePractice }: { meta: AssistantResponseMeta | null; onNewChat: () => void; onOpenCasePractice: () => void }) {
  const notes = meta?.safetyNotes ?? [];
  const blocks = notes.filter((note) => note.level === 'block');
  const warnings = notes.filter((note) => note.level === 'warning');
  if (blocks.length === 0 && warnings.length === 0) return null;

  const blocking = blocks.length > 0;
  const visibleNotes = blocking ? blocks : warnings;
  return (
    <section className={`rounded-3xl border p-4 ${blocking ? 'border-rose-500/35 bg-rose-500/10' : 'border-amber-500/35 bg-amber-500/10'}`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className={`mt-0.5 h-5 w-5 shrink-0 ${blocking ? 'text-rose-300' : 'text-amber-300'}`} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-white">{blocking ? 'This Thread Is Blocked' : 'Sensitive Topic Notice'}</p>
          <ul className="mt-2 space-y-1 text-xs text-slate-200">
            {visibleNotes.map((note) => <li key={note.text}>• {note.text}</li>)}
          </ul>
          {blocking ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={onNewChat} className="rounded-xl border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20">New Chat</button>
              <button type="button" onClick={onOpenCasePractice} className="rounded-xl border border-rose-400/30 bg-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-50 hover:bg-rose-500/30">Open Case Practice</button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default function AssistantScreenE2E() {
  const { isSignedIn } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const prefillConsumedRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [input, setInput] = useState('');
  const [mode, setMode] = useState<AssistantMode>('general');
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const {
    messages,
    status,
    error,
    historyLoadFailed,
    loadHistory,
    sendMessage,
    resetError,
    dismissHistoryWarning,
    clearMessages,
  } = useCareerAssistantStore();

  const isSending = status === 'sending';
  const isSyncing = status === 'syncing';
  const latestMeta = useMemo(
    () => [...messages].reverse().find((message) => message.role === 'assistant' && message.meta)?.meta ?? null,
    [messages],
  );
  const hasSafetyBlock = latestMeta?.safetyNotes?.some((note) => note.level === 'block') ?? false;

  useEffect(() => {
    if (isSignedIn) void loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn]);

  useEffect(() => {
    if (!isSignedIn || prefillConsumedRef.current) return;
    const state = (location.state as AssistantPrefillState | null) ?? null;
    const prefill = state?.prefill;
    if (!prefill?.text) return;
    prefillConsumedRef.current = true;
    const prefillMode = prefill.mode ?? 'general';
    setMode(prefillMode);
    if (prefill.autoSend === false) setInput(prefill.text);
    else void sendMessage(prefill.text, prefillMode);
    navigate(location.pathname, { replace: true, state: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, location.state]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isSending]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const maxHeight = MAX_TEXTAREA_ROWS * LINE_HEIGHT_PX + 20;
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [input]);

  const send = async (text = input, selectedMode = mode) => {
    if (!text.trim() || isSending || hasSafetyBlock) return;
    setInput('');
    await sendMessage(text, selectedMode);
  };

  const pickTopic = (topic: TopicCard) => {
    setMode(topic.mode);
    void send(topic.prompt, topic.mode);
  };

  const speak = async (id: string, text: string) => {
    if (speakingId === id) {
      setSpeakingId(null);
      return;
    }
    setSpeakingId(id);
    await speakText(text);
    setSpeakingId(null);
  };

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => { if (event.data.size > 0) chunksRef.current.push(event.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        setIsTranscribing(true);
        const transcript = await transcribeAudio(new Blob(chunksRef.current, { type: 'audio/webm' }));
        setIsTranscribing(false);
        if (transcript.trim()) {
          setInput((prev) => (prev ? `${prev} ${transcript.trim()}` : transcript.trim()));
          textareaRef.current?.focus();
        }
      };
      recorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch {
      setIsRecording(false);
    }
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      recorderRef.current?.stop();
      setIsRecording(false);
      return;
    }
    void startRecording();
  };

  const routeAction = (path: string, prompt: string, selectedMode: AssistantMode) => {
    if (prompt) void sendMessage(prompt, selectedMode);
    navigate(normalizeRoute(path));
  };

  if (!isSignedIn) {
    return <div className="flex items-center justify-center py-24 text-sm text-slate-500">Sign in to use AI Assistant.</div>;
  }

  return (
    <div className="mx-auto flex h-[calc(100dvh-7rem)] max-w-7xl min-h-[720px] flex-col gap-4 overflow-hidden">
      <header className="flex shrink-0 items-center justify-between gap-3 rounded-3xl border border-white/10 bg-white/[0.035] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight text-white">AI Assistant</h1>
            <p className="text-xs text-slate-400">Routing layer across Coach, Interview, Applications, Documents, and Negotiation.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => clearMessages()}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          New Chat
        </button>
      </header>

      {historyLoadFailed ? (
        <div className="shrink-0 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          <div className="flex items-center justify-between gap-3">
            <span>History could not be loaded. You can still use this session.</span>
            <button type="button" onClick={dismissHistoryWarning} className="rounded-lg px-2 py-1 text-xs font-semibold hover:bg-white/10">Dismiss</button>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="shrink-0 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          <div className="flex items-center justify-between gap-3">
            <span>{error}</span>
            <button type="button" onClick={resetError} className="rounded-lg px-2 py-1 text-xs font-semibold hover:bg-white/10"><X className="h-4 w-4" /></button>
          </div>
        </div>
      ) : null}

      <TopicPicker onPick={pickTopic} disabled={isSending || hasSafetyBlock} />

      <main className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025]">
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-5">
            {isSyncing ? (
              <div className="flex flex-1 items-center justify-center text-slate-400"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading assistant context…</div>
            ) : messages.length === 0 ? (
              <EmptyThread />
            ) : (
              messages.map((message) => <MessageBubble key={message.id} message={message} speakingId={speakingId} onSpeak={speak} />)
            )}
            {isSending ? <TypingIndicator /> : null}
            <div ref={messagesEndRef} />
          </div>

          <div className="shrink-0 border-t border-white/10 bg-slate-950/45 p-4">
            <SafetyNotice
              meta={latestMeta}
              onNewChat={() => clearMessages()}
              onOpenCasePractice={() => navigate('/case-study')}
            />
            <div className="mt-3 flex items-end gap-2">
              <button
                type="button"
                onClick={toggleRecording}
                disabled={isSending || hasSafetyBlock}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition disabled:cursor-not-allowed disabled:opacity-50 ${isRecording ? 'border-rose-500/40 bg-rose-500/15 text-rose-200' : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'}`}
                title={isRecording ? 'Stop recording' : 'Voice input'}
              >
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    void send();
                  }
                }}
                disabled={isSending || hasSafetyBlock}
                rows={1}
                placeholder={hasSafetyBlock ? 'Start a new chat to continue with general career topics.' : isTranscribing ? 'Transcribing…' : 'Ask for help, then route to the right module…'}
                className="max-h-36 min-h-[44px] flex-1 resize-none rounded-xl border border-white/10 bg-slate-950/70 px-3 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-400/50 disabled:cursor-not-allowed disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => void send()}
                disabled={!input.trim() || isSending || hasSafetyBlock}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-45"
                title="Send"
              >
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
            <SupportingMaterialsDisclaimer compact collapsible className="mt-3" />
          </div>
        </section>

        <aside className="hidden min-h-0 space-y-4 overflow-y-auto lg:block">
          <ContextPanel mode={mode} meta={latestMeta} messageCount={messages.length} />
          <ActionPanel meta={latestMeta} onRoute={routeAction} />
        </aside>
      </main>
    </div>
  );
}
