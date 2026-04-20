import type { ReactNode } from 'react';

/** Shared shell: right support rail (tips, disclaimers, secondary actions). Dev B expands. */
export type PracticeSupportRailProps = {
  children: ReactNode;
  className?: string;
};

export function PracticeSupportRail({ children, className = '' }: PracticeSupportRailProps) {
  return (
    <aside className={`rounded-2xl border border-white/10 bg-slate-900/30 p-4 text-sm text-slate-400 ${className}`.trim()}>
      {children}
    </aside>
  );
}
