import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, X } from 'lucide-react';
import { AI_ASSISTED_NOTICE_VERSION } from '@/lib/legalNoticeVersion';

const storageKey = () => `mvh_ai_assisted_notice_ack_v${AI_ASSISTED_NOTICE_VERSION}`;

/**
 * One-time (until cleared) in-app notice that the product is AI-heavy and output requires user review.
 * Reinforces Terms §6 for users who never open the legal pages.
 */
export default function AiAssistedBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(storageKey())) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(storageKey(), '1');
    } catch {
      /* private mode */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="AI-assisted service notice"
      className="shrink-0 border-b border-indigo-500/25 bg-indigo-950/40 px-4 py-3 dark:bg-indigo-950/50"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-indigo-400" aria-hidden />
          <p className="text-sm leading-snug text-slate-200">
            <span className="font-semibold text-white">AI-assisted product.</span>{' '}
            Drafts, scores, coaching, and automation may be wrong or incomplete. You are responsible for anything you
            send or submit in your name. See{' '}
            <Link to="/terms#ai-content" className="text-indigo-300 underline underline-offset-2 hover:text-white">
              Terms — AI-Generated Content
            </Link>
            {' · '}
            <Link to="/privacy" className="text-indigo-300 underline underline-offset-2 hover:text-white">
              Privacy
            </Link>
            .
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 self-end rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/10 sm:self-center"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
          Dismiss
        </button>
      </div>
    </div>
  );
}
