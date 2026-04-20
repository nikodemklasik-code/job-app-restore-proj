import type { ReactNode } from 'react';

export type PracticeProgressBadgeProps = {
  icon: ReactNode;
  caption: string;
  primary: ReactNode;
  secondary?: ReactNode;
  /** When true, uses warmer accent (e.g. active streak). */
  highlighted?: boolean;
  className?: string;
};

export function PracticeProgressBadge({
  icon,
  caption,
  primary,
  secondary,
  highlighted = false,
  className = '',
}: PracticeProgressBadgeProps) {
  return (
    <div
      className={`mvh-card-glow flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 ${className}`.trim()}
      style={{
        background: highlighted ? 'rgba(249,115,22,0.12)' : 'rgba(100,116,139,0.1)',
        borderColor: highlighted ? 'rgba(249,115,22,0.35)' : 'rgba(100,116,139,0.25)',
      }}
    >
      <div className="flex shrink-0 items-center">{icon}</div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{caption}</p>
        <p className="text-lg font-bold text-white">
          {primary}
          {secondary ? <span className="text-sm font-normal text-slate-400"> {secondary}</span> : null}
        </p>
      </div>
    </div>
  );
}
