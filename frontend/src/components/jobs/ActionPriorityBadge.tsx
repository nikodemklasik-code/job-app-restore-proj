/**
 * ActionPriorityBadge — displays apply_now/save/reject/verify_employer as CTA.
 * Uses signal language for all labels and tooltips.
 */

import { clsx } from 'clsx';
import { ArrowRight, Bookmark, Search, XCircle } from 'lucide-react';

type ActionRecommendation = 'apply_now' | 'save' | 'reject' | 'verify_employer';

interface ActionPriorityBadgeProps {
    recommendation: ActionRecommendation;
    score?: number;
    onClick?: () => void;
    className?: string;
}

const actionConfig: Record<ActionRecommendation, {
    label: string;
    description: string;
    color: string;
    Icon: typeof ArrowRight;
}> = {
    apply_now: {
        label: 'Strong match',
        description: 'Signals suggest this opportunity aligns well with your profile',
        color: 'bg-green-600 hover:bg-green-700 text-white',
        Icon: ArrowRight,
    },
    save: {
        label: 'Worth monitoring',
        description: 'Moderate fit signals — consider revisiting after gathering more data',
        color: 'bg-blue-600 hover:bg-blue-700 text-white',
        Icon: Bookmark,
    },
    reject: {
        label: 'Limited fit',
        description: 'Current skill alignment is limited, though unlisted experience may change this',
        color: 'bg-gray-500 hover:bg-gray-600 text-white',
        Icon: XCircle,
    },
    verify_employer: {
        label: 'Verify first',
        description: 'Skill fit looks promising, but employer signals suggest verifying further',
        color: 'bg-amber-600 hover:bg-amber-700 text-white',
        Icon: Search,
    },
};

export function ActionPriorityBadge({ recommendation, score, onClick, className }: ActionPriorityBadgeProps) {
    const config = actionConfig[recommendation];
    const { Icon } = config;

    return (
        <button
            type="button"
            onClick={onClick}
            className={clsx(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                config.color,
                className,
            )}
            title={config.description}
            aria-label={`${config.label}${score !== undefined ? ` (score: ${score})` : ''}: ${config.description}`}
        >
            <Icon className="w-4 h-4" aria-hidden="true" />
            <span>{config.label}</span>
            {score !== undefined && (
                <span className="ml-1 opacity-75 text-xs">{score}</span>
            )}
        </button>
    );
}
