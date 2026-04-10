import { useState } from 'react';
import { api } from '@/lib/api';
import { Radar, Zap, TrendingUp, Sparkles, ExternalLink, RefreshCw, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';

const TREND_CONFIG = {
  hot:      { label: 'Hot now',     color: '#f97316', bg: 'rgba(249,115,22,0.12)',  border: 'rgba(249,115,22,0.3)' },
  rising:   { label: 'Rising',      color: '#fbbf24', bg: 'rgba(251,191,36,0.10)',  border: 'rgba(251,191,36,0.3)' },
  emerging: { label: 'Emerging',    color: '#34d399', bg: 'rgba(52,211,153,0.10)',  border: 'rgba(52,211,153,0.25)' },
} as const;

type TrendKey = keyof typeof TREND_CONFIG;

interface Course { title: string; provider: string; url: string; level: string }
interface Skill { skill: string; trend: TrendKey; reason: string; timeframe: string; courses: Course[] }
interface RadarResult { sector: string; generatedAt: string; skills: Skill[]; summary: string }

export default function JobRadar() {
  const [sector, setSector] = useState('');
  const [result, setResult] = useState<RadarResult | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const generateMutation = api.radar.generate.useMutation({
    onSuccess: (data) => setResult(data as RadarResult),
  });

  const handleGenerate = () => {
    generateMutation.mutate({ sector: sector.trim() || undefined });
  };

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Radar style={{ width: 20, height: 20, color: '#fff' }} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Job Radar</h1>
          <p className="text-xs text-slate-400">AI skill trend predictions for the next 6–12 months in your sector</p>
        </div>
      </div>

      {/* Input */}
      <div className="mt-6 flex gap-3 items-end">
        <div className="flex-1">
          <label className="text-xs text-slate-400 mb-1.5 block">Your sector or role focus <span className="text-slate-600">(optional — AI infers from your applications)</span></label>
          <input
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            placeholder="e.g. Product Management, Data Engineering, UX Design"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        <button
          onClick={handleGenerate}
          disabled={generateMutation.isPending}
          className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all"
          style={{ background: generateMutation.isPending ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', cursor: generateMutation.isPending ? 'not-allowed' : 'pointer' }}
        >
          {generateMutation.isPending ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : result ? (
            <><RefreshCw className="h-4 w-4" /> Refresh</>
          ) : (
            <><Sparkles className="h-4 w-4" /> Analyse</>
          )}
        </button>
      </div>

      {/* Loading state */}
      {generateMutation.isPending && (
        <div className="mt-8 flex flex-col items-center gap-3 text-center">
          <div className="h-10 w-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-sm text-slate-400">Analysing your job search history and market signals…</p>
        </div>
      )}

      {/* Error */}
      {generateMutation.isError && (
        <div className="mt-6 rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
          Something went wrong. Please try again.
        </div>
      )}

      {/* Results */}
      {result && !generateMutation.isPending && (
        <div className="mt-8 space-y-4">
          {/* Sector + summary */}
          <div className="rounded-xl px-5 py-4" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-indigo-400" />
              <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wide">Sector: {result.sector}</span>
              <span className="ml-auto text-xs text-slate-500">{fmtDate(result.generatedAt)}</span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">{result.summary}</p>
          </div>

          {/* Skills */}
          {result.skills.map((skill) => {
            const cfg = TREND_CONFIG[skill.trend] ?? TREND_CONFIG.rising;
            const isOpen = expanded === skill.skill;
            return (
              <div key={skill.skill} className="rounded-xl overflow-hidden" style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid #1e293b' }}>
                <button
                  onClick={() => setExpanded(isOpen ? null : skill.skill)}
                  className="w-full text-left px-5 py-4 flex items-center gap-3"
                >
                  <div className="shrink-0 flex items-center gap-2">
                    <Zap className="h-4 w-4" style={{ color: cfg.color }} />
                    <span className="text-sm font-bold text-white">{skill.skill}</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                    {cfg.label}
                  </span>
                  <span className="ml-auto text-xs text-slate-500">{skill.timeframe}</span>
                  {isOpen ? <ChevronUp className="h-4 w-4 text-slate-500 shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-500 shrink-0" />}
                </button>

                {isOpen && (
                  <div className="px-5 pb-4 border-t border-slate-800">
                    <p className="text-sm text-slate-300 mt-3 mb-4 leading-relaxed">{skill.reason}</p>
                    {skill.courses.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
                          <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wide">Recommended Courses</span>
                        </div>
                        <div className="space-y-2">
                          {skill.courses.map((course, i) => (
                            <a key={i} href={course.url} target="_blank" rel="noopener noreferrer"
                              className="flex items-start gap-3 p-3 rounded-lg group transition-colors"
                              style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)' }}>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-200 group-hover:text-indigo-300 transition-colors truncate">{course.title}</p>
                                <p className="text-xs text-slate-500 mt-0.5">{course.provider} · {course.level}</p>
                              </div>
                              <ExternalLink className="h-3.5 w-3.5 text-slate-500 group-hover:text-indigo-400 transition-colors shrink-0 mt-0.5" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          <p className="text-xs text-slate-600 text-center pt-2">
            Predictions are AI-generated based on your application history and market signals. Not a guarantee of hiring outcomes.
          </p>
        </div>
      )}

      {/* Empty state */}
      {!result && !generateMutation.isPending && (
        <div className="mt-12 flex flex-col items-center gap-4 text-center">
          <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Radar style={{ width: 32, height: 32, color: '#818cf8' }} />
          </div>
          <div>
            <p className="text-base font-semibold text-slate-200 mb-1">Predict your next skill move</p>
            <p className="text-sm text-slate-400 max-w-sm">
              Job Radar analyses your application history to identify which skills will be in highest demand in your sector over the next 6–12 months — and suggests courses to get there first.
            </p>
          </div>
          <button onClick={handleGenerate}
            className="mt-2 flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff' }}>
            <Sparkles className="h-4 w-4" /> Run Job Radar
          </button>
        </div>
      )}
    </div>
  );
}
