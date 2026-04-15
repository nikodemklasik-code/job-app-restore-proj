import { Link } from 'react-router-dom';
import { Sparkles, ArrowLeft } from 'lucide-react';

const LAST_UPDATED = '15 April 2026';

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-white">MultivoHub</span>
          </Link>
          <Link
            to="/auth"
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-white">Cookie Policy</h1>
          <p className="mt-2 text-sm text-slate-500">Last updated: {LAST_UPDATED}</p>
          <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
            <p className="text-sm text-amber-300 leading-relaxed">
              This Cookie Policy supplements our{' '}
              <Link to="/privacy" className="underline underline-offset-2 hover:text-white">
                Privacy Policy
              </Link>
              . It describes how MultivoHub uses cookies and similar technologies when you use jobs.multivohub.com
              and related services.
            </p>
          </div>
        </div>

        <div className="space-y-10 text-sm text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-4 pb-2 border-b border-white/10">
              1. What are cookies?
            </h2>
            <p>
              Cookies are small text files stored on your device when you visit a website. Similar technologies
              include local storage and session storage, which we may use for preferences and session state where
              essential for the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4 pb-2 border-b border-white/10">
              2. Cookies we use
            </h2>
            <div className="space-y-4">
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
                <p className="font-semibold text-emerald-400">Strictly necessary</p>
                <p className="mt-2 text-slate-400">
                  Authentication and security: session tokens and identifiers issued by Clerk to keep you signed
                  in; CSRF-related tokens where applicable; cookies required for Stripe Checkout and PayPal flows.
                  These are needed for the Service to function and cannot be switched off without losing core
                  functionality.
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                <p className="font-semibold text-white">Functional (first-party)</p>
                <p className="mt-2 text-slate-400">
                  Theme, accessibility, or UI preferences stored locally (e.g. in{' '}
                  <code className="text-slate-500">localStorage</code>) so your choices persist between visits.
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                <p className="font-semibold text-white">Analytics (optional)</p>
                <p className="mt-2 text-slate-400">
                  We do not load third-party advertising or cross-site tracking cookies. If we introduce
                  privacy-focused, consent-based analytics in the future, we will ask for your permission first
                  and update this policy.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4 pb-2 border-b border-white/10">
              3. Third-party providers
            </h2>
            <p>
              When you authenticate or pay, Clerk, Stripe, and/or PayPal may set their own cookies or similar
              storage subject to their policies. We do not control those technologies; see clerk.com, stripe.com,
              and paypal.com for details.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4 pb-2 border-b border-white/10">
              4. Managing cookies
            </h2>
            <p>
              You can block or delete cookies through your browser settings. Blocking strictly necessary cookies
              may prevent sign-in, payments, or other core features. For more on your personal data, see the{' '}
              <Link to="/privacy" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">
                Privacy Policy
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4 pb-2 border-b border-white/10">
              5. Contact
            </h2>
            <p>
              Questions about this policy:{' '}
              <a href="mailto:privacy@multivohub.com" className="text-indigo-400 hover:text-indigo-300">
                privacy@multivohub.com
              </a>
            </p>
          </section>
        </div>

        <div className="mt-12 rounded-xl border border-indigo-500/20 bg-indigo-500/5 px-5 py-4">
          <p className="text-sm text-indigo-300">
            See also:{' '}
            <Link to="/terms" className="underline underline-offset-2 hover:text-white">
              Terms of Service
            </Link>
            {' · '}
            <Link to="/faq" className="underline underline-offset-2 hover:text-white">
              FAQ
            </Link>
          </p>
        </div>
      </main>

      <footer className="border-t border-white/10 mt-12">
        <div className="mx-auto max-w-3xl px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500">© 2026 MultivoHub Ltd. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
            <Link to="/privacy" className="hover:text-slate-300 transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-slate-300 transition-colors">Terms</Link>
            <Link to="/auth" className="hover:text-slate-300 transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
