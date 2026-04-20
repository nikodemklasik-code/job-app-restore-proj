import type { ReactNode } from 'react';

/** Shared shell: sticky / footer primary + secondary actions. Dev B expands. */
export type PracticeActionBarProps = {
  children: ReactNode;
  className?: string;
};

export function PracticeActionBar({ children, className = '' }: PracticeActionBarProps) {
  return (
    <div
      className={`flex flex-col gap-2 rounded-2xl border border-white/10 bg-slate-900/40 p-3 sm:flex-row sm:items-center sm:justify-end ${className}`.trim()}
    >
      {children}
    </div>
  );
}
