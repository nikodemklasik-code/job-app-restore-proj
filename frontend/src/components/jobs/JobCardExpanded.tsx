import {
    Sparkles,
    TrendingUp,
    AlertTriangle,
    Info,
    CheckCircle2,
    ExternalLink,
    FileText,
    Target,
    Shield,
    ShieldAlert,
    ShieldCheck,
    Briefcase,
    Clock,
    MapPin,
    Banknote,
    Laptop,
    Users,
    GraduationCap,
    Zap,
    ChevronDown,
    ChevronUp,
    Loader2,
    XCircle,
    Star,
    MinusCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { JobCardCompact } from './JobCardCompact';
import { useState } from 'react';

// ── Employer signals type (mirrors backend jobProtection.ts) ──────────────────

type BenefitSignal = {
    type: string;
    label: string;
    source: 'detected_in_listing';
};

type UkSignal = {
    type: string;
    label: string;
    present: boolean;
};

type EmployerSignals = {
    trustScore: number;
    trustLevel: 'verified' | 'likely_legit' | 'review' | 'risky';
    riskScore: number;
    riskLevel: 'low' | 'medium' | 'high';
    salaryTransparency: 'full' | 'range' | 'none';
    descriptionQuality: 'detailed' | 'average' | 'thin';
    requirementsClarity: 'clear' | 'vague' | 'none';
    workModeClarity: 'explicit' | 'implicit' | 'none';
    benefits: BenefitSignal[];
    ukSignals: UkSignal[];
    trustReasons: string[];
    riskReasons: string[];
};

// ── Description parser ────────────────────────────────────────────────────────

type DescriptionSection = {
    heading: string;
    icon: string;
    content: string;
};

type DescriptionInsights = {
    experienceRequired: string | null;
    contractType: string | null;
    descriptionExcerpt: string | null;
    hasEquity: boolean;
    hasRemoteOption: boolean;
    keyTechStack: string[];
    sections: DescriptionSection[];   // ← NEW: parsed sections from listing
};

const TECH_KEYWORDS = [
    'React', 'Vue', 'Angular', 'Next.js', 'TypeScript', 'JavaScript', 'Python',
    'Node.js', 'Go', 'Rust', 'Java', 'Kotlin', 'Swift', 'C#', '.NET', 'Ruby',
    'PHP', 'GraphQL', 'REST', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis',
    'AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD',
    'TDD', 'Agile', 'Scrum', 'Linux', 'Git',
];

// Section heading patterns → canonical label + icon
const SECTION_PATTERNS: Array<{ pattern: RegExp; heading: string; icon: string }> = [
    { pattern: /about (the )?(role|position|job|opportunity)/i,    heading: 'About the Role',     icon: '💼' },
    { pattern: /about (us|the company|our company|the team)/i,     heading: 'About Us',           icon: '🏢' },
    { pattern: /what (you('ll| will) do|we('re| are) looking for|the role involves)/i, heading: 'What You\'ll Do', icon: '🎯' },
    { pattern: /key (responsibilities|duties|accountabilities)/i,   heading: 'Responsibilities',  icon: '📋' },
    { pattern: /responsibilities|your (role|duties|day.to.day)/i,   heading: 'Responsibilities',  icon: '📋' },
    { pattern: /requirements?|what (you('ll| will) need|we need|we require)/i, heading: 'Requirements',   icon: '✅' },
    { pattern: /essential (skills?|experience|criteria)/i,          heading: 'Requirements',       icon: '✅' },
    { pattern: /nice to have|desirable|bonus (skills?|points?)/i,   heading: 'Nice to Have',      icon: '⭐' },
    { pattern: /preferred (skills?|qualifications?|experience)/i,   heading: 'Nice to Have',      icon: '⭐' },
    { pattern: /what (we offer|you('ll| will) get|we provide)/i,    heading: 'What We Offer',     icon: '🎁' },
    { pattern: /benefits|perks|package|compensation/i,              heading: 'Benefits',           icon: '🎁' },
    { pattern: /salary|pay|remuneration/i,                          heading: 'Salary',             icon: '💰' },
    { pattern: /skills? (required|needed|we('re| are) looking for)/i, heading: 'Required Skills', icon: '🔧' },
    { pattern: /technical (skills?|requirements?|stack)/i,          heading: 'Tech Stack',         icon: '⚙️' },
    { pattern: /qualifications?|education|degree/i,                 heading: 'Qualifications',     icon: '🎓' },
    { pattern: /about the team|team (structure|size|culture)/i,     heading: 'The Team',           icon: '👥' },
    { pattern: /interview (process|stages?|steps?)/i,               heading: 'Interview Process',  icon: '🗓️' },
    { pattern: /how to apply|application (process|instructions?)/i, heading: 'How to Apply',       icon: '📨' },
    { pattern: /equal opportunities?|diversity|inclusion/i,         heading: 'Diversity & Inclusion', icon: '🤝' },
];

function parseSections(text: string): DescriptionSection[] {
    // Split on lines that look like headings (short lines ending in : or all-caps or followed by newline)
    const lines = text.split(/\r?\n/);
    const sections: DescriptionSection[] = [];
    let currentHeading: string | null = null;
    let currentIcon = '📄';
    let currentLines: string[] = [];

    const isHeadingLine = (line: string): boolean => {
        const trimmed = line.trim();
        if (trimmed.length === 0) return false;
        if (trimmed.length > 80) return false; // too long to be a heading
        // Ends with colon
        if (trimmed.endsWith(':')) return true;
        // All caps (3+ chars)
        if (trimmed.length >= 3 && trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed)) return true;
        // Matches a known section pattern
        return SECTION_PATTERNS.some((p) => p.pattern.test(trimmed));
    };

    const canonicalise = (line: string): { heading: string; icon: string } => {
        const trimmed = line.replace(/:$/, '').trim();
        const match = SECTION_PATTERNS.find((p) => p.pattern.test(trimmed));
        if (match) return { heading: match.heading, icon: match.icon };
        // Title-case the raw heading
        const titleCased = trimmed.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
        return { heading: titleCased, icon: '📄' };
    };

    const flush = () => {
        const content = currentLines.join('\n').trim();
        if (currentHeading && content.length > 0) {
            sections.push({ heading: currentHeading, icon: currentIcon, content });
        }
        currentLines = [];
    };

    for (const line of lines) {
        if (isHeadingLine(line)) {
            flush();
            const { heading, icon } = canonicalise(line);
            currentHeading = heading;
            currentIcon = icon;
        } else {
            currentLines.push(line);
        }
    }
    flush();

    // If no sections found, return single "About the Role" section with full text
    if (sections.length === 0 && text.trim().length > 0) {
        return [{ heading: 'About the Role', icon: '💼', content: text.trim() }];
    }

    return sections;
}

function parseDescription(description: string): DescriptionInsights {
    const text = description;
    const lower = text.toLowerCase();

    const expMatch = text.match(/(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp)/i);
    const experienceRequired = expMatch ? `${expMatch[1]}+ years` : null;

    let contractType: string | null = null;
    if (/\bpermanent\b|\bfull[- ]?time\b/i.test(text)) contractType = 'Permanent';
    else if (/\bcontract\b|\bfixed[- ]?term\b/i.test(text)) contractType = 'Contract';
    else if (/\bfreelance\b|\bself[- ]?employed\b/i.test(text)) contractType = 'Freelance';
    else if (/\bpart[- ]?time\b/i.test(text)) contractType = 'Part-time';

    const hasEquity = /\bequity\b|\bstock\b|\bshare\s*option|\beso[ps]?\b/i.test(text);
    const hasRemoteOption = /\bremote\b|\bhybrid\b|\bwork from home\b|\bwfh\b/i.test(lower);

    const keyTechStack = TECH_KEYWORDS.filter((kw) =>
        new RegExp(`\\b${kw.replace('.', '\\.')}\\b`, 'i').test(text)
    ).slice(0, 8);

    // First meaningful sentence as excerpt (for the compact preview)
    const sentences = text.split(/(?<=[.!?])\s+/);
    const firstSentence = sentences.find((s) => s.trim().length > 20) ?? '';
    const descriptionExcerpt = firstSentence.length > 0
        ? firstSentence.slice(0, 200) + (firstSentence.length > 200 ? '…' : '')
        : null;

    const sections = parseSections(text);

    return { experienceRequired, contractType, descriptionExcerpt, hasEquity, hasRemoteOption, keyTechStack, sections };
}

// ── Score row with source explanation ─────────────────────────────────────────

function ScoreRow({
    label,
    score,
    basis,
    detail,
}: {
    label: string;
    score: number;
    basis: string;
    detail?: string;
}) {
    const color =
        score >= 85 ? { text: 'text-emerald-400', bar: 'bg-emerald-500' }
        : score >= 70 ? { text: 'text-blue-400', bar: 'bg-blue-500' }
        : score >= 55 ? { text: 'text-amber-400', bar: 'bg-amber-400' }
        : { text: 'text-red-400', bar: 'bg-red-500' };

    return (
        <div>
            <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-medium">{label}</span>
                <span className={`font-bold ${color.text}`}>{score}%</span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${color.bar}`}
                    style={{ width: `${score}%` }}
                />
            </div>
            <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                <span className="text-slate-600">Source: </span>{basis}
            </p>
            {detail && (
                <p className="text-[10px] text-slate-500 mt-0.5">{detail}</p>
            )}
        </div>
    );
}

// ── Trust badge ───────────────────────────────────────────────────────────────

function TrustBadge({ level, score }: { level: EmployerSignals['trustLevel']; score: number }) {
    const configs = {
        verified:     { Icon: ShieldCheck, label: 'High Trust',      cls: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
        likely_legit: { Icon: Shield,      label: 'Likely Legitimate', cls: 'text-blue-400 border-blue-500/30 bg-blue-500/10' },
        review:       { Icon: ShieldAlert, label: 'Review Signals',   cls: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
        risky:        { Icon: ShieldAlert, label: 'Risk Signals',     cls: 'text-red-400 border-red-500/30 bg-red-500/10' },
    };
    const c = configs[level];
    return (
        <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${c.cls}`}>
            <c.Icon className="h-3.5 w-3.5" />
            {c.label}
            <span className="ml-1 opacity-60">{score}/100</span>
        </div>
    );
}

// ── Collapsible section ───────────────────────────────────────────────────────

function CollapsiblePanel({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="rounded-xl border border-white/[0.07] overflow-hidden">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition"
            >
                {title}
                {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
            {open && <div className="px-3 pb-3 pt-1">{children}</div>}
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────

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
        description?: string;
        requirements?: string[];
        scamAnalysis?: {
            riskScore: number;
            level: 'low' | 'medium' | 'high';
            reasons?: string[];
        };
        employerSignals?: EmployerSignals;
    };
    applicationStatus?: string;
    isSaved?: boolean;
    onToggleSave?: () => void;
    onCollapse?: () => void;
    onExplain?: () => void;
    fitAnalysis?: {
        skillsMatch: number;
        experienceMatch: number;
        salaryMatch: number;
        cultureMatch: number;
        strengths: string[];
        gaps: string[];
        advice?: string;
        skillsBreakdown?: {
            matched: string[];
            missing: string[];
            partial: string[];
            bonus: string[];
        };
    };
    fitLoading?: boolean;
};

export function JobCardExpanded({
    job,
    applicationStatus,
    isSaved,
    onToggleSave,
    onCollapse,
    onExplain,
    fitAnalysis,
    fitLoading,
}: JobCardExpandedProps) {

    const insights = job.description ? parseDescription(job.description) : null;
    const signals = job.employerSignals;
    const hasRisk = job.scamAnalysis && job.scamAnalysis.level !== 'low';

    return (
        <article className="relative border border-emerald-500/40 rounded-2xl p-1 shadow-lg shadow-emerald-900/20 transition-all duration-300">
            <div className="absolute inset-0 rounded-2xl bg-emerald-500/5 animate-pulse" style={{ animationDuration: '3s' }} />

            <div className="relative bg-white/[0.04] rounded-xl p-6">
                <JobCardCompact
                    job={job}
                    applicationStatus={applicationStatus}
                    isSaved={isSaved}
                    onToggleSave={onToggleSave}
                    onExpand={onCollapse}
                    onExplain={onExplain}
                    isExpanded={true}
                />

                <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-700 to-transparent my-7" />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* ── Column 1: Match Analysis ───────────────────────────────── */}
                    <div className="space-y-5">
                        <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-emerald-500" />
                            Match Analysis
                        </h3>

                        {fitLoading && !fitAnalysis ? (
                            <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-6 flex flex-col items-center gap-3">
                                <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
                                <p className="text-xs text-slate-400">Analysing your fit…</p>
                            </div>
                        ) : fitAnalysis ? (
                            <div className="space-y-4">
                                {/* Score bars */}
                                <ScoreRow
                                    label="Technical Skills"
                                    score={fitAnalysis.skillsMatch}
                                    basis="Your profile skills vs job requirements"
                                    detail={
                                        job.requirements && job.requirements.length > 0
                                            ? `Detected: ${job.requirements.slice(0, 3).join(', ')}${job.requirements.length > 3 ? ` +${job.requirements.length - 3} more` : ''}`
                                            : undefined
                                    }
                                />
                                <ScoreRow
                                    label="Experience Level"
                                    score={fitAnalysis.experienceMatch}
                                    basis="Your years of experience vs role seniority"
                                    detail={insights?.experienceRequired ? `Role requires: ${insights.experienceRequired}` : undefined}
                                />
                                <ScoreRow
                                    label="Salary Match"
                                    score={fitAnalysis.salaryMatch}
                                    basis="Listing range compared to your target salary"
                                    detail={
                                        job.salaryMin
                                            ? `Listed: £${Math.round(job.salaryMin / 1000)}k${job.salaryMax ? `–£${Math.round(job.salaryMax / 1000)}k` : '+'}`
                                            : 'No salary listed — estimated from market data'
                                    }
                                />
                                <ScoreRow
                                    label="Culture Signals"
                                    score={fitAnalysis.cultureMatch}
                                    basis="Work mode, team size and listing tone"
                                    detail={insights?.hasRemoteOption ? 'Remote/hybrid option detected in listing' : undefined}
                                />

                                {/* ── Skills breakdown chips ── */}
                                {fitAnalysis.skillsBreakdown && (
                                    <div className="pt-1 space-y-3">
                                        {fitAnalysis.skillsBreakdown.matched.length > 0 && (
                                            <div>
                                                <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                                    <CheckCircle2 className="h-3 w-3" /> Matched ({fitAnalysis.skillsBreakdown.matched.length})
                                                </p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {fitAnalysis.skillsBreakdown.matched.map((s, i) => (
                                                        <span key={i} className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-300">
                                                            ✓ {s}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {fitAnalysis.skillsBreakdown.partial.length > 0 && (
                                            <div>
                                                <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                                    <MinusCircle className="h-3 w-3" /> Partial match ({fitAnalysis.skillsBreakdown.partial.length})
                                                </p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {fitAnalysis.skillsBreakdown.partial.map((s, i) => (
                                                        <span key={i} className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-300">
                                                            ~ {s}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {fitAnalysis.skillsBreakdown.missing.length > 0 && (
                                            <div>
                                                <p className="text-[10px] font-semibold text-red-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                                    <XCircle className="h-3 w-3" /> Missing ({fitAnalysis.skillsBreakdown.missing.length})
                                                </p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {fitAnalysis.skillsBreakdown.missing.map((s, i) => (
                                                        <span key={i} className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[11px] text-red-300">
                                                            ✗ {s}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {fitAnalysis.skillsBreakdown.bonus.length > 0 && (
                                            <div>
                                                <p className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                                    <Star className="h-3 w-3" /> Bonus skills ({fitAnalysis.skillsBreakdown.bonus.length})
                                                </p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {fitAnalysis.skillsBreakdown.bonus.map((s, i) => (
                                                        <span key={i} className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-[11px] text-indigo-300">
                                                            ★ {s}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Strengths & Gaps text (when no skillsBreakdown) */}
                                {!fitAnalysis.skillsBreakdown && fitAnalysis.strengths.length > 0 && (
                                    <div className="pt-2 space-y-1.5">
                                        <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">Strengths</p>
                                        {fitAnalysis.strengths.map((s, i) => (
                                            <div key={i} className="flex items-start gap-1.5 text-xs text-slate-300">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                                {s}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {!fitAnalysis.skillsBreakdown && fitAnalysis.gaps.length > 0 && (
                                    <div className="space-y-1.5">
                                        <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">Gaps to address</p>
                                        {fitAnalysis.gaps.map((g, i) => (
                                            <div key={i} className="flex items-start gap-1.5 text-xs text-slate-300">
                                                <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                                                {g}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {fitAnalysis.advice && (
                                    <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/[0.07] px-3 py-2.5">
                                        <p className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider mb-1">AI Advice</p>
                                        <p className="text-xs text-slate-300 leading-relaxed">{fitAnalysis.advice}</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 text-center space-y-3">
                                <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                                    <Zap className="h-5 w-5" />
                                </div>
                                <p className="text-sm font-medium text-white">Analysing your fit…</p>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    Scores are being calculated from your profile — skills, experience, salary range and culture signals.
                                </p>
                                {onExplain && (
                                    <button
                                        type="button"
                                        onClick={onExplain}
                                        className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 py-2.5 text-xs font-semibold text-indigo-300 transition hover:bg-indigo-500/20"
                                    >
                                        <Sparkles className="h-3.5 w-3.5" />
                                        Run analysis manually
                                    </button>
                                )}
                                <p className="text-[10px] text-slate-600">
                                    Based on your{' '}
                                    <Link to="/profile" className="text-slate-500 hover:text-slate-300 underline underline-offset-2">
                                        profile
                                    </Link>
                                </p>
                            </div>
                        )}
                    </div>

                    {/* ── Column 2: From the Listing ─────────────────────────────── */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-400" />
                            Job Description
                        </h3>

                        {insights ? (
                            <div className="space-y-3">
                                {/* Key signals grid */}
                                <div className="grid grid-cols-2 gap-2">
                                    {insights.experienceRequired && (
                                        <div className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] px-2.5 py-2">
                                            <GraduationCap className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                                            <div>
                                                <p className="text-[9px] text-slate-600 uppercase tracking-wider">Experience</p>
                                                <p className="text-[11px] font-semibold text-slate-200">{insights.experienceRequired}</p>
                                            </div>
                                        </div>
                                    )}
                                    {insights.contractType && (
                                        <div className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] px-2.5 py-2">
                                            <Briefcase className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                                            <div>
                                                <p className="text-[9px] text-slate-600 uppercase tracking-wider">Contract</p>
                                                <p className="text-[11px] font-semibold text-slate-200">{insights.contractType}</p>
                                            </div>
                                        </div>
                                    )}
                                    {job.workMode && (
                                        <div className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] px-2.5 py-2">
                                            <Laptop className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                                            <div>
                                                <p className="text-[9px] text-slate-600 uppercase tracking-wider">Work mode</p>
                                                <p className="text-[11px] font-semibold text-slate-200 capitalize">{job.workMode}</p>
                                            </div>
                                        </div>
                                    )}
                                    {job.location && (
                                        <div className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] px-2.5 py-2">
                                            <MapPin className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                                            <div>
                                                <p className="text-[9px] text-slate-600 uppercase tracking-wider">Location</p>
                                                <p className="text-[11px] font-semibold text-slate-200 line-clamp-1">{job.location}</p>
                                            </div>
                                        </div>
                                    )}
                                    {insights.hasEquity && (
                                        <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/[0.07] px-2.5 py-2">
                                            <Banknote className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                                            <div>
                                                <p className="text-[9px] text-amber-600 uppercase tracking-wider">Equity</p>
                                                <p className="text-[11px] font-semibold text-amber-300">Mentioned</p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] px-2.5 py-2">
                                        <Clock className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                                        <div>
                                            <p className="text-[9px] text-slate-600 uppercase tracking-wider">Posted</p>
                                            <p className="text-[11px] font-semibold text-slate-200">
                                                {job.postedAt
                                                    ? (() => {
                                                        const d = Math.floor((Date.now() - new Date(job.postedAt).getTime()) / 86400000);
                                                        return d === 0 ? 'Today' : d === 1 ? 'Yesterday' : `${d}d ago`;
                                                    })()
                                                    : 'Unknown'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* ── Dynamic description sections ── */}
                                {insights.sections.length > 0 && (
                                    <div className="space-y-2">
                                        {insights.sections.map((section, i) => (
                                            <CollapsiblePanel
                                                key={i}
                                                title={`${section.icon} ${section.heading}`}
                                                defaultOpen={i === 0}
                                            >
                                                <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                                                    {section.content}
                                                </div>
                                            </CollapsiblePanel>
                                        ))}
                                    </div>
                                )}

                                {/* Tech stack chips */}
                                {insights.keyTechStack.length > 0 && (
                                    <div>
                                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                            Tech detected
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {insights.keyTechStack.map((tech, i) => (
                                                <span key={i} className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-[11px] text-indigo-300">
                                                    {tech}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Benefits detected */}
                                {signals && signals.benefits.length > 0 && (
                                    <div>
                                        <p className="text-[10px] font-semibold text-emerald-500/70 uppercase tracking-wider mb-2">Perks mentioned</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {signals.benefits.map((b, i) => (
                                                <span key={i} className="rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-2 py-0.5 text-[11px] text-emerald-300">
                                                    {b.label}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* UK signals */}
                                {signals && signals.ukSignals.filter((s) => s.present).length > 0 && (
                                    <div>
                                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">UK signals</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {signals.ukSignals.filter((s) => s.present).map((s, i) => (
                                                <span key={i} className="rounded-full border border-sky-500/20 bg-sky-500/[0.08] px-2 py-0.5 text-[11px] text-sky-300">
                                                    {s.label}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 text-center">
                                <p className="text-xs text-slate-500">No description available for this listing.</p>
                            </div>
                        )}
                    </div>

                    {/* ── Column 3: Employer Trust + Actions ────────────────────── */}
                    <div className="space-y-5">
                        <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                            <Target className="w-4 h-4 text-violet-400" />
                            Trust &amp; Next Steps
                        </h3>

                        {/* Employer trust signals */}
                        {signals ? (
                            <div className="space-y-3">
                                <TrustBadge level={signals.trustLevel} score={signals.trustScore} />

                                {/* Listing quality grid */}
                                <div className="grid grid-cols-3 gap-1.5 text-center">
                                    {[
                                        { label: 'Salary', value: signals.salaryTransparency, good: 'full', Icon: Banknote },
                                        { label: 'Requirements', value: signals.requirementsClarity, good: 'clear', Icon: FileText },
                                        { label: 'Work mode', value: signals.workModeClarity, good: 'explicit', Icon: Users },
                                    ].map(({ label, value, good, Icon }) => (
                                        <div key={label} className={`rounded-xl border px-2 py-2 ${value === good ? 'border-emerald-500/20 bg-emerald-500/[0.06]' : 'border-white/[0.07] bg-white/[0.03]'}`}>
                                            <Icon className={`h-3.5 w-3.5 mx-auto mb-1 ${value === good ? 'text-emerald-400' : 'text-slate-500'}`} />
                                            <p className="text-[9px] text-slate-500 uppercase tracking-wider">{label}</p>
                                            <p className={`text-[10px] font-semibold capitalize ${value === good ? 'text-emerald-300' : 'text-slate-400'}`}>{value}</p>
                                        </div>
                                    ))}
                                </div>

                                {signals.trustReasons.length > 0 && (
                                    <CollapsiblePanel title="Positive signals">
                                        <ul className="space-y-1">
                                            {signals.trustReasons.map((r, i) => (
                                                <li key={i} className="flex items-start gap-1.5 text-xs text-slate-400">
                                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                                    {r}
                                                </li>
                                            ))}
                                        </ul>
                                    </CollapsiblePanel>
                                )}

                                {signals.riskReasons.length > 0 && (
                                    <CollapsiblePanel title={`Possible risk signals (${signals.riskReasons.length})`}>
                                        <ul className="space-y-1">
                                            {signals.riskReasons.map((r, i) => (
                                                <li key={i} className="flex items-start gap-1.5 text-xs text-slate-400">
                                                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                                                    {r}
                                                </li>
                                            ))}
                                        </ul>
                                        <p className="mt-2 text-[10px] text-slate-600">
                                            Based on available listing signals. Not an external verification.
                                        </p>
                                    </CollapsiblePanel>
                                )}
                            </div>
                        ) : hasRisk ? (
                            <div className={`rounded-xl border p-3 ${job.scamAnalysis!.level === 'high' ? 'bg-red-500/10 border-red-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
                                <p className={`text-sm font-semibold mb-1 flex items-center gap-2 ${job.scamAnalysis!.level === 'high' ? 'text-red-400' : 'text-amber-400'}`}>
                                    <AlertTriangle className="w-4 h-4" />
                                    {job.scamAnalysis!.level === 'high' ? 'High risk detected' : 'Review recommended'}
                                </p>
                                {job.scamAnalysis!.reasons && (
                                    <ul className="mt-2 space-y-1 text-xs text-slate-300">
                                        {job.scamAnalysis!.reasons!.map((r, i) => (
                                            <li key={i} className="flex items-start gap-1.5">
                                                <span className="text-slate-500 mt-0.5">•</span>
                                                {r}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                <p className="mt-2 text-[10px] text-slate-600">Based on listing signals. Not an external verification.</p>
                            </div>
                        ) : (
                            <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5 flex items-center gap-2">
                                <Shield className="h-4 w-4 text-slate-500 shrink-0" />
                                <p className="text-xs text-slate-500">No obvious risk signals detected in this listing.</p>
                            </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex flex-col gap-2.5 pt-1">
                            <Link
                                to={`/jobs/${job.id}`}
                                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-4 text-sm transition-colors"
                            >
                                <FileText className="w-4 h-4" />
                                Full Job Report
                            </Link>

                            {job.applyUrl && (
                                <a
                                    href={job.applyUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold py-2.5 px-4 text-sm transition-colors shadow-[0_0_15px_rgba(16,185,129,0.25)]"
                                >
                                    Apply Now
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            )}

                            <Link
                                to="/applications"
                                state={{ tailorForJobId: job.id, jobTitle: job.title, company: job.company }}
                                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white text-sm font-medium py-2.5 px-4 transition-colors"
                            >
                                <Sparkles className="w-4 h-4 text-indigo-400" />
                                Tailor CV for this role
                            </Link>

                            {onExplain && !fitAnalysis && (
                                <button
                                    type="button"
                                    onClick={onExplain}
                                    className="flex items-center justify-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/[0.08] hover:bg-indigo-500/15 text-indigo-300 text-sm font-medium py-2.5 px-4 transition-colors"
                                >
                                    <Zap className="w-4 h-4" />
                                    Why this match?
                                </button>
                            )}
                        </div>

                        {/* Score methodology footnote */}
                        <p className="text-[10px] text-slate-600 leading-relaxed">
                            Match scores are based on your{' '}
                            <Link to="/profile" className="text-slate-500 hover:text-slate-300 underline underline-offset-2">profile data</Link>{' '}
                            compared to this listing. Employer signals are extracted from the job description text — not externally verified.
                        </p>
                    </div>

                </div>
            </div>
        </article>
    );
}
