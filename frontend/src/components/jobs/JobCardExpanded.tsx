import {
    Sparkles,
    TrendingUp,
    AlertTriangle,
    Info,
    CheckCircle2,
    ExternalLink,
    FileText,
    Target,
    Radar,
    Loader2,
    X,
    Beaker
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { JobCardCompact } from './JobCardCompact';

type JobCardExpandedProps = {
    job: {
        id: string;
        title: string;
        company: string;
        location: string;
        salaryMin: number | null;
        salaryMax: number | null;
        workMode: string | null;
        source: string;
        applyUrl: string;
        fitScore: number;
        postedAt?: string;
        requirements?: string[];
        scamAnalysis?: {
            riskScore: number;
            level: 'low' | 'medium' | 'high';
            reasons?: string[];
        };
    };
    applicationStatus?: string;
    isSaved?: boolean;
    onToggleSave?: () => void;
    onCollapse?: () => void;
    onCreateDraft?: () => void;
    onTailorResume?: () => void;
    onStartRadarScan?: () => void;
    isCreatingDraft?: boolean;
    isTailoringResume?: boolean;
    isStartingRadarScan?: boolean;
    fitAnalysis?: {
        skillsMatch: number;
        experienceMatch: number;
        salaryMatch: number;
        cultureMatch: number;
        strengths: string[];
        gaps: string[];
        extractedRequirements?: string[];
    };
};

export function JobCardExpanded({
    job,
    applicationStatus,
    isSaved,
    onToggleSave,
    onCollapse,
    onCreateDraft,
    onTailorResume,
    onStartRadarScan,
    isCreatingDraft = false,
    isTailoringResume = false,
    isStartingRadarScan = false,
    fitAnalysis,
}: JobCardExpandedProps) {
    const [selectedScoreCategory, setSelectedScoreCategory] = useState<'skills' | 'experience' | 'salary' | 'culture' | null>(null);

    // Mock data if not provided
    const analysis = fitAnalysis || {
        skillsMatch: Math.min(job.fitScore + 5, 100),
        experienceMatch: Math.min(job.fitScore + 10, 100),
        salaryMatch: Math.max(job.fitScore - 15, 60),
        cultureMatch: Math.max(job.fitScore - 10, 70),
        strengths: [
            'Strong technical skills alignment',
            'Experience level matches requirements',
            'Domain knowledge is relevant',
        ],
        gaps: [
            'Salary slightly below your target range',
            'Some preferred skills missing',
        ],
    };

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-emerald-400';
        if (score >= 75) return 'text-blue-400';
        if (score >= 60) return 'text-amber-400';
        return 'text-red-400';
    };

    const getBarColor = (score: number) => {
        if (score >= 90) return 'bg-emerald-500';
        if (score >= 75) return 'bg-blue-500';
        if (score >= 60) return 'bg-amber-400';
        return 'bg-red-500';
    };

    return (
        <>
            <article className="relative bg-slate-900/80 backdrop-blur-sm border border-emerald-500/40 rounded-2xl p-1 shadow-lg shadow-emerald-900/20 transition-all duration-300">
                {/* Glow animation */}
                <div className="absolute inset-0 rounded-2xl bg-emerald-500/5 animate-pulse" style={{ animationDuration: '3s' }} />

                {/* Inner container */}
                <div className="relative bg-slate-900 rounded-xl p-6">
                    {/* Compact header */}
                    <JobCardCompact
                        job={job}
                        applicationStatus={applicationStatus}
                        isSaved={isSaved}
                        onToggleSave={onToggleSave}
                        onExpand={onCollapse}
                        onCreateDraft={onCreateDraft}
                        isExpanded={true}
                    />

                    {/* Divider */}
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-700 to-transparent my-7" />

                    {/* EXPANDED CONTENT */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Column 1: Match Breakdown */}
                        <div className="space-y-5">
                            <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-emerald-500" />
                                Match Breakdown
                            </h3>

                            <div className="space-y-4">
                                {/* Skills */}
                                <button
                                    onClick={() => setSelectedScoreCategory('skills')}
                                    className="w-full text-left hover:opacity-80 transition-opacity"
                                >
                                    <div className="flex justify-between text-xs mb-1.5">
                                        <span className="text-slate-400">Technical Skills</span>
                                        <span className={`font-medium ${getScoreColor(analysis.skillsMatch)}`}>
                                            {analysis.skillsMatch}%
                                        </span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden cursor-pointer">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${getBarColor(analysis.skillsMatch)}`}
                                            style={{ width: `${analysis.skillsMatch}%` }}
                                        />
                                    </div>
                                    {job.requirements && job.requirements.length > 0 && (
                                        <p className="text-[11px] text-slate-500 mt-1">
                                            Matches: {job.requirements.slice(0, 3).join(', ')}
                                        </p>
                                    )}
                                </button>

                                {/* Experience */}
                                <button
                                    onClick={() => setSelectedScoreCategory('experience')}
                                    className="w-full text-left hover:opacity-80 transition-opacity"
                                >
                                    <div className="flex justify-between text-xs mb-1.5">
                                        <span className="text-slate-400">Experience Level</span>
                                        <span className={`font-medium ${getScoreColor(analysis.experienceMatch)}`}>
                                            {analysis.experienceMatch}%
                                        </span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden cursor-pointer">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${getBarColor(analysis.experienceMatch)}`}
                                            style={{ width: `${analysis.experienceMatch}%` }}
                                        />
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-1">
                                        You meet or exceed requirements
                                    </p>
                                </button>

                                {/* Salary */}
                                <button
                                    onClick={() => setSelectedScoreCategory('salary')}
                                    className="w-full text-left hover:opacity-80 transition-opacity"
                                >
                                    <div className="flex justify-between text-xs mb-1.5">
                                        <span className="text-slate-400">Salary Match</span>
                                        <span className={`font-medium ${getScoreColor(analysis.salaryMatch)}`}>
                                            {analysis.salaryMatch}%
                                        </span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden cursor-pointer">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${getBarColor(analysis.salaryMatch)}`}
                                            style={{ width: `${analysis.salaryMatch}%` }}
                                        />
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-1">
                                        {analysis.salaryMatch >= 80 ? 'Within your target range' : 'Below your target range'}
                                    </p>
                                </button>

                                {/* Culture */}
                                <button
                                    onClick={() => setSelectedScoreCategory('culture')}
                                    className="w-full text-left hover:opacity-80 transition-opacity"
                                >
                                    <div className="flex justify-between text-xs mb-1.5">
                                        <span className="text-slate-400">Culture Signals</span>
                                        <span className={`font-medium ${getScoreColor(analysis.cultureMatch)}`}>
                                            {analysis.cultureMatch}%
                                        </span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden cursor-pointer">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${getBarColor(analysis.cultureMatch)}`}
                                            style={{ width: `${analysis.cultureMatch}%` }}
                                        />
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-1">
                                        Based on company profile
                                    </p>
                                </button>
                            </div>
                        </div>

                        {/* Column 2: Strengths & Gaps */}
                        <div className="space-y-5">
                            <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                                What to Know
                            </h3>

                            {/* Strengths */}
                            {analysis.strengths.length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold text-emerald-400 mb-2 uppercase tracking-wider">
                                        Strengths
                                    </p>
                                    <ul className="space-y-2">
                                        {analysis.strengths.map((strength, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                                <span>{strength}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Gaps */}
                            {analysis.gaps.length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold text-amber-400 mb-2 uppercase tracking-wider">
                                        Considerations
                                    </p>
                                    <ul className="space-y-2">
                                        {analysis.gaps.map((gap, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                                                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                                                <span>{gap}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Scam Warning */}
                            {job.scamAnalysis && job.scamAnalysis.level !== 'low' && (
                                <div className={`rounded-xl border p-3 ${job.scamAnalysis.level === 'high'
                                    ? 'bg-red-500/10 border-red-500/30'
                                    : 'bg-amber-500/10 border-amber-500/30'
                                    }`}>
                                    <p className={`text-sm font-semibold mb-1 flex items-center gap-2 ${job.scamAnalysis.level === 'high' ? 'text-red-400' : 'text-amber-400'
                                        }`}>
                                        <AlertTriangle className="w-4 h-4" />
                                        {job.scamAnalysis.level === 'high' ? 'High Risk Detected' : 'Review Recommended'}
                                    </p>
                                    {job.scamAnalysis.reasons && job.scamAnalysis.reasons.length > 0 && (
                                        <ul className="mt-2 space-y-1 text-xs text-slate-300">
                                            {job.scamAnalysis.reasons.map((reason, i) => (
                                                <li key={i} className="flex items-start gap-1.5">
                                                    <span className="text-slate-500">•</span>
                                                    <span>{reason}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Column 3: Actions */}
                        <div className="space-y-5">
                            <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                                <Target className="w-4 h-4 text-blue-500" />
                                Next Steps
                            </h3>

                            <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-xl p-4 border border-slate-700 space-y-4">
                                <p className="text-sm text-slate-300">
                                    To maximize your chances:
                                </p>

                                <ul className="space-y-2">
                                    <li className="flex items-center gap-2 text-sm text-slate-300">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                        Review full job description
                                    </li>
                                    <li className="flex items-center gap-2 text-sm text-slate-300">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                        Tailor your resume
                                    </li>
                                    <li className="flex items-center gap-2 text-sm text-slate-300">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                        Prepare key questions
                                    </li>
                                </ul>

                                <div className="flex flex-col gap-3 pt-2">
                                    <Link
                                        to={`/jobs/${job.id}`}
                                        className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm"
                                    >
                                        <FileText className="w-4 h-4" />
                                        View Full Report
                                    </Link>

                                    <button
                                        onClick={onCreateDraft}
                                        disabled={isCreatingDraft || isTailoringResume}
                                        className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {isCreatingDraft ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                <Target className="w-4 h-4" />
                                                Start Application
                                            </>
                                        )}
                                    </button>

                                    {job.applyUrl && (
                                        <a
                                            href={job.applyUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors border border-slate-600"
                                        >
                                            Quick Apply (External)
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    )}

                                    <button
                                        onClick={onTailorResume}
                                        disabled={isTailoringResume || isCreatingDraft}
                                        className="px-4 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition-colors border border-slate-600 disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {isTailoringResume ? (
                                            <>
                                                <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-4 h-4 inline mr-2" />
                                                Tailor CV
                                            </>
                                        )}
                                    </button>

                                    <button
                                        onClick={onStartRadarScan}
                                        disabled={isStartingRadarScan}
                                        className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold transition-all border border-indigo-500/50 shadow-lg shadow-indigo-900/30 disabled:opacity-60 disabled:cursor-not-allowed"
                                        title="Deep employer & risk analysis"
                                    >
                                        {isStartingRadarScan ? (
                                            <>
                                                <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                                                Starting Scan...
                                            </>
                                        ) : (
                                            <>
                                                <Radar className="w-4 h-4 inline mr-2" />
                                                Job Radar Scan
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </article>

            {/* Scoring Breakdown Modal */}
            {selectedScoreCategory && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#020617] p-6 space-y-4 max-h-[85vh] flex flex-col">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-indigo-400" />
                                {selectedScoreCategory === 'skills' && 'Technical Skills Match'}
                                {selectedScoreCategory === 'experience' && 'Experience Level Match'}
                                {selectedScoreCategory === 'salary' && 'Salary Match'}
                                {selectedScoreCategory === 'culture' && 'Culture & Values Match'}
                            </h2>
                            <button onClick={() => setSelectedScoreCategory(null)} className="text-slate-400 hover:text-white">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-4">
                            {/* Score Display */}
                            <div className="flex items-center justify-center py-4">
                                <span className="text-6xl font-bold text-indigo-400">
                                    {selectedScoreCategory === 'skills' && analysis.skillsMatch}
                                    {selectedScoreCategory === 'experience' && analysis.experienceMatch}
                                    {selectedScoreCategory === 'salary' && analysis.salaryMatch}
                                    {selectedScoreCategory === 'culture' && analysis.cultureMatch}%
                                </span>
                            </div>

                            {/* Scoring Explanation */}
                            {selectedScoreCategory === 'skills' && (
                                <div className="space-y-3">
                                    <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-3 space-y-2">
                                        <p className="text-sm font-semibold text-indigo-400">How we calculated this:</p>
                                        <ul className="text-xs text-indigo-300 space-y-1 list-disc list-inside">
                                            <li>Matched your skills against job requirements</li>
                                            <li>Weighted by importance in job description</li>
                                            <li>Considered proficiency levels</li>
                                            <li>Factored in related technologies</li>
                                        </ul>
                                        {(fitAnalysis?.extractedRequirements && fitAnalysis.extractedRequirements.length > 0) && (
                                            <div className="mt-2 pt-2 border-t border-indigo-500/20">
                                                <p className="text-xs font-semibold text-indigo-300 mb-1">Skills analyzed from job description:</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {fitAnalysis.extractedRequirements.slice(0, 8).map((req, i) => (
                                                        <span key={i} className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-[10px] text-indigo-200 border border-indigo-500/30">
                                                            {req}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 space-y-2">
                                        <p className="text-sm font-semibold text-emerald-400">Your matched skills:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {job.requirements?.slice(0, 6).map((req, i) => (
                                                <span key={i} className="px-2 py-1 rounded-lg bg-emerald-500/20 text-xs text-emerald-300 border border-emerald-500/30">
                                                    {req}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 space-y-2">
                                        <p className="text-sm font-semibold text-amber-400">Skills to develop:</p>
                                        <p className="text-xs text-amber-300">
                                            Consider learning or refreshing: Advanced frameworks, Cloud platforms, DevOps practices
                                        </p>
                                    </div>
                                    {/* Skills Gap Analysis */}
                                    {analysis.gaps && analysis.gaps.length > 0 && (
                                        <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-3 space-y-2">
                                            <p className="text-sm font-semibold text-purple-400 flex items-center gap-2">
                                                <Beaker className="h-4 w-4" />
                                                Skills Gap Analysis
                                            </p>
                                            <ul className="text-xs text-purple-300 space-y-1">
                                                {analysis.gaps.map((gap, i) => (
                                                    <li key={i} className="flex items-start gap-2">
                                                        <span className="text-purple-400">•</span>
                                                        <span>{gap}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                            <Link
                                                to="/skills"
                                                className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-purple-600 hover:bg-purple-500 px-3 py-2 text-xs font-semibold text-white transition-colors"
                                            >
                                                <Beaker className="h-3.5 w-3.5" />
                                                Go to Skills Lab
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            )}

                            {selectedScoreCategory === 'experience' && (
                                <div className="space-y-3">
                                    <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-3 space-y-2">
                                        <p className="text-sm font-semibold text-indigo-400">How we calculated this:</p>
                                        <ul className="text-xs text-indigo-300 space-y-1 list-disc list-inside">
                                            <li>Analyzed your years of experience</li>
                                            <li>Matched job titles and responsibilities</li>
                                            <li>Evaluated industry relevance</li>
                                            <li>Considered career progression</li>
                                        </ul>
                                    </div>
                                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 space-y-2">
                                        <p className="text-sm font-semibold text-emerald-400">Your experience level:</p>
                                        <p className="text-xs text-emerald-300">
                                            You meet or exceed the required experience level for this role
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-slate-500/30 bg-slate-500/10 px-4 py-3 space-y-2">
                                        <p className="text-sm font-semibold text-slate-400">Relevant roles:</p>
                                        <p className="text-xs text-slate-300">
                                            Senior Engineer, Tech Lead, Architect
                                        </p>
                                    </div>
                                </div>
                            )}

                            {selectedScoreCategory === 'salary' && (
                                <div className="space-y-3">
                                    <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-3 space-y-2">
                                        <p className="text-sm font-semibold text-indigo-400">How we calculated this:</p>
                                        <ul className="text-xs text-indigo-300 space-y-1 list-disc list-inside">
                                            <li>Compared job salary range to your target</li>
                                            <li>Factored in location cost of living</li>
                                            <li>Considered benefits package value</li>
                                            <li>Evaluated equity/stock options</li>
                                        </ul>
                                    </div>
                                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 space-y-2">
                                        <p className="text-sm font-semibold text-amber-400">Salary details:</p>
                                        <div className="text-xs text-amber-300 space-y-1">
                                            <p>Job range: £{job.salaryMin?.toLocaleString()} - £{job.salaryMax?.toLocaleString()}</p>
                                            <p>Your target: £80,000 - £120,000</p>
                                            <p>Gap: {analysis.salaryMatch >= 80 ? 'Within range' : 'Below target'}</p>
                                        </div>
                                    </div>
                                    <div className="rounded-xl border border-slate-500/30 bg-slate-500/10 px-4 py-3 space-y-2">
                                        <p className="text-sm font-semibold text-slate-400">Benefits considered:</p>
                                        <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                                            <li>Pension: 5% employer contribution</li>
                                            <li>Health insurance: Comprehensive</li>
                                            <li>Flexible working: 3 days remote</li>
                                            <li>Professional development: £2,000/year</li>
                                        </ul>
                                    </div>
                                </div>
                            )}

                            {selectedScoreCategory === 'culture' && (
                                <div className="space-y-3">
                                    <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-3 space-y-2">
                                        <p className="text-sm font-semibold text-indigo-400">How we calculated this:</p>
                                        <ul className="text-xs text-indigo-300 space-y-1 list-disc list-inside">
                                            <li>Analyzed company values and mission</li>
                                            <li>Reviewed team structure and size</li>
                                            <li>Evaluated work environment signals</li>
                                            <li>Considered company growth stage</li>
                                        </ul>
                                    </div>
                                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 space-y-2">
                                        <p className="text-sm font-semibold text-emerald-400">Company culture signals:</p>
                                        <ul className="text-xs text-emerald-300 space-y-1 list-disc list-inside">
                                            <li>Innovation-focused: Strong emphasis on R&D</li>
                                            <li>Collaborative: Cross-functional teams</li>
                                            <li>Growth-oriented: Career development programs</li>
                                            <li>Inclusive: Diverse team composition</li>
                                        </ul>
                                    </div>
                                    <div className="rounded-xl border border-slate-500/30 bg-slate-500/10 px-4 py-3 space-y-2">
                                        <p className="text-sm font-semibold text-slate-400">Company info:</p>
                                        <p className="text-xs text-slate-300">
                                            {job.company} - {job.location} - Growth Stage Startup
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="pt-2">
                            <button
                                onClick={() => setSelectedScoreCategory(null)}
                                className="w-full rounded-xl border border-white/10 py-2 text-sm text-slate-400 transition hover:bg-white/5"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
