import type { ComponentType, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart2,
  LineChart,
  PieChart,
  Sparkles,
  Target,
  TrendingUp,
  Wand2,
} from 'lucide-react';

/**
 * AI Analysis — layout aligned with `docs/features/19-screens-for-users-and-agents.md` §9.
 * Chart values are illustrative until wired to profile + evaluator endpoints.
 */
export default function AiAnalysisPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-indigo-400">
          <Sparkles className="h-4 w-4" />
          AI Analysis
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Strengths, Gaps, And Next Moves</h1>
        <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-400">
          This screen is the interpretation layer from the product spec: summary, strengths, gaps, recommendations,
          rewrite hints, and detected signals. Charts below use{' '}
          <strong className="text-slate-800 dark:text-slate-200">demo data</strong> until backend analysis is connected.
        </p>
      </header>

      {/* Analysis Summary */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900/60">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Analysis Summary</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Your positioning is strongest on delivery evidence and weakest on quantified outcomes in the last role.
          Priority: tighten three CV bullets and add one measurable negotiation outcome before the next application wave.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
            Fit: strong for product roles
          </span>
          <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-800 dark:text-amber-200">
            Risk: thin metrics in 2023–2024
          </span>
          <span className="rounded-full bg-indigo-500/15 px-3 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300">
            Signal: leadership inferred from copy
          </span>
        </div>
      </section>

      {/* Charts row — pie / bar / line */}
      <section className="grid gap-6 lg:grid-cols-3">
        <ChartCard title="Signal Mix" icon={PieChart} subtitle="Where attention goes today">
          <PieDemo />
        </ChartCard>
        <ChartCard title="Skill Confidence" icon={BarChart2} subtitle="Top five signals (0–100)">
          <BarDemo />
        </ChartCard>
        <ChartCard title="Twelve Week Trajectory" icon={LineChart} subtitle="Composite readiness (demo)">
          <LineDemo />
        </ChartCard>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-slate-900/60">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            Strengths
          </h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-400">
            <li>Clear ownership language in recent projects.</li>
            <li>STAR-ready stories for conflict and prioritisation.</li>
            <li>Strong alignment with hybrid collaboration norms.</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-slate-900/60">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
            <Target className="h-5 w-5 text-amber-500" />
            Gaps
          </h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-400">
            <li>Metrics missing on two flagship outcomes.</li>
            <li>Negotiation examples lack explicit trade-off framing.</li>
            <li>Skill Lab evidence thin for stakeholder management.</li>
          </ul>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-slate-900/60">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recommendations</h2>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-slate-600 dark:text-slate-400">
          <li>Add one revenue or retention metric per bullet in your latest role.</li>
          <li>Record a two-minute negotiation recap to capture counter-offer logic.</li>
          <li>Link one course completion to stakeholder influence in Skill Lab.</li>
        </ol>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-slate-900/60">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
          <Wand2 className="h-5 w-5 text-violet-500" />
          Suggested Rewrite
        </h2>
        <p className="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700 dark:border-white/10 dark:bg-slate-950/50 dark:text-slate-300">
          Led cross-team delivery of the billing migration, coordinating five engineers and cutting invoice disputes by{' '}
          <strong>32%</strong> within one quarter by introducing a shared reconciliation dashboard and weekly risk review.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-500/10 px-4 py-2 text-sm font-semibold text-indigo-700 dark:text-indigo-300"
          >
            Apply Suggestion
            <ArrowRight className="h-4 w-4" />
          </button>
          <Link
            to="/skills"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/5"
          >
            Open Skill Lab
          </Link>
          <Link
            to="/negotiation"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/5"
          >
            Open Negotiation
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-slate-900/60">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Signals Detected</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {['Evidence Density', 'Quantified Outcomes', 'Scope Narrative', 'Stakeholder Map', 'Risk Framing'].map((s) => (
            <span
              key={s}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-white/15 dark:text-slate-300"
            >
              {s}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon: ComponentType<{ className?: string }>;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900/60">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
        <Icon className="h-5 w-5 shrink-0 text-indigo-500" />
      </div>
      <div className="mt-4 flex min-h-[180px] items-center justify-center">{children}</div>
    </div>
  );
}

/** Simple donut: strengths / gaps / growth */
function PieDemo() {
  const r = 56;
  const c = 2 * Math.PI * r;
  const s1 = c * 0.42;
  const s2 = c * 0.33;
  const s3 = c * 0.25;
  return (
    <div className="flex flex-col items-center gap-3">
      <svg width={160} height={160} viewBox="0 0 160 160" aria-label="Demo pie chart: signal mix">
        <g transform="translate(80,80) rotate(-90)">
          <circle r={r} cx={0} cy={0} fill="none" stroke="#22c55e" strokeWidth={20} strokeDasharray={`${s1} ${c - s1}`} />
          <circle
            r={r}
            cx={0}
            cy={0}
            fill="none"
            stroke="#f59e0b"
            strokeWidth={20}
            strokeDasharray={`${s2} ${c - s2}`}
            strokeDashoffset={-s1}
          />
          <circle
            r={r}
            cx={0}
            cy={0}
            fill="none"
            stroke="#6366f1"
            strokeWidth={20}
            strokeDasharray={`${s3} ${c - s3}`}
            strokeDashoffset={-(s1 + s2)}
          />
        </g>
        <text x={80} y={84} textAnchor="middle" className="fill-slate-900 text-xs font-bold dark:fill-white">
          Demo
        </text>
      </svg>
      <ul className="flex flex-wrap justify-center gap-3 text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
        <li>
          <span className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-500" /> Strengths
        </li>
        <li>
          <span className="mr-1 inline-block h-2 w-2 rounded-full bg-amber-500" /> Gaps
        </li>
        <li>
          <span className="mr-1 inline-block h-2 w-2 rounded-full bg-indigo-500" /> Growth
        </li>
      </ul>
    </div>
  );
}

function BarDemo() {
  const rows = [
    { label: 'Delivery', v: 82 },
    { label: 'Metrics', v: 48 },
    { label: 'Leadership', v: 71 },
    { label: 'Stakeholder', v: 55 },
    { label: 'Negotiation', v: 63 },
  ];
  return (
    <div className="w-full max-w-xs space-y-3">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="mb-1 flex justify-between text-[11px] font-medium text-slate-600 dark:text-slate-400">
            <span>{row.label}</span>
            <span>{row.v}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
              style={{ width: `${row.v}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function LineDemo() {
  const w = 240;
  const h = 120;
  const pts = [20, 35, 32, 48, 55, 52, 68, 72, 70, 78, 82, 80];
  const max = 100;
  const step = w / (pts.length - 1);
  const d = pts
    .map((y, i) => {
      const x = i * step;
      const py = h - (y / max) * h;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${py.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg width={w} height={h + 24} viewBox={`0 0 ${w} ${h + 24}`} className="text-indigo-500" aria-label="Demo line chart">
      <rect x={0} y={0} width={w} height={h} rx={8} className="fill-slate-50 dark:fill-slate-950/80" />
      <path d={d} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((y, i) => (
        <circle
          key={i}
          cx={i * step}
          cy={h - (y / max) * h}
          r={3}
          className="fill-white stroke-indigo-500 dark:fill-slate-900"
          strokeWidth={2}
        />
      ))}
      <text x={4} y={h + 16} className="fill-slate-500 text-[9px] dark:fill-slate-500">
        Weeks 1–12 (illustrative)
      </text>
    </svg>
  );
}
