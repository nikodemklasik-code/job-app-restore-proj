/**
 * SkillPortfolioView — full skill portfolio with readiness scores, gap indicators, and signals.
 */

import { useEffect } from 'react';
import { BookOpen, RefreshCw, TrendingUp } from 'lucide-react';
import { useSkillMatrixStore } from '@/stores/skillMatrixStore';
import { SkillEvidenceCard } from './SkillEvidenceCard';
import { ScoreBreakdownPanel } from '../scoring/ScoreBreakdownPanel';

export function SkillPortfolioView() {
    const { portfolio, signals, isLoading, error, loadPortfolio, loadSignals } = useSkillMatrixStore();

    useEffect(() => {
        loadPortfolio();
        loadSignals();
    }, [loadPortfolio, loadSignals]);

    if (isLoading && !portfolio) {
        return (
            <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500">Loading skill portfolio...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <p className="text-red-600">{error}</p>
                <button onClick={loadPortfolio} className="mt-2 text-blue-600 hover:underline text-sm">
                    Try again
                </button>
            </div>
        );
    }

    if (!portfolio || portfolio.totalSkills === 0) {
        return (
            <div className="text-center py-12">
                <BookOpen className="w-10 h-10 text-gray-300 mx-auto" />
                <h3 className="mt-3 text-lg font-medium text-gray-900">No skills tracked yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                    Add evidence for your skills to see readiness scores and gap analysis.
                </p>
            </div>
        );
    }

    const gapSignals = signals.filter((s) => s.signalType === 'gap' || s.signalType === 'verification_needed');
    const strengthSignals = signals.filter((s) => s.signalType === 'strength');

    return (
        <div className="space-y-6">
            {/* Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="text-sm text-gray-500">Total Skills</div>
                    <div className="text-2xl font-bold text-gray-900 mt-1">{portfolio.totalSkills}</div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="text-sm text-gray-500">Average Readiness</div>
                    <div className="text-2xl font-bold text-gray-900 mt-1">{portfolio.averageReadiness}/100</div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="text-sm text-gray-500">Gaps Identified</div>
                    <div className="text-2xl font-bold text-amber-600 mt-1">{gapSignals.length}</div>
                </div>
            </div>

            {/* Signals summary */}
            {(gapSignals.length > 0 || strengthSignals.length > 0) && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Key Signals
                    </h3>
                    <div className="mt-3 space-y-2">
                        {strengthSignals.slice(0, 3).map((s) => (
                            <div key={s.id} className="text-sm px-3 py-1.5 bg-green-50 text-green-700 rounded">
                                {s.title}
                            </div>
                        ))}
                        {gapSignals.slice(0, 3).map((s) => (
                            <div key={s.id} className="text-sm px-3 py-1.5 bg-amber-50 text-amber-700 rounded">
                                {s.title}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Skill cards grid */}
            <div>
                <h3 className="font-medium text-gray-900 mb-3">Your Skills</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {portfolio.skills
                        .sort((a, b) => b.readinessScore - a.readinessScore)
                        .map((skill) => {
                            const skillSignals = signals.filter((s) => s.skillId === skill.skillId);
                            return (
                                <SkillEvidenceCard
                                    key={skill.skillId}
                                    skillName={skill.skillName}
                                    category={skill.category}
                                    readinessScore={skill.readinessScore}
                                    evidenceStrength={skill.evidenceStrength}
                                    evidenceCount={skill.evidenceCount}
                                    highestEvidenceLevel={null}
                                    isStale={skill.isStale}
                                    signals={skillSignals.map((s) => ({
                                        signalType: s.signalType,
                                        title: s.title,
                                        severity: s.severity,
                                    }))}
                                />
                            );
                        })}
                </div>
            </div>
        </div>
    );
}
