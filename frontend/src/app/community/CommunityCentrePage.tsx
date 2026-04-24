import {
  Award,
  CalendarDays,
  Gift,
  HandHeart,
  Handshake,
  Megaphone,
  Newspaper,
  Sparkles,
  Users,
} from 'lucide-react';
import { api } from '@/lib/api';

const SECTION_CARD =
  'rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]';

type CommunityCard = {
  id: string;
  title: string;
  category: string;
  description: string;
  ctaLabel: string;
};

type ExperiencePost = {
  id: string;
  authorLabel: string;
  topic: string;
  lesson: string;
  moduleHint: string;
};

type SupportOption = {
  id: string;
  title: string;
  description: string;
  ctaLabel: string;
};

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="h-56 animate-pulse rounded-3xl bg-white/5" />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="h-56 animate-pulse rounded-2xl bg-white/5" />
        <div className="h-56 animate-pulse rounded-2xl bg-white/5" />
        <div className="h-56 animate-pulse rounded-2xl bg-white/5" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-64 animate-pulse rounded-2xl bg-white/5" />
        <div className="h-64 animate-pulse rounded-2xl bg-white/5" />
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
          <h3 className="font-semibold text-emerald-100">Start the community board</h3>
          <p className="mt-1 text-sm text-emerald-50/90">{prompt}</p>
        </div>
      </div>
    </section>
  );
}

