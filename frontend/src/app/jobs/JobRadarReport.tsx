import { useParams, Link } from 'react-router-dom';
import { api } from '@/lib/api';
import {
    Loader2,
    ArrowLeft,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Info,
    DollarSign,
    Building2,
    Users,
    Heart,
    Shield,
    Star,
    ExternalLink,
    RefreshCw,
} from 'lucide-react';

export default function JobRadarReport() {
    const { scanId } = useParams<{ scanId: string }>();
    const reportQuery = api.jobRadar.getReport.useQuery(
        { scanId: scanId! },
        { enabled: !!scanId, refetchInterval: (data) => (data?.summary.status === 'processing' ? 2000 : false) }
    );

    if (reportQuery.isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-indigo-500" />
                    <p className="text-slate-400">Loading Job Radar report...</p>
                </div>
            </div>
        );
    }

    if (reportQuery.isError) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center">
                    <XCircle className="mx-auto h-12 w-12 text-red-400" />
                    <h2 className="mt-4 text-xl font-semibold text-white">Failed to load report</h2>
                    <p className="mt-2 text-sm text-red-300">{String(reportQuery.error)}</p>
                    <Link
                        to="/jobs"
                        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Jobs
                    </Link>
                </div>
            </div>
        );
    }

    const { summary, report, scores, findings, benchmark, sources } = reportQuery.data;

    if (summary.status === 'processing') {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <Loader2 className="h-16 w-16 animate-spin text-indigo-500" />
                        <div className="absolute inset-0 animate-ping rounded-full bg-indigo-500/20" />
                    </div>
                    <h2 className="text-xl font-semibold text-white">Deep Scan in Progress</h2>
                    <p className="text-sm text-slate-400">Analyzing employer, market data, and risk signals...</p>
                    <p className="text-xs text-slate-500">This usually takes 30-60 seconds</p>
                </div>
            </div>
        );
    }

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-emerald-400';
        if (score >= 60) return 'text-blue-400';
        if (score >= 40) return 'text-amber-400';
        return 'text-red-400';
    };

    const getScoreBg = (score: number) => {
        if (score >= 80) return 'bg-emerald-500/20 border-emerald-500/30';
        if (score >= 60) return 'bg-blue-500/20 border-blue-500/30';
        if (score >= 40) return 'bg-amber-500/20 border-amber-500/30';
        return 'bg-red-500/20 border-red-500/30';
    };

    const getRecommendationColor = (rec: string) => {
        if (rec === 'Strong Match') return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
        if (rec === 'Good Option') return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
        if (rec === 'Mixed Signals') return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
        return 'text-red-400 bg-red-500/10 border-red-500/30';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
            <div className="mx-auto max-w-6xl space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <Link
                        to="/jobs"
                        className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Jobs
                    </Link>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <RefreshCw className="h-3.5 w-3.5" />
                        {summary.freshnessStatus === 'fresh' ? 'Fresh scan' : `${Math.round(summary.freshnessHours)}h old`}
                    </div>
                </div>

                {/* Title */}
                <div>
                    <h1 className="text-3xl font-bold text-white">Job Radar Deep Analysis</h1>
                    <p className="mt-2 text-slate-400">
                        Comprehensive employer research, market benchmarks, and risk assessment
                    </p>
                </div>

                {/* Overall Recommendation */}
                <div className={`rounded-2xl border p-6 ${getRecommendationColor(summary.recommendation)}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-wider opacity-80">Overall Assessment</p>
                            <h2 className="mt-1 text-2xl font-bold">{summary.recommendation}</h2>
                            <p className="mt-1 text-sm opacity-70">
                                Confidence: {summary.confidenceOverall} • {summary.sourcesCount} sources analyzed
                            </p>
                        </div>
                        {summary.recommendation === 'Strong Match' && <CheckCircle2 className="h-12 w-12 opacity-50" />}
                        {summary.recommendation === 'Good Option' && <Star className="h-12 w-12 opacity-50" />}
                        {summary.recommendation === 'Mixed Signals' && <Info className="h-12 w-12 opacity-50" />}
                        {summary.recommendation === 'High Risk' && <AlertTriangle className="h-12 w-12 opacity-50" />}
                    </div>
                </div>

                {/* Scores Grid */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                    <ScoreCard
                        icon={<Building2 className="h-5 w-5" />}
                        label="Employer"
                        score={summary.employerScore}
                        description="Company reputation & stability"
                    />
                    <ScoreCard
                        icon={<Star className="h-5 w-5" />}
                        label="Offer Quality"
                        score={summary.offerScore}
                        description="Role attractiveness"
                    />
                    <ScoreCard
                        icon={<DollarSign className="h-5 w-5" />}
                        label="Market Pay"
                        score={summary.marketPayScore}
                        description="Salary vs market"
                    />
                    <ScoreCard
                        icon={<Heart className="h-5 w-5" />}
                        label="Benefits"
                        score={summary.benefitsScore}
                        description="Perks & compensation"
                    />
                    <ScoreCard
                        icon={<Users className="h-5 w-5" />}
                        label="Culture Fit"
                        score={summary.cultureFitScore}
                        description="Work environment"
                    />
                    <ScoreCard
                        icon={<Shield className="h-5 w-5" />}
                        label="Risk Level"
                        score={100 - summary.riskScore}
                        description="Safety & legitimacy"
                        inverted
                    />
                </div>

                {/* Red Flags */}
                {summary.redFlags.length > 0 && (
                    <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <AlertTriangle className="h-6 w-6 text-red-400" />
                            <h3 className="text-lg font-semibold text-red-400">Red Flags Detected</h3>
                        </div>
                        <ul className="space-y-2">
                            {summary.redFlags.map((flag, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-red-300">
                                    <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                    <span>{flag}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Key Findings */}
                {summary.keyFindings.length > 0 && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Key Findings</h3>
                        <ul className="space-y-2">
                            {summary.keyFindings.map((finding, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                                    <Info className="h-4 w-4 shrink-0 mt-0.5 text-blue-400" />
                                    <span>{finding}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Positive Signals */}
                {summary.positiveSignals.length > 0 && (
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                            <h3 className="text-lg font-semibold text-emerald-400">Positive Signals</h3>
                        </div>
                        <ul className="space-y-2">
                            {summary.positiveSignals.map((signal, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-emerald-300">
                                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                                    <span>{signal}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Salary Benchmark */}
                {summary.salaryBenchmark && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Salary Benchmark</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="text-center">
                                <p className="text-xs text-slate-500 uppercase tracking-wider">25th Percentile</p>
                                <p className="mt-1 text-2xl font-bold text-slate-300">
                                    £{summary.salaryBenchmark.p25.toLocaleString()}
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-slate-500 uppercase tracking-wider">Median</p>
                                <p className="mt-1 text-2xl font-bold text-white">
                                    £{summary.salaryBenchmark.median.toLocaleString()}
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-slate-500 uppercase tracking-wider">75th Percentile</p>
                                <p className="mt-1 text-2xl font-bold text-slate-300">
                                    £{summary.salaryBenchmark.p75.toLocaleString()}
                                </p>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center justify-center gap-2 text-sm">
                            {summary.salaryBenchmark.yourPosition === 'above' && (
                                <>
                                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                                    <span className="text-emerald-400">Above market average</span>
                                </>
                            )}
                            {summary.salaryBenchmark.yourPosition === 'at' && (
                                <>
                                    <Info className="h-4 w-4 text-blue-400" />
                                    <span className="text-blue-400">At market average</span>
                                </>
                            )}
                            {summary.salaryBenchmark.yourPosition === 'below' && (
                                <>
                                    <TrendingDown className="h-4 w-4 text-amber-400" />
                                    <span className="text-amber-400">Below market average</span>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Sources */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">
                        Data Sources ({sources.length})
                    </h3>
                    <div className="space-y-2">
                        {sources.map((source) => (
                            <div
                                key={source.id}
                                className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-4 py-2"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20">
                                        <ExternalLink className="h-4 w-4 text-indigo-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">{source.title}</p>
                                        <p className="text-xs text-slate-500 capitalize">{source.sourceType.replace(/_/g, ' ')}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-500">Tier {source.sourceQualityTier}</span>
                                    {source.parseStatus === 'parsed' && (
                                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                    )}
                                    {source.parseStatus === 'pending' && (
                                        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                                    )}
                                    {source.parseStatus === 'failed' && (
                                        <XCircle className="h-4 w-4 text-red-400" />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function ScoreCard({
    icon,
    label,
    score,
    description,
    inverted = false,
}: {
    icon: React.ReactNode;
    label: string;
    score: number;
    description: string;
    inverted?: boolean;
}) {
    const displayScore = inverted ? 100 - score : score;
    const getColor = (s: number) => {
        if (s >= 80) return 'text-emerald-400';
        if (s >= 60) return 'text-blue-400';
        if (s >= 40) return 'text-amber-400';
        return 'text-red-400';
    };

    const getBg = (s: number) => {
        if (s >= 80) return 'bg-emerald-500/20 border-emerald-500/30';
        if (s >= 60) return 'bg-blue-500/20 border-blue-500/30';
        if (s >= 40) return 'bg-amber-500/20 border-amber-500/30';
        return 'bg-red-500/20 border-red-500/30';
    };

    return (
        <div className={`rounded-2xl border p-4 ${getBg(displayScore)}`}>
            <div className="flex items-center gap-2 mb-2">
                <div className={getColor(displayScore)}>{icon}</div>
                <p className="text-sm font-semibold text-white">{label}</p>
            </div>
            <p className={`text-3xl font-bold ${getColor(displayScore)}`}>{displayScore}</p>
            <p className="mt-1 text-xs text-slate-400">{description}</p>
        </div>
    );
}
