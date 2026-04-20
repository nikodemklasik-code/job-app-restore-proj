import type { ReactNode } from 'react';

export type PracticeHeroHeaderProps = {
  /** Small label row above the title (e.g. pill with icon). */
  eyebrow?: ReactNode;
  title: string;
  description: string;
  className?: string;
};

export function PracticeHeroHeader({
  eyebrow,
  title,
  description,
  className = '',
}: PracticeHeroHeaderProps) {
  return (
    <div className={`max-w-xl space-y-3 ${className}`.trim()}>
      {eyebrow}
      <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{title}</h1>
      <p className="text-sm leading-relaxed text-slate-400">{description}</p>
    </div>
  );
}
