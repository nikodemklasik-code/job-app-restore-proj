/**
 * SkillsLabWithMatrix — redesigned skills page with modern UX.
 * Features: Portfolio overview, Skill Matrix view, Lab tools as collapsed sections.
 */

import { useState, useEffect } from 'react';
import {
    FlaskConical,
    BarChart3,
    RefreshCw,
    TrendingUp,
    Target,
    Sparkles,
    BookOpen,
    ArrowRight,
    AlertCircle,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Link } from 'react-router-dom';
import { SkillPortfolioView } from '@/components/skills/SkillPortfolioView';
import { useSkillMatrixStore } from '@/stores/skillMatrixStore';
import { trpcClient, api } from '@/lib/api';
import { useProfileStore } from '@/stores/profileStore';

// Lazy import the existing SkillsLab
import { default as SkillsLabPage } from './SkillsLabSuccessFirst';

type Tab = 'overview' | 'matrix' | 'lab';

export default function SkillsLabWithMatrix() {
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [syncing, setSyncing] = useState(false);
    const [syncMessage, setSyncMessage] = useState<string | null>(null);

    const { profile, loadProfile } = useProfileStore();
    const { portfolio, loadPortfolio, isLoading: matrixLoading, error: matrixError } = useSkillMatrixStore();

    useEffect(() => {
        if (!profile) void loadProfile();
        void loadPortfolio();
    }, [profile, loadProfile, loadPortfolio]);

    const handleSyncFromProfile = async () => {
        setSyncing(true);
        setSyncMessage(null);
        try {
            await (trpcClient as any).skillMatrix.syncFromLegacySkills?.mutate?.();
            await loadPortfolio();
            setSyncMessage('Profile skills synced to Skills Matrix');
        } catch (err) {
            setSyncMessage('Sync failed. Try adding skills in Profile first.');
        } finally {
            setSyncing(false);
        }
    };

    const totalSkills = profile?.skills?.length ?? 0;
    const portfolioReadiness = portfolio?.averageReadiness ?? 0;
    const targetRole = profile?.careerGoals?.targetJobTitle ?? null;

    if (matrixLoading && !portfolio) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            </div>
        );
    }

    if (matrixError && !portfolio) {
        return (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-center">
                <AlertCircle className="mx-auto h-8 w-8 text-amber-400" />
                <p className="mt-3 text-sm text-amber-200">{matrixError}</p>
                <button onClick={() => void loadPortfolio()} className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Hero / Overview */}
            <div className="mvh-card-glow rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 via-violet-500/5 to-teal-500/10 p-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-indigo-500/20 p-2.5">
                                <Target className="h-6 w-6 text-indigo-300" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">Skills Intelligence</h1>
                                <p className="text-sm text-slate-400">
                                    {targetRole ? `Tracking skills for ${targetRole}` : 'Set a target role in Profile to track gaps'}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {syncMessage && (
                            <span className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-1.5">
                                {syncMessage}
                            </span>
                        )}
                        <button
                            type="button"
                            onClick={handleSyncFromProfile}
                            disabled={syncing}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-200 bg-indigo-500/10 border border-indigo-500/30 rounded-lg hover:bg-indigo-500/20 transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={clsx('w-3.5 h-3.5', syncing && 'animate-spin')} />
                            {syncing ? 'Syncing...' : 'Sync from profile'}
                        </button>
                    </div>
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <StatCard
                        icon={<BookOpen className="h-5 w-5 text-sky-300" />}
                        label="Total Skills"
                        value={String(totalSkills)}
                        tone="sky"
                    />
                    <StatCard
                        icon={<TrendingUp className="h-5 w-5 text-emerald-300" />}
                        label="Portfolio Readiness"
                        value={`${portfolioReadiness}%`}
                        tone="emerald"
                    />
                    <StatCard
                        icon={<Sparkles className="h-5 w-5 text-amber-300" />}
                        label="Evidence Gaps"
                        value={String(portfolio?.skills?.filter((s) => s.isStale).length ?? 0)}
                        tone="amber"
                    />
                </div>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <ActionCard
                    icon={<FlaskConical className="h-5 w-5" />}
                    title="Analyze CV"
                    description="Extract skills from your CV document"
                    href="/documents?tab=upload"
                />
                <ActionCard
                    icon={<Target className="h-5 w-5" />}
                    title="Set Target Role"
                    description="Configure career goals for gap analysis"
                    href="/profile"
                />
                <ActionCard
                    icon={<BarChart3 className="h-5 w-5" />}
                    title="Job Radar"
                    description="Check employer trust for applications"
                    href="/job-radar"
                />
            </div>

            {/* Tab bar */}
            <div className="flex items-center gap-1 border-b border-gray-200 dark:border-white/10">
                <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<Target className="w-4 h-4" />}>
                    Overview
                </TabButton>
                <TabButton active={activeTab === 'matrix'} onClick={() => setActiveTab('matrix')} icon={<BarChart3 className="w-4 h-4" />}>
                    Skills Matrix
                </TabButton>
                <TabButton active={activeTab === 'lab'} onClick={() => setActiveTab('lab')} icon={<FlaskConical className="w-4 h-4" />}>
                    Skills Lab
                </TabButton>
            </div>

            {/* Tab content */}
            {activeTab === 'overview' && <OverviewPanel profile={profile} portfolio={portfolio} />}
            {activeTab === 'matrix' && <SkillPortfolioView />}
            {activeTab === 'lab' && <SkillsLabPage />}
        </div>
    );
}

