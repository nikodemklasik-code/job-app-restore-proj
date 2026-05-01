import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import {
  Award,
  BookOpen,
  Brain,
  Briefcase,
  ChevronRight,
  ExternalLink,
  FlaskConical,
  GraduationCap,
  Loader2,
  Medal,
  Route,
  Target,
  TrendingUp,
} from 'lucide-react';
import { SupportingMaterialsDisclaimer } from '@/components/SupportingMaterialsDisclaimer';
import { APP_SCREENS } from '@/config/appScreens';
import { api } from '@/lib/api';
import { useProfileStore } from '@/stores/profileStore';
import type { ProfileEducation, ProfileExperience, ProfileSnapshot } from '../../../../shared/profile';

type AnalysisResult = {
  wordCount: number;
  sentenceCount: number;
  avgSentenceLength: number;
  tone: { professional?: number; confident?: number; formal?: number };
  topVerbs: string[];
  suggestions: string[];
  score: number;
};

type SkillCard = {
  name: string;
  status: 'declared' | 'observed' | 'strengthening' | 'verified' | 'strong_signal';
  levelLabel: string;
  evidenceLabel: string;
  learningLabel: string;
  score: number;
};

const FALLBACK_RESOURCES: Record<string, { label: string; url: string }> = {
  default: { label: 'LinkedIn Learning', url: 'https://www.linkedin.com/learning/' },
  python: { label: 'Python.org Tutorials', url: 'https://docs.python.org/3/tutorial/' },
  react: { label: 'React Docs', url: 'https://react.dev/learn' },
  typescript: { label: 'TypeScript Handbook', url: 'https://www.typescriptlang.org/docs/handbook/intro.html' },
  sql: { label: 'SQLZoo', url: 'https://sqlzoo.net/' },
  aws: { label: 'AWS Skill Builder', url: 'https://skillbuilder.aws/' },
};

function statusLabel(status: SkillCard['status']) {
  return status.replace('_', ' ');
}

function statusClass(status: SkillCard['status']) {
  switch (status) {
    case 'strong_signal':
      return 'border-emerald-400/30 bg-emerald-500/15 text-emerald-200';
    case 'verified':
      return 'border-cyan-400/30 bg-cyan-500/15 text-cyan-200';
    case 'strengthening':
      return 'border-amber-400/30 bg-amber-500/15 text-amber-200';
    case 'observed':
      return 'border-indigo-400/30 bg-indigo-500/15 text-indigo-200';
    default:
      return 'border-slate-400/20 bg-white/10 text-slate-300';
  }
}

