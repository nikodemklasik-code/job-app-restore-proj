import type { ReactNode } from 'react';

type Props =
  | { label: string; value: string; icon?: never; caption?: never; primary?: never; secondary?: never; highlighted?: never }
  | { label?: never; value?: never; icon: ReactNode; caption: string; primary: ReactNode; secondary?: ReactNode; highlighted?: boolean };

export default function PracticeProgressBadge(props: Props) {
  if ('label' in props && typeof props.label === 'string') {
    return <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm"><span className="text-slate-500">{props.label}</span><span className="font-semibold text-slate-900">{props.value}</span></div>;
  }
  return <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm">{props.icon}<span className="text-slate-500">{props.caption}</span><span className="font-semibold text-slate-900">{props.primary}</span>{props.secondary ? <span className="text-slate-600">{props.secondary}</span> : null}</div>;
}
