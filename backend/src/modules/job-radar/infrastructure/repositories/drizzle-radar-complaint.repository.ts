import { desc, eq } from 'drizzle-orm';
import { jobRadarComplaints } from '../../../../db/schema.js';
import type {
  ComplaintStatus,
  CreateComplaintInput,
  RadarComplaintRepository,
  UpdateComplaintStatusInput,
} from '../../domain/repositories/radar-complaint.repository.js';
import type { JobRadarDb } from '../../job-radar-database.types.js';

export class DrizzleRadarComplaintRepository implements RadarComplaintRepository {
  constructor(private readonly db: JobRadarDb) {}

  async create(input: CreateComplaintInput): Promise<void> {
    await this.db.insert(jobRadarComplaints).values({
      id: input.id,
      reportId: input.reportId,
      scanId: input.scanId,
      findingId: input.findingId ?? null,
      userId: input.userId ?? null,
      employerId: input.employerId ?? null,
      complaintType: input.complaintType as typeof jobRadarComplaints.$inferInsert.complaintType,
      status: 'open',
      message: input.message,
      sourceSnapshot: input.sourceSnapshot ?? null,
      resolutionNote: null,
      reviewedBy: null,
      reviewedAt: null,
    });
  }

  async findById(id: string): Promise<Record<string, unknown> | null> {
    const rows = await this.db
      .select()
      .from(jobRadarComplaints)
      .where(eq(jobRadarComplaints.id, id))
      .limit(1);

    return rows[0] ? { ...rows[0] } : null;
  }

  async findByScanId(scanId: string): Promise<Record<string, unknown>[]> {
    const rows = await this.db
      .select()
      .from(jobRadarComplaints)
      .where(eq(jobRadarComplaints.scanId, scanId))
      .orderBy(desc(jobRadarComplaints.createdAt));
    return rows.map((r) => ({ ...r }));
  }

  async findAllByStatus(status?: ComplaintStatus): Promise<Record<string, unknown>[]> {
    if (status !== undefined) {
      const rows = await this.db
        .select()
        .from(jobRadarComplaints)
        .where(eq(jobRadarComplaints.status, status))
        .orderBy(desc(jobRadarComplaints.createdAt));
      return rows.map((r) => ({ ...r }));
    }

    const rows = await this.db
      .select()
      .from(jobRadarComplaints)
      .orderBy(desc(jobRadarComplaints.createdAt));
    return rows.map((r) => ({ ...r }));
  }

  async updateStatus(input: UpdateComplaintStatusInput): Promise<void> {
    await this.db
      .update(jobRadarComplaints)
      .set({
        status: input.status as typeof jobRadarComplaints.$inferInsert.status,
        resolutionNote: input.resolutionNote ?? null,
        reviewedBy: input.reviewedBy ?? null,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(jobRadarComplaints.id, input.complaintId));
  }
}