function normalizeSkillName(name: string): string {
  return name
    .split(/\s+/)
    .map((word) => {
      // Handle special cases: keep all-caps words (like "PDF", "KPI") as-is
      if (word.length <= 3 && word === word.toUpperCase() && word !== word.toLowerCase()) {
        return word;
      }
      // Capitalize first letter, lowercase rest
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ')
    .trim();
}

function resourceForTerm(term: string): { label: string; url: string } {
  const lower = term.toLowerCase();
  for (const key of Object.keys(FALLBACK_RESOURCES)) {
    if (key !== 'default' && lower.includes(key)) return FALLBACK_RESOURCES[key]!;
  }
  return FALLBACK_RESOURCES.default!;
}

function scoreForSkill(index: number, hasTraining: boolean, hasExperience: boolean): number {
  const base = 48 + index * 5;
  const trainingBoost = hasTraining ? 16 : 0;
  const experienceBoost = hasExperience ? 12 : 0;
  return Math.min(94, base + trainingBoost + experienceBoost);
}

function buildSkillCards(profile: ProfileSnapshot | null, claims: Array<{ skillKey: string; claimedLevel: string; claimSource: string }>): SkillCard[] {
  const profileSkills = profile?.skills ?? [];
  const trainings = profile?.trainings ?? [];
  const experiences = profile?.experiences ?? [];
  const sourceSkills = profileSkills.length > 0 ? profileSkills : claims.map((claim) => claim.skillKey);

  return sourceSkills.slice(0, 12).map((skill, index) => {
    const key = skill.toLowerCase();
    const claim = claims.find((item) => item.skillKey.toLowerCase() === key);
    const hasTraining = trainings.some((training) => training.title.toLowerCase().includes(key));
    const hasExperience = experiences.some((experience) => {
      const text = `${experience.jobTitle} ${experience.description ?? ''}`.toLowerCase();
      return text.includes(key);
    });
    const score = scoreForSkill(index, hasTraining, hasExperience);
    const status: SkillCard['status'] = score >= 86 ? 'strong_signal' : hasTraining ? 'verified' : hasExperience ? 'observed' : claim ? 'strengthening' : 'declared';

    return {
      name: skill,
      status,
      levelLabel: claim?.claimedLevel ?? 'declared',
      evidenceLabel: hasTraining ? 'course evidence' : hasExperience ? 'experience evidence' : claim?.claimSource ?? 'profile signal',
      learningLabel: hasTraining ? 'training linked' : 'course needed',
      score,
    };
  });
}

function RingScore({ value, label, sublabel }: { value: number; label: string; sublabel: string }) {
  return (
    <div className="rounded-3xl border border-emerald-400/25 bg-gradient-to-br from-emerald-500/10 via-slate-900/60 to-indigo-900/20 p-5">
      <div className="flex items-center gap-4">
        <div
          className="grid h-24 w-24 place-items-center rounded-full"
          style={{ background: `conic-gradient(rgba(99,102,241,0.95) ${value * 3.6}deg, rgba(255,255,255,0.08) 0deg)` }}
        >
          <div className="grid h-16 w-16 place-items-center rounded-full bg-slate-950 text-xl font-black text-white">
            {value}%
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{label}</p>
          <p className="mt-1 text-xs leading-5 text-slate-400">{sublabel}</p>
        </div>
      </div>
    </div>
  );
}

function SuccessSnapshot({ profile, skillCards }: { profile: ProfileSnapshot | null; skillCards: SkillCard[] }) {
  const verifiedCount = skillCards.filter((skill) => skill.status === 'verified' || skill.status === 'strong_signal').length;
  const achievementCount = (profile?.experiences?.length ?? 0) + (profile?.trainings?.length ?? 0) + (profile?.educations?.length ?? 0);
  const readiness = skillCards.length === 0 ? 0 : Math.round(skillCards.reduce((sum, skill) => sum + skill.score, 0) / skillCards.length);

  return (
    <section className="rounded-3xl border border-emerald-400/25 bg-gradient-to-br from-emerald-500/15 via-slate-900/70 to-indigo-900/30 p-6">
      <div className="flex flex-col gap-6">
        <div className="max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-200">
            <Medal className="h-3.5 w-3.5" /> Success first
          </p>
          <h1 className="mt-4 text-3xl font-bold text-white md:text-4xl">First show what you have already built.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
            Skill Lab starts with proof: skills, experience, education, training, and evidence. Gaps come after achievements,
            because development should point forward, not open by telling the user they are a pile of missing parts. Humanity can cope with one humane screen.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <RingScore value={readiness} label="Readiness" sublabel="Average skill signal from saved profile data." />
          <RingScore value={Math.min(100, verifiedCount * 18)} label="Verified proof" sublabel={`${verifiedCount} skills with stronger evidence.`} />
          <RingScore value={Math.min(100, achievementCount * 12)} label="Achievement base" sublabel={`${achievementCount} education, training, and experience signals.`} />
        </div>
      </div>
    </section>
  );
}

function AchievementBoard({ profile }: { profile: ProfileSnapshot | null }) {
  const experiences = profile?.experiences ?? [];
  const educations = profile?.educations ?? [];
  const trainings = profile?.trainings ?? [];

  return (
    <section className="grid gap-4 xl:grid-cols-3">
      <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Successes</p>
            <h2 className="mt-1 text-lg font-semibold text-white">Experience evidence</h2>
          </div>
          <Briefcase className="h-5 w-5 text-indigo-300" />
        </div>
        {experiences.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.025] p-4 text-sm text-slate-500">Add roles in Profile to show achievement evidence here.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {experiences.slice(0, 4).map((experience: ProfileExperience) => (
              <div key={experience.id} className="rounded-2xl border border-white/10 bg-slate-950/35 p-3">
                <p className="text-sm font-semibold text-white">{experience.jobTitle}</p>
                <p className="text-xs text-slate-400">{experience.employerName}</p>
              </div>
            ))}
          </div>
        )}
      </article>

      <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Education Path</p>
            <h2 className="mt-1 text-lg font-semibold text-white">Studies and direction</h2>
          </div>
          <GraduationCap className="h-5 w-5 text-emerald-300" />
        </div>
        {educations.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.025] p-4 text-sm text-slate-500">Add education, degree, field of study, or course path in Profile.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {educations.slice(0, 4).map((education: ProfileEducation) => (
              <div key={education.id} className="rounded-2xl border border-white/10 bg-slate-950/35 p-3">
                <p className="text-sm font-semibold text-white">{education.schoolName}</p>
                <p className="text-xs text-slate-400">{education.degree || 'Education entry'}{education.fieldOfStudy ? ` · ${education.fieldOfStudy}` : ''}</p>
              </div>
            ))}
          </div>
        )}
      </article>

      <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Learning proof</p>
            <h2 className="mt-1 text-lg font-semibold text-white">Courses and training</h2>
          </div>
          <BookOpen className="h-5 w-5 text-amber-300" />
        </div>
        {trainings.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.025] p-4 text-sm text-slate-500">Add courses and certificates to connect training with skills.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {trainings.slice(0, 4).map((training) => (
              <div key={training.id} className="rounded-2xl border border-white/10 bg-slate-950/35 p-3">
                <p className="text-sm font-semibold text-white">{training.title}</p>
                <p className="text-xs text-slate-400">{training.providerName}</p>
              </div>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}

