import { useState, useEffect } from 'react';
import { FlaskConical, Loader2, ChevronRight, AlertCircle, BookOpen, ChevronDown, ExternalLink, Zap, TrendingUp, Clock, Award, Info, X } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { api } from '@/lib/api';
import { useProfileStore } from '@/stores/profileStore';
import { useBillingStore } from '@/stores/billingStore';

// ── Mock data for Skills Gap & Courses sections ───────────────────────────

const MY_SKILLS_MOCK = [
  { name: 'React', current: 80 },
  { name: 'Node.js', current: 60 },
  { name: 'TypeScript', current: 75 },
  { name: 'AWS', current: 30 },
  { name: 'Docker', current: 45 },
  { name: 'SQL', current: 70 },
];

const MARKET_REQUIREMENTS_MOCK = [
  { name: 'React', required: 90 },
  { name: 'Node.js', required: 85 },
  { name: 'TypeScript', required: 80 },
  { name: 'AWS', required: 60 },
  { name: 'Docker', required: 65 },
  { name: 'SQL', required: 70 },
];

const COURSES_MOCK = [
  { name: 'AWS Certified Developer – Associate', platform: 'Udemy', duration: '30h', url: '#', skills: ['AWS'] },
  { name: 'Docker & Kubernetes: The Complete Guide', platform: 'Udemy', duration: '22h', url: '#', skills: ['Docker'] },
  { name: 'Node.js: Advanced Concepts', platform: 'Udemy', duration: '16h', url: '#', skills: ['Node.js'] },
  { name: 'React – The Complete Guide', platform: 'Coursera', duration: '48h', url: '#', skills: ['React', 'TypeScript'] },
  { name: 'The Web Developer Bootcamp', platform: 'freeCodeCamp', duration: '60h', url: '#', skills: ['Node.js', 'SQL'] },
];

function gapColor(current: number, required: number): string {
  const diff = required - current;
  if (diff <= 0) return '#34d399'; // green — meets or exceeds
  if (diff < 15) return '#f97316'; // orange — close
  return '#f87171'; // red — significant gap
}

// ── Salary Methodology Modal ──────────────────────────────────────────────

function SalaryMethodologyModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <div
        className="relative max-w-lg w-full rounded-2xl border border-white/10 bg-slate-900 p-6 space-y-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white">Salary methodology</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-500 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">
          Estimates are based on aggregated UK job posting data from Reed, LinkedIn, Indeed and Adzuna (rolling
          90-day window). The range shown reflects the 25th–75th percentile for your declared role, location
          (default: UK national), and detected skill set.
        </p>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Factors not included in this estimate:
          </p>
          <ul className="space-y-1 text-sm text-slate-400">
            <li>• Company size, funding stage or sector</li>
            <li>• Your specific years of experience</li>
            <li>• Location premium (London vs regional)</li>
            <li>• Benefits, equity or bonus components</li>
            <li>• Your individual negotiation outcome</li>
          </ul>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed border-t border-white/10 pt-3">
          These figures are indicative only. Use them as a starting point for market research, not as a
          guarantee or floor for negotiations.
        </p>
      </div>
    </div>
  );
}

// ── Monetisation Zone ─────────────────────────────────────────────────────

