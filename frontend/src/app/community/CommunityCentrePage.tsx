import { CalendarDays, Handshake, Megaphone, MessageSquare, Sparkles, Users } from 'lucide-react';

const SECTION_CARD =
  'rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]';

export default function CommunityCentrePage() {
  const liveEvents: Array<{ title: string; when: string }> = [];
  const liveDiscussions: Array<{ title: string; topic: string }> = [];
  const liveHighlights: Array<{ title: string; detail: string }> = [];

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/15 via-slate-900/40 to-violet-900/25 p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-indigo-300/30 bg-indigo-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-200">
              <Users className="h-3.5 w-3.5" />
              Community Centre
            </p>
            <h1 className="mt-3 text-3xl font-bold text-white md:text-4xl">Your destination for member community activity.</h1>
            <p className="mt-3 text-sm text-slate-300 md:text-base">
              Community Centre is a dedicated product area for member-to-member engagement: discussions, events, and shared outcomes.
              It is intentionally separate from settings, legal, billing, and profile workflows.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-slate-200">
            <p className="font-semibold text-white">Start here</p>
            <p className="mt-1 text-slate-300">Pick one action: invite a peer, start a discussion, or browse upcoming events.</p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            className="inline-flex items-center rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
          >
            Invite a peer
          </button>
          <button
            type="button"
            className="inline-flex items-center rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
          >
            Start discussion
          </button>
          <button
            type="button"
            className="inline-flex items-center rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
          >
            Browse events
          </button>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className={SECTION_CARD}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400">Primary community action</p>
              <h2 className="mt-1 text-lg font-semibold text-white">Refer a friend</h2>
            </div>
            <Handshake className="h-5 w-5 text-emerald-300" />
          </div>
          <p className="mt-3 text-sm text-slate-300">
            Send your referral link to one relevant person. Keep invites targeted and useful.
          </p>
          <button
            type="button"
            className="mt-4 inline-flex items-center rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
          >
            Copy referral link
          </button>
        </article>

        <article className={SECTION_CARD}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400">Community discussions</p>
              <h2 className="mt-1 text-lg font-semibold text-white">Member threads</h2>
            </div>
            <MessageSquare className="h-5 w-5 text-amber-300" />
          </div>
          {liveDiscussions.length === 0 ? (
            <div className="mt-3 rounded-xl border border-dashed border-white/15 bg-white/[0.03] p-3 text-sm text-slate-300">
              <p className="font-medium text-white">No live discussions yet.</p>
              <p className="mt-1">Start the first thread for your cohort (example: interview prep accountability).</p>
            </div>
          ) : (
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              {liveDiscussions.map((thread) => (
                <li key={thread.title}>• {thread.title} — {thread.topic}</li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className={SECTION_CARD}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400">Events and engagement</p>
              <h2 className="mt-1 text-lg font-semibold text-white">Upcoming events</h2>
            </div>
            <CalendarDays className="h-5 w-5 text-cyan-300" />
          </div>
          {liveEvents.length === 0 ? (
            <div className="mt-3 rounded-xl border border-dashed border-white/15 bg-white/[0.03] p-3 text-sm text-slate-300">
              <p className="font-medium text-white">No events are scheduled yet.</p>
              <p className="mt-1">Propose a first session and invite peers to co-host.</p>
            </div>
          ) : (
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              {liveEvents.map((event) => (
                <li key={event.title}>• {event.when}: {event.title}</li>
              ))}
            </ul>
          )}
          <button
            type="button"
            className="mt-4 inline-flex items-center rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
          >
            View event details
          </button>
        </article>

        <article className={SECTION_CARD}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400">Community highlights</p>
              <h2 className="mt-1 text-lg font-semibold text-white">What is trending now</h2>
            </div>
            <Megaphone className="h-5 w-5 text-fuchsia-300" />
          </div>
          {liveHighlights.length === 0 ? (
            <div className="mt-3 rounded-xl border border-dashed border-white/15 bg-white/[0.03] p-3 text-sm text-slate-300">
              <p className="font-medium text-white">No highlights published yet.</p>
              <p className="mt-1">Highlights will appear once members share outcomes and moderators verify them.</p>
            </div>
          ) : (
            <div className="mt-3 space-y-2 text-sm text-slate-300">
              {liveHighlights.map((item) => (
                <p key={item.title}>{item.title}: {item.detail}</p>
              ))}
            </div>
          )}
        </article>
      </section>

      <section className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-5">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 text-emerald-300" />
          <div>
            <h3 className="font-semibold text-emerald-100">Meaningful empty state</h3>
            <p className="mt-1 text-sm text-emerald-50/90">
              No live community data yet. Recommended sequence: invite a peer (primary), start one discussion (secondary), then set up one event
              (tertiary) to activate this space.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
