import {
    MapPin,
    DollarSign,
    ChevronDown,
    ChevronUp,
    Bookmark,
    BookmarkCheck,
    Sparkles,
    Building2,
    Clock,
    Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';

type JobCardCompactProps = {
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
        scamAnalysis?: {
            riskScore: number;
            level: 'low' | 'medium' | 'high';
        };
    };
    applicationStatus?: string;
    isSaved?: boolean;
    onToggleSave?: () => void;
    onExpand?: () => void;
    onExplain?: () => void;
    isExpanded?: boolean;
};

const STATUS_COLORS: Record<string, string> = {
    draft: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    prepared: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    sent: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    interview: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    accepted: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
};

function formatSalary(min: number | null, max: number | null): string | null {
    if (!min && !max) return null;
    if (min && max) return `£${Math.round(min / 1000)}k–£${Math.round(max / 1000)}k`;
    if (min) return `£${Math.round(min / 1000)}k+`;
    return `up to £${Math.round((max ?? 0) / 1000)}k`;
}

function getFitScoreColor(score: number): string {
    if (score >= 90) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    if (score >= 80) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    if (score >= 70) return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    if (score >= 60) return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    return 'bg-red-500/10 text-red-400 border-red-500/30';
}

function getTimeAgo(dateString?: string): string | null {
    if (!dateString) return null;
    const date = new Date(dateString);
    const diffDays = Math.floor((Date.now() - date.getTime()) / 86400000);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function JobCardCompact({
    job,
    applicationStatus,
    isSaved = false,
    onToggleSave,
    onExpand,
    onExplain,
    isExpanded = false,
}: JobCardCompactProps) {
    const salary = formatSalary(job.salaryMin, job.salaryMax);
    const timeAgo = getTimeAgo(job.postedAt);
    const fitScoreColor = getFitScoreColor(job.fitScore);
    const hasWarning = job.scamAnalysis && job.scamAnalysis.level !== 'low';

    return (
        <article
            className={`
        group relative backdrop-blur-sm border rounded-2xl p-5
        transition-all duration-300 cursor-pointer
        ${isExpanded
                    ? 'border-emerald-500/40 shadow-lg shadow-emerald-900/20 bg-white/[0.06]'
                    : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]'
                }
      `}
            onClick={onExpand}
        >
            {/* Glow effect for high matches */}
            {job.fitScore >= 90 && !isExpanded && (
                <div className="absolute inset-0 rounded-2xl bg-emerald-500/5 blur-xl opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
            )}

            <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4 flex-1 min-w-0">
                    {/* Company Logo */}
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center shrink-0 border border-slate-700 shadow-inner">
                        <Building2 className="w-6 h-6 text-slate-400" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        {/* Title & Badges */}
                        <div className="flex items-start gap-3 mb-2 flex-wrap">
                            <Link
                                to={`/jobs/${job.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-lg font-bold text-slate-200 group-hover:text-white transition-colors hover:underline"
                            >
                                {job.title}
                            </Link>

                            <div className="flex items-center gap-2 flex-wrap">
                                {/* Fit Score Badge */}
                                <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold tracking-wide border ${fitScoreColor}`}>
                                    {job.fitScore}% MATCH
                                </span>

                                {/* Application Status */}
                                {applicationStatus && (
                                    <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold border ${STATUS_COLORS[applicationStatus] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}>
                                        {applicationStatus.toUpperCase()}
                                    </span>
                                )}

                                {/* Warning Badge */}
                                {hasWarning && (
                                    <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border flex items-center gap-1 ${job.scamAnalysis!.level === 'high'
                                        ? 'bg-red-500/10 text-red-400 border-red-500/30'
                                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                        }`}>
                                        ⚠ {job.scamAnalysis!.level === 'high' ? 'HIGH RISK' : 'REVIEW'}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Company & Meta */}
                        <div className="flex items-center gap-3 text-sm text-slate-400 mb-3 flex-wrap">
                            <span className="flex items-center gap-1.5 hover:text-slate-300 transition-colors">
                                <Building2 className="w-3.5 h-3.5" />
                                {job.company}
                            </span>

                            {job.location && (
                                <>
                                    <span className="w-1 h-1 rounded-full bg-slate-700" />
                                    <span className="flex items-center gap-1.5">
                                        <MapPin className="w-3.5 h-3.5" />
                                        {job.location}
                                    </span>
                                </>
                            )}

                            {salary && (
                                <>
                                    <span className="w-1 h-1 rounded-full bg-slate-700" />
                                    <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                                        <DollarSign className="w-3.5 h-3.5 text-emerald-500/70" />
                                        {salary}
                                    </span>
                                </>
                            )}

                            {job.workMode && (
                                <>
                                    <span className="w-1 h-1 rounded-full bg-slate-700" />
                                    <span className="px-2 py-0.5 rounded-full border border-slate-700 bg-slate-800/50 text-xs font-medium capitalize">
                                        {job.workMode}
                                    </span>
                                </>
                            )}

                            {timeAgo && (
                                <>
                                    <span className="w-1 h-1 rounded-full bg-slate-700" />
                                    <span className="flex items-center gap-1.5 text-slate-500">
                                        <Clock className="w-3.5 h-3.5" />
                                        {timeAgo}
                                    </span>
                                </>
                            )}
                        </div>

                        {/* AI Summary - Always visible */}
                        <div className={`pl-4 border-l-2 transition-colors ${isExpanded ? 'border-emerald-500/50' : 'border-slate-700 group-hover:border-emerald-500/30'
                            }`}>
                            <p className="text-sm text-slate-400 line-clamp-2">
                                <span className="font-medium text-slate-300">
                                    <Sparkles className="w-3.5 h-3.5 inline mr-1 text-emerald-400" />
                                    AI Insight:
                                </span>{' '}
                                Strong alignment with your skills. {job.fitScore >= 80 ? 'Highly recommended.' : 'Worth reviewing.'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleSave?.();
                        }}
                        className="w-9 h-9 rounded-lg bg-white/5 text-slate-400 hover:text-emerald-400 hover:bg-white/10 border border-white/10 transition-all flex items-center justify-center"
                        title={isSaved ? 'Unsave Job' : 'Save Job'}
                    >
                        {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                    </button>

                    {onExplain && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onExplain();
                            }}
                            className="w-9 h-9 rounded-lg bg-white/5 text-slate-400 hover:text-indigo-400 hover:bg-white/10 border border-white/10 transition-all flex items-center justify-center"
                            title="Why this match?"
                        >
                            <Zap className="w-4 h-4" />
                        </button>
                    )}

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onExpand?.();
                        }}
                        className="w-9 h-9 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/10 transition-all flex items-center justify-center"
                        title={isExpanded ? 'Collapse' : 'Expand Details'}
                    >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        </article>
    );
}
