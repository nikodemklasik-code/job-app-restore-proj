/**
 * Product disclaimer: AI/coach modules are supporting guidance, not a sole path or guarantee.
 * @see docs/policies/supporting-materials-disclaimer-v1.0.md
 */
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

function DisclaimerBody({ compact }: { compact: boolean }) {
  return compact ? (
    <p className="m-0">
      <span className="font-semibold text-amber-200/95">★ </span>
      Supporting materials: AI offers <strong className="font-medium text-slate-200">direction</strong> and{' '}
      <strong className="font-medium text-slate-200">pace</strong> — not the only path,{' '}
      <strong className="font-medium text-slate-200">no guarantee of outcome</strong>; results depend on{' '}
      <strong className="font-medium text-slate-200">many factors</strong>.
    </p>
  ) : (
    <p className="m-0">
      <span className="font-semibold text-amber-200/95">★ </span>
      <strong className="text-slate-200">Supporting materials</strong> — AI modules and content suggest{' '}
      <strong className="text-slate-200">direction</strong> and a workable <strong className="text-slate-200">rhythm</strong>.
      They are <strong className="text-slate-200">not the only possible route</strong> and{' '}
      <strong className="text-slate-200">do not guarantee success</strong> (e.g. interviews, promotions, or pay).
      This is <strong className="text-slate-200">guidance</strong> for typical situations;{' '}
      <strong className="text-slate-200">outcomes depend on many factors</strong>, including your effort, preparation,
      job market context, and employer decisions.
    </p>
  );
}

export function SupportingMaterialsDisclaimer({
  compact = false,
  className = '',
  collapsible = false,
  defaultExpanded = false,
}: {
  compact?: boolean;
  className?: string;
  /** When true, only a ★ row is shown until the user expands (same pattern across modules). */
  collapsible?: boolean;
  defaultExpanded?: boolean;
}) {
  const [open, setOpen] = useState(defaultExpanded);

  if (collapsible) {
    return (
      <div className={`rounded-xl border border-amber-500/25 bg-amber-500/[0.07] text-slate-300 ${className}`}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[11px] font-medium text-amber-100/95 transition hover:bg-white/[0.04]"
          aria-expanded={open}
        >
          <span className="flex items-center gap-1.5">
            <span className="text-amber-200" aria-hidden>
              ★
            </span>
            <span>Supporting materials (guidance only — tap to {open ? 'hide' : 'show'})</span>
          </span>
          <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-amber-200/80 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
        </button>
        {open && (
          <div
            className={`border-t border-amber-500/20 px-3 py-2 ${compact ? 'text-[11px] leading-snug' : 'text-sm leading-relaxed'}`}
            role="region"
            aria-label="Supporting materials details"
          >
            <DisclaimerBody compact={compact} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      role="note"
      aria-label="Supporting materials: guidance only, not a guarantee"
      className={`rounded-xl border border-amber-500/25 bg-amber-500/[0.07] text-slate-300 ${compact ? 'px-3 py-2 text-[11px] leading-snug' : 'px-4 py-3 text-sm leading-relaxed'} ${className}`}
    >
      <DisclaimerBody compact={compact} />
    </div>
  );
}