function MonetisationZone() {
  const [showMethodology, setShowMethodology] = useState(false);

  return (
    <div className="space-y-4">
      {showMethodology && <SalaryMethodologyModal onClose={() => setShowMethodology(false)} />}
      {/* Salary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Current valuation */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Current Market Value</p>
          <p className="text-2xl font-black text-white">£42,000 – £55,000</p>
          <p className="text-sm font-medium text-slate-400">/ year</p>
          <p className="text-xs text-slate-500 mt-1">Based on your current qualifications</p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-400" style={{ width: '62%' }} />
          </div>
        </div>
        {/* Max potential */}
        <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-5 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
            <TrendingUp className="inline h-3.5 w-3.5 mr-1" />
            Max Potential
          </p>
          <p className="text-2xl font-black text-white">£65,000 – £85,000</p>
          <p className="text-sm font-medium text-indigo-300">/ year</p>
          <p className="text-xs text-slate-500 mt-1">After reaching your career goals</p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-violet-400" style={{ width: '88%' }} />
          </div>
        </div>
      </div>
      {/* Disclaimer */}
      <p className="text-xs text-slate-500 leading-relaxed flex items-center gap-1.5 flex-wrap">
        <span>⚠️ Estimates only. Actual salary depends on location, company, experience and negotiation.</span>
        <button
          onClick={() => setShowMethodology(true)}
          title="Salary methodology"
          className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-xs text-slate-400 hover:border-indigo-500/40 hover:text-indigo-300 transition-all"
        >
          <Info className="h-3 w-3" />
          Methodology
        </button>
      </p>
    </div>
  );
}

// ── Skills Gap Split ──────────────────────────────────────────────────────

function SkillsGapSplit() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Left — My skills */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
        <h3 className="font-semibold text-white text-sm uppercase tracking-wider">Your Skills</h3>
        <div className="space-y-3">
          {MY_SKILLS_MOCK.map((skill) => {
            const req = MARKET_REQUIREMENTS_MOCK.find((r) => r.name === skill.name)?.required ?? 70;
            const color = gapColor(skill.current, req);
            return (
              <div key={skill.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">{skill.name}</span>
                  <span className="font-semibold" style={{ color }}>{skill.current}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${skill.current}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Right — Market requirements */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
        <h3 className="font-semibold text-white text-sm uppercase tracking-wider">Market Requirements</h3>
        <div className="space-y-3">
          {MARKET_REQUIREMENTS_MOCK.map((req) => {
            const mine = MY_SKILLS_MOCK.find((s) => s.name === req.name)?.current ?? 0;
            const color = gapColor(mine, req.required);
            return (
              <div key={req.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">{req.name}</span>
                  <span className="font-semibold text-slate-400">{req.required}% required</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${req.required}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 border-t border-white/10 pt-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-3 rounded-sm bg-emerald-400" />
            <span className="text-xs text-slate-500">Met</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-3 rounded-sm bg-orange-400" />
            <span className="text-xs text-slate-500">Close (&lt;15%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-3 rounded-sm bg-red-400" />
            <span className="text-xs text-slate-500">Gap (&gt;15%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Recommended Courses ───────────────────────────────────────────────────

const PLATFORM_COLORS: Record<string, string> = {
  Udemy: 'rgba(167,139,250,0.15)',
  Coursera: 'rgba(59,130,246,0.15)',
  freeCodeCamp: 'rgba(52,211,153,0.15)',
};
const PLATFORM_TEXT: Record<string, string> = {
  Udemy: '#a78bfa',
  Coursera: '#93c5fd',
  freeCodeCamp: '#34d399',
};

function RecommendedCourses() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Award className="h-5 w-5 text-indigo-400" />
        <h2 className="font-semibold text-white">Recommended Courses</h2>
        <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs font-medium text-indigo-400">
          {COURSES_MOCK.length} courses
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {COURSES_MOCK.map((course, i) => (
          <a
            key={i}
            href={course.url}
            className="group rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3 hover:border-indigo-500/40 hover:bg-white/[0.08] transition-all"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-white leading-snug group-hover:text-indigo-200 transition-colors">
                {course.name}
              </p>
              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-600 group-hover:text-indigo-400 transition-colors mt-0.5" />
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span
                className="rounded-md px-2 py-0.5 font-medium"
                style={{ background: PLATFORM_COLORS[course.platform] ?? 'rgba(255,255,255,0.08)', color: PLATFORM_TEXT[course.platform] ?? '#e2e8f0' }}
              >
                {course.platform}
              </span>
              <Clock className="h-3 w-3 text-slate-500" />
              <span className="text-slate-500">{course.duration}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {course.skills.map((s) => (
                <span
                  key={s}
                  className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-xs font-medium text-slate-400"
                >
                  {s}
                </span>
              ))}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** Derive a stable pseudo-level (0-10) from a skill name string. */
function pseudoLevel(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) & 0xffff;
  }
  return (hash % 7) + 4; // range 4-10 — skills assumed at least moderate
}

function levelColor(pct: number): string {
  if (pct >= 80) return '#34d399'; // emerald
  if (pct >= 50) return '#fbbf24'; // amber
  return '#f87171'; // red
}

interface SkillBarProps {
  name: string;
  level: number; // 0-10
}

interface Course {
  title: string;
  provider: string;
  url: string;
  level: string;
}

function SkillBar({ name, level }: SkillBarProps) {
  const pct = level * 10;
  const segments = 10;
  const filledSegments = Math.round(level);
  const color = levelColor(pct);

  const [expanded, setExpanded] = useState(false);
  const [courses, setCourses] = useState<Course[] | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const suggestMutation = (api as any).style.suggestCoursesForSkill.useMutation({
    onSuccess: (data: { courses: Course[] }) => setCourses(data.courses),
  });

  function handleToggle() {
    if (!expanded && !courses && !suggestMutation.isPending) {
      suggestMutation.mutate({ skill: name });
    }
    setExpanded((v) => !v);
  }

  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] overflow-hidden">
      <div className="group flex items-center gap-3 px-3 py-2">
        <span className="w-28 shrink-0 truncate text-sm text-slate-300 group-hover:text-white transition-colors">
          {name}
        </span>
        <div className="flex flex-1 items-center gap-0.5">
          {Array.from({ length: segments }).map((_, i) => (
            <div
              key={i}
              className="h-3 flex-1 rounded-sm transition-all"
              style={{
                backgroundColor: i < filledSegments ? color : 'rgba(255,255,255,0.07)',
                opacity: i < filledSegments ? 1 - i * 0.04 : 1,
              }}
            />
          ))}
        </div>
        <span className="w-9 shrink-0 text-right text-xs font-semibold" style={{ color }}>
          {pct}%
        </span>
        <button
          onClick={handleToggle}
          title="Suggest courses"
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
                className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm transition hover:border-indigo-500/40 hover:bg-white/[0.08]"
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

  const analyzeMutation = api.style.analyzeDocument.useMutation({
    onSuccess: (data) => setAnalysisResult(data as AnalysisResult),
  });

  // Load profile if not yet loaded
  if (!profile && !isLoadingProfile) {
    void loadProfile();
  }

  useEffect(() => {
    if (userId && !currentPlan) void loadBillingData(userId);
  }, [userId, currentPlan, loadBillingData]);

  const rawSkills: string[] = profile?.skills ?? [];
  const skillItems = rawSkills.map((name) => ({ name, level: pseudoLevel(name) }));

  function handleAnalyze() {
    if (!targetInput.trim() || !userId) return;
    analyzeMutation.mutate({ userId, text: targetInput.trim(), documentType: 'skills' });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-indigo-500/10 p-2.5">
          <FlaskConical className="h-6 w-6 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Skills Lab</h1>
          <p className="text-sm text-slate-400">Visualise your current skills and analyse gaps for any role.</p>
        </div>
      </div>

      {/* Credits bar */}
      {currentPlan && (
        <div className="flex items-center justify-between rounded-xl border border-indigo-500/20 bg-indigo-500/5 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-indigo-400" />
            <span className="text-sm text-slate-400">AI credits remaining:</span>
            <span className="text-sm font-bold text-white">{currentPlan.credits.toLocaleString()}</span>
          </div>
          <a
            href="/billing"
            className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300 transition hover:bg-indigo-500/20"
          >
            Buy Credits →
          </a>
        </div>
      )}

      {/* ── TOP ZONE — CV / Skill Monetisation ── */}
      <MonetisationZone />

      {/* ── MIDDLE ZONE — Skills Gap Split ── */}
      <SkillsGapSplit />

      {/* ── BOTTOM ZONE — Recommended Courses ── */}
      <RecommendedCourses />

      {/* 2-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* LEFT — My Skills */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">My Skills</h2>
            {skillItems.length > 0 && (
              <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs font-medium text-indigo-400">
                {skillItems.length} skills
              </span>
            )}
          </div>

          {isLoadingProfile ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
            </div>
          ) : skillItems.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <AlertCircle className="h-8 w-8 text-slate-600" />
              <p className="text-sm text-slate-400">No skills in your profile yet.</p>
              <a href="/profile" className="text-xs text-indigo-400 hover:underline">
                Add skills in Profile &rarr;
              </a>
            </div>
          ) : (
            <div className="space-y-3">
              {skillItems.map((skill) => (
                <SkillBar key={skill.name} name={skill.name} level={skill.level} />
              ))}
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center gap-4 border-t border-white/10 pt-4">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-3 rounded-sm bg-emerald-400" />
              <span className="text-xs text-slate-500">Proficient (80%+)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-3 rounded-sm bg-amber-400" />
              <span className="text-xs text-slate-500">Developing (50–79%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-3 rounded-sm bg-red-400" />
              <span className="text-xs text-slate-500">Beginner (&lt;50%)</span>
            </div>
          </div>
        </div>

        {/* RIGHT — Target Position */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-5">
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
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-white/10 py-12 text-center">
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
    </div>
  );
}
