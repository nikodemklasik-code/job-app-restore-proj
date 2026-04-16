import type { ComponentType, ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart2,
  Briefcase,
  ClipboardList,
  FileText,
  LineChart,
  Loader2,
  MessageSquare,
  PieChart,
  Radar,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  Wand2,
  AlertCircle,
  Handshake,
  FolderOpen,
} from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { SupportingMaterialsDisclaimer } from '@/components/SupportingMaterialsDisclaimer';
import { useProfileStore } from '@/stores/profileStore';
import { api } from '@/lib/api';
import type { ProfileSnapshot, ProfileExperience } from '../../../../shared/profile';

// ── Live analysis (same contract as Skill Lab `style.analyzeDocument`) ─────

interface AnalysisResult {
  wordCount: number;
  sentenceCount: number;
  avgSentenceLength: number;
  tone: { professional?: number; confident?: number; formal?: number };
  topVerbs: string[];
  suggestions: string[];
  score: number;
}

interface DerivedInsight {
  strengths: string[];
  gaps: string[];
  recommendations: { text: string; to: string; cta: string }[];
  signalTags: string[];
  summaryParagraph: string;
  mix: { strengths: number; gaps: number; growth: number };
  skillBars: { label: string; v: number }[];
}

function experienceHasMetric(ex: ProfileExperience): boolean {
  return /\d/.test(ex.description ?? '');
}

function deriveInsights(profile: ProfileSnapshot | null): DerivedInsight | null {
  if (!profile) return null;
  const { personalInfo, skills, experiences, educations, trainings } = profile;
  const profileSummary = personalInfo.summary?.trim() ?? '';
  const strengths: string[] = [];
  const gaps: string[] = [];

  if (skills.length >= 3) {
    strengths.push(`You list ${skills.length} skills — good breadth for keyword alignment.`);
  } else if (skills.length > 0) {
    gaps.push('Add more core skills (aim for at least three) so analysis can compare role fit.');
  } else {
    gaps.push('No skills on profile yet — add the stack you actually use in target roles.');
  }

  if (profileSummary.length >= 120) {
    strengths.push('Professional summary has enough depth to anchor narrative and AI context.');
  } else if (profileSummary.length > 0) {
    gaps.push('Extend your summary with one concrete outcome and one scope line (team size, domain).');
  } else {
    gaps.push('Add a professional summary — it is the fastest lever for every downstream module.');
  }

  const richExp = experiences.filter((e) => (e.description?.trim().length ?? 0) >= 80);
  if (richExp.length > 0) {
    strengths.push(`${richExp.length} role${richExp.length === 1 ? '' : 's'} have detailed descriptions — strong evidence base.`);
  }
  const weakMetrics = experiences.filter((e) => !experienceHasMetric(e));
  if (experiences.length > 0 && weakMetrics.length > 0) {
    gaps.push(`${weakMetrics.length} experience entr${weakMetrics.length === 1 ? 'y lacks' : 'ies lack'} quantified outcomes (add %, £, time, or scale).`);
  }
  if (experiences.length === 0) {
    gaps.push('Add at least one experience block so fit and gap analysis can reference real roles.');
  }

  if (trainings.length > 0) {
    strengths.push(`${trainings.length} training or certification entr${trainings.length === 1 ? 'y' : 'ies'} — visible learning evidence.`);
  } else {
    gaps.push('Link courses or certificates in Profile to strengthen proof for high-value skills.');
  }

  if (educations.length > 0) {
    strengths.push(`${educations.length} education entr${educations.length === 1 ? 'y' : 'ies'} on file.`);
  }

  const recommendations = [
    { text: 'Tighten CV and documents before the next application wave.', to: '/documents?tab=upload', cta: 'Open Document Lab' },
    { text: 'Map skills to role text and close evidence gaps.', to: '/skills', cta: 'Open Skill Lab' },
    { text: 'Practice salary and boundary language with structured prompts.', to: '/negotiation', cta: 'Open Negotiation' },
    { text: 'Run employer and listing checks before you commit.', to: '/job-radar', cta: 'Open Job Radar' },
    { text: 'Ask follow-ups in context when you are stuck between modules.', to: '/assistant', cta: 'Open Assistant' },
  ];

  const signalTags: string[] = ['Profile Snapshot', 'Evidence Density', 'Quantified Outcomes'];
  if (trainings.length) signalTags.push('Learning Evidence');
  if (educations.length) signalTags.push('Education Signal');
  if (richExp.length >= 2) signalTags.push('Scope Narrative');

  const mix = {
    strengths: Math.max(1, strengths.length * 3 + skills.length),
    gaps: Math.max(1, gaps.length * 3),
    growth: Math.max(1, educations.length + trainings.length + 2),
  };

  const skillBars = skills.slice(0, 6).map((skill) => {
    const needle = skill.toLowerCase();
    let hits = 0;
    for (const ex of experiences) {
      const d = (ex.description ?? '').toLowerCase();
      if (d.includes(needle)) hits += 1;
    }
    const v = 28 + Math.min(72, hits * 22 + (profileSummary.toLowerCase().includes(needle) ? 12 : 0));
    return { label: skill, v };
  });
  if (skillBars.length === 0) {
    skillBars.push({ label: 'Add Skills In Profile', v: 0 });
  }

  const summaryParagraph =
    strengths.length >= gaps.length
      ? 'Overall your profile reads as evidence-forward. Priority is to convert remaining narrative gaps into measurable outcomes before the next high-stakes application or interview.'
      : 'Overall the profile needs more concrete evidence and structure. Priority is to fill summary, skills, and quantified outcomes so downstream tools can produce reliable guidance.';

  return {
    strengths,
    gaps,
    recommendations,
    signalTags,
    summaryParagraph,
    mix,
    skillBars,
  };
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
    <div className="mvh-card-glow rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>
        </div>
        <Icon className="h-6 w-6 shrink-0 text-indigo-600 dark:text-indigo-400" />
      </div>
      <div className="mt-6 flex min-h-[200px] items-center justify-center">{children}</div>
    </div>
  );
}

