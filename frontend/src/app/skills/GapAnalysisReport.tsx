/**
 * GapAnalysisReport — displays AI-generated gap analysis with learning recommendations.
 * Shows credit cost confirmation before execution.
 */

import { useState } from 'react';
import { AlertTriangle, BookOpen, Clock, Coins, TrendingUp } from 'lucide-react';
import { clsx } from 'clsx';
import { TrustMetadataTooltip } from '@/components/shared/TrustMetadataTooltip';

interface SkillGap {
    skillName: string;
    severity: 'critical' | 'important' | 'nice_to_have';
    currentLevel: string | null;
    frequency: number;
    salaryImpact: number;
    recommendation: string;
    estimatedWeeksToClose: number;
    suggestedActions: string[];
}

interface GapAnalysisData {
    gaps: SkillGap[];
    summary: string;
    totalGaps: number;
    criticalGaps: number;
    estimatedFitImprovement: number;
    trustMetadata?: {
        sourceName: string;
        sourceUrl: string | null;
        sourceType: string;
        freshness: string;
        confidence: number;
        explanationType: string;
        userVisibleReason: string;
    };
}

interface GapAnalysisReportProps {
    data?: GapAnalysisData | null;
    isLoading?: boolean;
    creditCost?: { min: number; max: number };
    onRequestAnalysis?: () => void;
    onConfirmSpend?: () => void;
}

const severityConfig = {
    critical: { label: 'Critical', color: 'bg-red-100 text-red-800 border-red-200', icon: AlertTriangle },
    important: { label: 'Important', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: TrendingUp },
    nice_to_have: { label: 'Nice to have', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: BookOpen },
};

export function GapAnalysisReport({ data, isLoading, creditCost, onRequestAnalysis, onConfirmSpend }: GapAnalysisReportProps) {
    const [showConfirm, setShowConfirm] = useState(false);

    // Pre-analysis state: show cost and request button
    if (!data && !isLoading) {
        return (
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                <BookOpen className="w-10 h-10 text-gray-300 mx-auto" />
                <h3 className="mt-3 text-lg font-medium text-gray-900">Skill Gap Analysis</h3>
                <p className="mt-1 text-sm text-gray-500 max-w-md mx-auto">
                    Get a detailed analysis of skill gaps for your target role with specific learning recommendations and time estimates.
                </p>

                {creditCost && !showConfirm && (
                    <button
                        type="button"
                        onClick={() => setShowConfirm(true)}
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Coins className="w-4 h-4" />
                        Run analysis ({creditCost.min}–{creditCost.max} credits)
                    </button>
                )}

                {showConfirm && (
                    <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-sm text-amber-800">
                            This will use {creditCost?.min}–{creditCost?.max} credits from your balance.
                        </p>
                        <div className="mt-3 flex justify-center gap-3">
                            <button
                                type="button"
                                onClick={() => { onConfirmSpend?.(); setShowConfirm(false); }}
                                className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                            >
                                Confirm
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowConfirm(false)}
                                className="px-4 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto" />
                    <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
                    <div className="h-20 bg-gray-100 rounded mt-4" />
                </div>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="space-y-4">
            {/* Summary */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="font-medium text-gray-900">Gap Analysis Summary</h3>
                        <p className="mt-1 text-sm text-gray-600">{data.summary}</p>
                    </div>
                    {data.trustMetadata && <TrustMetadataTooltip metadata={data.trustMetadata} />}
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{data.totalGaps}</div>
                        <div className="text-xs text-gray-500">Total gaps</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{data.criticalGaps}</div>
                        <div className="text-xs text-gray-500">Critical</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">+{data.estimatedFitImprovement}</div>
                        <div className="text-xs text-gray-500">Potential fit boost</div>
                    </div>
                </div>
            </div>

            {/* Gap cards */}
            <div className="space-y-3">
                {data.gaps.map((gap, i) => {
                    const config = severityConfig[gap.severity];
                    const Icon = config.icon;

                    return (
                        <div key={i} className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                    <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border', config.color)}>
                                        <Icon className="w-3 h-3" />
                                        {config.label}
                                    </span>
                                    <h4 className="font-medium text-gray-900">{gap.skillName}</h4>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <Clock className="w-3 h-3" />
                                    ~{gap.estimatedWeeksToClose} weeks
                                </div>
                            </div>

                            <p className="mt-2 text-sm text-gray-600">{gap.recommendation}</p>

                            {gap.suggestedActions.length > 0 && (
                                <div className="mt-3">
                                    <p className="text-xs font-medium text-gray-500 mb-1">Suggested actions:</p>
                                    <ul className="space-y-1">
                                        {gap.suggestedActions.map((action, j) => (
                                            <li key={j} className="text-xs text-gray-600 flex items-start gap-1.5">
                                                <span className="text-blue-500 mt-0.5">•</span>
                                                {action}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                                <span>In {Math.round(gap.frequency * 100)}% of listings</span>
                                {gap.salaryImpact > 0 && <span>~+{gap.salaryImpact}pts fit impact</span>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
