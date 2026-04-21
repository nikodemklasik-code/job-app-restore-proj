import type { ReadinessModule } from '../types/product.types';

export default function PhaseReadinessChecklist({ title, modules }: { title: string; modules: ReadinessModule[] }) {
  return <section className="rounded-2xl border border-white/10 bg-white/5 p-4"><h3 className="text-sm font-semibold text-white">{title}</h3><ul className="mt-3 space-y-2">{modules.map((m) => <li key={m.id} className="flex items-center justify-between text-sm text-slate-300"><span>{m.title}</span><span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs">{m.status}</span></li>)}</ul></section>;
}
