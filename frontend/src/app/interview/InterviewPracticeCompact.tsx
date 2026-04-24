import InterviewPractice from './InterviewPractice';

/**
 * Compact Interview screen wrapper.
 *
 * The underlying interview engine stays unchanged. This wrapper only tightens the
 * lobby layout so the start controls are visible on small laptop screens without
 * forcing the user through a vertical marketing scroll before beginning practice.
 */
export default function InterviewPracticeCompact() {
  return (
    <div className="interview-compact-screen">
      <style>{`
        .interview-compact-screen {
          --compact-gap: 0.75rem;
        }

        .interview-compact-screen :is(.space-y-8, .space-y-7, .space-y-6) > :not([hidden]) ~ :not([hidden]) {
          margin-top: var(--compact-gap) !important;
        }

        .interview-compact-screen :is(.p-8, .p-7, .p-6, .p-5) {
          padding: 1rem !important;
        }

        .interview-compact-screen :is(.py-8, .py-7, .py-6, .py-5) {
          padding-top: 1rem !important;
          padding-bottom: 1rem !important;
        }

        .interview-compact-screen :is(.px-8, .px-7, .px-6, .px-5) {
          padding-left: 1rem !important;
          padding-right: 1rem !important;
        }

        .interview-compact-screen h1 {
          font-size: clamp(1.5rem, 2.2vw, 2rem) !important;
          line-height: 1.1 !important;
        }

        .interview-compact-screen h2 {
          font-size: clamp(1.125rem, 1.7vw, 1.35rem) !important;
          line-height: 1.15 !important;
        }

        .interview-compact-screen p {
          line-height: 1.45 !important;
        }

        .interview-compact-screen :is(.rounded-3xl, .rounded-2xl) {
          border-radius: 1rem !important;
        }

        .interview-compact-screen [class*="min-h-"] {
          min-height: auto !important;
        }

        .interview-compact-screen [class*="h-16"],
        .interview-compact-screen [class*="h-14"],
        .interview-compact-screen [class*="h-12"] {
          min-height: 2.5rem !important;
        }

        .interview-compact-screen [class*="gap-6"],
        .interview-compact-screen [class*="gap-5"] {
          gap: 0.75rem !important;
        }

        .interview-compact-screen [class*="mt-6"],
        .interview-compact-screen [class*="mt-5"],
        .interview-compact-screen [class*="mt-4"] {
          margin-top: 0.75rem !important;
        }

        .interview-compact-screen [class*="mb-6"],
        .interview-compact-screen [class*="mb-5"],
        .interview-compact-screen [class*="mb-4"] {
          margin-bottom: 0.75rem !important;
        }

        .interview-compact-screen input,
        .interview-compact-screen select,
        .interview-compact-screen textarea,
        .interview-compact-screen button {
          font-size: 0.875rem !important;
        }

        .interview-compact-screen [aria-label*="AI interviewer"] {
          max-width: 150px !important;
          max-height: 150px !important;
        }

        @media (min-width: 1024px) {
          .interview-compact-screen {
            max-height: calc(100vh - 4rem);
            overflow-y: auto;
          }
        }
      `}</style>
      <InterviewPractice />
    </div>
  );
}
