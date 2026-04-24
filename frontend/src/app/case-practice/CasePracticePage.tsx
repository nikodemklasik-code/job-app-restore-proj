import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Headphones,
  History,
  Loader2,
  Lock,
  MessageSquareWarning,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Square,
  Users,
  Volume2,
} from 'lucide-react';
import { SupportingMaterialsDisclaimer } from '@/components/SupportingMaterialsDisclaimer';
import { postJson } from '@/lib/apiClient';

type ViewState = 'loading' | 'empty' | 'error' | 'populated';
type PracticeMode = 'solo' | 'joint-call' | 'private-session' | 'tomorrow';

interface GeneratedCasePack {
  briefing: string;
  openingResponse: string;
  pushbackResponse?: string;
  verdict: string;
  reflection: string;
}

interface CaseHistoryEntry {
  id: string;
  caseId: string;
  caseTitle: string;
  mode: PracticeMode;
  includePushback: boolean;
  createdAt: string;
  pack: GeneratedCasePack;
}

const CASE_HISTORY_STORAGE_KEY = 'mvh-case-practice-history-v1';

const CASES = [
  {
    id: 'work-conflict',
    title: 'Workplace Conflict De-Escalation',
    pressure: 'high',
    timeWindow: 'Today, 15:30',
    source: 'Case Inbox',
    summary:
      'A manager questions your project decisions in a team channel and requests immediate justification.',
    roleBrief:
      'You are a Senior Product Designer. Goal: stay factual, reduce escalation, protect credibility.',
    prep: [
      'State facts first, interpretation second.',
      'Use one boundary sentence without blame.',
      'Offer one concrete next step and timing.',
    ],
  },
  {
    id: 'fair-treatment',
    title: 'Fair Treatment Concern',
    pressure: 'medium',
    timeWindow: 'Tomorrow, 09:00',
    source: 'Case Inbox',
    summary:
      'You need to raise repeated process inconsistencies affecting your evaluation outcomes.',
    roleBrief:
      'You are an Operations Analyst. Goal: present evidence, request process clarity, avoid accusatory tone.',
    prep: [
      'Open with timeline and concrete events.',
      'Separate impact from intent assumptions.',
      'Close with a clear process request.',
    ],
  },
  {
    id: 'adjustment-request',
    title: 'Adjustment Request',
    pressure: 'medium',
    timeWindow: 'Today, 11:45',
    source: 'Priority Case',
    summary:
      'You need to request practical adjustments to improve performance consistency.',
    roleBrief:
      'You are a Customer Success Specialist. Goal: ask clearly, link request to measurable outcomes.',
    prep: [
      'Name requested adjustment in one sentence.',
      'Connect adjustment to team and delivery impact.',
      'Agree check-in date for review.',
    ],
  },
];

function readCaseHistory(): CaseHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CASE_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CaseHistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCaseHistory(entries: CaseHistoryEntry[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CASE_HISTORY_STORAGE_KEY, JSON.stringify(entries.slice(0, 8)));
}

function useWarmListenAlong() {
  const [speaking, setSpeaking] = useState(false);
  const prefersReducedMotion = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const synth = window.speechSynthesis;
    return () => {
      synth.cancel();
    };
  }, []);

  const pickVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    const prefer =
      voices.find((v) => /Samantha|Victoria|Karen|Martha|Fiona|Google UK English Female/i.test(v.name)) ??
      voices.find((v) => v.lang.startsWith('en') && /female/i.test(v.name)) ??
      voices.find((v) => v.lang.startsWith('en-GB')) ??
      voices.find((v) => v.lang.startsWith('en'));
    return prefer ?? null;
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (prefersReducedMotion || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      const synth = window.speechSynthesis;
      synth.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 0.9;
      utter.pitch = 1;
      const voice = pickVoice();
      if (voice) utter.voice = voice;
      utter.onend = () => setSpeaking(false);
      utter.onerror = () => setSpeaking(false);
      setSpeaking(true);
      synth.speak(utter);
    },
    [pickVoice, prefersReducedMotion],
  );

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
  }, []);

  const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window && !prefersReducedMotion;

  return { speak, stop, speaking, prefersReducedMotion, canSpeak };
}

