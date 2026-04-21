import type { IntelligenceModule } from '../types/intelligence.types';

export default function IntelligenceReadinessPanel({ modules }: { modules: IntelligenceModule[] }) {
  return <section className="rounded-2xl border border-white/10 bg-white/5 p-4"><h3 className="text-sm font-semibold text-white">Intelligence readiness</h3><ul className="mt-3 space-y-2">{modules.map((m) => <li key={m.route} className="flex items-center justify-between text-sm text-slate-300"><span>{m.title}</span><span className="text-xs text-slate-400">{m.status}</span></li>)}</ul></section>;
}
