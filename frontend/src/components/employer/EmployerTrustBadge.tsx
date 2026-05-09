/**
 * EmployerTrustBadge — compact trust level indicator.
 * Shows verified (≥75), likely_legit (≥55), review (≥35), risky (<35).
 */

import { clsx } from 'clsx';
import { Shield, ShieldAlert, ShieldCheck, ShieldQuestion } from 'lucide-react';

interface EmployerTrustBadgeProps {
    trustScore: number;
    riskScore?: number;
    size?: 'sm' | 'md';
    className?: string;
}

type TrustLevel = 'verified' | 'likely_legit' | 'review' | 'risky';

function getTrustLevel(score: number): TrustLevel {
    if (score >= 75) return 'verified';
    if (score >= 55) return 'likely_legit';
    if (score >= 35) return 'review';
    return 'risky';
}

const trustConfig: Record<TrustLevel, { label: string; color: string; Icon: typeof Shield }> = {
    verified: { label: 'Verified', color: 'bg-green-50 text-green-700 border-green-200', Icon: ShieldCheck },
    likely_legit: { label: 'Likely legit', color: 'bg-blue-50 text-blue-700 border-blue-200', Icon: Shield },
    review: { label: 'Review', color: 'bg-amber-50 text-amber-700 border-amber-200', Icon: ShieldQuestion },
    risky: { label: 'Risky', color: 'bg-red-50 text-red-700 border-red-200', Icon: ShieldAlert },
};

export function EmployerTrustBadge({ trustScore, riskScore, size = 'sm', className }: EmployerTrustBadgeProps) {
    const level = getTrustLevel(trustScore);
    const config = trustConfig[level];
    const { Icon } = config;

    const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
    const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
    const padding = size === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-1';

    return (
        <div className={clsx('inline-flex items-center gap-1 rounded-full border', config.color, padding, className)}>
            <Icon className={iconSize} aria-hidden="true" />
            <span className={clsx('font-medium', textSize)}>{config.label}</span>
            {riskScore !== undefined && riskScore > 50 && (
                <span className="ml-1 text-red-600 font-medium" aria-label={`Risk score: ${riskScore}`}>
                    ⚠
                </span>
            )}
        </div>
    );
}
