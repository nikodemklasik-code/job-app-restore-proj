/**
 * EmployerRiskDrawer — expandable drawer showing all employer signals
 * grouped by category with Trust_Metadata.
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp, Flag, X } from 'lucide-react';
import { clsx } from 'clsx';
import { TrustMetadataTooltip } from '../shared/TrustMetadataTooltip';
import { EmployerTrustBadge } from './EmployerTrustBadge';

interface EmployerSignal {
    id: string;
    category: string;
    signalType: string;
    score: number;
    severity: string;
    title: string;
    explanation: string;
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

interface EmployerRiskDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    employerName: string;
    trustScore: number;
    riskScore: number;
    signals: EmployerSignal[];
    onReportInaccuracy?: (signalId: string, reason: string) => void;
}

const categoryLabels: Record<string, string> = {
    identity_credibility: 'Identity & Credibility',
    offer_transparency: 'Offer Transparency',
    compensation_benefits: 'Compensation & Benefits',
    business_stability: 'Business Stability',
    culture_management: 'Culture & Management',
    recruitment_process: 'Recruitment Process',
    technology_maturity: 'Technology Maturity',
    uk_local_risks: 'UK-Specific Signals',
    scam_fraud: 'Safety Signals',
};

const severityColors: Record<string, string> = {
    positive: 'border-l-green-500 bg-green-50',
    neutral: 'border-l-gray-400 bg-gray-50',
    warning: 'border-l-amber-500 bg-amber-50',
    critical: 'border-l-red-500 bg-red-50',
};

export function EmployerRiskDrawer({
    isOpen,
    onClose,
    employerName,
    trustScore,
    riskScore,
    signals,
    onReportInaccuracy,
}: EmployerRiskDrawerProps) {
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

    if (!isOpen) return null;

    // Group signals by category
    const grouped = signals.reduce<Record<string, EmployerSignal[]>>((acc, signal) => {
        const cat = signal.category;
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(signal);
        return acc;
    }, {});

    const toggleCategory = (cat: string) => {
        setExpandedCategories((prev) => {
            const next = new Set(prev);
            if (next.has(cat)) next.delete(cat);
            else next.add(cat);
            return next;
        });
    };

    return (
        <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-xl z-50 overflow-y-auto border-l border-gray-200">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">{employerName}</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Employer verification signals</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
                        aria-label="Close drawer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex items-center gap-3 mt-3">
                    <EmployerTrustBadge trustScore={trustScore} riskScore={riskScore} size="md" />
                    <div className="text-sm text-gray-600">
                        Trust: {trustScore}/100 · Risk: {riskScore}/100
                    </div>
                </div>
            </div>

            {/* Signal categories */}
            <div className="p-4 space-y-3">
                {Object.entries(grouped).map(([category, catSignals]) => {
                    const isExpanded = expandedCategories.has(category);
                    const positiveCount = catSignals.filter((s) => s.score > 0).length;
                    const negativeCount = catSignals.filter((s) => s.score < 0).length;

                    return (
                        <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
                            <button
                                type="button"
                                onClick={() => toggleCategory(category)}
                                className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm text-gray-900">
                                        {categoryLabels[category] ?? category}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {positiveCount > 0 && <span className="text-green-600">+{positiveCount}</span>}
                                        {negativeCount > 0 && <span className="text-red-600 ml-1">-{negativeCount}</span>}
                                    </span>
                                </div>
                                {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                            </button>

                            {isExpanded && (
                                <div className="border-t border-gray-100 p-2 space-y-2">
                                    {catSignals.map((signal) => (
                                        <div
                                            key={signal.id}
                                            className={clsx('border-l-4 rounded-r-lg p-2.5', severityColors[signal.severity] ?? 'bg-gray-50 border-l-gray-300')}
                                        >
                                            <div className="flex items-start justify-between">
                                                <p className="text-sm font-medium text-gray-900">{signal.title}</p>
                                                {signal.trustMetadata && (
                                                    <TrustMetadataTooltip metadata={signal.trustMetadata} />
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-600 mt-1">{signal.explanation}</p>
                                            {onReportInaccuracy && (
                                                <button
                                                    type="button"
                                                    onClick={() => onReportInaccuracy(signal.id, '')}
                                                    className="mt-1.5 text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                                                >
                                                    <Flag className="w-3 h-3" />
                                                    Report inaccuracy
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}

                {signals.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-8">
                        No verification signals available yet. Signals are generated as more data sources are analysed.
                    </p>
                )}
            </div>
        </div>
    );
}
