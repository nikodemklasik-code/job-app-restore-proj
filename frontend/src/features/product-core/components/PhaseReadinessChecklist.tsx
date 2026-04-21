import type { ProductModuleReadiness, ReadinessStatus } from '../types/product.types';

const STATUS_STYLES: Record<ReadinessStatus, string> = {
  ready: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  in_progress: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300',
  blocked: 'border-red-500/40 bg-red-500/10 text-red-300',
  planned: 'border-slate-500/40 bg-slate-500/10 text-slate-300',
};

export function PhaseReadinessChecklist({
  title,
  modules,
}: {
  title: string;
  modules: ProductModuleReadiness[];
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <div className="mt-3 space-y-2">
        {modules.map((module) => (
          <article key={module.id} className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-white">{module.name}</p>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_STYLES[module.status]}`}>
                {module.status.replace('_', ' ')}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">{module.summary}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