export default function CasePracticePage() {
  const [state, setState] = useState<ViewState>('populated');
  const [mode, setMode] = useState<PracticeMode>('solo');
  const [selectedCaseId, setSelectedCaseId] = useState(CASES[0]?.id ?? '');
  const [showPushbackRound, setShowPushbackRound] = useState(false);
  const [generatedPack, setGeneratedPack] = useState<GeneratedCasePack | null>(null);
  const [activePanel, setActivePanel] = useState<'scenario' | 'verdict' | 'reflection'>('scenario');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [history, setHistory] = useState<CaseHistoryEntry[]>([]);
  const { speak, stop, speaking, prefersReducedMotion, canSpeak } = useWarmListenAlong();

  const selectedCase = useMemo(
    () => CASES.find((item) => item.id === selectedCaseId) ?? CASES[0],
    [selectedCaseId],
  );

  useEffect(() => {
    setHistory(readCaseHistory());
  }, []);

  const modeLabel =
    mode === 'joint-call'
      ? 'Join Joint Call'
      : mode === 'private-session'
        ? 'Open Private Session'
        : mode === 'tomorrow'
          ? 'Prepare For Tomorrow'
          : 'Play Solo';

  const introForVoice = useMemo(
    () =>
      'Case Practice is a calm rehearsal space for difficult workplace conversations. You read a scenario, prepare your lines, and practise responses under pressure. Nothing here is legal advice — it is practice for clarity and steadiness.',
    [],
  );

  const buildCaseNarration = useCallback(() => {
    if (!selectedCase) return '';
    const prepLines = selectedCase.prep.join(' ');
    return `${selectedCase.title}. ${selectedCase.summary} Your role: ${selectedCase.roleBrief} Preparation ideas: ${prepLines}`;
  }, [selectedCase]);

  const resetGeneratedState = useCallback(() => {
    setGeneratedPack(null);
    setGenerationError(null);
    setIsGenerating(false);
    setActivePanel('scenario');
  }, []);

  useEffect(() => {
    resetGeneratedState();
  }, [selectedCaseId, mode, showPushbackRound, resetGeneratedState]);

  const saveHistoryEntry = useCallback((pack: GeneratedCasePack) => {
    if (!selectedCase) return;
    const nextEntry: CaseHistoryEntry = {
      id: `${selectedCase.id}-${Date.now()}`,
      caseId: selectedCase.id,
      caseTitle: selectedCase.title,
      mode,
      includePushback: showPushbackRound,
      createdAt: new Date().toISOString(),
      pack,
    };
    const next = [nextEntry, ...history.filter((entry) => !(entry.caseId === nextEntry.caseId && entry.mode === nextEntry.mode && entry.includePushback === nextEntry.includePushback))].slice(0, 8);
    setHistory(next);
    writeCaseHistory(next);
  }, [history, mode, selectedCase, showPushbackRound]);

  const restoreHistoryEntry = useCallback((entry: CaseHistoryEntry) => {
    setSelectedCaseId(entry.caseId);
    setMode(entry.mode);
    setShowPushbackRound(entry.includePushback);
    setGeneratedPack(entry.pack);
    setActivePanel('scenario');
    setGenerationError(null);
    setState('populated');
  }, []);

  const generateCasePack = useCallback(async (panel: 'scenario' | 'verdict' | 'reflection') => {
    if (!selectedCase) return;
    setActivePanel(panel);
    if (generatedPack) return;

    setIsGenerating(true);
    setGenerationError(null);
    try {
      const response = await postJson<GeneratedCasePack>('/api/case-practice/generate', {
        scenario: {
          title: selectedCase.title,
          summary: selectedCase.summary,
          roleBrief: selectedCase.roleBrief,
          prep: selectedCase.prep,
          mode,
          includePushback: showPushbackRound,
        },
      });
      setGeneratedPack(response);
      saveHistoryEntry(response);
    } catch {
      setGenerationError('Could not generate case guidance right now. Try again in a moment.');
    } finally {
      setIsGenerating(false);
    }
  }, [generatedPack, mode, saveHistoryEntry, selectedCase, showPushbackRound]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="rounded-xl bg-indigo-500/15 p-2.5 shrink-0">
            <ShieldCheck className="h-6 w-6 text-indigo-300" />
          </div>
          <div className="min-w-0 space-y-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">Case Study</h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-300 md:text-base">
                A <span className="font-medium text-white">case-practice studio</span> for high-stakes work moments: you pick a
                case, absorb the brief, then rehearse how you would explain, defend, or de-escalate — without rushing into
                a real chat thread. Use the modes below when you want to simulate solo practice, a joint call mindset, a
                private run-through, or a slower &quot;prepare for tomorrow&quot; pass.
              </p>
            </div>
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-4 text-sm leading-relaxed text-amber-50/95">
              <p className="flex items-start gap-2 font-medium text-amber-100">
                <Headphones className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" aria-hidden />
                <span>
                  <span className="text-white">Listen along (optional):</span> your browser can read introductions,
                  case summaries, and prep bullets aloud in a steady English voice — helpful if you absorb information
                  better by ear, or want a calmer pace. Use the buttons in the panel below; you can stop playback anytime.
                  If your system hides extended motion, we keep listen controls off so the page stays comfortable.
                </span>
              </p>
            </div>
          </div>
        </div>
      </header>

      <SupportingMaterialsDisclaimer compact collapsible defaultExpanded={false} />

      <section
        className="rounded-2xl border border-violet-500/25 bg-violet-500/[0.06] p-5 md:p-6"
        aria-labelledby="case-practice-listen-heading"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="case-practice-listen-heading" className="text-base font-semibold text-white">
              Listen with a calm voice
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-300">
              Uses your device&apos;s built-in speech (no account needed). Voice quality depends on your browser and OS.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {prefersReducedMotion ? (
              <p className="text-xs text-slate-400">
                Listen-along is not shown when reduced motion is preferred. You can still read everything on screen.
              </p>
            ) : !canSpeak ? (
              <p className="text-xs text-slate-400">Speech is not available in this browser.</p>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => speak(introForVoice)}
                  disabled={speaking}
                  className="inline-flex items-center gap-2 rounded-xl border border-violet-400/35 bg-violet-600/25 px-4 py-2.5 text-sm font-semibold text-violet-100 transition hover:bg-violet-600/35 disabled:opacity-50"
                >
                  <Volume2 className="h-4 w-4 shrink-0" aria-hidden />
                  Hear introduction
                </button>
                <button
                  type="button"
                  onClick={() => speak(buildCaseNarration())}
                  disabled={speaking}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15 disabled:opacity-50"
                >
                  <Volume2 className="h-4 w-4 shrink-0" aria-hidden />
                  Hear this case
                </button>
                <button
                  type="button"
                  onClick={() => stop()}
                  disabled={!speaking}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/10 disabled:opacity-40"
                >
                  <Square className="h-4 w-4 shrink-0" aria-hidden />
                  Stop
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-indigo-500/25 bg-indigo-500/[0.06] p-4 md:p-5">
        <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-200/90">Practice mode</p>
        <p className="mt-1 text-xs text-slate-400">Choose how you want to frame this rehearsal.</p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {[
            { id: 'solo' as const, label: 'Play Solo', hint: 'You vs the scenario', icon: PlayCircle },
            { id: 'joint-call' as const, label: 'Join Joint Call', hint: 'Others on the line', icon: Users },
            { id: 'private-session' as const, label: 'Open Private Session', hint: 'Closed room', icon: Lock },
            { id: 'tomorrow' as const, label: 'Prepare For Tomorrow', hint: 'Slower tempo', icon: CalendarClock },
          ].map((item) => {
            const Icon = item.icon;
            const active = mode === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setMode(item.id)}
                className={`mvh-card-glow flex min-h-[3.25rem] flex-1 items-center gap-3 rounded-xl border px-4 py-3 text-left transition sm:min-w-[200px] sm:flex-none ${
                  active
                    ? 'border-indigo-400/60 bg-indigo-600/25 text-white ring-1 ring-indigo-400/30'
                    : 'border-white/10 bg-white/5 text-slate-200 hover:border-white/20 hover:bg-white/10'
                }`}
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${active ? 'bg-indigo-500/30 text-indigo-100' : 'bg-white/10 text-slate-300'}`}>
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold tracking-tight">{item.label}</span>
                  <span className="mt-0.5 block text-[11px] font-medium text-slate-400">{item.hint}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border-2 border-dashed border-amber-500/40 bg-amber-500/[0.05] p-4 md:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-amber-200">Shell preview — UI states</p>
            <p className="mt-1 text-xs text-amber-100/85">
              For design and QA only: switches the placeholder layout. Not a user-facing menu in the final product.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {([
              { id: 'loading' as const, label: 'Loading', desc: 'Spinner' },
              { id: 'empty' as const, label: 'Empty', desc: 'No case' },
              { id: 'error' as const, label: 'Error', desc: 'Failed load' },
              { id: 'populated' as const, label: 'Populated', desc: 'Full shell' },
            ] as const).map((item) => {
              const active = state === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setState(item.id)}
                  className={`mvh-card-glow flex min-h-[3rem] min-w-[7.5rem] flex-col items-center justify-center rounded-xl border px-4 py-2.5 text-center transition ${active ? 'border-amber-300/70 bg-amber-500/25 text-white ring-1 ring-amber-300/40' : 'border-amber-500/30 bg-amber-950/20 text-amber-50/90 hover:bg-amber-500/15'}`}
                >
                  <span className="text-sm font-bold">{item.label}</span>
                  <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-200/80">{item.desc}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {state === 'loading' && (
        <section className="flex h-56 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
            Preparing case scenarios…
          </div>
        </section>
      )}

      {state === 'empty' && (
        <section className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
          <p className="text-base font-semibold text-white">No Case Started Yet</p>
          <p className="mt-2 text-sm text-slate-400">Choose a starter scenario to begin structured practice.</p>
        </section>
      )}

      {state === 'error' && (
        <section className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
          <div className="flex items-start gap-2 text-sm text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            Could not load scenarios. Retry in a moment.
          </div>
          <button
            type="button"
            onClick={() => setState('populated')}
            className="mt-3 rounded-lg border border-red-400/40 px-3 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-500/20"
          >
            Retry
          </button>
        </section>
      )}

      {state === 'populated' && (
        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[300px_minmax(0,1fr)_320px]">
          <aside className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Case Inbox</h2>
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-slate-400">{CASES.length} Open</span>
            </div>
            <div className="space-y-2">
              {CASES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedCaseId(item.id)}
                  className={`w-full rounded-xl border px-3 py-2 text-left transition ${selectedCase?.id === item.id ? 'border-indigo-500/40 bg-indigo-600/15' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                >
                  <p className="text-xs font-semibold text-white">{item.title}</p>
                  <p className="mt-1 text-[11px] text-slate-400">{item.timeWindow}</p>
                </button>
              ))}
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
                <History className="h-3.5 w-3.5 text-indigo-300" />
                Recent sessions
              </div>
              {history.length === 0 ? (
                <p className="mt-2 text-xs text-slate-500">Generated packs you create here stay available in this browser for quick return.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {history.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => restoreHistoryEntry(entry)}
                      className="w-full rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2 text-left transition hover:border-indigo-400/30 hover:bg-indigo-500/10"
                    >
                      <p className="text-xs font-semibold text-white">{entry.caseTitle}</p>
                      <p className="mt-1 text-[11px] text-slate-400">{entry.mode} · {entry.includePushback ? 'pushback' : 'standard'}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </aside>

          <main className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">{selectedCase?.source}</p>
                <h3 className="mt-1 text-xl font-semibold text-white">{selectedCase?.title}</h3>
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                  <Clock3 className="h-3.5 w-3.5" />
                  {selectedCase?.timeWindow}
                </div>
              </div>
              <span className="rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
                Pressure: {selectedCase?.pressure}
              </span>
            </div>

            <section className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h4 className="text-sm font-semibold text-white">Case Detail</h4>
              <p className="mt-1.5 text-sm text-slate-300">{selectedCase?.summary}</p>
            </section>

            <section className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <h4 className="text-sm font-semibold text-white">Role Brief</h4>
                <p className="mt-1.5 text-sm text-slate-300">{selectedCase?.roleBrief}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <h4 className="text-sm font-semibold text-white">Preparation</h4>
                <ul className="mt-2 space-y-1.5 text-sm text-slate-300">
                  {selectedCase?.prep.map((line) => (
                    <li key={line} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-white">Live Response</h4>
                <button
                  type="button"
                  onClick={() => setShowPushbackRound((prev) => !prev)}
                  className="text-xs text-indigo-300 hover:text-indigo-200"
                >
                  {showPushbackRound ? 'Hide Pushback Round' : 'Add Pushback Round'}
                </button>
              </div>
              <p className="mt-1.5 text-sm text-slate-300">
                Mode: <span className="font-medium text-white">{modeLabel}</span>. Start with a clear first response focused on facts, impact, and requested next step.
              </p>
              {showPushbackRound && (
                <div className="mt-3 rounded-lg border border-orange-500/25 bg-orange-500/10 p-3 text-sm text-orange-200">
                  <div className="mb-1 flex items-center gap-2 font-semibold">
                    <MessageSquareWarning className="h-4 w-4" />
                    Pushback Round
                  </div>
                  Simulated response: “We already explained this, why are you raising it again?” Practice a calm, evidence-based reply.
                </div>
              )}
            </section>

            <section className="rounded-xl border border-indigo-500/25 bg-indigo-500/[0.08] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Sparkles className="h-4 w-4 text-indigo-300" />
                AI practice pack
              </div>
              <p className="mt-2 text-sm text-slate-300">
                Generate a sharper briefing, a realistic opening response, and a concise verdict or reflection for this case.
              </p>
              {generationError ? (
                <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  {generationError}
                </div>
              ) : null}
              {isGenerating ? (
                <div className="mt-3 flex items-center gap-2 text-sm text-indigo-200">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Building your case practice pack…
                </div>
              ) : generatedPack ? (
                <div className="mt-4 space-y-3">
                  <div className="rounded-lg border border-white/10 bg-slate-950/40 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-indigo-300">Briefing</p>
                    <p className="mt-2 text-sm leading-6 text-slate-200">{generatedPack.briefing}</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-slate-950/40 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-indigo-300">Opening response</p>
                    <p className="mt-2 text-sm leading-6 text-slate-200">{generatedPack.openingResponse}</p>
                  </div>
                  {showPushbackRound && generatedPack.pushbackResponse ? (
                    <div className="rounded-lg border border-orange-500/20 bg-orange-500/[0.08] p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-orange-300">Pushback response</p>
                      <p className="mt-2 text-sm leading-6 text-orange-100">{generatedPack.pushbackResponse}</p>
                    </div>
                  ) : null}
                  {activePanel === 'verdict' ? (
                    <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.08] p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">Verdict</p>
                      <p className="mt-2 text-sm leading-6 text-emerald-100">{generatedPack.verdict}</p>
                    </div>
                  ) : null}
                  {activePanel === 'reflection' ? (
                    <div className="rounded-lg border border-violet-500/20 bg-violet-500/[0.08] p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-violet-300">Reflection</p>
                      <p className="mt-2 text-sm leading-6 text-violet-100">{generatedPack.reflection}</p>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </section>
          </main>

          <aside className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <h3 className="text-sm font-semibold text-white">Action Rail</h3>
            <button
              type="button"
              onClick={() => void generateCasePack('scenario')}
              className="flex w-full items-center justify-between rounded-xl bg-indigo-600 px-3 py-2 text-left text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Start Scenario
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => void generateCasePack('scenario')}
              className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/10"
            >
              Joint Call Prompt
              <ChevronRight className="h-4 w-4 text-slate-500" />
            </button>
            <button
              type="button"
              onClick={() => void generateCasePack('verdict')}
              className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/10"
            >
              Verdict
              <ChevronRight className="h-4 w-4 text-slate-500" />
            </button>
            <button
              type="button"
              onClick={() => void generateCasePack('reflection')}
              className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/10"
            >
              Reflection
              <ChevronRight className="h-4 w-4 text-slate-500" />
            </button>

            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Key Categories</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[
                  'Explain What Happened',
                  'Defend Your Decision',
                  'Mediation',
                  'Boundary Setting',
                  'Fair Treatment Concern',
                  'Reasonable Adjustments',
                  'Speak Under Time Pressure',
                  'Prepare For Tomorrow',
                ].map((item) => (
                  <span key={item} className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-slate-300">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Case Practice supports preparation and communication clarity. It does not replace legal or regulatory advice.
            </p>
          </aside>
        </section>
      )}
    </div>
  );
}
