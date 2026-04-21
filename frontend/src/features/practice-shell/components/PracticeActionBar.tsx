import clsx from 'clsx';
import type { PracticeAction } from '../types/practice.types';

export default function PracticeActionBar({ primaryActions, secondaryActions = [], onAction }: { primaryActions: PracticeAction[]; secondaryActions?: PracticeAction[]; onAction: (id: string) => void }) {
  const renderButton = (action: PracticeAction) => <button key={action.id} type="button" disabled={action.disabled} onClick={() => onAction(action.id)} className={clsx('rounded-xl px-4 py-2 text-sm font-medium transition', action.kind === 'ghost' ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50' : action.kind === 'secondary' ? 'bg-slate-100 text-slate-900 hover:bg-slate-200' : 'bg-slate-900 text-white hover:bg-slate-800', action.disabled && 'cursor-not-allowed opacity-50')}>{action.label}</button>;
  return <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 backdrop-blur"><div className="flex flex-wrap gap-2">{secondaryActions.map(renderButton)}</div><div className="flex flex-wrap gap-2">{primaryActions.map(renderButton)}</div></div>;
}
