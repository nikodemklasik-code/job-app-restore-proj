export class ConfidenceSummaryBuilder {
  build(
    signals: Record<string, unknown>[],
    scores: Record<string, unknown> | null,
  ): Record<string, 'low' | 'medium' | 'high'> {
    const salarySignals = signals.filter((s) =>
      ['salary_min', 'salary_max', 'salary_missing'].includes(String(s.signalKey)),
    );

    const benefitsSignals = signals.filter((s) => String(s.category) === 'benefits');
    const reputationSignals = signals.filter((s) => String(s.category) === 'reputation');

    const overall = scores?.confidenceOverall;

    return {
      overall:
        overall === 'high' || overall === 'medium' || overall === 'low'
          ? overall
          : 'low',
      salary: this.aggregateConfidence(salarySignals),
      benefits: this.aggregateConfidence(benefitsSignals),
      reputation: this.aggregateConfidence(reputationSignals),
      fit: 'low',
    };
  }

  private aggregateConfidence(signals: Record<string, unknown>[]): 'low' | 'medium' | 'high' {
    if (signals.some((s) => s.confidence === 'high')) return 'high';
    if (signals.some((s) => s.confidence === 'medium')) return 'medium';
    return 'low';
  }
}
