import type { ReactNode } from 'react';

export default function PracticeSessionPanel({ title, children }: { title: string; children: ReactNode }) {
  return <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-semibold text-slate-900">{title}</h2><div className="mt-4">{children}</div></section>;
}
