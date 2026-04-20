import type { ReactNode } from 'react';

export type PracticeCostCardProps = {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export function PracticeCostCard({
  icon,
  label,
  value,
  footer,
  className = '',
}: PracticeCostCardProps) {
  return (
    <div className={className}>
      <div className="mvh-card-glow flex items-center justify-between gap-4 rounded-2xl border border-indigo-500/25 bg-indigo-500/10 px-4 py-3">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm text-slate-300">{label}</span>
        </div>
        <span className="text-lg font-bold tabular-nums text-white">{value}</span>
      </div>
      {footer}
    </div>
  );
}
