import type { IntelligenceModuleReadiness } from '../types/intelligence.types';

export function IntelligenceReadinessPanel({
  title,
  modules,
}: {
  title: string;
  modules: IntelligenceModuleReadiness[];
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <div className="mt-3 space-y-2">
        {modules.map((module) => (
          <article key={module.id} className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-white">{module.capability}</p>
              <span className="text-[10px] uppercase tracking-wide text-slate-400">{module.status.replace('_', ' ')}</span>
            </div>
            <p className="mt-1 text-xs text-slate-400">{module.signal}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

