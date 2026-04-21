import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FlaskConical, Loader2, ChevronRight, AlertCircle, BookOpen, ChevronDown, ExternalLink, Zap, Briefcase, GraduationCap, TrendingUp } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { api } from '@/lib/api';
import { useProfileStore } from '@/stores/profileStore';
import { useBillingStore } from '@/stores/billingStore';
import { appScreens } from '@/config/appScreens';
import type { ProfileSnapshot, ProfileExperience, ProfileEducation } from '../../../../shared/profile';
import { SupportingMaterialsDisclaimer } from '@/components/SupportingMaterialsDisclaimer';

// ── Live profile context (no fabricated salaries or market %) ─────────────

function LiveProfileSnapshot({ profile }: { profile: ProfileSnapshot }) {
  const { personalInfo, experiences, educations, trainings } = profile;
  const summary = personalInfo.summary?.trim();

  return (
    <div className="mvh-card-glow rounded-2xl border border-white/10 bg-white/5 p-6 space-y-5">
      <h2 className="font-semibold text-white text-sm uppercase tracking-wider">From your profile</h2>
      {summary ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Summary</p>
          <p className="text-sm text-slate-300 leading-relaxed line-clamp-6">{summary}</p>
        </div>
      ) : (
        <p className="text-sm text-slate-500">Add a professional summary in Profile to anchor skill context.</p>
      )}

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
          <Briefcase className="h-3.5 w-3.5" /> Experience ({experiences.length})
        </p>
        {experiences.length === 0 ? (
          <p className="text-xs text-slate-500">No roles saved yet.</p>
        ) : (
          <ul className="space-y-2 max-h-48 overflow-y-auto">
            {experiences.map((ex: ProfileExperience) => (
              <li key={ex.id} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs">
                <span className="font-medium text-slate-200">{ex.jobTitle}</span>
                <span className="text-slate-500"> · {ex.employerName}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
          <GraduationCap className="h-3.5 w-3.5" /> Education ({educations.length})
        </p>
        {educations.length === 0 ? (
          <p className="text-xs text-slate-500">No education entries yet.</p>
        ) : (
          <ul className="space-y-2 max-h-36 overflow-y-auto">
            {educations.map((ed: ProfileEducation) => (
              <li key={ed.id} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs text-slate-300">
                {ed.schoolName}
                {ed.degree ? <span className="text-slate-500"> — {ed.degree}</span> : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      {trainings.length > 0 && (
        <p className="text-xs text-slate-400">
          {trainings.length} training{trainings.length === 1 ? '' : 's'} on file — open Profile to edit.
        </p>
      )}
    </div>
  );
}

interface SkillBarProps {
  name: string;
  claimedLevel?: string | null;
  claimSource?: string | null;
}

interface Course {
  title: string;
  provider: string;
  url: string;
  level: string;
}

interface SkillCourseLink {
  skill: string;
  relatedSkills: string[];
  supportingCourses: Array<{ title: string; providerName: string; credentialUrl: string | null }>;
}

function buildSkillCourseLinks(
  skills: string[],
  trainings: Array<{ title: string; providerName: string; credentialUrl?: string | null }>,
): SkillCourseLink[] {
  return skills.slice(0, 6).map((skill, idx) => {
    const token = skill.toLowerCase();
    const supportingCourses = trainings.filter((training) =>
      training.title.toLowerCase().includes(token)
      || training.providerName.toLowerCase().includes(token),
    );
    const fallback = supportingCourses.length === 0 && trainings[idx]
      ? [trainings[idx]]
      : supportingCourses;
    const relatedSkills = skills
      .filter((item) => item !== skill)
      .slice(0, 3);

    return {
      skill,
      relatedSkills,
      supportingCourses: fallback.map((course) => ({
        title: course.title,
        providerName: course.providerName,
        credentialUrl: course.credentialUrl ?? null,
      })),
    };
  });
}

function formatClaimBadge(claimedLevel?: string | null): string {
  if (!claimedLevel) return 'Declared';
  return claimedLevel.charAt(0).toUpperCase() + claimedLevel.slice(1);
}

function SkillBar({ name, claimedLevel, claimSource }: SkillBarProps) {
  const [expanded, setExpanded] = useState(false);
  const [courses, setCourses] = useState<Course[] | null>(null);

  const suggestMutation = api.style.suggestCoursesForSkill.useMutation({
    onSuccess: (data) => setCourses(data.courses),
  });

  function handleToggle() {
    if (!expanded && !courses && !suggestMutation.isPending) {
      suggestMutation.mutate({ skill: name });
    }
    setExpanded((v) => !v);
  }

  return (
    <div className="mvh-card-glow rounded-lg border border-white/[0.06] bg-white/[0.02] overflow-hidden">
      <div className="group flex items-center gap-3 px-3 py-2">
        <span className="min-w-0 flex-1 truncate text-sm text-slate-300 group-hover:text-white transition-colors">
          {name}
        </span>
        <span className="shrink-0 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
          {formatClaimBadge(claimedLevel)}
          {claimSource ? (
            <span className="ml-1 normal-case text-slate-600">({claimSource})</span>
          ) : null}
        </span>
        <button
          onClick={handleToggle}
          title="Suggest courses (live)"
          className="ml-1 flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-1.5 py-1 text-xs text-slate-400 hover:border-indigo-500/40 hover:text-indigo-300 transition-all"
        >
          {suggestMutation.isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <>
              <BookOpen className="h-3 w-3" />
              <ChevronDown className={`h-3 w-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </>
          )}
        </button>
      </div>
      {expanded && (
        <div className="px-3 pb-3 space-y-1.5 border-t border-white/[0.06]">
          {suggestMutation.isPending ? (
            <div className="flex items-center gap-2 pt-2 text-xs text-slate-500">
              <Loader2 className="h-3 w-3 animate-spin text-indigo-400" /> Finding courses…
            </div>
          ) : courses && courses.length > 0 ? (
            <div className="pt-2 space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Suggested Courses</p>
              {courses.map((c, i) => (
                <a
                  key={i}
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-xs hover:border-indigo-500/30 hover:bg-white/[0.06] transition-all"
                >
                  <div>
                    <span className="font-medium text-slate-200">{c.title}</span>
                    <span className="ml-2 text-slate-500">· {c.provider}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="rounded px-1.5 py-0.5 text-xs font-medium"
                      style={{ background: c.level === 'Beginner' ? 'rgba(52,211,153,0.15)' : c.level === 'Advanced' ? 'rgba(248,113,113,0.15)' : 'rgba(251,191,36,0.15)', color: c.level === 'Beginner' ? '#34d399' : c.level === 'Advanced' ? '#f87171' : '#fbbf24' }}>
                      {c.level}
                    </span>
                    <ExternalLink className="h-3 w-3 text-slate-600" />
                  </div>
                </a>
              ))}
            </div>
          ) : courses && courses.length === 0 ? (
            <p className="pt-2 text-xs text-slate-500">No courses found for this skill.</p>
          ) : null}
        </div>
      )}
    </div>
  );
}

// ── Gap analysis result display ────────────────────────────────────────────

interface AnalysisResult {
  wordCount: number;
  sentenceCount: number;
  avgSentenceLength: number;
  tone: { professional?: number; confident?: number; formal?: number };
  topVerbs: string[];
  suggestions: string[];
  score: number;
}

const TRAINING_RESOURCES: Record<string, { label: string; url: string }> = {
  default: { label: 'LinkedIn Learning', url: 'https://www.linkedin.com/learning/' },
  python: { label: 'Python.org Tutorials', url: 'https://docs.python.org/3/tutorial/' },
  react: { label: 'React Docs', url: 'https://react.dev/learn' },
  typescript: { label: 'TypeScript Handbook', url: 'https://www.typescriptlang.org/docs/handbook/intro.html' },
  sql: { label: 'SQLZoo', url: 'https://sqlzoo.net/' },
  aws: { label: 'AWS Skill Builder', url: 'https://skillbuilder.aws/' },
  docker: { label: 'Docker Get Started', url: 'https://docs.docker.com/get-started/' },
  kubernetes: { label: 'Kubernetes Tutorials', url: 'https://kubernetes.io/docs/tutorials/' },
  node: { label: 'Node.js Docs', url: 'https://nodejs.org/en/docs/' },
  java: { label: 'Java Tutorials', url: 'https://dev.java/learn/' },
  go: { label: 'Go Tour', url: 'https://go.dev/tour/welcome/1' },
  rust: { label: 'Rust Book', url: 'https://doc.rust-lang.org/book/' },
};

function resourceForVerb(verb: string): { label: string; url: string } {
  const lower = verb.toLowerCase();
  for (const key of Object.keys(TRAINING_RESOURCES)) {
    if (key !== 'default' && lower.includes(key)) return TRAINING_RESOURCES[key]!;
  }
  return TRAINING_RESOURCES.default!;
}

function GapAnalysisPanel({ result, targetInput }: { result: AnalysisResult; targetInput: string }) {
  // Extract likely required skills from top verbs + target text
  const targetWords = targetInput
    .split(/\W+/)
    .filter((w) => w.length > 3)
    .slice(0, 8);

  return (
    <div className="space-y-5">
      {/* Score */}
      <div className="flex items-center gap-3">
        <div className="text-4xl font-black text-white">{result.score}</div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Overall Match Score</p>
          <div className="mt-1 h-1.5 w-40 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-400 transition-all"
              style={{ width: `${result.score}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tone breakdown */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Document Tone</p>
        <div className="space-y-1.5">
          {Object.entries(result.tone).map(([key, val]) => (
            <div key={key} className="flex items-center gap-2">
              <span className="w-24 text-xs capitalize text-slate-400">{key}</span>
              <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-indigo-500" style={{ width: `${val ?? 0}%` }} />
              </div>
              <span className="w-8 text-right text-xs text-slate-500">{val ?? 0}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Required skills / key terms */}
      {targetWords.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Key Requirements Detected</p>
          <div className="flex flex-wrap gap-1.5">
            {targetWords.map((w) => (
              <span
                key={w}
                className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-xs font-medium text-slate-300"
              >
                {w}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Recommendations</p>
        <ul className="space-y-2">
          {result.suggestions.map((s, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
              <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-400" />
              {s}
            </li>
          ))}
        </ul>
      </div>

      {/* Recommended training */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Recommended Training</p>
        <div className="space-y-2">
          {result.topVerbs.slice(0, 4).map((verb) => {
            const res = resourceForVerb(verb);
            return (
              <a
                key={verb}
                href={res.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mvh-card-glow flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm transition hover:border-indigo-500/40 hover:bg-white/[0.08]"
              >
                <span className="text-slate-200">{res.label}</span>
                <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function SkillsLab() {
  const { user } = useUser();
  const userId = user?.id ?? '';
  const { profile, isLoadingProfile, loadProfile } = useProfileStore();
  const { currentPlan, loadBillingData } = useBillingStore();

  const [targetInput, setTargetInput] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [liveDataOpen, setLiveDataOpen] = useState(false);

  const analyzeMutation = api.skillLab.analyzeJobGap.useMutation({
    onSuccess: (data) => setAnalysisResult(data as AnalysisResult),
  });

  const claimsQuery = api.skillLab.listClaims.useQuery(undefined, { enabled: Boolean(userId) });
  const coreSignalsQuery = api.skillLab.coreSignals.useQuery(undefined, { enabled: Boolean(userId), staleTime: 30_000 });
  const syncClaimsMutation = api.skillLab.syncFromProfileSkills.useMutation({
    onSuccess: async () => {
      await claimsQuery.refetch();
    },
  });

  const claimBySkillKey = useMemo(() => {
    const m = new Map<string, { claimedLevel: string; claimSource: string }>();
    for (const it of claimsQuery.data?.items ?? []) {
      m.set(it.skillKey.toLowerCase(), { claimedLevel: it.claimedLevel, claimSource: it.claimSource });
    }
    return m;
  }, [claimsQuery.data]);

  // Load profile if not yet loaded
  if (!profile && !isLoadingProfile) {
    void loadProfile();
  }

  useEffect(() => {
    if (userId && !currentPlan) void loadBillingData(userId);
  }, [userId, currentPlan, loadBillingData]);

  const rawSkills: string[] = profile?.skills ?? [];
  const trainingEntries = profile?.trainings ?? [];
  const skillCourseLinks = useMemo(
    () => buildSkillCourseLinks(rawSkills, trainingEntries),
    [rawSkills, trainingEntries],
  );

  function handleAnalyze() {
    if (!targetInput.trim() || !userId) return;
    analyzeMutation.mutate({ text: targetInput.trim() });
  }

  return (
    <div className="space-y-6">
      <SupportingMaterialsDisclaimer collapsible defaultExpanded={false} />

      <div className="mvh-card-glow rounded-xl border border-emerald-500/25 bg-emerald-500/[0.07] text-emerald-100">
        <button
          type="button"
          onClick={() => setLiveDataOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[11px] font-medium text-emerald-100/95 transition hover:bg-white/[0.04]"
          aria-expanded={liveDataOpen}
        >
          <span className="flex items-center gap-1.5">
            <FlaskConical className="h-3.5 w-3.5 shrink-0 text-emerald-300" aria-hidden />
            <span>Live data (how this page loads — tap to {liveDataOpen ? 'hide' : 'show'})</span>
          </span>
          <ChevronDown
            className={`h-3.5 w-3.5 shrink-0 text-emerald-200/80 transition-transform ${liveDataOpen ? 'rotate-180' : ''}`}
            aria-hidden
          />
        </button>
        {liveDataOpen && (
          <div
            className="border-t border-emerald-500/20 px-3 py-2 text-sm leading-relaxed"
            role="region"
            aria-label="Live data details"
          >
            <p className="m-0">
              <strong className="text-emerald-200">Live data:</strong> skills, summary, experience, and education load from your saved profile.
              Course suggestions load from <code className="rounded bg-white/10 px-1 text-xs">style.suggestCoursesForSkill</code> when you expand a skill.
              Skill claims load from <code className="rounded bg-white/10 px-1 text-xs">skillLab.listClaims</code>; sync with{' '}
              <code className="rounded bg-white/10 px-1 text-xs">skillLab.syncFromProfileSkills</code>.
              Gap analysis uses <code className="rounded bg-white/10 px-1 text-xs">skillLab.analyzeJobGap</code> on the job text you paste — we do not show fabricated salary or &quot;market %&quot; bars.
            </p>
          </div>
        )}
      </div>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-indigo-500/10 p-2.5">
          <FlaskConical className="h-6 w-6 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Skills Lab</h1>
          <p className="text-sm text-slate-400">
            Profile-backed skills, AI course hints per skill, and gap analysis from your target role text.
          </p>
        </div>
      </div>

      <div className="mvh-card-glow rounded-2xl border border-amber-500/25 bg-amber-500/5 p-5">
        <h2 className="font-semibold text-white">CV Value Signals &amp; Market Value Signals</h2>
        <p className="mt-1 text-sm text-slate-400">
          Skill Lab now highlights salary relevance: what increases your market position and what still needs proof.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          <div className="mvh-card-glow rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">Salary Potential</p>
            <p className="mt-1 text-sm font-medium text-white">
              {rawSkills.length >= 8 ? 'Higher potential (strong skill breadth)' : 'Medium potential (build 3-5 core skills)'}
            </p>
          </div>
          <div className="mvh-card-glow rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">High-Value Skills</p>
            <p className="mt-1 text-sm text-slate-300">{rawSkills.slice(0, 4).join(', ') || 'Add skills in Profile first.'}</p>
          </div>
          <div className="mvh-card-glow rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">Underused Skills</p>
            <p className="mt-1 text-sm text-slate-300">
              Skills without quantified outcomes in your profile descriptions should be treated as underused.
            </p>
          </div>
          <div className="mvh-card-glow rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">Proof And Evidence</p>
            <p className="mt-1 text-sm text-slate-300">
              Link each key skill to project outcomes, certificate URLs, or interview examples.
            </p>
          </div>
          <div className="mvh-card-glow rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">Skills That Increase Your Position</p>
            <p className="mt-1 text-sm text-slate-300">
              Skills aligned with target role keywords and repeated demand in job descriptions.
            </p>
          </div>
          <div className="mvh-card-glow rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">Skills That Need Stronger Proof</p>
            <p className="mt-1 text-sm text-slate-300">
              Any skill with no portfolio evidence, no metrics, and no verified course/certificate support.
            </p>
          </div>
        </div>
      </div>

      <div className="mvh-card-glow rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 to-slate-900/40 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20">
              <TrendingUp className="h-5 w-5 text-indigo-300" />
            </div>
            <div>
              <h2 className="font-semibold text-white">CV Score &amp; Valuation</h2>
              <p className="text-sm text-slate-400">
                Run an AI-backed CV score on uploaded documents in Document Lab; use Build for style analysis. Skill Lab focuses on skills and gap analysis from job text.
              </p>
            </div>
          </div>
          <Link
            to={`${appScreens.documents.path}?tab=upload`}
            className="mvh-card-glow inline-flex shrink-0 items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            Open Document Lab
          </Link>
        </div>
      </div>

      {profile && !isLoadingProfile ? <LiveProfileSnapshot profile={profile} /> : null}

      {userId && coreSignalsQuery.data ? (
        <div className="mvh-card-glow rounded-2xl border border-teal-500/25 bg-teal-500/[0.06] p-5 space-y-3">
          <h2 className="font-semibold text-white">Capability signals (backend)</h2>
          <p className="text-xs text-slate-400">
            Qualitative tiers only — from <code className="rounded bg-white/10 px-1">skillLab.coreSignals</code>. Use Profile + claims to strengthen bands.
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Salary positioning hint</p>
              <p className="mt-1 text-sm text-slate-200">{coreSignalsQuery.data.salaryImpact.tier}</p>
              <p className="mt-1 text-xs text-slate-400">{coreSignalsQuery.data.salaryImpact.rationale}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Growth hooks</p>
              <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-slate-300">
                {coreSignalsQuery.data.growthHooks.slice(0, 4).map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </div>
          </div>
          {coreSignalsQuery.data.cvValueSignals.length > 0 ? (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">CV value signals</p>
              <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-slate-300">
                {coreSignalsQuery.data.cvValueSignals.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {coreSignalsQuery.data.courseToSkillMappings.length > 0 ? (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Course → skill mapping</p>
              <ul className="mt-1 space-y-1 text-xs text-slate-300">
                {coreSignalsQuery.data.courseToSkillMappings.slice(0, 6).map((m) => (
                  <li key={m.courseTitle} className="rounded border border-white/[0.06] bg-white/[0.02] px-2 py-1">
                    <span className="font-medium text-slate-200">{m.courseTitle}</span>
                    <span className="text-slate-500"> · {m.confidence} · </span>
                    {m.matchedSkills.length ? m.matchedSkills.join(', ') : '— no name overlap with profile skills'}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mvh-card-glow rounded-2xl border border-blue-500/25 bg-blue-500/5 p-5">
        <h2 className="font-semibold text-white">Skills And Courses</h2>
        <p className="mt-1 text-sm text-slate-400">
          Courses act as learning evidence for each skill. This view links your declared skills with available course and certification proof.
        </p>

        {skillCourseLinks.length === 0 ? (
          <div className="mvh-card-glow mt-4 rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-sm text-slate-500">
            Add skills and trainings in Profile to generate skill-course links.
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
            {skillCourseLinks.map((entry) => (
              <article key={entry.skill} className="mvh-card-glow rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
                <p className="text-sm font-semibold text-white">{entry.skill}</p>

                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500">Related Skills</p>
                  <p className="mt-1 text-xs text-slate-300">
                    {entry.relatedSkills.join(', ') || 'Add adjacent skills to show stronger capability clusters.'}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500">Courses Supporting This Skill</p>
                  {entry.supportingCourses.length === 0 ? (
                    <p className="mt-1 text-xs text-slate-400">No supporting course linked yet.</p>
                  ) : (
                    <div className="mt-1 space-y-1.5">
                      {entry.supportingCourses.map((course) => (
                        <div key={`${entry.skill}-${course.title}`} className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-300">
                          <p className="font-medium text-slate-200">{course.title}</p>
                          <p className="text-slate-500">{course.providerName}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500">This Course Strengthens</p>
                  <p className="mt-1 text-xs text-slate-300">
                    Applied execution and confidence for <span className="text-white">{entry.skill}</span> in role-level scenarios.
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500">Learning Evidence</p>
                  <p className="mt-1 text-xs text-slate-300">
                    {entry.supportingCourses.some((course) => Boolean(course.credentialUrl))
                      ? 'Certificate link available for verification.'
                      : 'Add a credential URL or project example as verifiable evidence.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wider text-amber-300">Still Needs Practice</p>
                    <p className="mt-1 text-xs text-amber-100">Run one scenario in Interview or Case Practice using this skill.</p>
                  </div>
                  <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wider text-rose-300">Still Needs Verification</p>
                    <p className="mt-1 text-xs text-rose-100">Add measurable outcomes linked to this skill in Profile experience entries.</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* 2-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* LEFT — My Skills */}
        <div className="mvh-card-glow rounded-2xl border border-white/10 bg-white/5 p-6 space-y-5">
          <p className="text-xs text-slate-500">
            Proficiency is not stored on your profile yet — expand a skill for live course suggestions from the API.
          </p>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold text-white">My Skills</h2>
            <div className="flex flex-wrap items-center gap-2">
              {userId ? (
                <button
                  type="button"
                  disabled={syncClaimsMutation.isPending || !rawSkills.length}
                  onClick={() => syncClaimsMutation.mutate()}
                  className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-slate-200 hover:border-indigo-500/40 hover:bg-indigo-500/10 disabled:opacity-50"
                >
                  {syncClaimsMutation.isPending ? 'Syncing…' : 'Sync claims from profile'}
                </button>
              ) : null}
              {rawSkills.length > 0 && (
                <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs font-medium text-indigo-400">
                  {rawSkills.length} skills
                </span>
              )}
            </div>
          </div>

          {isLoadingProfile ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
            </div>
          ) : rawSkills.length === 0 ? (
            <div className="mvh-card-glow flex flex-col items-center gap-2 rounded-xl border border-dashed border-white/10 bg-white/[0.02] py-10 text-center">
              <AlertCircle className="h-8 w-8 text-slate-600" />
              <p className="text-sm text-slate-400">No skills in your profile yet.</p>
              <Link to={appScreens.profile.path} className="text-xs text-indigo-400 hover:underline">
                Add skills in {appScreens.profile.label} &rarr;
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {rawSkills.map((name) => {
                const meta = claimBySkillKey.get(name.trim().toLowerCase());
                return (
                  <SkillBar
                    key={name}
                    name={name}
                    claimedLevel={meta?.claimedLevel}
                    claimSource={meta?.claimSource}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT — Target Position */}
        <div className="mvh-card-glow rounded-2xl border border-white/10 bg-white/5 p-6 space-y-5">
          <h2 className="font-semibold text-white">Target Position</h2>

          <div className="space-y-3">
            <textarea
              rows={4}
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              placeholder="Job title or paste a job description…"
              className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none transition focus:border-indigo-500/50 focus:ring-0"
            />

            <button
              onClick={handleAnalyze}
              disabled={!targetInput.trim() || !userId || analyzeMutation.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {analyzeMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analysing…
                </>
              ) : (
                <>
                  <FlaskConical className="h-4 w-4" />
                  Analyse Gap
                </>
              )}
            </button>

            {analyzeMutation.isError && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                Analysis failed. Please try again.
              </p>
            )}
          </div>

          {/* Results or placeholder */}
          {analysisResult ? (
            <GapAnalysisPanel result={analysisResult} targetInput={targetInput} />
          ) : (
            <div className="mvh-card-glow flex flex-col items-center gap-3 rounded-xl border border-dashed border-white/10 py-12 text-center">
              <FlaskConical className="h-10 w-10 text-slate-700" />
              <p className="text-sm font-medium text-slate-500">No analysis yet</p>
              <p className="max-w-xs text-xs text-slate-600">
                Enter a job title or paste a full job description above, then click{' '}
                <span className="text-indigo-400">"Analyse Gap"</span> to see required skills, gaps, and
                recommended training resources.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Credits bar — bottom of page */}
      {currentPlan && (
        <div className="mvh-card-glow flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5 px-4 py-2.5">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Zap className="h-4 w-4 shrink-0 text-indigo-400" />
            <span className="text-sm text-slate-400">Credits remaining (coach / style features):</span>
            <span className="text-sm font-bold text-white tabular-nums">{currentPlan.credits.toLocaleString()}</span>
          </div>
          <Link
            to={appScreens.billing.path}
            className="shrink-0 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300 transition hover:bg-indigo-500/20"
          >
            Buy Credits →
          </Link>
        </div>
      )}
    </div>
  );
}
