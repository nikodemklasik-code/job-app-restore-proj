import { CalendarDays, Handshake, Megaphone, Sparkles, Star, Users } from 'lucide-react';
import { api } from '@/lib/api';

const SECTION_CARD =
  'rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]';

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="h-56 animate-pulse rounded-3xl bg-white/5" />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-48 animate-pulse rounded-2xl bg-white/5" />
        <div className="h-48 animate-pulse rounded-2xl bg-white/5" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-48 animate-pulse rounded-2xl bg-white/5" />
        <div className="h-48 animate-pulse rounded-2xl bg-white/5" />
      </div>
    </div>
  );
}

function EmptyState({ prompt }: { prompt: string }) {
  return (
    <section className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-5">
      <div className="flex items-start gap-3">
        <Sparkles className="mt-0.5 h-5 w-5 text-emerald-300" />
        <div>
          <h3 className="font-semibold text-emerald-100">Start the community loop</h3>
          <p className="mt-1 text-sm text-emerald-50/90">{prompt}</p>
        </div>
      </div>
    </section>
  );
}

export default function CommunityCentrePage() {
  const utils = api.useUtils();
  const snapshotQuery = api.community.getSnapshot.useQuery(undefined, {
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
  const trackAction = api.community.trackAction.useMutation({
    onSuccess: async () => {
      await utils.community.getSnapshot.invalidate();
    },
  });

  const copyReferralLink = async (referralLink: string) => {
    await navigator.clipboard.writeText(referralLink);
    await trackAction.mutateAsync({ action: 'copy_referral_link' });
  };

  if (snapshotQuery.isLoading) return <LoadingState />;

  if (snapshotQuery.isError || !snapshotQuery.data) {
    return (
      <section className="rounded-3xl border border-rose-400/25 bg-rose-500/10 p-6">
        <h1 className="text-xl font-semibold text-rose-100">Community Centre failed to load</h1>
        <p className="mt-2 text-sm text-rose-50/80">
          {snapshotQuery.error?.message ?? 'Community snapshot is unavailable.'}
        </p>
        <button
          type="button"
          onClick={() => void snapshotQuery.refetch()}
          className="mt-4 inline-flex items-center rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-400"
        >
          Retry
        </button>
      </section>
    );
  }

  const snapshot = snapshotQuery.data;
  const hasCommunityContent = snapshot.events.length > 0 || snapshot.featuredOutcomes.length > 0 || snapshot.trending.length > 0;

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/15 via-slate-900/40 to-violet-900/25 p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-indigo-300/30 bg-indigo-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-200">
              <Users className="h-3.5 w-3.5" />
              Community Centre
            </p>
            <h1 className="mt-3 text-3xl font-bold text-white md:text-4xl">Grow with peers, proof, and shared momentum.</h1>
            <p className="mt-3 text-sm text-slate-300 md:text-base">
              Community is where members exchange wins, join focused events, and invite trusted peers. This screen now reads a
              server-authoritative snapshot instead of pretending hard-coded cards are product state. Imagine that, software behaving honestly.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-slate-200">
            <p className="font-semibold text-white">Primary action this week</p>
            <p className="mt-1 text-slate-300">{snapshot.primaryAction}</p>
            <p className="mt-2 text-xs text-slate-500">Updated {new Date(snapshot.generatedAt).toLocaleString()}</p>
          </div>
        </div>
      </section>

      {!hasCommunityContent ? <EmptyState prompt={snapshot.emptyStatePrompt} /> : null}

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
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              readOnly
              value={snapshot.referralLink}
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-300"
            />
            <button
              type="button"
              disabled={trackAction.isPending}
              onClick={() => void copyReferralLink(snapshot.referralLink)}
              className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {trackAction.isPending ? 'Saving...' : 'Copy referral link'}
            </button>
          </div>
        </article>

        <article className={SECTION_CARD}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400">Social proof</p>
              <h2 className="mt-1 text-lg font-semibold text-white">Featured member outcomes</h2>
            </div>
            <Star className="h-5 w-5 text-amber-300" />
          </div>
          {snapshot.featuredOutcomes.length === 0 ? (
            <p className="mt-3 text-sm text-slate-300">No featured outcomes yet. First useful community artifact beats fake applause.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              {snapshot.featuredOutcomes.map((outcome) => (
                <li key={outcome.id}>
                  <span className="font-semibold text-white">{outcome.memberName}</span> — {outcome.outcome}
                  <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-slate-400">
                    {outcome.proofSignal}
                  </span>
                </li>
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
          {snapshot.events.length === 0 ? (
            <p className="mt-3 text-sm text-slate-300">No events are scheduled yet.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              {snapshot.events.map((event) => (
                <li key={event.id}>
                  <span className="font-semibold text-white">{event.startsAtLabel}: {event.title}</span>
                  <span className="block text-slate-400">{event.description}</span>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            disabled={trackAction.isPending}
            onClick={() => void trackAction.mutateAsync({ action: 'view_event_details' })}
            className="mt-4 inline-flex items-center rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
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
          {snapshot.trending.length === 0 ? (
            <p className="mt-3 text-sm text-slate-300">No trending topics yet.</p>
          ) : (
            <div className="mt-3 space-y-2 text-sm text-slate-300">
              {snapshot.trending.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
          )}
        </article>
      </section>

      <EmptyState prompt={snapshot.emptyStatePrompt} />
    </div>
  );
}
