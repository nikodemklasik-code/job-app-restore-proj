import type { ReactNode } from 'react';

export type PracticePageLayoutProps = {
  header?: ReactNode;
  main: ReactNode;
  rail?: ReactNode;
  footer?: ReactNode;
  className?: string;
};

/**
 * Shared presentation scaffold for practice pages.
 * No orchestration/state logic here.
 */
export function PracticePageLayout({ header, main, rail, footer, className = '' }: PracticePageLayoutProps) {
  return (
    <section className={`space-y-4 ${className}`.trim()}>
      {header}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">{main}</div>
        {rail ? <div className="space-y-4">{rail}</div> : null}
      </div>
      {footer}
    </section>
  );
}

