import { describe, it, expect } from 'vitest';
import { ConflictResolverService } from '../../application/services/conflict-resolver.service.js';

describe('ConflictResolverService', () => {
  it('prefers Tier 1 over Tier 2 for conflicting work_mode', () => {
    const service = new ConflictResolverService();

    const result = service.resolve([
      {
        id: 'a',
        signalScope: 'offer',
        signalKey: 'work_mode',
        signalValueText: 'Remote',
        sourceQualityTier: 2,
        confidence: 'medium',
      },
      {
        id: 'b',
        signalScope: 'offer',
        signalKey: 'work_mode',
        signalValueText: 'Hybrid',
        sourceQualityTier: 1,
        confidence: 'high',
      },
    ]);

    expect(result.resolvedSignals[0].id).toBe('b');
    expect(result.conflictedSignalIds).toHaveLength(1);
    expect(result.conflictedSignalIds[0].id).toBe('a');
  });
});
