'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { ScoreDriverGroup } from '../api/job-radar.types';

type Props = {
  label: string;
  score: number;
  drivers: ScoreDriverGroup;
  sourcesCount?: number;
};

export function ScoreCardFlip({ label, score, drivers, sourcesCount = 0 }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getScoreColor = (score: number, isRisk: boolean) => {
    if (isRisk) {
      if (score <= 20) return 'text-emerald-600 dark:text-emerald-400';
      if (score <= 35) return 'text-amber-600 dark:text-amber-400';
      return 'text-red-600 dark:text-red-400';
    }
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 60) return 'text-blue-600 dark:text-blue-400';
    if (score >= 40) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const isRiskScore = label.includes('Risk');
  const scoreColor = getScoreColor(score, isRiskScore);

  const hasDrivers = 
    drivers.positive_drivers.length > 0 ||
    drivers.negative_drivers.length > 0 ||
    drivers.neutral_constraints.length > 0;

  // Fallback message if no drivers
  const fallbackMessage = sourcesCount > 0 
    ? `Based on ${sourcesCount} source${sourcesCount !== 1 ? 's' : ''} analyzed`
    : 'Limited data available';

  return (
    <div className="rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 text-left hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors flex items-start justify-between"
      >
        <div className="flex-1">
          <div className="text-sm text-neutral-600 dark:text-neutral-400">{label}</div>
          <div className={`mt-2 text-3xl font-semibold ${scoreColor}`}>
            {score}
            <span className="text-sm text-neutral-500 dark:text-neutral-500 ml-1">/100</span>
          </div>
          {!hasDrivers && (
            <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
              {fallbackMessage}
            </div>
          )}
        </div>
        <ChevronDown
          className={`w-5 h-5 text-neutral-400 transition-transform duration-300 mt-1 shrink-0 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isExpanded && (
        <div className="border-t border-neutral-200 dark:border-neutral-800 p-4 bg-neutral-50 dark:bg-neutral-900 space-y-3 text-sm">
          {hasDrivers ? (
            <>
              {/* Positive Drivers */}
              {drivers.positive_drivers.length > 0 && (
                <div>
                  <div className="font-medium text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-1">
                    <span>✓</span> Positive Factors
                  </div>
                  <div className="space-y-1 ml-4">
                    {drivers.positive_drivers.map((driver, i) => (
                      <div key={i} className="text-neutral-700 dark:text-neutral-300">
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          +{driver.impact}
                        </span>
                        {' '}
                        <span>{driver.label}</span>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400 ml-1">
                          ({driver.confidence})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Negative Drivers */}
              {drivers.negative_drivers.length > 0 && (
                <div>
                  <div className="font-medium text-red-600 dark:text-red-400 mb-2 flex items-center gap-1">
                    <span>✗</span> Negative Factors
                  </div>
                  <div className="space-y-1 ml-4">
                    {drivers.negative_drivers.map((driver, i) => (
                      <div key={i} className="text-neutral-700 dark:text-neutral-300">
                        <span className="text-red-600 dark:text-red-400 font-semibold">
                          {driver.impact}
                        </span>
                        {' '}
                        <span>{driver.label}</span>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400 ml-1">
                          ({driver.confidence})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Neutral Constraints */}
              {drivers.neutral_constraints.length > 0 && (
                <div>
                  <div className="font-medium text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-1">
                    <span>⚠</span> Neutral Factors
                  </div>
                  <div className="space-y-1 ml-4">
                    {drivers.neutral_constraints.map((driver, i) => (
                      <div key={i} className="text-neutral-700 dark:text-neutral-300">
                        <span>{driver.label}</span>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400 ml-1">
                          ({driver.confidence})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {sourcesCount > 0 && (
                <div className="text-xs text-neutral-500 dark:text-neutral-400 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                  Based on {sourcesCount} source{sourcesCount !== 1 ? 's' : ''} analyzed
                </div>
              )}
            </>
          ) : (
            <div className="text-neutral-600 dark:text-neutral-400 italic py-2">
              {fallbackMessage}. More sources will provide detailed breakdown.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
