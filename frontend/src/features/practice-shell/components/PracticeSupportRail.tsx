import type { PracticeSupportItem } from '../types/practice.types';

export default function PracticeSupportRail({ title = 'Support', items }: { title?: string; items: PracticeSupportItem[] }) {
  return <aside className="space-y-3"><div className="text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</div>{items.map((item) => <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="text-sm font-semibold text-slate-900">{item.title}</div><p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p></div>)}</aside>;
}