function CardListSection({
  title,
  eyebrow,
  icon: Icon,
  items,
  onAction,
  isPending,
}: {
  title: string;
  eyebrow: string;
  icon: React.ElementType;
  items: CommunityCard[];
  onAction: () => void;
  isPending: boolean;
}) {
  return (
    <article className={SECTION_CARD}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-400">{eyebrow}</p>
          <h2 className="mt-1 text-lg font-semibold text-white">{title}</h2>
        </div>
        <Icon className="h-5 w-5 text-indigo-300" />
      </div>

      {items.length === 0 ? (
        <p className="mt-3 text-sm text-slate-300">No items yet.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl border border-white/8 bg-black/20 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {item.category}
                </span>
                <h3 className="text-sm font-semibold text-white">{item.title}</h3>
              </div>
              <p className="mt-2 text-sm text-slate-300">{item.description}</p>
              <button
                type="button"
                disabled={isPending}
                onClick={onAction}
                className="mt-3 inline-flex items-center rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {item.ctaLabel}
              </button>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

function ExperienceExchange({ items }: { items: ExperiencePost[] }) {
  return (
    <article className={SECTION_CARD}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-400">Wymiana doświadczeń</p>
          <h2 className="mt-1 text-lg font-semibold text-white">Experience Exchange</h2>
        </div>
        <Users className="h-5 w-5 text-emerald-300" />
      </div>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-slate-300">No shared experience posts yet.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-xl border border-white/8 bg-black/20 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                  {item.authorLabel}
                </span>
                <span className="text-sm font-semibold text-white">{item.topic}</span>
              </div>
              <p className="mt-2 text-sm text-slate-300">{item.lesson}</p>
              <p className="mt-2 text-xs text-slate-500">Related module: {item.moduleHint}</p>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

function SupportSection({
  title,
  eyebrow,
  icon: Icon,
  items,
  onAction,
  isPending,
}: {
  title: string;
  eyebrow: string;
  icon: React.ElementType;
  items: SupportOption[];
  onAction: (id: string) => void;
  isPending: boolean;
}) {
  return (
    <article className={SECTION_CARD}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-400">{eyebrow}</p>
          <h2 className="mt-1 text-lg font-semibold text-white">{title}</h2>
        </div>
        <Icon className="h-5 w-5 text-amber-300" />
      </div>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-xl border border-white/8 bg-black/20 p-3">
            <h3 className="text-sm font-semibold text-white">{item.title}</h3>
            <p className="mt-2 text-sm text-slate-300">{item.description}</p>
            <button
              type="button"
              disabled={isPending}
              onClick={() => onAction(item.id)}
              className="mt-3 inline-flex items-center rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {item.ctaLabel}
            </button>
          </div>
        ))}
      </div>
    </article>
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
  const hasCommunityContent =
    snapshot.announcements.length > 0 ||
    snapshot.contests.length > 0 ||
    snapshot.productNews.length > 0 ||
    snapshot.experienceExchange.length > 0;

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/15 via-slate-900/40 to-violet-900/25 p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-indigo-300/30 bg-indigo-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-200">
              <Users className="h-3.5 w-3.5" />
              Community Centre
            </p>
            <h1 className="mt-3 text-3xl font-bold text-white md:text-4xl">Board, contests, news, and open support space.</h1>
            <p className="mt-3 text-sm text-slate-300 md:text-base">
              Community Centre is a practical notice board: announcements, competitions, product news, shared experience, open space,
              patronage for people in harder situations, and volunteering. Not a decorative social wall, because apparently we are still
              trying to build software with a pulse.
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

      <section className="grid gap-4 xl:grid-cols-3">
        <CardListSection
          title="Announcements"
          eyebrow="Tablica ogłoszeń"
          icon={Megaphone}
          items={snapshot.announcements}
          onAction={() => void trackAction.mutateAsync({ action: 'open_announcement' })}
          isPending={trackAction.isPending}
        />
        <CardListSection
          title="Contests"
          eyebrow="Konkursy"
          icon={Award}
          items={snapshot.contests}
          onAction={() => void trackAction.mutateAsync({ action: 'open_contest' })}
          isPending={trackAction.isPending}
        />
        <CardListSection
          title="Product News"
          eyebrow="Nowości"
          icon={Newspaper}
          items={snapshot.productNews}
          onAction={() => void trackAction.mutateAsync({ action: 'open_product_news' })}
          isPending={trackAction.isPending}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <ExperienceExchange items={snapshot.experienceExchange} />

        <article className={SECTION_CARD}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400">Open Space</p>
              <h2 className="mt-1 text-lg font-semibold text-white">Requests, questions, shared help</h2>
            </div>
            <CalendarDays className="h-5 w-5 text-cyan-300" />
          </div>
          <div className="mt-4 space-y-2 text-sm text-slate-300">
            {snapshot.openSpacePrompts.map((prompt) => (
              <p key={prompt}>• {prompt}</p>
            ))}
          </div>
          <button
            type="button"
            disabled={trackAction.isPending}
            onClick={() => void trackAction.mutateAsync({ action: 'open_open_space' })}
            className="mt-4 inline-flex items-center rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Open Space board
          </button>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <SupportSection
          title="Patronage and Gift Credits"
          eyebrow="Refer a Friend + Become a Patron"
          icon={Gift}
          items={snapshot.patronageOptions}
          isPending={trackAction.isPending}
          onAction={(id) =>
            void trackAction.mutateAsync({ action: id === 'gift-credits' ? 'buy_credits_for_someone' : 'become_patron' })
          }
        />
        <SupportSection
          title="Volunteering"
          eyebrow="Sekcja wolontariat"
          icon={HandHeart}
          items={snapshot.volunteeringOptions}
          isPending={trackAction.isPending}
          onAction={() => void trackAction.mutateAsync({ action: 'volunteer' })}
        />
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">Refer a Friend</p>
            <h2 className="mt-1 text-lg font-semibold text-white">Invite someone useful, not everyone in your contacts</h2>
          </div>
          <Handshake className="h-5 w-5 text-emerald-300" />
        </div>
        <p className="mt-3 text-sm text-slate-300">
          Referral is still here, but it is no longer the whole Community Centre. It belongs beside patronage, volunteering, and the board.
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
      </section>

      <EmptyState prompt={snapshot.emptyStatePrompt} />
    </div>
  );
}
