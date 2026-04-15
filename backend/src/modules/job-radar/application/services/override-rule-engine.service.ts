import type { Recommendation } from '../../domain/types/recommendation.js';

export type OverrideResult = {
  overrideApplied: boolean;
  overrideId?: string;
  overrideReason?: string;
  overrideConfidence?: 'low' | 'medium' | 'high';
  overrideCeiling?: Recommendation;
};

export class OverrideRuleEngine {
  evaluate(input: {
    signals: Record<string, unknown>[];
    findings: Record<string, unknown>[];
    recommendation: Recommendation;
  }): OverrideResult {
    const hasInactiveSignal = input.signals.some(
      (s) => String(s.signalKey) === 'fake_or_inactive_company_signal',
    );

    if (hasInactiveSignal) {
      return {
        overrideApplied: true,
        overrideId: 'OVR-001',
        overrideReason: 'Registry suggests inactive or non-operational entity',
        overrideConfidence: 'high',
        overrideCeiling: 'Mixed Signals',
      };
    }

    const severeRedFlags = input.findings.filter(
      (f) =>
        f.findingType === 'red_flag' &&
        String(f.severity) === 'severe' &&
        ['medium', 'high'].includes(String(f.confidence)),
    );

    if (severeRedFlags.length > 0) {
      return {
        overrideApplied: true,
        overrideId: 'OVR-003',
        overrideReason: 'Severe reputational or legal risk signal present',
        overrideConfidence: 'medium',
        overrideCeiling: 'Mixed Signals',
      };
    }

    return { overrideApplied: false };
  }

  applyRecommendationCeiling(current: Recommendation, ceiling: Recommendation): Recommendation {
    const order: Record<Recommendation, number> = {
      'Strong Match': 4,
      'Good Option': 3,
      'Mixed Signals': 2,
      'High Risk': 1,
    };

    return order[current] > order[ceiling] ? ceiling : current;
  }
}
