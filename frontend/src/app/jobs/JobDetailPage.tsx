import { useParams, Link, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { api } from '@/lib/api';
import {
    ArrowLeft,
    Building2,
    MapPin,
    DollarSign,
    ExternalLink,
    Bookmark,
    BookmarkCheck,
    Loader2,
    TrendingUp,
    AlertTriangle,
    CheckCircle2,
    Info,
    Sparkles,
    FileText,
    Target,
    Briefcase
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function JobDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useUser();
    const userId = user?.id ?? '';
    const [isSaved, setIsSaved] = useState(false);

    const jobQuery = api.jobs.getById.useQuery(
        { id: id! },
        { enabled: !!id }
    );

    const fitQuery = api.jobs.explainFit.useQuery(
        { userId, jobId: id! },
        { enabled: !!id && !!userId }
    );

    const savedJobsQuery = api.jobs.getSavedJobs.useQuery(undefined, { enabled: !!userId });
    const saveJobMutation = api.jobs.saveJob.useMutation();
    const unsaveJobMutation = api.jobs.unsaveJob.useMutation();

    useEffect(() => {
        if (savedJobsQuery.data && id) {
            setIsSaved(savedJobsQuery.data.some(j => j.job.id === id));
        }
    }, [savedJobsQuery.data, id]);

    const handleToggleSave = () => {
        if (!id) return;
        const wasSaved = isSaved;
        setIsSaved(!wasSaved);
        if (wasSaved) {
            unsaveJobMutation.mutate({ jobId: id }, { onError: () => setIsSaved(true) });
        } else {
            saveJobMutation.mutate({ jobId: id }, { onError: () => setIsSaved(false) });
        }
    };

    if (jobQuery.isLoading || fitQuery.isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                    <p className="text-sm text-slate-400">Loading job details...</p>
                </div>
            </div>
        );
    }

    if (!jobQuery.data) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-bold text-white mb-2">Job Not Found</h2>
                    <p className="text-slate-400 mb-4">This job listing may have been removed.</p>
                    <Link
                        to="/jobs"
                        className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Jobs
                    </Link>
                </div>
            </div>
        );
    }

    const job = jobQuery.data;
    const fit = fitQuery.data?.fit;
    const scam = fitQuery.data?.scam;

    const formatSalary = (min: string | null, max: string | null) => {
        if (!min && !max) return null;
        const minNum = min ? Number(min) : null;
        const maxNum = max ? Number(max) : null;
        if (minNum && maxNum) return `£${Math.round(minNum / 1000)}k–£${Math.round(maxNum / 1000)}k`;
        if (minNum) return `£${Math.round(minNum / 1000)}k+`;
        if (maxNum) return `up to £${Math.round(maxNum / 1000)}k`;
        return null;
    };

    const salary = formatSalary(job.salaryMin, job.salaryMax);
    const fitScore = fit?.score ?? job.fitScore ?? 60;

    const getFitScoreColor = (score: number) => {
        if (score >= 90) return 'text-emerald-400';
        if (score >= 80) return 'text-emerald-400';
        if (score >= 70) return 'text-blue-400';
        if (score >= 60) return 'text-amber-400';
        return 'text-red-400';
    };

    return (
        <div className="min-h-screen text-slate-300">
            {/* Sticky Header */}
            <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-white/10 px-8 py-5">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span className="text-sm font-medium">Back</span>
                        </button>
                        <div className="w-px h-6 bg-white/10" />
                        <div>
                            <h1 className="text-xl font-bold text-white">{job.title}</h1>
                            <p className="text-sm text-slate-400">{job.company}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className={`px-4 py-2 rounded-lg border font-bold ${fitScore >= 80
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : fitScore >= 60
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                : 'bg-red-500/10 text-red-400 border-red-500/30'
                            }`}>
                            {fitScore}% Match
                        </div>

                        <button
                            onClick={handleToggleSave}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border border-white/10 transition-all"
                        >
                            {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                            {isSaved ? 'Saved' : 'Save'}
                        </button>

                        {job.applyUrl && (
                            <a
                                href={job.applyUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-6 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                            >
                                Apply Now
                                <ExternalLink className="w-4 h-4" />
                            </a>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="px-8 py-8 max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Job Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Overview Card */}
                        <section className="bg-white/[0.04] border border-white/10 rounded-2xl p-6">
                            <div className="flex items-start gap-5 mb-6">
                                <div className="w-16 h-16 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0 border border-white/10 shadow-inner">
                                    <Building2 className="w-8 h-8 text-slate-400" />
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-2xl font-bold text-white mb-2">{job.title}</h2>
                                    <div className="flex items-center gap-4 text-sm text-slate-400 flex-wrap">
                                        <span className="flex items-center gap-1.5">
                                            <Building2 className="w-4 h-4" />
                                            {job.company}
                                        </span>
                                        {job.location && (
                                            <>
                                                <span className="w-1 h-1 rounded-full bg-white/10" />
                                                <span className="flex items-center gap-1.5">
                                                    <MapPin className="w-4 h-4" />
                                                    {job.location}
                                                </span>
                                            </>
                                        )}
                                        {salary && (
                                            <>
                                                <span className="w-1 h-1 rounded-full bg-white/10" />
                                                <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                                                    <DollarSign className="w-4 h-4 text-emerald-500/70" />
                                                    {salary}
                                                </span>
                                            </>
                                        )}
                                        {job.workMode && (
                                            <>
                                                <span className="w-1 h-1 rounded-full bg-white/10" />
                                                <span className="px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-xs font-medium capitalize">
                                                    {job.workMode}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* AI Summary */}
                            {fit?.advice && (
                                <div className="pl-4 border-l-2 border-emerald-500/50 mb-6">
                                    <p className="text-sm text-slate-300 leading-relaxed">
                                        <span className="font-semibold text-emerald-400 flex items-center gap-2 mb-2">
                                            <Sparkles className="w-4 h-4" />
                                            AI Insight
                                        </span>
                                        {fit.advice}
                                    </p>
                                </div>
                            )}

                            {/* Scam Warning */}
                            {scam && scam.level !== 'low' && (
                                <div className={`rounded-xl border p-4 ${scam.level === 'high'
                                    ? 'bg-red-500/10 border-red-500/30'
                                    : 'bg-amber-500/10 border-amber-500/30'
                                    }`}>
                                    <p className={`text-sm font-semibold mb-2 flex items-center gap-2 ${scam.level === 'high' ? 'text-red-400' : 'text-amber-400'
                                        }`}>
                                        <AlertTriangle className="w-5 h-5" />
                                        {scam.level === 'high' ? 'High Risk Detected' : 'Review Recommended'}
                                    </p>
                                    {scam.reasons && scam.reasons.length > 0 && (
                                        <ul className="space-y-1 text-sm text-slate-300">
                                            {scam.reasons.map((reason: string, i: number) => (
                                                <li key={i} className="flex items-start gap-2">
                                                    <span className="text-slate-500">•</span>
                                                    <span>{reason}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}
                        </section>

                        {/* Description */}
                        {job.description && (
                            <section className="bg-white/[0.04] border border-white/10 rounded-2xl p-6">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-indigo-400" />
                                    Job Description
                                </h3>
                                <div className="prose prose-invert prose-sm max-w-none">
                                    <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                                        {job.description}
                                    </p>
                                </div>
                            </section>
                        )}

                        {/* Requirements */}
                        {job.requirements && (job.requirements as string[]).length > 0 && (
                            <section className="bg-white/[0.04] border border-white/10 rounded-2xl p-6">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                    Requirements
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {(job.requirements as string[]).map((req, i) => (
                                        <span
                                            key={i}
                                            className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-sm font-medium text-slate-300"
                                        >
                                            {req}
                                        </span>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Right Column: Match Analysis */}
                    <div className="space-y-6">
                        {/* Fit Score Card */}
                        <section className="bg-white/[0.04] border border-white/10 rounded-2xl p-6">
                            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-emerald-500" />
                                Match Analysis
                            </h3>

                            <div className="flex items-center justify-center py-6 mb-6">
                                <span className={`text-6xl font-bold ${getFitScoreColor(fitScore)}`}>
                                    {fitScore}%
                                </span>
                            </div>

                            {fit && (
                                <div className="space-y-4">
                                    {/* Strengths */}
                                    {fit.strengths && fit.strengths.length > 0 && (
                                        <div>
                                            <p className="text-xs font-semibold text-emerald-400 mb-2 uppercase tracking-wider">
                                                Strengths
                                            </p>
                                            <ul className="space-y-2">
                                                {fit.strengths.map((strength: string, i: number) => (
                                                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                                        <span>{strength}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Gaps */}
                                    {fit.gaps && fit.gaps.length > 0 && (
                                        <div>
                                            <p className="text-xs font-semibold text-amber-400 mb-2 uppercase tracking-wider">
                                                Considerations
                                            </p>
                                            <ul className="space-y-2">
                                                {fit.gaps.map((gap: string, i: number) => (
                                                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                                                        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                                                        <span>{gap}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </section>

                        {/* Action Plan */}
                        <section className="bg-white/[0.04] border border-white/10 rounded-2xl p-6">
                            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Target className="w-4 h-4 text-blue-500" />
                                Next Steps
                            </h3>

                            <p className="text-sm text-slate-300 mb-4">
                                To maximize your chances:
                            </p>

                            <ul className="space-y-2 mb-6">
                                <li className="flex items-center gap-2 text-sm text-slate-300">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                    Tailor your resume to highlight relevant skills
                                </li>
                                <li className="flex items-center gap-2 text-sm text-slate-300">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                    Prepare questions about the role
                                </li>
                                <li className="flex items-center gap-2 text-sm text-slate-300">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                    Research the company culture
                                </li>
                            </ul>

                            <div className="flex flex-col gap-3">
                                <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors border border-white/10">
                                    <Sparkles className="w-4 h-4" />
                                    Tailor Resume
                                </button>
                                <Link
                                    to="/interview"
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
                                >
                                    <Briefcase className="w-4 h-4" />
                                    Practice Interview
                                </Link>
                            </div>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}
