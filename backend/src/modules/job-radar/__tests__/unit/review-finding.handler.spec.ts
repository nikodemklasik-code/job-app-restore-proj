import { describe, it, expect, vi } from 'vitest';
import { ReviewFindingHandler } from '../../application/handlers/review-finding.handler.js';

describe('ReviewFindingHandler', () => {
  it('suppresses finding and resolves complaint when complaintId provided', async () => {
    const findingRepository = {
      updateVisibility: vi.fn().mockResolvedValue(undefined),
    };
    const complaintRepository = {
      updateStatus: vi.fn().mockResolvedValue(undefined),
    };

    const handler = new ReviewFindingHandler(
      findingRepository as never,
      complaintRepository as never,
    );

    await handler.execute({
      reviewerId: 'admin-1',
      complaintId: 'c1',
      findingId: 'f1',
      action: 'suppress',
      note: 'Removed after review',
    });

    expect(findingRepository.updateVisibility).toHaveBeenCalledWith(
      expect.objectContaining({
        findingId: 'f1',
        visibility: 'suppressed',
      }),
    );
    expect(complaintRepository.updateStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        complaintId: 'c1',
        status: 'resolved',
      }),
    );
  });
});