/** Donut from three non-fake counts (profile-derived); normalized for display only. */
function SignalMixChart({ a, b, c }: { a: number; b: number; c: number }) {
  const total = a + b + c;
  const r = 56;
  const circumference = 2 * Math.PI * r;
  const seg = (n: number) => (n / total) * circumference;
  const s1 = seg(a);
  const s2 = seg(b);
  const s3 = seg(c);
  return (
    <div className="flex flex-col items-center gap-4">
      <svg width={168} height={168} viewBox="0 0 168 168" aria-label="Signal mix from profile-derived counts">
        <g transform="translate(84,84) rotate(-90)">
          <circle r={r} cx={0} cy={0} fill="none" stroke="#22c55e" strokeWidth={22} strokeDasharray={`${s1} ${circumference}`} />
          <circle
            r={r}
            cx={0}
            cy={0}
            fill="none"
            stroke="#f59e0b"
            strokeWidth={22}
            strokeDasharray={`${s2} ${circumference}`}
            strokeDashoffset={-s1}
          />
          <circle
            r={r}
            cx={0}
            cy={0}
            fill="none"
            stroke="#6366f1"
            strokeWidth={22}
            strokeDasharray={`${s3} ${circumference}`}
            strokeDashoffset={-(s1 + s2)}
          />
        </g>
        <text x={84} y={88} textAnchor="middle" className="fill-slate-900 text-sm font-bold dark:fill-white">
          Mix
        </text>
      </svg>
      <ul className="flex flex-wrap justify-center gap-4 text-sm font-medium text-slate-700 dark:text-slate-300">
        <li className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden />
          Strengths Signal ({a})
        </li>
        <li className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500" aria-hidden />
          Gap Pressure ({b})
        </li>
        <li className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" aria-hidden />
          Growth Base ({c})
        </li>
      </ul>
      <p className="max-w-xs text-center text-xs text-slate-600 dark:text-slate-500">
        Segments use counts from your profile heuristics, not salary or external market percentages.
      </p>
    </div>
  );
}

function SkillConfidenceChart({ rows }: { rows: { label: string; v: number }[] }) {
  return (
    <div className="w-full max-w-sm space-y-4">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="mb-1.5 flex justify-between text-sm font-medium text-slate-800 dark:text-slate-300">
            <span>{row.label}</span>
            <span className="tabular-nums text-slate-600 dark:text-slate-400">{row.v}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
              style={{ width: `${row.v}%` }}
            />
          </div>
        </div>
      ))}
      <p className="text-xs text-slate-600 dark:text-slate-500">
        Scores reflect how strongly each skill appears in your summary and experience text (local heuristic).
      </p>
    </div>
  );
}

