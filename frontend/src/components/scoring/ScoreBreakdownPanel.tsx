/**
 * ScoreBreakdownPanel — per-dimension visualization for any score type.
 * Shows a horizontal bar chart of contributing dimensions.
 */

import { clsx } from 'clsx';

interface Dimension {
    label: string;
    value: number; // 0–100
    weight?: number; // 0–1
}

interface ScoreBreakdownPanelProps {
    title: string;
    overallScore: number;
    dimensions: Dimension[];
    className?: string;
}

function getScoreColor(score: number): string {
    if (score >= 70) return 'bg-green-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-red-400';
}

export function ScoreBreakdownPanel({ title, overallScore, dimensions, className }: ScoreBreakdownPanelProps) {
    const scoreColor =
        overallScore >= 70 ? 'text-green-600' :
            overallScore >= 40 ? 'text-amber-600' :
                'text-red-600';

    return (
        <div className={clsx('bg-white border border-gray-200 rounded-lg p-4', className)}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">{title}</h3>
                <div className={clsx('text-2xl font-bold', scoreColor)}>
                    {overallScore}
                    <span className="text-sm font-normal text-gray-400">/100</span>
                </div>
            </div>

            {/* Dimension bars */}
            <div className="space-y-3">
                {dimensions.map((dim) => (
                    <div key={dim.label}>
                        <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-700">{dim.label}</span>
                            <div className="flex items-center gap-2">
                                {dim.weight !== undefined && (
                                    <span className="text-xs text-gray-400">{Math.round(dim.weight * 100)}%</span>
                                )}
                                <span className="font-medium text-gray-900 w-8 text-right">{dim.value}</span>
                            </div>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className={clsx('h-full rounded-full transition-all', getScoreColor(dim.value))}
                                style={{ width: `${dim.value}%` }}
                                role="progressbar"
                                aria-valuenow={dim.value}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-label={`${dim.label}: ${dim.value}%`}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
