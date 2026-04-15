import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateComplaintHandler } from '../../application/handlers/create-complaint.handler.js';

describe('CreateComplaintHandler', () => {
  let complaintRepository: { create: ReturnType<typeof vi.fn> };
  let reportRepository: { findById: ReturnType<typeof vi.fn> };
  let scanRepository: { findById: ReturnType<typeof vi.fn> };
  let findingRepository: {
    getByScanId: ReturnType<typeof vi.fn>;
    updateVisibility: ReturnType<typeof vi.fn>;
  };
  let handler: CreateComplaintHandler;

  beforeEach(() => {
    complaintRepository = { create: vi.fn().mockResolvedValue(undefined) };
    reportRepository = {
      findById: vi.fn().mockResolvedValue({ id: 'r1', scanId: 's1' }),
    };
    scanRepository = {
      findById: vi.fn().mockResolvedValue({ id: 's1', userId: 'u1', employerId: null }),
    };
    findingRepository = {
      getByScanId: vi.fn().mockResolvedValue([
        {
          id: 'f1',
          title: 'Salary not listed',
          summary: 'Missing salary',
          severity: 'medium',
          confidence: 'high',
          visibility: 'visible',
        },
      ]),
      updateVisibility: vi.fn().mockResolvedValue(undefined),
    };

    handler = new CreateComplaintHandler(
      complaintRepository as never,
      reportRepository as never,
      scanRepository as never,
      findingRepository as never,
    );
  });

  it('creates complaint and moves harmful finding to pending review', async () => {
    const result = await handler.execute({
      userId: 'u1',
      reportId: 'r1',
      findingId: 'f1',
      complaintType: 'harmful_content',
      message: 'This is inaccurate and harmful for testing purposes.',
    });

    expect(result.status).toBe('open');
    expect(findingRepository.updateVisibility).toHaveBeenCalledWith(
      expect.objectContaining({
        findingId: 'f1',
        visibility: 'pending_review',
      }),
    );
    expect(complaintRepository.create).toHaveBeenCalledTimes(1);
  });
});
