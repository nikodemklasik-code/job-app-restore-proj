import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import {
  Radar, Zap, TrendingUp, Sparkles, ExternalLink,
  RefreshCw, BookOpen, ChevronDown, ChevronUp, CheckCircle2,
  Search, Database, Brain, BarChart3, GraduationCap, Activity,
} from 'lucide-react';

// ── Trend config ─────────────────────────────────────────────────────────────

const TREND_CONFIG = {
  hot:      { label: 'Hot now',   color: '#f97316', bg: 'rgba(249,115,22,0.12)',  border: 'rgba(249,115,22,0.3)'  },
  rising:   { label: 'Rising',    color: '#fbbf24', bg: 'rgba(251,191,36,0.10)',  border: 'rgba(251,191,36,0.3)'  },
  emerging: { label: 'Emerging',  color: '#34d399', bg: 'rgba(52,211,153,0.10)',  border: 'rgba(52,211,153,0.25)' },
} as const;

type TrendKey = keyof typeof TREND_CONFIG;

interface Course  { title: string; provider: string; url: string; level: string }
interface Skill   { skill: string; trend: TrendKey; reason: string; timeframe: string; courses: Course[] }
interface RadarResult { sector: string; generatedAt: string; skills: Skill[]; summary: string }

// ── Analysis log steps ────────────────────────────────────────────────────────

interface LogStep {
  id: number;
  icon: React.ElementType;
  text: string;
  delayMs: number;
  done?: boolean;
}

const ANALYSIS_STEPS: Omit<LogStep, 'done'>[] = [
  { id: 0, icon: Database,     text: 'Connecting to job market database…',       delayMs: 0    },
  { id: 1, icon: Search,       text: 'Scanning your application history…',        delayMs: 700  },
  { id: 2, icon: BarChart3,    text: 'Querying global demand signals…',           delayMs: 1800 },
  { id: 3, icon: Brain,        text: 'AI analysing skill trends…',               delayMs: 3200 },
  { id: 4, icon: Activity,     text: 'Calculating 6–12 month outlook…',           delayMs: 5000 },
  { id: 5, icon: GraduationCap,text: 'Generating course recommendations…',       delayMs: 6800 },
];

// ── Live Log component ─────────────────────────────────────────────────────────

