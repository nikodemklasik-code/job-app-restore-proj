import { Sparkles, Clock3 } from 'lucide-react';

interface ComingSoonScreenProps {
  title: string;
  description: string;
  hint?: string;
}

export default function ComingSoonScreen({ title, description, hint }: ComingSoonScreenProps) {
  return (
    <div className="relative isolate overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 md:p-10">
      <div className="pointer-events-none absolute inset-0 bg-slate-950/50 backdrop-blur-[3px]" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-16 top-10 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -left-10 bottom-0 h-36 w-36 rounded-full bg-amber-500/10 blur-3xl" aria-hidden="true" />

      <div className="relative z-10 mx-auto flex min-h-[420px] max-w-3xl flex-col items-center justify-center text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-500/15 px-4 py-2 text-sm font-semibold text-orange-300 shadow-[0_0_0_1px_rgba(251,146,60,0.08)]">
          <Clock3 className="h-4 w-4" />
          Coming soon
        </div>

        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-orange-300">
          <Sparkles className="h-7 w-7" />
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">{title}</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 md:text-lg">{description}</p>
        {hint ? <p className="mt-4 text-sm text-slate-400">{hint}</p> : null}
      </div>
    </div>
  );
}