function CoverageSnapshot({ profile }: { profile: ProfileSnapshot }) {
  const { experiences, educations, trainings } = profile;
  const withMetrics = experiences.filter(experienceHasMetric).length;
  const rows: { label: string; value: string; positive: boolean }[] = [
    {
      label: 'Roles With Quantified Outcomes',
      value: `${withMetrics} / ${experiences.length || 0}`,
      positive: experiences.length > 0 && withMetrics === experiences.length,
    },
    { label: 'Education Entries', value: String(educations.length), positive: educations.length > 0 },
    { label: 'Trainings And Certificates', value: String(trainings.length), positive: trainings.length > 0 },
  ];
  return (
    <div className="w-full space-y-4">
      {rows.map((row) => (
        <div
          key={row.label}
          className="mvh-card-glow flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]"
        >
          <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{row.label}</span>
          <span className={`text-sm font-semibold tabular-nums ${row.positive ? 'text-emerald-400' : 'text-amber-300'}`}>
            {row.value}
          </span>
        </div>
      ))}
      <p className="text-sm text-slate-600 dark:text-slate-400">
        These numbers come straight from your saved profile — no fabricated trajectory.
      </p>
    </div>
  );
}

export default function AiAnalysisPage() {
  const { user } = useUser();
  const userId = user?.id ?? '';
  const { profile, isLoadingProfile, error, loadProfile, dismissError } = useProfileStore();
  const [jdInput, setJdInput] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const analyzeMutation = api.style.analyzeDocument.useMutation({
    onSuccess: (data) => setAnalysisResult(data as AnalysisResult),
  });

  useEffect(() => {
    if (!profile && !isLoadingProfile && !error) void loadProfile();
  }, [profile, isLoadingProfile, error, loadProfile]);

  const insight = useMemo(() => deriveInsights(profile), [profile]);

  const handleRunCompare = () => {
    const text = jdInput.trim() || profile?.personalInfo.summary?.trim() || '';
    if (!text || !userId) return;
    analyzeMutation.mutate({ userId, text, documentType: 'skills' });
  };

  const rewriteSample =
    analysisResult?.suggestions?.[0]
    ?? (profile?.experiences?.[0]?.description?.trim().slice(0, 220)
      ? `${profile.experiences[0].description!.trim().slice(0, 220)}…`
      : 'Add a results-focused bullet in Profile — we will surface a rewrite here once there is source text or after you run Compare To Role Text.');

  const isEmptyProfile =
    profile &&
    (profile.skills?.length ?? 0) === 0 &&
    (profile.experiences?.length ?? 0) === 0 &&
    !(profile.personalInfo.summary?.trim());

  if (isLoadingProfile && !profile) {
    return (
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-4 px-4 py-24">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-400" aria-hidden />
        <p className="text-base font-medium text-slate-300">Loading Your Profile For Analysis…</p>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="mvh-card-glow mx-auto max-w-2xl space-y-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-red-400" aria-hidden />
        <p className="text-base text-red-200">{error}</p>
        <button
          type="button"
          onClick={() => {
            dismissError();
            void loadProfile();
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-10">
      {/* Hero */}
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 text-sm font-semibold uppercase tracking-widest text-indigo-400">
          <Sparkles className="h-5 w-5" aria-hidden />
          AI Analysis
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">Interpretation, Not A Second Chat</h1>
        <p className="max-w-3xl text-base leading-relaxed text-slate-300 md:text-lg">
          This screen summarizes strengths, gaps, and next moves from your saved profile. Run Compare To Role Text
          against a job description to add a live document match layer — without invented salary or market percentages.
        </p>
        <SupportingMaterialsDisclaimer collapsible defaultExpanded={false} className="max-w-3xl" />
      </header>

      {/* Action rail — primary portal CTAs */}
      <section className="mvh-card-glow rounded-2xl border border-indigo-500/25 bg-gradient-to-br from-indigo-500/15 to-slate-900/40 p-6">
        <p className="text-sm font-semibold uppercase tracking-wider text-indigo-300">Next Actions</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            to="/documents?tab=upload"
            className="mvh-card-glow inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-900/30 transition hover:bg-indigo-500"
          >
            <FolderOpen className="h-4 w-4" />
            Open Document Lab
          </Link>
          <Link
            to="/skills"
            className="mvh-card-glow inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
          >
            <Target className="h-4 w-4" />
            Open Skill Lab
          </Link>
          <Link
            to="/assistant"
            className="mvh-card-glow inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
          >
            <MessageSquare className="h-4 w-4" />
            Open Assistant
          </Link>
          <Link
            to="/negotiation"
            className="mvh-card-glow inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
          >
            <Handshake className="h-4 w-4" />
            Open Negotiation
          </Link>
          <Link
            to="/job-radar"
            className="mvh-card-glow inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
          >
            <Radar className="h-4 w-4" />
            Open Job Radar
          </Link>
          <Link
            to="/applications"
            className="mvh-card-glow inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
          >
            <ClipboardList className="h-4 w-4" />
            Open Applications
          </Link>
          <Link
            to="/profile"
            className="mvh-card-glow inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
          >
            <Briefcase className="h-4 w-4" />
            Open Profile
          </Link>
        </div>
      </section>

      {isEmptyProfile && (
        <section className="mvh-card-glow rounded-2xl border border-dashed border-amber-500/40 bg-amber-500/10 p-8 text-center">
          <FileText className="mx-auto h-12 w-12 text-amber-400" aria-hidden />
          <h2 className="mt-4 text-xl font-semibold text-white">Profile Is Too Thin For Rich Analysis</h2>
          <p className="mx-auto mt-2 max-w-lg text-base text-amber-100/90">
            Add a summary, at least one role, and a few skills. This page will then populate strengths, gaps, and charts from real data.
          </p>
          <Link
            to="/profile"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            Complete Profile
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      )}

      {profile && insight && (
        <>
          {/* PO layout §2.1: charts row first, then summary + two columns, recommendations, compare, rewrite, signals */}
          <section className="grid gap-6 lg:grid-cols-3">
            <ChartCard title="Signal Mix" icon={PieChart} subtitle="From Profile Heuristics (Counts)">
              <SignalMixChart a={insight.mix.strengths} b={insight.mix.gaps} c={insight.mix.growth} />
            </ChartCard>
            <ChartCard title="Skill Signal In Text" icon={BarChart2} subtitle="How Strongly Skills Appear In Your Copy">
              <SkillConfidenceChart rows={insight.skillBars} />
            </ChartCard>
            <ChartCard title="Evidence Coverage" icon={LineChart} subtitle="Concrete Fields On Your Profile">
              <CoverageSnapshot profile={profile} />
            </ChartCard>
          </section>

          <section className="mvh-card-glow rounded-2xl border border-white/10 bg-white/[0.04] p-8">
            <h2 className="text-xl font-semibold text-white">Analysis Summary</h2>
            <p className="mt-4 text-base leading-relaxed text-slate-300">{insight.summaryParagraph}</p>
          </section>

          <div className="grid gap-8 lg:grid-cols-2">
            <section className="mvh-card-glow rounded-2xl border border-white/10 bg-white/[0.04] p-8">
              <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
                <TrendingUp className="h-6 w-6 text-emerald-400" aria-hidden />
                Strengths
              </h2>
              <p className="mt-2 text-sm text-slate-500">Inferred from saved profile fields — not a separate chat transcript.</p>
              <ul className="mt-6 space-y-4 text-base text-slate-300">
                {insight.strengths.map((item) => (
                  <li key={item} className="flex gap-3 border-l-2 border-emerald-500/50 pl-4">
                    {item}
                  </li>
                ))}
                {insight.strengths.length === 0 && (
                  <li className="text-slate-500">No strengths inferred yet — enrich your profile.</li>
                )}
              </ul>
            </section>

            <section className="mvh-card-glow rounded-2xl border border-white/10 bg-white/[0.04] p-8">
              <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
                <Target className="h-6 w-6 text-amber-400" aria-hidden />
                Gaps
              </h2>
              <p className="mt-2 text-sm text-slate-500">Concrete missing evidence or structure we see before role-specific compare.</p>
              <ul className="mt-6 space-y-4 text-base text-slate-300">
                {insight.gaps.map((item) => (
                  <li key={item} className="flex gap-3 border-l-2 border-amber-500/50 pl-4">
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section className="mvh-card-glow rounded-2xl border border-white/10 bg-white/[0.04] p-8">
            <h2 className="text-xl font-semibold text-white">Recommendations</h2>
            <ol className="mt-6 list-decimal space-y-4 pl-6 text-base text-slate-300">
              {insight.recommendations.map((rec) => (
                <li key={rec.to}>
                  <span>{rec.text}</span>
                  <Link
                    to={rec.to}
                    className="mvh-card-glow mt-2 inline-flex items-center gap-2 rounded-lg border border-transparent px-1 py-0.5 text-sm font-semibold text-indigo-400 hover:text-indigo-300"
                  >
                    {rec.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </li>
              ))}
            </ol>
          </section>

          {/* Live compare — real API */}
          <section className="mvh-card-glow rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-8">
            <h2 className="text-xl font-semibold text-white">Compare To Role Text</h2>
            <p className="mt-2 text-base text-slate-300">
              Paste a job description (or leave empty to use your profile summary). We call the same analysis path as Skill Lab (
              <code className="rounded bg-black/30 px-1.5 text-sm">style.analyzeDocument</code>
              ) — results below are live, not static copy.
            </p>
            <textarea
              rows={5}
              value={jdInput}
              onChange={(e) => setJdInput(e.target.value)}
              placeholder="Paste job description here, or clear to use your profile summary…"
              className="mt-4 w-full resize-none rounded-xl border border-white/15 bg-black/20 px-4 py-3 text-base text-white placeholder:text-slate-500 outline-none focus:border-indigo-500/50"
            />
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void handleRunCompare()}
                disabled={analyzeMutation.isPending || !userId || (!jdInput.trim() && !(profile.personalInfo.summary?.trim()))}
                className="mvh-card-glow inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {analyzeMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Running Analysis…
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    Run Compare
                  </>
                )}
              </button>
              {!userId && <span className="text-sm text-amber-300">Sign In To Run Live Compare.</span>}
            </div>
            {analyzeMutation.isError && (
              <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
                Analysis failed. Check your connection and try again.
              </p>
            )}
            {analysisResult && (
              <div className="mvh-card-glow mt-8 rounded-xl border border-white/10 bg-black/20 p-6">
                <div className="flex flex-wrap items-end gap-4">
                  <div>
                    <p className="text-sm font-medium uppercase tracking-wider text-slate-400">Match Score</p>
                    <p className="text-4xl font-black text-white">{analysisResult.score}</p>
                  </div>
                  <p className="text-sm text-slate-400">From document tone and structure vs pasted role text.</p>
                </div>
                {analysisResult.suggestions.length > 0 && (
                  <div className="mt-6">
                    <p className="text-sm font-semibold text-white">Top Suggestions</p>
                    <ul className="mt-3 space-y-2 text-base text-slate-300">
                      {analysisResult.suggestions.slice(0, 5).map((s) => (
                        <li key={s}>• {s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="mvh-card-glow rounded-2xl border border-white/10 bg-white/[0.04] p-8">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
              <Wand2 className="h-6 w-6 text-violet-400" aria-hidden />
              Suggested Rewrite
            </h2>
            <p className="mt-4 text-base text-slate-400">
              First line is either the top AI suggestion after Compare, or an excerpt from your lead experience — edit in Profile, then re-run Compare.
            </p>
            <blockquote className="mvh-card-glow mt-6 rounded-xl border border-white/10 bg-black/25 p-6 text-base leading-relaxed text-slate-100">
              {rewriteSample}
            </blockquote>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void navigator.clipboard?.writeText(rewriteSample)}
                className="mvh-card-glow inline-flex items-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-500/20 px-5 py-2.5 text-sm font-semibold text-indigo-200 transition hover:bg-indigo-500/30"
              >
                Copy To Clipboard
              </button>
              <Link
                to="/profile"
                className="mvh-card-glow inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Edit In Profile
              </Link>
            </div>
          </section>

          <section className="mvh-card-glow rounded-2xl border border-white/10 bg-white/[0.04] p-8">
            <h2 className="text-xl font-semibold text-white">Signals Detected</h2>
            <div className="mt-6 flex flex-wrap gap-2">
              {insight.signalTags.map((s) => (
                <span
                  key={s}
                  className="rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-slate-200"
                >
                  {s}
                </span>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
