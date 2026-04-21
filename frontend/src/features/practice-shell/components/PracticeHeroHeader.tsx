import type { PracticeHeroData } from '../types/practice.types';

export default function PracticeHeroHeader({ hero }: { hero: PracticeHeroData }) {
  return <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">{hero.eyebrow ? <div className="mb-2 text-sm font-medium text-slate-500">{hero.eyebrow}</div> : null}<h1 className="text-3xl font-semibold tracking-tight text-slate-900">{hero.title}</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{hero.subtitle}</p></section>;
}
