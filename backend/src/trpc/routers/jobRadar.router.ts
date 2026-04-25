import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import { router, protectedProcedure } from '../trpc.js';
import { db } from '../../db/index.js';
import { applications } from '../../db/schema.js';
import { getJobRadarModule } from '../../modules/job-radar/job-radar.module.js';
import { startScanDtoSchema } from '../../modules/job-radar/api/job-radar.dto.js';
import {
  createComplaintDtoSchema,
  reviewFindingDtoSchema,
  updateKillSwitchDtoSchema,
} from '../../modules/job-radar/api/job-radar-complaint.dto.js';
import { JobRadarHttpMapper } from '../../modules/job-radar/api/job-radar.http.mapper.js';
import {
  jobRadarEmployerHistorySchema,
  jobRadarScanAcceptedSchema,
  jobRadarScanStatusSchema,
} from '../../prompts/schemas/job-radar-output.schema.js';
import { checkAiProfileGate } from '../../services/profileCompletionGate.service.js';

function isTrustReviewer(userId: string): boolean {
  const raw = process.env.JOB_RADAR_TRUST_REVIEWER_USER_IDS ?? '';
  const ids = raw.split(',').map((s) => s.trim()).filter(Boolean);
  return ids.length > 0 && ids.includes(userId);
}

const trustProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!isTrustReviewer(ctx.user.id)) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'TRUST_ACCESS_REQUIRED' });
  }
  return next({ ctx });
});

function mapHandlerError(err: unknown): never {
  if (err instanceof Error) {
    if (
      err.message === 'SCAN_NOT_FOUND' ||
      err.message === 'REPORT_NOT_FOUND' ||
      err.message === 'FINDING_NOT_FOUND' ||
      err.message === 'COMPLAINT_NOT_FOUND'
    ) {
      throw new TRPCError({ code: 'NOT_FOUND', message: err.message });
    }
    if (err.message === 'FORBIDDEN' || err.message === 'TRUST_ACCESS_REQUIRED') {
      throw new TRPCError({ code: 'FORBIDDEN', message: err.message });
    }
    if (err.message === 'IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD') {
      throw new TRPCError({ code: 'CONFLICT', message: err.message });
    }
  }
  if (err instanceof TRPCError) throw err;
  throw err instanceof Error ? err : new Error(String(err));
}

