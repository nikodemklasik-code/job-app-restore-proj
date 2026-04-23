import { Link } from 'react-router-dom';
import { MessageSquare, Users, CalendarDays, Sparkles, ArrowRight, LifeBuoy } from 'lucide-react';

const pendingStreams = [
  {
    title: 'Peer introductions',
    description: 'Meet other candidates by role, location, and current interview stage.',
    cta: 'Complete your profile headline',
    to: '/profile',
  },
  {
    title: 'Practice circles',
    description: 'Join weekly mock-interview circles and swap structured feedback.',
    cta: 'Open Interview practice',
    to: '/interview',
  },
  {
    title: 'Community events',
    description: 'Attend role-based events, office-hours, and group strategy sessions.',
    cta: 'Browse Jobs to set your target track',
    to: '/jobs',
  },
];

export default function CommunityCentrePage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-10">
      <header className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 via-slate-900/50 to-sky-950/30 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <p className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-300">
              <Users className="h-3.5 w-3.5" />
              Community Centre
            </p>
            <h1 className="text-3xl font-bold text-white">Your shared career space</h1>
            <p className="max-w-2xl text-sm text-slate-300">
              Community Centre is where members connect, learn, and practice together. It is a standalone destination
              for peer support and events—not an overflow from settings, billing, or legal pages.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-300">
            <p className="font-semibold text-white">Rollout status</p>
            <p className="mt-1">Live community feeds are being enabled in stages.</p>
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {pendingStreams.map((stream) => (
          <article key={stream.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-sm font-semibold text-white">{stream.title}</h2>
            <p className="mt-2 text-sm text-slate-400">{stream.description}</p>
            <Link
              to={stream.to}
              className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-indigo-300 transition hover:text-indigo-200"
            >
              {stream.cta}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 text-amber-300" />
          <div>
            <h2 className="text-base font-semibold text-amber-100">No live discussions yet</h2>
            <p className="mt-1 text-sm text-amber-200/90">
              We are preparing moderated channels for role-based support, accountability check-ins, and interview prep
              rooms. Until feeds go live, you can take these next actions:
            </p>
            <ul className="mt-3 space-y-2 text-sm text-amber-100">
              <li className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Save your target roles in Jobs so we can suggest relevant circles.
              </li>
              <li className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Complete Profile details to improve peer matching and introductions.
              </li>
              <li className="flex items-center gap-2">
                <LifeBuoy className="h-4 w-4" />
                Use Coach and Interview to keep momentum while community streams open.
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