function AnalysisLog({
  isRunning,
  result,
  onDone,
}: {
  isRunning: boolean;
  result: RadarResult | null;
  onDone: () => void;
}) {
  const [visibleSteps, setVisibleSteps] = useState<number[]>([]);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [finalLine, setFinalLine] = useState<string | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const doneCalledRef = useRef(false);

  useEffect(() => {
    if (!isRunning && visibleSteps.length === 0) return;
    if (!isRunning) return;

    // clear any leftover timers
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    doneCalledRef.current = false;
    setVisibleSteps([]);
    setCompletedSteps([]);
    setFinalLine(null);

    // Schedule each step appearing
    ANALYSIS_STEPS.forEach((step) => {
      const t = setTimeout(() => {
        setVisibleSteps((prev) => [...prev, step.id]);
      }, step.delayMs);
      timersRef.current.push(t);
    });

    // Mark each step as "done" 900ms after it appears
    ANALYSIS_STEPS.forEach((step) => {
      const t = setTimeout(() => {
        setCompletedSteps((prev) => [...prev, step.id]);
      }, step.delayMs + 900);
      timersRef.current.push(t);
    });

    return () => timersRef.current.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  // When result arrives, show completion line + call onDone
  useEffect(() => {
    if (result && !doneCalledRef.current) {
      doneCalledRef.current = true;
      // Mark all steps done
      setCompletedSteps(ANALYSIS_STEPS.map((s) => s.id));
      const t = setTimeout(() => {
        setFinalLine(`Sector detected: ${result.sector} — ${result.skills.length} trends identified`);
        setTimeout(onDone, 600);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [result, onDone]);

  if (visibleSteps.length === 0) return null;

  return (
    <div className="mt-8 rounded-2xl border border-white/8 bg-black/30 p-5 font-mono text-xs">
      <div className="mb-3 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-slate-400 uppercase tracking-widest text-[10px]">Job Radar — live analysis</span>
      </div>

      <div className="space-y-2">
        {ANALYSIS_STEPS.filter((s) => visibleSteps.includes(s.id)).map((step) => {
          const done = completedSteps.includes(step.id);
          const Icon = step.icon;
          return (
            <div
              key={step.id}
              className="flex items-center gap-3 transition-all"
              style={{ animation: 'fadeSlideIn 0.3s ease-out both' }}
            >
              {done ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
              ) : (
                <Icon className="h-3.5 w-3.5 shrink-0 text-indigo-400 animate-pulse" />
              )}
              <span className={done ? 'text-slate-400' : 'text-slate-200'}>
                {step.text}
              </span>
              {!done && (
                <span className="flex gap-0.5 ml-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-1 w-1 rounded-full bg-indigo-400"
                      style={{ animation: `dotBounce 1.2s ${i * 0.2}s infinite` }}
                    />
                  ))}
                </span>
              )}
            </div>
          );
        })}

        {finalLine && (
          <div
            className="flex items-center gap-3 text-emerald-400 font-semibold pt-1 border-t border-white/8"
            style={{ animation: 'fadeSlideIn 0.4s ease-out both' }}
          >
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            {finalLine}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Skill card ────────────────────────────────────────────────────────────────

function SkillCard({ skill, index, visible, expanded, onToggle }: {
  skill: Skill;
  index: number;
  visible: boolean;
  expanded: boolean;
  onToggle: () => void;
}) {
  const cfg = TREND_CONFIG[skill.trend] ?? TREND_CONFIG.rising;

  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-500"
      style={{
        background: 'rgba(15,23,42,0.8)',
        border: '1px solid #1e293b',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transitionDelay: `${index * 120}ms`,
      }}
    >
      <button
        onClick={onToggle}
        className="w-full text-left px-5 py-4 flex items-center gap-3 hover:bg-white/[0.02] transition-colors"
      >
        {/* Rank */}
        <span className="text-xs font-mono text-slate-600 w-4 shrink-0">{index + 1}</span>

        {/* Icon + name */}
        <Zap className="h-4 w-4 shrink-0" style={{ color: cfg.color }} />
        <span className="text-sm font-bold text-white flex-1 text-left">{skill.skill}</span>

        {/* Badge */}
        <span
          className="text-xs px-2 py-0.5 rounded-full font-semibold shrink-0"
          style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
        >
          {cfg.label}
        </span>

        {/* Timeframe */}
        <span className="text-xs text-slate-500 shrink-0 hidden sm:block">{skill.timeframe}</span>

        {expanded
          ? <ChevronUp className="h-4 w-4 text-slate-500 shrink-0" />
          : <ChevronDown className="h-4 w-4 text-slate-500 shrink-0" />
        }
      </button>

      {expanded && (
        <div
          className="px-5 pb-5 border-t border-slate-800"
          style={{ animation: 'fadeSlideIn 0.25s ease-out both' }}
        >
          <p className="text-sm text-slate-300 mt-4 mb-5 leading-relaxed">{skill.reason}</p>

          {skill.courses.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-3">
                <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
                <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                  Courses to get ahead
                </span>
              </div>
              <div className="space-y-2">
                {skill.courses.map((course, i) => (
                  <a
                    key={i}
                    href={course.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl group transition-all"
                    style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)' }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors truncate">
                        {course.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {course.provider}
                        <span className="mx-1.5 text-slate-700">·</span>
                        <span
                          className="font-medium"
                          style={{
                            color: course.level === 'Beginner' ? '#34d399' : course.level === 'Advanced' ? '#f87171' : '#fbbf24',
                          }}
                        >
                          {course.level}
                        </span>
                      </p>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-slate-600 group-hover:text-indigo-400 transition-colors shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function JobRadar() {
  const [sector, setSector] = useState('');
  const [result, setResult] = useState<RadarResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [visibleSkills, setVisibleSkills] = useState<number[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  const generateMutation = api.radar.generate.useMutation({
    onSuccess: (data) => setResult(data as RadarResult),
  });

  const isRunning = generateMutation.isPending;

  function handleGenerate() {
    setResult(null);
    setShowResults(false);
    setVisibleSkills([]);
    setExpanded(null);
    generateMutation.mutate({ sector: sector.trim() || undefined });
  }

  // Once log is done → reveal results progressively
  function handleLogDone() {
    setShowResults(true);
  }

  useEffect(() => {
    if (!showResults || !result) return;
    result.skills.forEach((_, i) => {
      const t = setTimeout(() => {
        setVisibleSkills((prev) => [...prev, i]);
      }, i * 130);
      return () => clearTimeout(t);
    });
  }, [showResults, result]);

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <>
      {/* Keyframe styles */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes dotBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40%            { transform: translateY(-4px); opacity: 1; }
        }
        @keyframes radarPulse {
          0%   { transform: scale(1);    opacity: 0.6; }
          50%  { transform: scale(1.15); opacity: 1;   }
          100% { transform: scale(1);    opacity: 0.6; }
        }
      `}</style>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-0">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              animation: isRunning ? 'radarPulse 2s ease-in-out infinite' : 'none',
            }}
          >
            <Radar className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Job Radar</h1>
            <p className="text-xs text-slate-400">AI skill trend predictions — next 6–12 months in your sector</p>
          </div>
        </div>

        {/* ── Input ──────────────────────────────────────────────────── */}
        <div className="mt-6 flex gap-3 items-end">
          <div className="flex-1">
            <label className="text-xs text-slate-400 mb-1.5 block">
              Sector or role{' '}
              <span className="text-slate-600">— leave blank to infer from your applications</span>
            </label>
            <input
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isRunning && handleGenerate()}
              placeholder="e.g. Product Management, Data Engineering, UX Design"
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={isRunning}
            className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all disabled:cursor-not-allowed"
            style={{
              background: isRunning
                ? 'rgba(99,102,241,0.3)'
                : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            }}
          >
            {isRunning ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : result ? (
              <><RefreshCw className="h-4 w-4" /> Refresh</>
            ) : (
              <><Sparkles className="h-4 w-4" /> Analyse</>
            )}
          </button>
        </div>

        {/* ── Live analysis log ───────────────────────────────────────── */}
        <AnalysisLog
          isRunning={isRunning}
          result={result}
          onDone={handleLogDone}
        />

        {/* ── Error ──────────────────────────────────────────────────── */}
        {generateMutation.isError && (
          <div className="mt-6 rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
            Something went wrong — please try again.
          </div>
        )}

        {/* ── Results ────────────────────────────────────────────────── */}
        {showResults && result && (
          <div
            className="mt-8 space-y-4"
            style={{ animation: 'fadeSlideIn 0.4s ease-out both' }}
          >
            {/* Sector summary banner */}
            <div
              className="rounded-2xl px-5 py-4"
              style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-indigo-400" />
                <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                  {result.sector}
                </span>
                <span className="ml-auto text-xs text-slate-500">{fmtDate(result.generatedAt)}</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{result.summary}</p>
            </div>

            {/* Skill cards */}
            <div className="space-y-3">
              {result.skills.map((skill, i) => (
                <SkillCard
                  key={skill.skill}
                  skill={skill}
                  index={i}
                  visible={visibleSkills.includes(i)}
                  expanded={expanded === skill.skill}
                  onToggle={() => setExpanded(expanded === skill.skill ? null : skill.skill)}
                />
              ))}
            </div>

            <p className="text-xs text-slate-600 text-center pt-2">
              Predictions are AI-generated based on your application history and market signals. Not a guarantee of hiring outcomes.
            </p>
          </div>
        )}

        {/* ── Empty state ─────────────────────────────────────────────── */}
        {!result && !isRunning && (
          <div
            className="mt-16 flex flex-col items-center gap-5 text-center"
            style={{ animation: 'fadeSlideIn 0.5s ease-out both' }}
          >
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}
            >
              <Radar className="h-8 w-8 text-indigo-400" />
            </div>
            <div>
              <p className="text-base font-semibold text-slate-200 mb-2">Predict your next skill move</p>
              <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
                Job Radar analyses your application history to identify which skills will be in highest demand in your sector
                over the next 6–12 months — and suggests courses to get there first.
              </p>
            </div>
            <button
              onClick={handleGenerate}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-white"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              <Sparkles className="h-4 w-4" /> Run Job Radar
            </button>
          </div>
        )}
      </div>
    </>
  );
}
