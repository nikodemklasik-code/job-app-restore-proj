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
    RefreshCw,
} from 'lucide-react';
import { ScoreCardsGrid } from '@/features/job-radar/components/score-cards-grid';

export default function JobRadarReport() {
    const { scanId } = useParams<{ scanId: string }>();
    const reportQuery = api.jobRadar.getReport.useQuery(
        { scanId: scanId! },
        {
            enabled: !!scanId,
            refetchInterval: (query) => {
                const data = query.state.data;
                return data?.summary.status === 'processing' ? 2000 : false;
            }
        }
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

    if (!reportQuery.data) {
        return null;
    }

    const { summary, sources, scoreDrivers, jobInfo } = reportQuery.data;

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

    const getRecommendationColor = (rec: string) => {
        if (rec === 'Strong Match') return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
        if (rec === 'Good Option') return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
        if (rec === 'Mixed Signals') return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
        return 'text-red-400 bg-red-500/10 border-red-500/30';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
            <div className="mx-auto max-w-6xl space-y-6">
                <div className="flex items-center justify-between">
                    <Link to="/jobs" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Jobs
                    </Link>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <RefreshCw className="h-3.5 w-3.5" />
                        {summary.freshnessStatus === 'fresh' ? 'Fresh scan' : `${Math.round(summary.freshnessHours)}h old`}
                    </div>
                </div>

                <div>
                    <h1 className="text-3xl font-bold text-white">Job Radar Deep Analysis</h1>
                    <p className="mt-2 text-slate-400">Comprehensive employer research, market benchmarks, and risk assessment</p>
                </div>

                <div className={`rounded-2xl border p-6 ${getRecommendationColor(summary.recommendation)}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-wider opacity-80">Overall Assessment</p>
                            <h2 className="mt-1 text-2xl font-bold">{summary.recommendation}</h2>
                            <p className="mt-1 text-sm opacity-70">Confidence: {summary.confidenceOverall} • {summary.sourcesCount} sources analyzed</p>
                        </div>
                        {summary.recommendation === 'Strong Match' && <CheckCircle2 className="h-12 w-12 opacity-50" />}
                        {summary.recommendation === 'Good Option' && <CheckCircle2 className="h-12 w-12 opacity-50" />}
                        {summary.recommendation === 'Mixed Signals' && <Info className="h-12 w-12 opacity-50" />}
                        {summary.recommendation === 'High Risk' && <AlertTriangle className="h-12 w-12 opacity-50" />}
                    </div>
                </div>

                <ScoreCardsGrid 
                    report={{
                        report_id: summary.scanId,
                        scan_id: summary.scanId,
                        status: summary.status as any,
                        scoring_version: '1.0',
                        parser_version: '1.0',
                        scores: {
                            employer_score: summary.employerScore,
                            offer_score: summary.offerScore,
                            market_pay_score: summary.marketPayScore,
                            benefits_score: summary.benefitsScore,
                            culture_fit_score: summary.cultureFitScore,
                            risk_score: summary.riskScore,
                        },
                        recommendation: summary.recommendation as any,
                        score_drivers: scoreDrivers || {},
                        confidence_summary: { overall: summary.confidenceOverall as any },
                        freshness: {
                            last_scanned_at: new Date().toISOString(),
                            freshness_hours: summary.freshnessHours,
                            freshness_status: summary.freshnessStatus as any,
                            auto_rescan_eligible: true,
                        },
                        missing_data: [],
                        red_flags: [],
                        key_findings: [],
                        sources: sources.map((s: any) => ({
                            source_id: s.id,
                            type: s.sourceType,
                            url: s.sourceUrl || '',
                            tier: s.sourceQualityTier,
                            collected_at: s.collectedAt,
                        })),
                    }}
                />

                {summary.redFlags.length > 0 && (
                    <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <AlertTriangle className="h-6 w-6 text-red-400" />
                            <h3 className="text-lg font-semibold text-red-400">Red Flags Detected</h3>
                        </div>
                        <ul className="space-y-2">
                            {summary.redFlags.map((flag: string, i: number) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-red-300">
                                    <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                    <span>{flag}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {summary.keyFindings.length > 0 && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Key Findings</h3>
                        <ul className="space-y-2">
                            {summary.keyFindings.map((finding: string, i: number) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                                    <Info className="h-4 w-4 shrink-0 mt-0.5 text-blue-400" />
                                    <span>{finding}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {summary.positiveSignals.length > 0 && (
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                            <h3 className="text-lg font-semibold text-emerald-400">Positive Signals</h3>
                        </div>
                        <ul className="space-y-2">
                            {summary.positiveSignals.map((signal: string, i: number) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-emerald-300">
                                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                                    <span>{signal}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {summary.salaryBenchmark && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Salary Benchmark</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="text-center">
                                <p className="text-xs text-slate-500 uppercase tracking-wider">25th Percentile</p>
                                <p className="mt-1 text-2xl font-bold text-slate-300">£{summary.salaryBenchmark.p25.toLocaleString()}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-slate-500 uppercase tracking-wider">Median</p>
                                <p className="mt-1 text-2xl font-bold text-white">£{summary.salaryBenchmark.median.toLocaleString()}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-slate-500 uppercase tracking-wider">75th Percentile</p>
                                <p className="mt-1 text-2xl font-bold text-slate-300">£{summary.salaryBenchmark.p75.toLocaleString()}</p>
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

                {/* Job Description */}
                {jobInfo?.description && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Job Description</h3>
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-sm font-semibold text-indigo-400 mb-2">{jobInfo.title}</h4>
                                <p className="text-sm text-slate-400">{jobInfo.company}{jobInfo.location ? ` • ${jobInfo.location}` : ''}</p>
                            </div>
                            <div className="prose prose-invert prose-sm max-w-none">
                                <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{jobInfo.description}</p>
                            </div>
                            {jobInfo.applyUrl && (
                                <a
                                    href={jobInfo.applyUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition"
                                >
                                    Apply Now
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </a>
                            )}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
