import clsx from 'clsx';
import type { PracticeModeOption } from '../types/practice.types';

export default function PracticeModeCard({ option, selected, onSelect }: { option: PracticeModeOption; selected: boolean; onSelect: (id: string) => void }) {
  return <button type="button" onClick={() => onSelect(option.id)} className={clsx('w-full rounded-2xl border p-4 text-left transition', selected ? 'border-slate-900 bg-slate-900 text-white shadow-md' : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:shadow-sm')}><div className="flex items-start justify-between gap-3"><div><div className="text-base font-semibold">{option.title}</div><div className={clsx('mt-1 text-sm', selected ? 'text-slate-200' : 'text-slate-600')}>{option.description}</div></div>{option.badge ? <span className={clsx('rounded-full px-2 py-1 text-xs font-medium', selected ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-700')}>{option.badge}</span> : null}</div>{option.durationLabel ? <div className={clsx('mt-3 text-xs', selected ? 'text-slate-300' : 'text-slate-500')}>{option.durationLabel}</div> : null}</button>;
}