export const jobRadarRouter = router({
  /**
   * OpenAPI `POST /job-radar/scan/from-saved-job` intent: start a scan from a user’s saved application row.
   */
  startScanFromSavedJob: protectedProcedure
    .input(
      z.object({
        applicationId: z.string().min(1).max(36),
        forceRescan: z.boolean().optional().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const profileGate = await checkAiProfileGate(ctx.user);
      if (!profileGate.allowed) return profileGate.incompleteProfile;

      const {
        handlers: { startScanHandler },
      } = getJobRadarModule();

      const appRows = await db
        .select()
        .from(applications)
        .where(and(eq(applications.id, input.applicationId), eq(applications.userId, ctx.user.id)))
        .limit(1);

      const app = appRows[0];
      if (!app) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'APPLICATION_NOT_FOUND' });
      }

      const employerName = app.company?.trim() || app.jobTitle?.trim() || 'Saved application';
      const jobTitle = app.jobTitle?.trim() || undefined;

      const payload = startScanDtoSchema.parse({
        scanTrigger: 'saved_job',
        savedJobId: app.id,
        employerName,
        jobTitle,
        forceRescan: input.forceRescan,
      });

      const idempotencyKey = ctx.req.get('idempotency-key') ?? ctx.req.get('Idempotency-Key') ?? null;

      try {
        const result = await startScanHandler.execute({
          userId: ctx.user.id,
          idempotencyKey,
          payload,
        });
        return jobRadarScanAcceptedSchema.parse(JobRadarHttpMapper.toScanAcceptedResponse(result));
      } catch (err) {
        mapHandlerError(err);
      }
    }),

  /**
   * OpenAPI `GET /job-radar/employers/{employer_id}/history` intent: prior reports for the same stable employer id.
   */
  getEmployerHistory: protectedProcedure
    .input(
      z.object({
        employerId: z.string().min(4).max(40),
        limit: z.number().int().min(1).max(50).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const {
        repositories: { reportRepository },
      } = getJobRadarModule();
      const history = await reportRepository.listEmployerHistoryForUser(
        ctx.user.id,
        input.employerId,
        input.limit ?? 24,
      );
      return jobRadarEmployerHistorySchema.parse({
        employerId: input.employerId,
        history: history.map((h) => ({
          report_id: h.reportId,
          created_at: h.createdAt ? h.createdAt.toISOString() : null,
          employer_score: h.employerScore,
          offer_score: h.offerScore,
          risk_score: h.riskScore,
        })),
      });
    }),

  rescanReport: protectedProcedure.input(z.object({ reportId: z.string().min(1) })).mutation(async ({ ctx, input }) => {
    const profileGate = await checkAiProfileGate(ctx.user);
    if (!profileGate.allowed) return profileGate.incompleteProfile;

    const {
      handlers: { startScanHandler },
      repositories: { reportRepository, scanRepository },
    } = getJobRadarModule();

    try {
      const report = await reportRepository.findByIdForUser(input.reportId, ctx.user.id);
      if (!report) throw new Error('REPORT_NOT_FOUND');

      const scan = await scanRepository.findById(String(report.scanId));
      if (!scan) throw new Error('SCAN_NOT_FOUND');

      const base = scan.inputPayload as Record<string, unknown>;
      const payload = startScanDtoSchema.parse({ ...base, forceRescan: true });
      const idempotencyKey = ctx.req.get('idempotency-key') ?? ctx.req.get('Idempotency-Key') ?? null;

      const result = await startScanHandler.execute({
        userId: ctx.user.id,
        idempotencyKey,
        payload,
      });
      return jobRadarScanAcceptedSchema.parse(JobRadarHttpMapper.toScanAcceptedResponse(result));
    } catch (err) {
      mapHandlerError(err);
    }
  }),

  startScan: protectedProcedure.input(startScanDtoSchema).mutation(async ({ ctx, input }) => {
    const profileGate = await checkAiProfileGate(ctx.user);
    if (!profileGate.allowed) return profileGate.incompleteProfile;

    const {
      handlers: { startScanHandler },
    } = getJobRadarModule();
    const idempotencyKey = ctx.req.get('idempotency-key') ?? ctx.req.get('Idempotency-Key') ?? null;

    try {
      const result = await startScanHandler.execute({
        userId: ctx.user.id,
        idempotencyKey,
        payload: input,
      });
      return jobRadarScanAcceptedSchema.parse(JobRadarHttpMapper.toScanAcceptedResponse(result));
    } catch (err) {
      mapHandlerError(err);
    }
  }),

  getScanStatus: protectedProcedure
    .input(z.object({ scanId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const {
        handlers: { getScanStatusHandler },
      } = getJobRadarModule();
      try {
        const scan = await getScanStatusHandler.execute({
          userId: ctx.user.id,
          scanId: input.scanId,
        });
        return jobRadarScanStatusSchema.parse(JobRadarHttpMapper.toScanProgressResponseWire(scan));
      } catch (err) {
        mapHandlerError(err);
      }
    }),

  getReport: protectedProcedure
    .input(z.object({ reportId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const {
        handlers: { getReportHandler },
      } = getJobRadarModule();
      try {
        return await getReportHandler.execute({
          userId: ctx.user.id,
          reportId: input.reportId,
        });
      } catch (err) {
        mapHandlerError(err);
      }
    }),

  listMyReports: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(50).optional() }).optional())
    .query(async ({ ctx, input }) => {
      const {
        repositories: { reportRepository },
      } = getJobRadarModule();
      const limit = input?.limit ?? 12;
      return reportRepository.listRecentForUser(ctx.user.id, limit);
    }),

  createComplaint: protectedProcedure.input(createComplaintDtoSchema).mutation(async ({ ctx, input }) => {
    const {
      handlers: { createComplaintHandler },
    } = getJobRadarModule();
    try {
      return await createComplaintHandler.execute({
        userId: ctx.user.id,
        reportId: input.reportId,
        findingId: input.findingId ?? null,
        complaintType: input.complaintType,
        message: input.message,
      });
    } catch (err) {
      mapHandlerError(err);
    }
  }),

  adminListComplaints: trustProcedure
    .input(
      z.object({
        status: z.enum(['open', 'under_review', 'resolved', 'rejected']).optional(),
        scanId: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      const {
        handlers: { listComplaintsHandler },
      } = getJobRadarModule();
      try {
        const items = await listComplaintsHandler.execute({
          status: input.status,
          scanId: input.scanId,
        });
        return { items };
      } catch (err) {
        mapHandlerError(err);
      }
    }),

  adminGetComplaint: trustProcedure
    .input(z.object({ complaintId: z.string().min(1) }))
    .query(async ({ input }) => {
      const {
        repositories: { complaintRepository },
      } = getJobRadarModule();
      const row = await complaintRepository.findById(input.complaintId);
      if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'COMPLAINT_NOT_FOUND' });
      return row;
    }),

  adminReviewFinding: trustProcedure.input(reviewFindingDtoSchema).mutation(async ({ ctx, input }) => {
    const {
      handlers: { reviewFindingHandler },
    } = getJobRadarModule();
    try {
      return await reviewFindingHandler.execute({
        reviewerId: ctx.user.id,
        complaintId: input.complaintId ?? null,
        findingId: input.findingId,
        action: input.action,
        note: input.note ?? null,
      });
    } catch (err) {
      mapHandlerError(err);
    }
  }),

  adminUpdateKillSwitch: trustProcedure.input(updateKillSwitchDtoSchema).mutation(async ({ input }) => {
    const {
      handlers: { updateKillSwitchHandler },
    } = getJobRadarModule();
    return updateKillSwitchHandler.execute({
      disableAllReports: input.disableAllReports,
      disableReputationFindings: input.disableReputationFindings,
      disableSevereRegistryAlerts: input.disableSevereRegistryAlerts,
    });
  }),
});
