import type { GovernanceModule } from '../types/governance.types';

export default function GovernanceReadinessPanel({ modules }: { modules: GovernanceModule[] }) {
  return <section className="rounded-2xl border border-white/10 bg-white/5 p-4"><h3 className="text-sm font-semibold text-white">Governance readiness</h3><ul className="mt-3 space-y-2">{modules.map((m) => <li key={m.route} className="flex items-center justify-between text-sm text-slate-300"><span>{m.title}</span><span className="text-xs text-slate-400">{m.owner}</span></li>)}</ul></section>;
}