// ── Components ──────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: 'sky' | 'emerald' | 'amber' }) {
    const toneClasses = {
        sky: 'bg-sky-500/10 border-sky-500/30',
        emerald: 'bg-emerald-500/10 border-emerald-500/30',
        amber: 'bg-amber-500/10 border-amber-500/30',
    };
    return (
        <div className={clsx('rounded-xl border p-4', toneClasses[tone])}>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
                {icon}
                {label}
            </div>
            <div className="mt-2 text-2xl font-bold text-white">{value}</div>
        </div>
    );
}

function ActionCard({ icon, title, description, href }: { icon: React.ReactNode; title: string; description: string; href: string }) {
    return (
        <Link
            to={href}
            className="mvh-card-glow group rounded-xl border border-white/10 bg-white/5 p-4 hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all"
        >
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-white/10 p-1.5 text-indigo-300">{icon}</div>
                    <div>
                        <p className="font-medium text-white text-sm">{title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{description}</p>
                    </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-300 group-hover:translate-x-1 transition-all" />
            </div>
        </Link>
    );
}

function TabButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={clsx(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
                active
                    ? 'border-indigo-500 text-indigo-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200',
            )}
        >
            {icon}
            {children}
        </button>
    );
}

function OverviewPanel({ profile, portfolio }: { profile: any; portfolio: any }) {
    if (!profile) {
        return (
            <div className="mvh-card-glow rounded-xl border border-white/10 bg-white/5 p-12 text-center">
                <FlaskConical className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                <h3 className="font-semibold text-white">Profile not loaded</h3>
                <p className="text-sm text-slate-400 mt-1">Add skills to your profile to see insights here.</p>
            </div>
        );
    }

    const skills = profile.skills ?? [];
    const targetRole = profile.careerGoals?.targetJobTitle;

    return (
        <div className="space-y-4">
            {/* Profile skills summary */}
            <div className="mvh-card-glow rounded-xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-white">Your Skills ({skills.length})</h2>
                    <Link to="/profile" className="text-xs text-indigo-300 hover:text-indigo-200">
                        Edit in Profile →
                    </Link>
                </div>
                {skills.length === 0 ? (
                    <div className="text-center py-6">
                        <p className="text-sm text-slate-400">No skills added yet</p>
                        <Link to="/profile" className="mt-2 inline-block text-xs text-indigo-300 hover:text-indigo-200">
                            Add skills to get started →
                        </Link>
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {skills.slice(0, 30).map((skill: string, i: number) => (
                            <span key={i} className="inline-flex items-center rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-xs font-medium text-indigo-300">
                                {skill}
                            </span>
                        ))}
                        {skills.length > 30 && (
                            <span className="text-xs text-slate-500">+{skills.length - 30} more</span>
                        )}
                    </div>
                )}
            </div>

            {/* Next steps */}
            {!targetRole && (
                <div className="mvh-card-glow rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="font-medium text-amber-100">Set your target role</p>
                            <p className="text-xs text-amber-200/80 mt-1">
                                Defining a target role unlocks personalized gap analysis and market value estimates.
                            </p>
                            <Link to="/profile" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-300 hover:text-amber-200">
                                Set target role
                                <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {portfolio && portfolio.skills && portfolio.skills.length > 0 && (
                <div className="mvh-card-glow rounded-xl border border-white/10 bg-white/5 p-5">
                    <h2 className="font-semibold text-white mb-3">Top Skills by Readiness</h2>
                    <div className="space-y-2">
                        {portfolio.skills
                            .slice()
                            .sort((a: any, b: any) => b.readinessScore - a.readinessScore)
                            .slice(0, 5)
                            .map((skill: any) => (
                                <div key={skill.skillId} className="flex items-center justify-between gap-3 p-2 rounded-lg bg-white/[0.03]">
                                    <span className="text-sm text-white truncate">{skill.skillName}</span>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                            <div
                                                className={clsx('h-full transition-all', {
                                                    'bg-emerald-500': skill.readinessScore >= 70,
                                                    'bg-amber-500': skill.readinessScore >= 40 && skill.readinessScore < 70,
                                                    'bg-red-500': skill.readinessScore < 40,
                                                })}
                                                style={{ width: `${skill.readinessScore}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-medium text-slate-300 w-10 text-right">{skill.readinessScore}%</span>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            )}
        </div>
    );
}
