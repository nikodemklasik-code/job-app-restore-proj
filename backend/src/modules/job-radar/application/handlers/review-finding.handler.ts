import type { RadarFindingRepository } from '../../domain/repositories/radar-finding.repository.js';
import type { RadarComplaintRepository } from '../../domain/repositories/radar-complaint.repository.js';

export class ReviewFindingHandler {
  constructor(
    private readonly findingRepository: RadarFindingRepository,
    private readonly complaintRepository: RadarComplaintRepository,
  ) {}

  async execute(input: {
    reviewerId: string;
    complaintId?: string | null;
    findingId: string;
    action: 'approve_visible' | 'keep_pending' | 'suppress';
    note?: string | null;
  }): Promise<{ ok: true }> {
    if (input.action === 'approve_visible') {
      await this.findingRepository.updateVisibility({
        findingId: input.findingId,
        visibility: 'visible',
        reviewReason: input.note ?? 'Approved after review',
        reviewedBy: input.reviewerId,
      });
    }

    if (input.action === 'keep_pending') {
      await this.findingRepository.updateVisibility({
        findingId: input.findingId,
        visibility: 'pending_review',
        reviewReason: input.note ?? 'Pending additional review',
        reviewedBy: input.reviewerId,
      });
    }

    if (input.action === 'suppress') {
      await this.findingRepository.updateVisibility({
        findingId: input.findingId,
        visibility: 'suppressed',
        reviewReason: input.note ?? 'Suppressed after review',
        reviewedBy: input.reviewerId,
      });
    }

    if (input.complaintId) {
      await this.complaintRepository.updateStatus({
        complaintId: input.complaintId,
        status: 'resolved',
        resolutionNote: input.note ?? input.action,
        reviewedBy: input.reviewerId,
      });
    }

    return { ok: true };
  }
}
