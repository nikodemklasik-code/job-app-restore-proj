import { PlayCircle, ShieldCheck, Sparkles, Volume2 } from 'lucide-react';
import { SupportingMaterialsDisclaimer } from '@/components/SupportingMaterialsDisclaimer';
import CasePracticePage from './CasePracticePage';

/**
 * Presentation wrapper for Case Study.
 *
 * The underlying case-practice engine stays unchanged. This wrapper fixes the
 * first-fold hierarchy: visual introduction first, practice content next,
 * disclaimers at the bottom. Apparently users came to practise, not to read a
 * treaty before touching the product. Imagine that.
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

      <section className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/80 shadow-2xl shadow-black/20">
        <div className="grid gap-0 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-5 p-5 sm:p-6 lg:p-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/25 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-100">
              <ShieldCheck className="h-3.5 w-3.5" />
              Case Study Practice
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Defend your position. Win with words.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                No winner is decided in advance. Choose the case, prepare your argument, then start the action with rhetoric, interpersonal skill, and pressure control.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Step One</p>
                <p className="mt-1 text-sm font-semibold text-white">Make your choice.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Step Two</p>
                <p className="mt-1 text-sm font-semibold text-white">Prepare to win.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Step Three</p>
                <p className="mt-1 text-sm font-semibold text-white">Start the action.</p>
              </div>
            </div>
          </div>

          <div className="relative min-h-[260px] border-t border-white/10 bg-gradient-to-br from-indigo-600/25 via-slate-900 to-violet-700/25 p-5 lg:border-l lg:border-t-0">
            <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_30%_20%,rgba(129,140,248,0.35),transparent_30%),radial-gradient(circle_at_70%_70%,rgba(168,85,247,0.26),transparent_35%)]" />
            <div className="relative flex h-full min-h-[220px] flex-col justify-between rounded-3xl border border-white/15 bg-black/30 p-5 backdrop-blur">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200">60 sec intro</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-200">
                  <Sparkles className="h-3.5 w-3.5" /> Interactive
                </span>
              </div>
              <button
                type="button"
                className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-white/25 bg-white/15 text-white shadow-xl shadow-indigo-950/40 transition hover:bg-white/25"
                aria-label="Intro preview"
              >
                <PlayCircle className="h-12 w-12" />
              </button>
              <div>
                <p className="text-sm font-semibold text-white">What decides the outcome?</p>
                <p className="mt-1 text-sm leading-5 text-slate-300">
                  Arguments, rhetoric, debate tactics, interpersonal skill, and your ability to hold the line under pressure.
                </p>
                <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-slate-200">
                  <Volume2 className="h-4 w-4 text-indigo-200" />
                  Video/audio intro placeholder
                </div>
              </div>
            </div>
          </div>
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
