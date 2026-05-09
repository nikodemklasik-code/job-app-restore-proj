/**
 * SkillEvidenceCard — shows a skill with evidence level badge, confidence, and signals.
 */

import { clsx } from 'clsx';
import { Award, BookOpen, CheckCircle, Clock, Eye, FileText } from 'lucide-react';

interface SkillEvidenceCardProps {
    skillName: string;
    category: string;
    readinessScore: number;
    evidenceStrength: number;
    evidenceCount: number;
    highestEvidenceLevel: string | null;
    isStale: boolean;
    signals?: Array<{ signalType: string; title: string; severity: string }>;
    onViewDetails?: () => void;
}

const evidenceLevelConfig: Record<string, { label: string; color: string; Icon: typeof Award }> = {
    recent: { label: 'Recent', color: 'bg-green-100 text-green-800', Icon: Clock },
    verified: { label: 'Verified', color: 'bg-blue-100 text-blue-800', Icon: CheckCircle },
    demonstrated: { label: 'Demonstrated', color: 'bg-purple-100 text-purple-800', Icon: Award },
    observed: { label: 'Observed', color: 'bg-amber-100 text-amber-800', Icon: Eye },
    declared: { label: 'Declared', color: 'bg-gray-100 text-gray-700', Icon: FileText },
};

export function SkillEvidenceCard({
    skillName,
    category,
    readinessScore,
    evidenceStrength,
    evidenceCount,
    highestEvidenceLevel,
    isStale,
    signals = [],
    onViewDetails,
}: SkillEvidenceCardProps) {
    const levelConfig = highestEvidenceLevel
        ? evidenceLevelConfig[highestEvidenceLevel] ?? evidenceLevelConfig.declared
        : null;

    const scoreColor =
        readinessScore >= 70 ? 'text-green-600' :
            readinessScore >= 40 ? 'text-amber-600' :
                'text-red-600';

    return (
        <div
            className={clsx(
                'border rounded-lg p-4 hover:shadow-sm transition-shadow cursor-pointer',
                isStale ? 'border-amber-200 bg-amber-50/30' : 'border-gray-200 bg-white',
            )}
            onClick={onViewDetails}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onViewDetails?.()}
            aria-label={`${skillName} skill card. Readiness: ${readinessScore}%`}
        >
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="font-medium text-gray-900">{skillName}</h3>
                    <p className="text-xs text-gray-500 capitalize mt-0.5">{category.replace('_', ' ')}</p>
                </div>
                <div className={clsx('text-lg font-bold', scoreColor)}>
                    {readinessScore}
                </div>
            </div>

            {/* Evidence level badge */}
            <div className="flex items-center gap-2 mt-3">
                {levelConfig && (
                    <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', levelConfig.color)}>
                        <levelConfig.Icon className="w-3 h-3" />
                        {levelConfig.label}
                    </span>
                )}
                <span className="text-xs text-gray-500">
                    {evidenceCount} source{evidenceCount !== 1 ? 's' : ''}
                </span>
                {isStale && (
                    <span className="text-xs text-amber-600 font-medium">Needs refresh</span>
                )}
            </div>

            {/* Evidence strength bar */}
            <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Evidence strength</span>
                    <span>{evidenceStrength}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className={clsx('h-full rounded-full transition-all', {
                            'bg-green-500': evidenceStrength >= 70,
                            'bg-amber-500': evidenceStrength >= 40 && evidenceStrength < 70,
                            'bg-red-400': evidenceStrength < 40,
                        })}
                        style={{ width: `${evidenceStrength}%` }}
                    />
                </div>
            </div>

            {/* Signals */}
            {signals.length > 0 && (
                <div className="mt-3 space-y-1">
                    {signals.slice(0, 2).map((signal, i) => (
                        <div
                            key={i}
                            className={clsx('text-xs px-2 py-1 rounded', {
                                'bg-blue-50 text-blue-700': signal.severity === 'info',
                                'bg-amber-50 text-amber-700': signal.severity === 'warning',
                                'bg-red-50 text-red-700': signal.severity === 'critical',
                            })}
                        >
                            {signal.title}
                        </div>
                    ))}
                    {signals.length > 2 && (
                        <p className="text-xs text-gray-400">+{signals.length - 2} more signals</p>
                    )}
                </div>
            )}
        </div>
    );
}
