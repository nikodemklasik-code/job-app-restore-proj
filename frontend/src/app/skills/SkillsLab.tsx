import { useState } from 'react';
import { FlaskConical, Loader2, ChevronRight, AlertCircle } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { api } from '@/lib/api';
import { useProfileStore } from '@/stores/profileStore';

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

function SkillBar({ name, level }: SkillBarProps) {
  const pct = level * 10;
  const segments = 10;
  const filledSegments = Math.round(level);
  const color = levelColor(pct);

  return (
    <div className="group flex items-center gap-3">
      <span className="w-32 shrink-0 truncate text-sm text-slate-300 group-hover:text-white transition-colors">
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
                className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-medium text-slate-300"
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

  const [targetInput, setTargetInput] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const analyzeMutation = api.style.analyzeDocument.useMutation({
    onSuccess: (data) => setAnalysisResult(data as AnalysisResult),
  });

  // Load profile if not yet loaded
  if (!profile && !isLoadingProfile) {
    void loadProfile();
  }

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

      {/* 2-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* LEFT — My Skills */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">My Skills</h2>
            {skillItems.length > 0 && (
              <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[11px] font-medium text-indigo-400">
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
              <span className="text-[11px] text-slate-500">Proficient (80%+)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-3 rounded-sm bg-amber-400" />
              <span className="text-[11px] text-slate-500">Developing (50–79%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-3 rounded-sm bg-red-400" />
              <span className="text-[11px] text-slate-500">Beginner (&lt;50%)</span>
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
