import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Send, Bot, User, RefreshCw, X, Volume2, VolumeX,
  MessageSquarePlus, Mic, MicOff, Sparkles,
  FileText, TrendingUp, Briefcase, DollarSign, ChevronRight, Route, Link2,
  AlertTriangle, ShieldAlert,
} from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCareerAssistantStore } from '@/stores/careerAssistantStore';
import type { AssistantResponseMeta } from '../../../../shared/assistant';
import { SupportingMaterialsDisclaimer } from '@/components/SupportingMaterialsDisclaimer';

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

function EmptyState() {
  return (
    <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-4 px-4 py-8">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-xl shadow-indigo-500/30">
          <Sparkles className="h-7 w-7 text-white" />
        </div>
        <h2 className="text-lg font-bold text-white">Start This Session</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
          Pick a topic above (no scrolling) or type below. For grounded answers across sessions, upload a CV or career PDF in{' '}
          <Link to="/documents" className="font-medium text-indigo-300 underline-offset-2 hover:underline">
            Document Lab
          </Link>
          — that is the durable context this product is built around, not a long scrollback list.
        </p>
        <div className="mx-auto mt-4 flex w-fit items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-medium text-emerald-400">Assistant online</span>
        </div>
      </div>
    </div>
  );
}

/** Fixed topic row — stays outside the message scroll region. */
function TopicPickerBar({
  onPick,
  isSending,
}: {
  onPick: (prompt: string, mode: 'general' | 'cv' | 'interview' | 'salary') => void;
  isSending: boolean;
}) {
  return (
    <div className="shrink-0 rounded-2xl border border-white/10 bg-gradient-to-r from-white/[0.04] to-indigo-500/[0.06] p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Topics</p>
        <span className="hidden text-[10px] text-slate-600 sm:inline">Tap once — no menu scroll</span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              type="button"
              onClick={() => !isSending && onPick(action.prompt, action.mode)}
              disabled={isSending}
              className={`flex min-h-[72px] flex-col items-start gap-1.5 rounded-xl border px-3 py-2.5 text-left transition hover:brightness-110 disabled:opacity-45 ${action.bg}`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${action.color}`} />
              <span className="text-xs font-semibold leading-tight text-white">{action.label}</span>
            </button>
          );
        })}
      </div>
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
      {meta?.aiProductMeta ? (
        <div className="rounded-xl border border-sky-500/25 bg-sky-500/10 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-300/90">AI usage (product)</p>
          <p className="mt-1 text-sm text-white">{meta.aiProductMeta.interactionModeLabel}</p>
          <p className="mt-1 text-xs text-slate-300">
            Typical credits this turn: {meta.aiProductMeta.estimatedCredits.min}–{meta.aiProductMeta.estimatedCredits.max}
            <span className="text-slate-500"> · cap {meta.aiProductMeta.maxApprovedCredits}</span>
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] text-slate-400">
            {meta.aiProductMeta.usesPremiumTier ? (
              <span className="rounded border border-amber-400/30 bg-amber-500/15 px-1.5 py-0.5 text-amber-100">Premium depth</span>
            ) : (
              <span className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5">Standard model tier</span>
            )}
            {meta.aiProductMeta.usesRealtimeVoice ? (
              <span className="rounded border border-violet-400/30 bg-violet-500/15 px-1.5 py-0.5 text-violet-100">Voice / realtime</span>
            ) : null}
            {meta.aiProductMeta.legalSourceRestricted ? (
              <span className="rounded border border-emerald-400/30 bg-emerald-500/15 px-1.5 py-0.5 text-emerald-100">Legal sources locked</span>
            ) : null}
          </div>
        </div>
      ) : null}
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
        {meta?.safetyNotes?.length ? (
          <ul className="mt-2 space-y-2">
            {meta.safetyNotes.map((note) => (
              <li
                key={note.text}
                className={`rounded-lg border px-2.5 py-1.5 text-xs leading-snug ${
                  note.level === 'block'
                    ? 'border-rose-500/35 bg-rose-500/15 text-rose-100'
                    : note.level === 'warning'
                      ? 'border-amber-500/35 bg-amber-500/10 text-amber-100'
                      : 'border-white/10 bg-white/[0.04] text-slate-300'
                }`}
              >
                <span className="font-semibold text-white/90">
                  {note.level === 'block' ? 'Block: ' : note.level === 'warning' ? 'Warning: ' : 'Info: '}
                </span>
                {note.text}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-0.5 text-sm text-slate-300">General Career Guidance Only.</p>
        )}
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
    { label: 'Open review queue', path: '/review', prompt: 'What should I follow up and when?', mode: 'general' as const },
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

/** FU-1: distinct copy/UX for sensitive-case tiers from `AssistantResponseMeta.safetyNotes` (warning vs block). */
function SensitiveCaseLayer({
  meta,
  onNewChat,
  onOpenCasePractice,
}: {
  meta: AssistantResponseMeta | null;
  onNewChat: () => void;
  onOpenCasePractice: () => void;
}) {
  const notes = meta?.safetyNotes ?? [];
  const blockNotes = notes.filter((n) => n.level === 'block');
  const warningNotes = notes.filter((n) => n.level === 'warning');
  const hasBlock = blockNotes.length > 0;
  const hasWarning = warningNotes.length > 0;

  if (!hasBlock && !hasWarning) return null;

  if (hasBlock) {
    return (
      <div
        role="alert"
        className="rounded-2xl border border-rose-500/40 bg-rose-950/50 px-4 py-3 text-sm text-rose-100 shadow-lg shadow-rose-900/20"
      >
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-300" aria-hidden />
          <div className="min-w-0 flex-1 space-y-2">
            <p className="font-semibold text-white">We Cannot Continue This Thread Here</p>
            <ul className="list-inside list-disc space-y-1 text-xs text-rose-100/95">
              {blockNotes.map((n) => (
                <li key={n.text}>{n.text}</li>
              ))}
            </ul>
            <p className="text-xs text-rose-200/80">
              Start a new chat for general career topics, or use Case Practice for structured workplace rehearsal (not legal advice).
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={onNewChat}
                className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20"
              >
                New Chat
              </button>
              <button
                type="button"
                onClick={onOpenCasePractice}
                className="rounded-lg border border-rose-400/40 bg-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-50 transition hover:bg-rose-500/30"
              >
                Open Case Practice
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      role="status"
      className="rounded-2xl border border-amber-500/35 bg-amber-950/40 px-4 py-3 text-sm text-amber-50 shadow-md shadow-amber-900/10"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" aria-hidden />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="font-semibold text-white">Sensitive Topic Notice</p>
          <ul className="list-inside list-disc space-y-1 text-xs text-amber-100/90">
            {warningNotes.map((n) => (
              <li key={n.text}>{n.text}</li>
            ))}
          </ul>
          <p className="text-xs text-amber-200/85">
            You can keep chatting here for preparation and wording. For formal processes or urgent risk, use qualified support or the right module.
          </p>
        </div>
      </div>
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
    historyLoadFailed,
    loadHistory,
    sendMessage,
    resetError,
    dismissHistoryWarning,
    clearMessages,
  } = useCareerAssistantStore();

  const isSending = status === 'sending';
  const isLoading = status === 'syncing';

  useEffect(() => {
    if (isSignedIn) void loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn]);

  // Accept a prefilled prompt from sibling pages (e.g. Legal Hub topic search).
  // Consumed once per navigation to avoid replaying on re-renders.
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

  const handleRouteAction = (path: string, prompt: string, mode: 'general' | 'cv' | 'interview' | 'salary') => {
    void sendMessage(prompt, mode);
    void navigate(path);
  };
  const latestAssistantMeta =
    [...messages].reverse().find((msg) => msg.role === 'assistant' && msg.meta)?.meta ?? null;

  const hasSafetyBlock =
    latestAssistantMeta?.safetyNotes?.some((n) => n.level === 'block') ?? false;

  return (
    <div className="flex min-h-0 flex-col gap-4 max-h-[calc(100dvh-10rem)]">

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

        {historyLoadFailed && (
          <div
            role="status"
            className="flex items-start justify-between gap-3 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100"
          >
            <p className="min-w-0 flex-1 leading-snug">
              <span className="font-semibold text-white">Past messages could not be loaded.</span>{' '}
              You can still use the assistant in this browser session. For durable, reviewable context across visits, upload a{' '}
              <strong className="text-white">CV or career PDF</strong> in{' '}
              <Link to="/documents" className="font-medium text-amber-200 underline-offset-2 hover:underline">
                Document Lab
              </Link>
              — that is how production grounding is intended to work, not an endless chat archive.
            </p>
            <button
              type="button"
              onClick={dismissHistoryWarning}
              className="shrink-0 rounded-lg p-1 text-amber-200/80 hover:bg-amber-500/20 hover:text-white"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <TopicPickerBar onPick={(prompt, mode) => void handleQuickStart(prompt, mode)} isSending={isSending} />

        <SensitiveCaseLayer
          meta={latestAssistantMeta}
          onNewChat={() => clearMessages?.()}
          onOpenCasePractice={() => void navigate('/case-practice')}
        />

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
                <EmptyState />
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
          </div>

          {/* ── Context + actions sidebar ────────────────────────────── */}
          <div className="hidden min-h-0 flex-col gap-4 overflow-y-auto lg:flex">
            <ContextSidebar replyMode={replyMode} messageCount={messages.length} meta={latestAssistantMeta} />
            <ActionRail onRoute={handleRouteAction} meta={latestAssistantMeta} />
            <RoutingBlocks meta={latestAssistantMeta} onRoute={handleRouteAction} />
          </div>
        </div>

        <div className="shrink-0 lg:hidden">
          <RoutingBlocks meta={latestAssistantMeta} onRoute={handleRouteAction} />
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
            disabled={isSending || isTranscribing || hasSafetyBlock}
            className="flex-1 resize-none bg-transparent text-sm text-white placeholder:text-slate-500 outline-none disabled:opacity-50"
            style={{ lineHeight: `${LINE_HEIGHT_PX}px`, overflowY: 'hidden' }}
          />

          <div className="flex shrink-0 items-center gap-1.5">
            {/* Mic */}
            <button
              onClick={toggleRecording}
              disabled={isSending || isTranscribing || hasSafetyBlock}
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
              disabled={isSending || !input.trim() || hasSafetyBlock}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-500 disabled:opacity-40 disabled:shadow-none"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          </div>
        </div>

        <SupportingMaterialsDisclaimer compact collapsible className="shrink-0" />

        <p className="text-center text-[11px] text-slate-600">
          Mode applies to typed messages · Enter to send · Shift+Enter for new line · Mic for voice
          {hasSafetyBlock ? ' · Sending is paused until you start a new chat' : ''}
        </p>
    </div>
  );
}
