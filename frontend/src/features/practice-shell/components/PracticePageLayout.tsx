import type { ReactNode } from 'react';

export default function PracticePageLayout({ hero, modeSelector, costPanel, mainPanel, supportRail, actionBar }: { hero: ReactNode; modeSelector: ReactNode; costPanel: ReactNode; mainPanel: ReactNode; supportRail: ReactNode; actionBar: ReactNode; }) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6">
      {hero}
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">{modeSelector}{costPanel}{mainPanel}</div>
        <div>{supportRail}</div>
      </div>
      {actionBar}
    </div>
  );
}
