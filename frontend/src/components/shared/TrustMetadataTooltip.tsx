/**
 * TrustMetadataTooltip — reusable tooltip showing source, confidence, freshness.
 * Displays on hover/click to provide transparency about data provenance.
 */

import { useState } from 'react';
import { Info } from 'lucide-react';
import { clsx } from 'clsx';

interface TrustMetadata {
    sourceName: string;
    sourceUrl: string | null;
    sourceType: string;
    freshness: string;
    confidence: number;
    explanationType: string;
    userVisibleReason: string;
}

interface TrustMetadataTooltipProps {
    metadata: TrustMetadata;
    className?: string;
}

const freshnessColors: Record<string, string> = {
    fresh: 'text-green-600',
    recent: 'text-blue-600',
    aging: 'text-amber-600',
    stale: 'text-red-600',
};

export function TrustMetadataTooltip({ metadata, className }: TrustMetadataTooltipProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={clsx('relative inline-block', className)}>
            <button
                type="button"
                className="text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
                onMouseEnter={() => setIsOpen(true)}
                onMouseLeave={() => setIsOpen(false)}
                aria-label="View data source information"
            >
                <Info className="w-3.5 h-3.5" />
            </button>

            {isOpen && (
                <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-white border border-gray-200 rounded-lg shadow-lg text-xs">
                    <div className="space-y-1.5">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Source</span>
                            <span className="font-medium text-gray-900">{metadata.sourceName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Confidence</span>
                            <span className="font-medium text-gray-900">
                                {Math.round(metadata.confidence * 100)}%
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Freshness</span>
                            <span className={clsx('font-medium capitalize', freshnessColors[metadata.freshness] ?? 'text-gray-900')}>
                                {metadata.freshness}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Method</span>
                            <span className="font-medium text-gray-900 capitalize">
                                {metadata.explanationType.replace('_', ' ')}
                            </span>
                        </div>
                        {metadata.sourceUrl && (
                            <a
                                href={metadata.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline block mt-1"
                            >
                                View source →
                            </a>
                        )}
                    </div>
                    <p className="mt-2 text-gray-500 border-t border-gray-100 pt-1.5">
                        {metadata.userVisibleReason}
                    </p>
                    {/* Arrow */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                        <div className="w-2 h-2 bg-white border-b border-r border-gray-200 rotate-45" />
                    </div>
                </div>
            )}
        </div>
    );
}
