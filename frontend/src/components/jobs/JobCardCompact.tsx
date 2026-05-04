import {
    MapPin,
    DollarSign,
    Bookmark,
    BookmarkCheck,
    Building2,
    Clock,
    ChevronDown,
    ChevronUp,
    Zap,
    ExternalLink,
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

function getFitColor(score: number): { bar: string; badge: string } {
    if (score >= 85) return { bar: 'bg-emerald-500', badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' };
    if (score >= 70) return { bar: 'bg-blue-500', badge: 'bg-blue-500/15 text-blue-300 border-blue-500/30' };
    if (score >= 55) return { bar: 'bg-amber-400', badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30' };
    return { bar: 'bg-red-500', badge: 'bg-red-500/15 text-red-300 border-red-500/30' };
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
    const fit = getFitColor(job.fitScore);
    const hasWarning = job.scamAnalysis && job.scamAnalysis.level !== 'low';

    return (
        <article
            className={`relative rounded-2xl border transition-all duration-200 ${
                isExpanded
                    ? 'border-emerald-500/40 bg-white/[0.05]'
                    : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]'
            }`}
        >
            {/* Fit score bar — thin top stripe */}
            <div className="absolute left-0 top-0 h-[3px] w-full overflow-hidden rounded-t-2xl">
                <div className={`h-full transition-all duration-500 ${fit.bar}`} style={{ width: `${job.fitScore}%` }} />
            </div>

            <div className="p-4 pt-5">
                {/* Top row: logo + info + actions */}
                <div className="flex items-start gap-3">
                    {/* Company logo placeholder */}
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] border border-white/10">
                        <Building2 className="h-5 w-5 text-slate-500" />
                    </div>

                    {/* Main info */}
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start gap-x-3 gap-y-1">
                            <Link
                                to={`/jobs/${job.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-base font-bold text-white hover:text-indigo-300 transition-colors"
                            >
                                {job.title}
                            </Link>
                            <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-bold tracking-wide ${fit.badge}`}>
                                {job.fitScore}% match
                            </span>
                            {applicationStatus && (
                                <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${STATUS_COLORS[applicationStatus] ?? 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}>
                                    {applicationStatus}
                                </span>
                            )}
                            {hasWarning && (
                                <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-bold ${job.scamAnalysis!.level === 'high' ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'}`}>
                                    ⚠ {job.scamAnalysis!.level === 'high' ? 'High risk' : 'Review'}
                                </span>
                            )}
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-slate-400">
                            <span>{job.company}</span>
                            {job.location && <><span className="text-slate-600">·</span><span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span></>}
                            {salary && <><span className="text-slate-600">·</span><span className="flex items-center gap-1 font-medium text-slate-300"><DollarSign className="h-3 w-3 text-emerald-500/70" />{salary}</span></>}
                            {job.workMode && <><span className="text-slate-600">·</span><span className="capitalize text-slate-400">{job.workMode}</span></>}
                            {timeAgo && <><span className="text-slate-600">·</span><span className="flex items-center gap-1 text-slate-500"><Clock className="h-3 w-3" />{timeAgo}</span></>}
                        </div>
                    </div>
                </div>

                {/* Action row — always visible */}
                <div className="mt-3 flex items-center gap-2 border-t border-white/[0.06] pt-3">
                    {/* Save */}
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onToggleSave?.(); }}
                        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                            isSaved
                                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                                : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white'
                        }`}
                    >
                        {isSaved ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
                        {isSaved ? 'Saved' : 'Save'}
                    </button>

                    {/* Why this match */}
                    {onExplain && (
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onExplain(); }}
                            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-400 transition-all hover:border-indigo-500/30 hover:bg-indigo-500/10 hover:text-indigo-300"
                        >
                            <Zap className="h-3.5 w-3.5" />
                            Why this match?
                        </button>
                    )}

                    {/* Apply */}
                    {job.applyUrl && (
                        <a
                            href={job.applyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition-all hover:bg-emerald-500/20 hover:text-emerald-200"
                        >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Apply
                        </a>
                    )}

                    {/* Spacer + expand */}
                    <div className="ml-auto flex items-center gap-1">
                        {onExpand && (
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onExpand(); }}
                                className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-slate-400 transition-all hover:border-white/20 hover:text-white"
                                title={isExpanded ? 'Collapse' : 'See details'}
                            >
                                {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                <span className="hidden sm:inline">{isExpanded ? 'Less' : 'Details'}</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </article>
    );
}
