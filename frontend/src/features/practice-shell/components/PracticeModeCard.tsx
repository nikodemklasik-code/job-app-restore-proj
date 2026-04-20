import type { ReactNode } from 'react';

/** Shared shell: mode / duration selector card. Dev B replaces with full styling + behaviour. */
export type PracticeModeCardProps = {
  title: string;
  description?: string;
  footer?: ReactNode;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  children?: ReactNode;
};

export function PracticeModeCard({
  title,
  description,
  footer,
  selected,
  disabled,
  onClick,
  className = '',
  children,
}: PracticeModeCardProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-2xl border border-white/10 bg-slate-900/50 p-4 text-left transition hover:border-white/20 disabled:cursor-not-allowed disabled:opacity-50 ${
        selected ? 'ring-2 ring-indigo-500/60' : ''
      } ${className}`.trim()}
    >
      <p className="font-semibold text-white">{title}</p>
      {description ? <p className="mt-1 text-xs text-slate-400">{description}</p> : null}
      {children}
      {footer ? <div className="mt-3 border-t border-white/5 pt-2">{footer}</div> : null}
    </button>
  );
}