function SkillLaboratoryGrid({ skills }: { skills: SkillCard[] }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Laboratory grid</p>
          <h2 className="mt-1 text-xl font-semibold text-white">Skills, evidence, and growth status</h2>
        </div>
        <Link to="/profile" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-white/10">
          Update Profile <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {skills.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-white/[0.025] p-6 text-sm text-slate-500">
          Add skills in Profile to generate the skill laboratory grid.
        </div>
      ) : (
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {skills.map((skill) => (
            <article key={skill.name} className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{normalizeSkillName(skill.name)}</p>
                  <p className="mt-1 text-xs text-slate-500">{skill.evidenceLabel} · {skill.learningLabel}</p>
                </div>
                <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusClass(skill.status)}`}>
                  {statusLabel(skill.status)}
                </span>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Signal strength</span>
                  <span>{skill.score}%</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400" style={{ width: `${skill.score}%` }} />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function CoursePathways({ profile, skills }: { profile: ProfileSnapshot | null; skills: SkillCard[] }) {
  const trainings = profile?.trainings ?? [];
  const topSkills = skills.slice(0, 6);

  return (
    <section className="rounded-3xl border border-blue-400/25 bg-blue-500/[0.055] p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-200/70">Courses linked to skills</p>
          <h2 className="mt-1 text-xl font-semibold text-white">Training pathways under the skills</h2>
        </div>
        <Route className="h-5 w-5 text-blue-300" />
      </div>
      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {topSkills.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/10 bg-white/[0.025] p-4 text-sm text-slate-500">Add skills first. Then course pathways can attach underneath them.</p>
        ) : topSkills.map((skill) => {
          const matched = trainings.filter((training) => training.title.toLowerCase().includes(skill.name.toLowerCase()));
          const fallback = matched[0] ?? trainings[0];
          const fallbackResource = resourceForTerm(skill.name);
          return (
            <article key={skill.name} className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
              <p className="text-sm font-semibold text-white">{skill.name}</p>
              <p className="mt-1 text-xs text-slate-400">Recommended learning support below this skill.</p>
              <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.035] p-3">
                <p className="text-xs font-semibold text-slate-200">{fallback?.title ?? fallbackResource.label}</p>
                <p className="mt-1 text-xs text-slate-500">{fallback?.providerName ?? 'External learning resource'}</p>
                {fallback?.credentialUrl ? (
                  <a href={fallback.credentialUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-300 hover:text-blue-200">
                    Open credential <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <a href={fallbackResource.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-300 hover:text-blue-200">
                    Open course path <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function GapAnalysisSection({
  targetInput,
  setTargetInput,
  analysisResult,
  isPending,
  onAnalyze,
}: {
  targetInput: string;
  setTargetInput: (value: string) => void;
  analysisResult: AnalysisResult | null;
  isPending: boolean;
  onAnalyze: () => void;
}) {
  const targetWords = targetInput.split(/\W+/).filter((word) => word.length > 3).slice(0, 8);

  return (
    <section className="rounded-3xl border border-amber-400/25 bg-amber-500/[0.055] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-200/70">Gap after success</p>
          <h2 className="mt-1 text-xl font-semibold text-white">Now identify the next useful gap</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Paste a target role or job description after reviewing achievements. The gap is framed as the next route forward, not as the opening story.
          </p>
        </div>
        <Target className="h-5 w-5 text-amber-300" />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <textarea
            value={targetInput}
            onChange={(event) => setTargetInput(event.target.value)}
            rows={8}
            placeholder="Paste target role, job description, study pathway, or capability target…"
            className="w-full resize-none rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-amber-400/50"
          />
          <button
            type="button"
            disabled={!targetInput.trim() || isPending}
            onClick={onAnalyze}
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
            Analyze next gap
          </button>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
          {analysisResult ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="text-4xl font-black text-white">{analysisResult.score}</div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Capability Match</p>
                  <div className="mt-1 h-2 w-40 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400" style={{ width: `${analysisResult.score}%` }} />
                  </div>
                </div>
              </div>
              {targetWords.length > 0 ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Detected target terms</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {targetWords.map((word) => (
                      <span key={word} className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-slate-300">{word}</span>
                    ))}
                  </div>
                </div>
              ) : null}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Next moves</p>
                <ul className="mt-2 space-y-2 text-sm text-slate-300">
                  {analysisResult.suggestions.slice(0, 4).map((suggestion, index) => (
                    <li key={`${suggestion}-${index}`} className="flex gap-2"><ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />{suggestion}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[220px] items-center justify-center text-center text-sm text-slate-500">
              Gap analysis appears here after achievements, skill evidence, course links, and education path.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default function SkillsLabSuccessFirst() {
  const { user } = useUser();
  const userId = user?.id ?? '';
  const { profile, isLoadingProfile, loadProfile } = useProfileStore();
  const [targetInput, setTargetInput] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const claimsQuery = api.skillLab.listClaims.useQuery(undefined, { enabled: Boolean(userId) });
  const coreSignalsQuery = api.skillLab.coreSignals.useQuery(undefined, { enabled: Boolean(userId), staleTime: 30_000 });
  const analyzeMutation = api.skillLab.analyzeJobGap.useMutation({
    onSuccess: (data) => setAnalysisResult(data as AnalysisResult),
  });

  useEffect(() => {
    if (!profile && !isLoadingProfile) void loadProfile();
  }, [profile, isLoadingProfile, loadProfile]);

  const claims = claimsQuery.data?.items ?? [];
  const skillCards = useMemo(() => buildSkillCards(profile ?? null, claims), [profile, claims]);
  const strongSignals = skillCards.filter((skill) => skill.status === 'strong_signal' || skill.status === 'verified');

  const analyze = () => {
    if (!targetInput.trim()) return;
    analyzeMutation.mutate({ text: targetInput.trim() });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-indigo-500/10 p-2.5">
          <FlaskConical className="h-6 w-6 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{APP_SCREENS.skillLab.label}</h1>
          <p className="text-sm text-slate-400">Visual skills laboratory: achievements first, gaps second, routes forward always visible.</p>
        </div>
      </div>

      <SuccessSnapshot profile={profile ?? null} skillCards={skillCards} />

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <Award className="h-5 w-5 text-emerald-300" />
          <p className="mt-3 text-3xl font-black text-white">{strongSignals.length}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Strong or verified skills</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <BookOpen className="h-5 w-5 text-blue-300" />
          <p className="mt-3 text-3xl font-black text-white">{profile?.trainings?.length ?? 0}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Courses and trainings</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <GraduationCap className="h-5 w-5 text-amber-300" />
          <p className="mt-3 text-3xl font-black text-white">{profile?.educations?.length ?? 0}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Education entries</p>
        </div>
      </section>

      <AchievementBoard profile={profile ?? null} />

      {coreSignalsQuery.data && 'salaryImpact' in coreSignalsQuery.data ? (
        <section className="rounded-3xl border border-teal-400/25 bg-teal-500/[0.055] p-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-teal-300" />
            <h2 className="text-lg font-semibold text-white">Capability signals from backend</h2>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Positioning hint</p>
              <p className="mt-1 text-sm font-semibold text-white">{coreSignalsQuery.data.salaryImpact.tier}</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">{coreSignalsQuery.data.salaryImpact.rationale}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Growth hooks</p>
              <ul className="mt-2 space-y-1 text-xs text-slate-300">
                {coreSignalsQuery.data.growthHooks.slice(0, 4).map((hook) => <li key={hook}>• {hook}</li>)}
              </ul>
            </div>
            {coreSignalsQuery.data.cvValueSignals.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">CV value signals</p>
                <ul className="mt-2 space-y-1 text-xs text-slate-300">
                  {coreSignalsQuery.data.cvValueSignals.slice(0, 4).map((signal) => <li key={signal}>• {signal}</li>)}
                </ul>
              </div>
            )}
          </div>
        </section>
      ) : null}

      <SkillLaboratoryGrid skills={skillCards} />
      <CoursePathways profile={profile ?? null} skills={skillCards} />

      <GapAnalysisSection
        targetInput={targetInput}
        setTargetInput={setTargetInput}
        analysisResult={analysisResult}
        isPending={analyzeMutation.isPending}
        onAnalyze={analyze}
      />

      <div className="border-t border-white/10 pt-6 mt-8">
        <SupportingMaterialsDisclaimer collapsible defaultExpanded={false} />
      </div>
    </div>
  );
}
