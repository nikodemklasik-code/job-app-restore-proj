import type { ReactNode } from 'react';

/** Shared shell: main interaction area (recording, transcript, session body). Dev B expands. */
export type PracticeSessionPanelProps = {
  title?: string;
  children: ReactNode;
  className?: string;
};

export function PracticeSessionPanel({ title, children, className = '' }: PracticeSessionPanelProps) {
  return (
    <section className={`rounded-2xl border border-white/10 bg-slate-950/40 p-4 ${className}`.trim()}>
      {title ? <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h2> : null}
      {children}
    </section>
  );
}
