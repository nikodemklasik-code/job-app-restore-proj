import { BriefcaseBusiness, CalendarDays, Handshake, HeartHandshake, Megaphone, Sparkles, Star, Users } from 'lucide-react';

const SECTION_CARD =
  'rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]';

export default function CommunityCentrePage() {
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
              Community is where members exchange wins, join focused events, and invite trusted peers. Keep this space practical:
              one clear action path, visible proof, and lightweight engagement.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-slate-200">
            <p className="font-semibold text-white">Primary action this week</p>
            <p className="mt-1 text-slate-300">Invite one peer and share one verified outcome.</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-emerald-400/25 bg-emerald-500/10 p-6 md:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-100">
              <HeartHandshake className="h-3.5 w-3.5" />
              Community Goodwill
            </p>
            <h2 className="mt-3 text-2xl font-bold text-white md:text-3xl">Goodwill moves. People remain equal.</h2>
            <div className="mt-4 space-y-3 text-sm leading-6 text-emerald-50/90 md:text-base">
              <p>Community Goodwill is voluntary.</p>
              <p>A person contributes because they want to. A person uses access because it is available.</p>
              <p>
                The platform applies its allocation rules. The community accepts the outcome of those rules. The person
                using access decides whether and how to use it.
              </p>
              <p>Contribution does not create control. Use does not create debt.</p>
            </div>
          </div>
          <div className="rounded-2xl border border-emerald-200/20 bg-black/15 p-4 text-sm text-emerald-50/90 lg:max-w-sm">
            <p className="font-semibold text-white">Three principles</p>
            <ol className="mt-3 space-y-2 pl-4 text-sm leading-6">
              <li>Be human when using Community Goodwill.</li>
              <li>When contributing, accept that goodwill leaves your hands and enters the community.</li>
              <li>When using covered access, do so on your own responsibility.</li>
            </ol>
          </div>
        </div>
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-emerald-50/85">
          Community Goodwill should not require personal stories, gratitude performance or proof of moral worth.
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className={SECTION_CARD}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400">Community board</p>
              <h2 className="mt-1 text-lg font-semibold text-white">Give, receive, look for, offer</h2>
            </div>
            <Megaphone className="h-5 w-5 text-fuchsia-300" />
          </div>
          <div className="mt-3 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
            <p className="rounded-xl border border-white/10 bg-white/5 p-3">Oddam / I can give</p>
            <p className="rounded-xl border border-white/10 bg-white/5 p-3">Przyjmę / I can receive</p>
            <p className="rounded-xl border border-white/10 bg-white/5 p-3">Poszukuję / I am looking for</p>
            <p className="rounded-xl border border-white/10 bg-white/5 p-3">Oferuję / I can offer</p>
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-400">
            Board posts should stay practical, respectful and clear. No personal pressure, no private-data requests, no hidden recruitment traps.
          </p>
        </article>

        <article className={SECTION_CARD}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400">NGO, volunteering and fair placements</p>
              <h2 className="mt-1 text-lg font-semibold text-white">Useful opportunities without exploitation</h2>
            </div>
            <BriefcaseBusiness className="h-5 w-5 text-cyan-300" />
          </div>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            <li>• NGO and foundation announcements.</li>
            <li>• Volunteering with clear scope, time and expectations.</li>
            <li>• Paid internships, paid placements and paid traineeships.</li>
            <li>• Unpaid roles must be clearly marked and cannot replace real work that should be paid.</li>
          </ul>
          <p className="mt-3 text-xs leading-5 text-slate-400">
            Community can show opportunity. It must not dress exploitation as experience. Fancy wording, same old unpaid labour circus, no thanks.
          </p>
        </article>
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
              <p className="text-xs uppercase tracking-wider text-slate-400">Social proof</p>
              <h2 className="mt-1 text-lg font-semibold text-white">Featured member outcomes</h2>
            </div>
            <Star className="h-5 w-5 text-amber-300" />
          </div>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            <li>• Elena — improved interview confidence score after Daily Warmup streak.</li>
            <li>• Marcus — converted report insights into stronger application replies.</li>
            <li>• Priya — negotiated compensation band with clear value framing.</li>
          </ul>
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
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            <li>• Thursday: Interview Rehearsal Sprint</li>
            <li>• Saturday: Negotiation Language Lab</li>
            <li>• Tuesday: Skill Value Positioning Q&amp;A</li>
          </ul>
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
          <div className="mt-3 space-y-2 text-sm text-slate-300">
            <p>Top topic: Follow-up strategy after 7+ days of silence.</p>
            <p>Most saved template: Compensation boundary response draft.</p>
            <p>Fastest growing ritual: 10-minute Daily Warmup challenge.</p>
          </div>
        </article>
      </section>

      <section className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-5">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 text-emerald-300" />
          <div>
            <h3 className="font-semibold text-emerald-100">Community Goodwill note</h3>
            <p className="mt-1 text-sm text-emerald-50/90">
              Community Goodwill covers product usage costs for eligible actions. It does not create personal claims, debt,
              hierarchy, reporting duties or access to private user data. Covered actions are settled through the product cost model.
              The platform does not add profit to covered actions.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
