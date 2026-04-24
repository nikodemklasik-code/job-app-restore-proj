import type { ReactNode } from 'react';
import { clsx } from 'clsx';
import { LayoutDashboard } from 'lucide-react';

export type ScreenTone =
  | 'command'
  | 'identity'
  | 'documents'
  | 'market'
  | 'pipeline'
  | 'assistant'
  | 'practice'
  | 'coach'
  | 'strategy'
  | 'case'
  | 'lab'
  | 'radar'
  | 'reports'
  | 'calculator'
  | 'legal'
  | 'community'
  | 'settings'
  | 'billing'
  | 'help';

const toneClasses: Record<ScreenTone, { label: string; shell: string; icon: string }> = {
  command: { label: 'Command centre', shell: 'from-indigo-50 via-white to-slate-50 dark:from-indigo-950/40 dark:via-slate-900 dark:to-slate-950', icon: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100' },
  identity: { label: 'Identity core', shell: 'from-violet-50 via-white to-slate-50 dark:from-violet-950/40 dark:via-slate-900 dark:to-slate-950', icon: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-100' },
  documents: { label: 'Document engine', shell: 'from-sky-50 via-white to-slate-50 dark:from-sky-950/40 dark:via-slate-900 dark:to-slate-950', icon: 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-100' },
  market: { label: 'Market board', shell: 'from-emerald-50 via-white to-slate-50 dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-950', icon: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100' },
  pipeline: { label: 'Pipeline tracker', shell: 'from-amber-50 via-white to-slate-50 dark:from-amber-950/40 dark:via-slate-900 dark:to-slate-950', icon: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100' },
  assistant: { label: 'Conversation workspace', shell: 'from-cyan-50 via-white to-slate-50 dark:from-cyan-950/40 dark:via-slate-900 dark:to-slate-950', icon: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-100' },
  practice: { label: 'Quick drill', shell: 'from-orange-50 via-white to-slate-50 dark:from-orange-950/40 dark:via-slate-900 dark:to-slate-950', icon: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100' },
  coach: { label: 'Training studio', shell: 'from-purple-50 via-white to-slate-50 dark:from-purple-950/40 dark:via-slate-900 dark:to-slate-950', icon: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100' },
  strategy: { label: 'Strategy table', shell: 'from-stone-100 via-white to-slate-50 dark:from-stone-900 dark:via-slate-900 dark:to-slate-950', icon: 'bg-stone-200 text-stone-800 dark:bg-stone-800 dark:text-stone-100' },
  case: { label: 'Problem-solving board', shell: 'from-rose-50 via-white to-slate-50 dark:from-rose-950/40 dark:via-slate-900 dark:to-slate-950', icon: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-100' },
  lab: { label: 'Laboratory', shell: 'from-lime-50 via-white to-slate-50 dark:from-lime-950/40 dark:via-slate-900 dark:to-slate-950', icon: 'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-100' },
  radar: { label: 'Opportunity intelligence', shell: 'from-blue-50 via-white to-slate-50 dark:from-blue-950/40 dark:via-slate-900 dark:to-slate-950', icon: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100' },
  reports: { label: 'Evidence archive', shell: 'from-slate-100 via-white to-slate-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-950', icon: 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-100' },
  calculator: { label: 'Comparison tool', shell: 'from-teal-50 via-white to-slate-50 dark:from-teal-950/40 dark:via-slate-900 dark:to-slate-950', icon: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-100' },
  legal: { label: 'Grounded workspace', shell: 'from-zinc-100 via-white to-slate-50 dark:from-zinc-900 dark:via-slate-900 dark:to-slate-950', icon: 'bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100' },
  community: { label: 'Open board', shell: 'from-fuchsia-50 via-white to-slate-50 dark:from-fuchsia-950/40 dark:via-slate-900 dark:to-slate-950', icon: 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900 dark:text-fuchsia-100' },
  settings: { label: 'Control panel', shell: 'from-slate-100 via-white to-slate-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-950', icon: 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-100' },
  billing: { label: 'Wallet ledger', shell: 'from-green-50 via-white to-slate-50 dark:from-green-950/40 dark:via-slate-900 dark:to-slate-950', icon: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' },
  help: { label: 'Help library', shell: 'from-indigo-50 via-white to-slate-50 dark:from-indigo-950/40 dark:via-slate-900 dark:to-slate-950', icon: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100' },
};

type ModulePageHeaderProps = {
  tone: ScreenTone;
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  metrics?: ReactNode;
  className?: string;
};

export function ModulePageHeader({ tone, eyebrow, title, description, actions, metrics, className }: ModulePageHeaderProps) {
  const toneClass = toneClasses[tone];

  return (
    <section className={clsx('rounded-3xl border border-slate-200 bg-gradient-to-br p-6 shadow-sm dark:border-slate-800', toneClass.shell, className)}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 max-w-3xl">
          <div className="flex items-center gap-3">
            <span className={clsx('flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl', toneClass.icon)}>
              <LayoutDashboard className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{eyebrow ?? toneClass.label}</p>
              <h1 className="mt-1 text-balance text-3xl font-bold tracking-tight text-slate-950 dark:text-white">{title}</h1>
            </div>
          </div>
          {description ? <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-700 dark:text-slate-300">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-3 lg:justify-end">{actions}</div> : null}
      </div>
      {metrics ? <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">{metrics}</div> : null}
    </section>
  );
}

export function ModuleActionBar({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx('flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between', className)}>{children}</div>;
}

export function ModuleMetricCard(props: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-2xl border border-white/60 bg-white/75 p-4 shadow-sm backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/75">
      <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{props.label}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">{props.value}</div>
      {props.detail ? <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{props.detail}</div> : null}
    </div>
  );
}
