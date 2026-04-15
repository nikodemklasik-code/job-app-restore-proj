import type { RadarComplaintRepository } from '../../domain/repositories/radar-complaint.repository.js';
import type { ComplaintStatus } from '../../domain/repositories/radar-complaint.repository.js';

export class ListComplaintsHandler {
  constructor(private readonly complaintRepository: RadarComplaintRepository) {}

  async execute(input: { scanId?: string; status?: ComplaintStatus }): Promise<Record<string, unknown>[]> {
    if (input.scanId) {
      return this.complaintRepository.findByScanId(input.scanId);
    }

    return this.complaintRepository.findAllByStatus(input.status);
  }
}
