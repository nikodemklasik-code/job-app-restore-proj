import { PlayCircle, ShieldCheck, Sparkles, Volume2 } from 'lucide-react';
import { SupportingMaterialsDisclaimer } from '@/components/SupportingMaterialsDisclaimer';
import CasePracticePage from './CasePracticePage';

/**
 * Presentation wrapper for Case Study.
 *
 * The underlying case-practice engine stays unchanged. This wrapper fixes the
 * first-fold hierarchy: clear page promise first, one primary action path,
 * video as supporting context, practice content next, disclaimers at the bottom.
 */
export default function CasePracticePageCompact() {
  return (
    <div className="case-study-compact mx-auto max-w-7xl space-y-5">
      <style>{`
        .case-study-compact > .case-study-engine > div > header,
        .case-study-compact > .case-study-engine > div > header + div,
        .case-study-compact > .case-study-engine [aria-labelledby="case-practice-listen-heading"] {
          display: none !important;
        }

        .case-study-compact > .case-study-engine > div {
          max-width: 100% !important;
          margin-left: 0 !important;
          margin-right: 0 !important;
        }

        .case-study-compact .case-study-engine :is(.space-y-6) > :not([hidden]) ~ :not([hidden]) {
          margin-top: 1rem !important;
        }

        .case-study-compact .case-study-engine :is(.p-8, .p-7, .p-6, .p-5) {
          padding: 1rem !important;
        }

        .case-study-compact .case-study-engine h1 {
          font-size: clamp(1.5rem, 2vw, 2rem) !important;
        }

        .case-study-compact .case-study-engine :is(.rounded-3xl, .rounded-2xl) {
          border-radius: 1rem !important;
        }
      `}</style>

      <section className="mvh-module-hero overflow-hidden rounded-3xl border p-4 shadow-sm sm:p-5 lg:p-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)] lg:items-stretch">
          <div className="flex min-w-0 flex-col justify-between gap-5">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.18em] mvh-chip-primary">
                <ShieldCheck className="h-3.5 w-3.5" />
                Case Study Practice
              </div>
              <div>
                <h1 className="max-w-3xl text-3xl font-black tracking-tight mvh-text-strong sm:text-4xl">
                  Defend your position. Win with words.
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 mvh-text-muted sm:text-base">
                  Choose the case, connect the facts, prepare your logic, then start the action with active listening, rhetoric, interpersonal skill, and pressure control.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="mvh-step-card rounded-2xl border p-3">
                <p className="text-[11px] font-black uppercase tracking-wide mvh-text-soft">Step One</p>
                <p className="mt-1 text-sm font-bold mvh-text-strong">Choose the case.</p>
              </div>
              <div className="mvh-step-card rounded-2xl border p-3">
                <p className="text-[11px] font-black uppercase tracking-wide mvh-text-soft">Step Two</p>
                <p className="mt-1 text-sm font-bold mvh-text-strong">Build your position.</p>
              </div>
              <div className="mvh-step-card rounded-2xl border p-3">
                <p className="text-[11px] font-black uppercase tracking-wide mvh-text-soft">Step Three</p>
                <p className="mt-1 text-sm font-bold mvh-text-strong">Start the action.</p>
              </div>
            </div>
          </div>

          <aside className="mvh-video-card relative min-h-[240px] rounded-3xl border p-4 lg:min-h-[260px]">
            <div className="flex h-full min-h-[210px] flex-col justify-between gap-5">
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full border px-3 py-1 text-xs font-bold mvh-chip-muted">60 sec intro</span>
                <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold mvh-chip-success">
                  <Sparkles className="h-3.5 w-3.5" /> Interactive
                </span>
              </div>

              <button
                type="button"
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border text-current shadow-sm transition hover:scale-[1.02] mvh-play-button"
                aria-label="Intro preview"
              >
                <PlayCircle className="h-10 w-10" />
              </button>

              <div>
                <p className="text-sm font-black mvh-text-strong">What decides the outcome?</p>
                <p className="mt-1 text-sm leading-5 mvh-text-muted">
                  Active listening, connected facts, clear logic, and the ability to stay persuasive under pressure.
                </p>
                <div className="mt-3 inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold mvh-chip-muted">
                  <Volume2 className="h-4 w-4" />
                  Video/audio intro placeholder
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <div className="case-study-engine">
        <CasePracticePage />
      </div>

      <footer className="pb-4">
        <SupportingMaterialsDisclaimer compact collapsible defaultExpanded={false} />
      </footer>
    </div>
  );
}
