import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Bookmark,
    BookmarkCheck,
    ExternalLink,
    Share2,
    TrendingUp,
    AlertTriangle,
    Target,
    Building2,
    MapPin,
    DollarSign,
    Clock,
    Sparkles,
    CheckCircle2,
    Info,
    FileText,
    BarChart3
} from 'lucide-react';
import { useState } from 'react';

export default function JobReportPage() {
    const { jobId } = useParams<{ jobId: string }>();
    const navigate = useNavigate();
    const [isSaved, setIsSaved] = useState(false);

    // Mock data - replace with actual API call
    const job = {
        id: jobId || '1',
        title: 'Senior Frontend Engineer',
        company: 'Stripe',
        location: 'Remote (US)',
        salaryMin: 160000,
        salaryMax: 210000,
        workMode: 'remote',
        fitScore: 94,
        postedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        description: 'We are looking for a Senior Frontend Engineer to join our growing team...',
        requirements: ['React', 'TypeScript', 'Node.js', 'GraphQL', 'Performance Optimization'],
        applyUrl: 'https://stripe.com/jobs/apply',
    };

    const analysis = {
        skillsMatch: 98,
        experienceMatch: 100,
        salaryMatch: 80,
        cultureMatch: 90,
        strengths: [
            'Strong technical skills alignment with React and TypeScript',
            'Experience level exceeds requirements',
            'Domain knowledge in fintech is highly relevant',
            'Performance optimization expertise matches key requirement',
        ],
        gaps: [
            'Salary is at the lower end of your target range',
            'GraphQL experience could be stronger',
            'Remote work may require timezone flexibility',
        ],
        advice: 'This is an excellent match for your profile. Focus on highlighting your performance optimization work and fintech experience in your application. Consider negotiating for the higher end of the salary range given your strong skill match.',
    };

    const formatSalary = (min: number, max: number) => {
        return `$${Math.round(min / 1000)}k - $${Math.round(max / 1000)}k`;
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
        <div className="min-h-screen bg-[#0B1121] text-slate-300">
            {/* Ambient Background */}
            <div className="fixed top-0 left-1/4 w-[600px] h-[400px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="fixed top-1/3 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-[150px] rounded-full pointer-events-none" />

            {/* Sticky Header */}
            <header className="sticky top-0 z-40 bg-[#0B1121]/80 backdrop-blur-xl border-b border-slate-800/80">
                <div className="max-w-5xl mx-auto px-8 py-5">
                    <div className="flex items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate(-1)}
                                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                <span className="text-sm font-medium">Back</span>
                            </button>
                            <div className="w-px h-6 bg-slate-700" />
                            <div>
                                <h1 className="text-xl font-bold text-white">{job.title}</h1>
                                <p className="text-sm text-slate-400">{job.company}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className={`px-3 py-1.5 rounded-lg text-sm font-bold border ${job.fitScore >= 90
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                    : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                                }`}>
                                {job.fitScore}% Match
                            </span>

                            <button
                                onClick={() => setIsSaved(!isSaved)}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
                            >
                                {isSaved ? (
                                    <>
                                        <BookmarkCheck className="w-4 h-4 text-emerald-400" />
                                        <span className="text-sm font-medium text-emerald-400">Saved</span>
                                    </>
                                ) : (
                                    <>
                                        <Bookmark className="w-4 h-4" />
                                        <span className="text-sm font-medium">Save</span>
                                    </>
                                )}
                            </button>

                            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors">
                                <Share2 className="w-4 h-4" />
                                <span className="text-sm font-medium">Share</span>
                            </button>

                            <a
                                href={job.applyUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-6 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                            >
                                Apply Now
                                <ExternalLink className="w-4 h-4" />
                            </a>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-8 py-8">
                {/* Overview Card */}
                <section className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Left: Job Details */}
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-4">{job.title}</h2>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-slate-300">
                                        <Building2 className="w-5 h-5 text-slate-500" />
                                        <span className="font-medium">{job.company}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-300">
                                        <MapPin className="w-5 h-5 text-slate-500" />
                                        <span>{job.location}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-300">
                                        <DollarSign className="w-5 h-5 text-emerald-500/70" />
                                        <span className="font-semibold">{formatSalary(job.salaryMin, job.salaryMax)}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-400">
                                        <Clock className="w-5 h-5 text-slate-500" />
                                        <span>Posted 2 days ago</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-800">
                                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                                    Required Skills
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {job.requirements.map((skill, i) => (
                                        <span
                                            key={i}
                                            className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-sm font-medium text-slate-300"
                                        >
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right: Fit Score */}
                        <div className="flex flex-col items-center justify-center bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl p-8 border border-slate-700">
                            <div className="text-center mb-6">
                                <div className={`text-7xl font-bold mb-2 ${getScoreColor(job.fitScore)}`}>
                                    {job.fitScore}%
                                </div>
                                <p className="text-lg font-semibold text-white">Overall Match</p>
                                <p className="text-sm text-slate-400 mt-1">Excellent fit for your profile</p>
                            </div>

                            <div className="w-full space-y-3">
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-400">Skills</span>
                                    <span className={getScoreColor(analysis.skillsMatch)}>{analysis.skillsMatch}%</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-400">Experience</span>
                                    <span className={getScoreColor(analysis.experienceMatch)}>{analysis.experienceMatch}%</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-400">Salary</span>
                                    <span className={getScoreColor(analysis.salaryMatch)}>{analysis.salaryMatch}%</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-400">Culture</span>
                                    <span className={getScoreColor(analysis.cultureMatch)}>{analysis.cultureMatch}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Detailed Analysis */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Match Breakdown */}
                    <section className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
                        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-emerald-500" />
                            Match Breakdown
                        </h2>

                        <div className="space-y-6">
                            {[
                                { label: 'Technical Skills', score: analysis.skillsMatch, detail: 'React, TypeScript, Node.js' },
                                { label: 'Experience Level', score: analysis.experienceMatch, detail: 'Exceeds requirements' },
                                { label: 'Salary Match', score: analysis.salaryMatch, detail: 'Within target range' },
                                { label: 'Culture Fit', score: analysis.cultureMatch, detail: 'Fast-paced environment' },
                            ].map((item, i) => (
                                <div key={i}>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-slate-300 font-medium">{item.label}</span>
                                        <span className={`font-bold ${getScoreColor(item.score)}`}>
                                            {item.score}%
                                        </span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden mb-1">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${getBarColor(item.score)}`}
                                            style={{ width: `${item.score}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500">{item.detail}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Strengths & Gaps */}
                    <section className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
                        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                            Analysis
                        </h2>

                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3">
                                    Strengths
                                </h3>
                                <ul className="space-y-2">
                                    {analysis.strengths.map((strength, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                            <span>{strength}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-3">
                                    Considerations
                                </h3>
                                <ul className="space-y-2">
                                    {analysis.gaps.map((gap, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                                            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                                            <span>{gap}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Recommendations */}
                    <section className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
                        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <Target className="w-5 h-5 text-blue-500" />
                            Recommendations
                        </h2>

                        <div className="space-y-4">
                            <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-xl p-4">
                                <p className="text-sm text-slate-300 leading-relaxed mb-4">
                                    <Sparkles className="w-4 h-4 inline text-blue-400 mr-1" />
                                    <span className="font-semibold text-blue-400">AI Advice:</span>
                                    {' '}{analysis.advice}
                                </p>
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    Action Items
                                </h3>
                                <ul className="space-y-2">
                                    <li className="flex items-center gap-2 text-sm text-slate-300">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                        Tailor resume to highlight React expertise
                                    </li>
                                    <li className="flex items-center gap-2 text-sm text-slate-300">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                        Prepare examples of performance optimization
                                    </li>
                                    <li className="flex items-center gap-2 text-sm text-slate-300">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                        Research Stripe's engineering culture
                                    </li>
                                </ul>
                            </div>

                            <div className="flex flex-col gap-3 pt-4">
                                <button className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-4 rounded-lg transition-colors">
                                    <FileText className="w-4 h-4" />
                                    Generate Tailored Resume
                                </button>
                                <button className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 px-4 rounded-lg transition-colors border border-slate-600">
                                    <BarChart3 className="w-4 h-4" />
                                    Compare with Similar Jobs
                                </button>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}
