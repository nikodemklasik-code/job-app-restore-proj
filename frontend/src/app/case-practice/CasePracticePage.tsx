import { useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Loader2,
  Lock,
  MessageSquareWarning,
  PlayCircle,
  ShieldCheck,
  Users,
} from 'lucide-react';

type ViewState = 'loading' | 'empty' | 'error' | 'populated';
type PracticeMode = 'solo' | 'joint-call' | 'private-session' | 'tomorrow';

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

export default function CasePracticePage() {
  const [state, setState] = useState<ViewState>('populated');
  const [mode, setMode] = useState<PracticeMode>('solo');
  const [selectedCaseId, setSelectedCaseId] = useState(CASES[0]?.id ?? '');
  const [showPushbackRound, setShowPushbackRound] = useState(false);

  const selectedCase = useMemo(
    () => CASES.find((item) => item.id === selectedCaseId) ?? CASES[0],
    [selectedCaseId],
  );

  const modeLabel =
    mode === 'joint-call'
      ? 'Join Joint Call'
      : mode === 'private-session'
        ? 'Open Private Session'
        : mode === 'tomorrow'
          ? 'Prepare For Tomorrow'
          : 'Play Solo';

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-indigo-500/15 p-2.5">
            <ShieldCheck className="h-5 w-5 text-indigo-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Case Practice</h1>
            <p className="mt-1 text-sm text-slate-400">
              High-pressure professional reality practice: explain, defend, mediate, and set boundaries with control.
            </p>
          </div>
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'solo' as const, label: 'Play Solo', icon: PlayCircle },
            { id: 'joint-call' as const, label: 'Join Joint Call', icon: Users },
            { id: 'private-session' as const, label: 'Open Private Session', icon: Lock },
            { id: 'tomorrow' as const, label: 'Prepare For Tomorrow', icon: CalendarClock },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setMode(item.id)}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                  mode === item.id
                    ? 'border-indigo-500/40 bg-indigo-600/20 text-indigo-200'
                    : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setState('loading')}
            className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300 hover:bg-white/10"
          >
            Loading
          </button>
          <button
            type="button"
            onClick={() => setState('empty')}
            className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300 hover:bg-white/10"
          >
            Empty
          </button>
          <button
            type="button"
            onClick={() => setState('error')}
            className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300 hover:bg-white/10"
          >
            Error
          </button>
          <button
            type="button"
            onClick={() => setState('populated')}
            className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300 hover:bg-white/10"
          >
            Populated
          </button>
        </div>
      </div>

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
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-slate-400">
                {CASES.length} Open
              </span>
            </div>
            <div className="space-y-2">
              {CASES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedCaseId(item.id)}
                  className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                    selectedCase?.id === item.id
                      ? 'border-indigo-500/40 bg-indigo-600/15'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <p className="text-xs font-semibold text-white">{item.title}</p>
                  <p className="mt-1 text-[11px] text-slate-400">{item.timeWindow}</p>
                </button>
              ))}
            </div>
          </aside>

          <main className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  {selectedCase?.source}
                </p>
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
          </main>

          <aside className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <h3 className="text-sm font-semibold text-white">Action Rail</h3>
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-xl bg-indigo-600 px-3 py-2 text-left text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Start Scenario
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/10"
            >
              Joint Call Prompt
              <ChevronRight className="h-4 w-4 text-slate-500" />
            </button>
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/10"
            >
              Verdict
              <ChevronRight className="h-4 w-4 text-slate-500" />
            </button>
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/10"
            >
              Reflection
              <ChevronRight className="h-4 w-4 text-slate-500" />
            </button>

            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Key Categories
              </p>
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
                  <span
                    key={item}
                    className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-slate-300"
                  >
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

