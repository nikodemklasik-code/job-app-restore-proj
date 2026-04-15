export type ComplaintStatus = 'open' | 'under_review' | 'resolved' | 'rejected';
export type ComplaintType =
  | 'factual_inaccuracy'
  | 'outdated_information'
  | 'harmful_content'
  | 'legal_notice';

export type CreateComplaintInput = {
  id: string;
  reportId: string;
  scanId: string;
  findingId?: string | null;
  userId?: string | null;
  employerId?: string | null;
  complaintType: ComplaintType;
  message: string;
  sourceSnapshot?: Record<string, unknown> | null;
};

export type UpdateComplaintStatusInput = {
  complaintId: string;
  status: ComplaintStatus;
  resolutionNote?: string | null;
  reviewedBy?: string | null;
};

export interface RadarComplaintRepository {
  create(input: CreateComplaintInput): Promise<void>;
  findById(id: string): Promise<Record<string, unknown> | null>;
  findByScanId(scanId: string): Promise<Record<string, unknown>[]>;
  findAllByStatus(status?: ComplaintStatus): Promise<Record<string, unknown>[]>;
  updateStatus(input: UpdateComplaintStatusInput): Promise<void>;
}
