import { describe, it, expect } from 'vitest';
import { SourceDedupService } from '../../application/services/source-dedup.service.js';

describe('SourceDedupService', () => {
  it('clusters sources with same content hash and prefers lower tier', async () => {
    const service = new SourceDedupService();

    const clusters = await service.deduplicate([
      {
        id: 's1',
        contentHash: 'sha256:abc',
        sourceQualityTier: 2,
        collectedAt: new Date('2026-04-15T10:00:00Z'),
      },
      {
        id: 's2',
        contentHash: 'sha256:abc',
        sourceQualityTier: 1,
        collectedAt: new Date('2026-04-15T11:00:00Z'),
      },
    ]);

    expect(clusters).toHaveLength(1);
    expect(clusters[0].primarySourceId).toBe('s2');
    expect(clusters[0].reason).toBe('same_content_hash');
  });
});
