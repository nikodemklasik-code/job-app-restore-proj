import {
    Sparkles,
    TrendingUp,
    AlertTriangle,
    Info,
    CheckCircle2,
    ExternalLink,
    FileText,
    Target
} from 'lucide-react';
import { Link } from 'react-router-dom';
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
    fitAnalysis?: {
        skillsMatch: number;
        experienceMatch: number;
        salaryMatch: number;
        cultureMatch: number;
        strengths: string[];
        gaps: string[];
    };
};

export function JobCardExpanded({
    job,
    applicationStatus,
    isSaved,
    onToggleSave,
    onCollapse,
    fitAnalysis,
}: JobCardExpandedProps) {
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
                            <div>
                                <div className="flex justify-between text-xs mb-1.5">
                                    <span className="text-slate-400">Technical Skills</span>
                                    <span className={`font-medium ${getScoreColor(analysis.skillsMatch)}`}>
                                        {analysis.skillsMatch}%
                                    </span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
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
                            </div>

                            {/* Experience */}
                            <div>
                                <div className="flex justify-between text-xs mb-1.5">
                                    <span className="text-slate-400">Experience Level</span>
                                    <span className={`font-medium ${getScoreColor(analysis.experienceMatch)}`}>
                                        {analysis.experienceMatch}%
                                    </span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${getBarColor(analysis.experienceMatch)}`}
                                        style={{ width: `${analysis.experienceMatch}%` }}
                                    />
                                </div>
                                <p className="text-[11px] text-slate-500 mt-1">
                                    You meet or exceed requirements
                                </p>
                            </div>

                            {/* Salary */}
                            <div>
                                <div className="flex justify-between text-xs mb-1.5">
                                    <span className="text-slate-400">Salary Match</span>
                                    <span className={`font-medium ${getScoreColor(analysis.salaryMatch)}`}>
                                        {analysis.salaryMatch}%
                                    </span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${getBarColor(analysis.salaryMatch)}`}
                                        style={{ width: `${analysis.salaryMatch}%` }}
                                    />
                                </div>
                                <p className="text-[11px] text-slate-500 mt-1">
                                    {analysis.salaryMatch >= 80 ? 'Within your target range' : 'Below your target range'}
                                </p>
                            </div>

                            {/* Culture */}
                            <div>
                                <div className="flex justify-between text-xs mb-1.5">
                                    <span className="text-slate-400">Culture Signals</span>
                                    <span className={`font-medium ${getScoreColor(analysis.cultureMatch)}`}>
                                        {analysis.cultureMatch}%
                                    </span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${getBarColor(analysis.cultureMatch)}`}
                                        style={{ width: `${analysis.cultureMatch}%` }}
                                    />
                                </div>
                                <p className="text-[11px] text-slate-500 mt-1">
                                    Based on company profile
                                </p>
                            </div>
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

                                {job.applyUrl && (
                                    <a
                                        href={job.applyUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                                    >
                                        Apply Now
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                )}

                                <button className="px-4 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition-colors border border-slate-600">
                                    <Sparkles className="w-4 h-4 inline mr-2" />
                                    Tailor Resume
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </article>
    );
}
