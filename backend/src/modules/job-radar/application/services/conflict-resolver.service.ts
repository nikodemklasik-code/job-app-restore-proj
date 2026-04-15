type SignalRow = Record<string, unknown>;

const confidenceRank: Record<string, number> = { high: 3, medium: 2, low: 1 };

export class ConflictResolverService {
  resolve(signals: SignalRow[]): {
    resolvedSignals: SignalRow[];
    conflictedSignalIds: Array<{ id: string; reason: string }>;
  } {
    const grouped = new Map<string, SignalRow[]>();

    for (const signal of signals) {
      const key = `${String(signal.signalScope)}::${String(signal.signalKey)}`;
      const group = grouped.get(key) ?? [];
      group.push(signal);
      grouped.set(key, group);
    }

    const resolvedSignals: SignalRow[] = [];
    const conflictedSignalIds: Array<{ id: string; reason: string }> = [];

    for (const [, candidates] of grouped.entries()) {
      if (candidates.length === 1) {
        resolvedSignals.push(candidates[0]);
        continue;
      }

      const distinctValues = new Set(
        candidates.map((c) =>
          c.signalValueText ??
          c.signalValueNumber ??
          JSON.stringify(c.signalValueJson ?? null),
        ),
      );

      if (distinctValues.size === 1) {
        resolvedSignals.push(this.chooseBest(candidates));
        continue;
      }

      const winner = this.chooseBest(candidates);
      resolvedSignals.push(winner);

      for (const candidate of candidates) {
        if (String(candidate.id) !== String(winner.id)) {
          conflictedSignalIds.push({
            id: String(candidate.id),
            reason: `resolved_by_priority_against_${String(winner.id)}`,
          });
        }
      }
    }

    return { resolvedSignals, conflictedSignalIds };
  }

  private chooseBest(candidates: SignalRow[]): SignalRow {
    return [...candidates].sort((a, b) => {
      const tierA = Number(a.sourceQualityTier ?? 9);
      const tierB = Number(b.sourceQualityTier ?? 9);
      if (tierA !== tierB) return tierA - tierB;

      const clusterBonusA = a.sourceClusterId ? 0 : 1;
      const clusterBonusB = b.sourceClusterId ? 0 : 1;
      if (clusterBonusA !== clusterBonusB) return clusterBonusA - clusterBonusB;

      const confA = confidenceRank[String(a.confidence)] ?? 0;
      const confB = confidenceRank[String(b.confidence)] ?? 0;
      if (confA !== confB) return confB - confA;

      return 0;
    })[0];
  }
}
