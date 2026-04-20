import type { Request, Response } from 'express';
import express from 'express';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { authenticateRequest, getOrCreateAppUser } from '../../../lib/clerk.js';
import { db } from '../../../db/index.js';
import { applications } from '../../../db/schema.js';
import { getJobRadarModule } from '../job-radar.module.js';
import { mapJobRadarScanRequestWireToDtoShape, startScanDtoSchema } from './job-radar.dto.js';
import { JobRadarHttpMapper } from './job-radar.http.mapper.js';

type JobRadarLocals = { jobRadarUserId: string };

function locals(res: Response): JobRadarLocals {
  return res.locals as JobRadarLocals;
}

function readIdempotencyKey(req: Request): string | null {
  const raw = req.get('idempotency-key') ?? req.get('Idempotency-Key');
  return raw?.trim() ? raw.trim() : null;
}

function mapJobRadarHandlerError(err: unknown): { status: number; error_code: string; message: string } {
  if (err instanceof z.ZodError) {
    return { status: 400, error_code: 'VALIDATION_ERROR', message: err.message };
  }
  if (err instanceof Error) {
    const m = err.message;
    if (m === 'SCAN_NOT_FOUND' || m === 'REPORT_NOT_FOUND') {
      return { status: 404, error_code: m, message: m };
    }
    if (m === 'FORBIDDEN' || m === 'TRUST_ACCESS_REQUIRED') {
      return { status: 403, error_code: 'SCAN_QUOTA_EXCEEDED', message: m };
    }
    if (m === 'IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD') {
      return { status: 409, error_code: m, message: m };
    }
  }
  return { status: 500, error_code: 'INTERNAL_SCAN_ERROR', message: 'INTERNAL_SCAN_ERROR' };
}

async function requireJobRadarUser(req: Request, res: Response, next: express.NextFunction) {
  const auth = await authenticateRequest(req);
  if (!auth) {
    res.status(401).json({ error_code: 'UNAUTHORIZED', message: 'Authentication required' });
    return;
  }
  try {
    const user = await getOrCreateAppUser(auth.clerkUserId);
    (res.locals as JobRadarLocals).jobRadarUserId = user.id;
    next();
  } catch {
    res.status(401).json({ error_code: 'UNAUTHORIZED', message: 'Authentication required' });
  }
}

/**
 * OpenAPI v1.1 literal paths under `/job-radar` (mounted at that prefix on the Express app).
 * Behaviour matches `jobRadar` tRPC procedures for the same operations.
 */
export function createJobRadarOpenApiRouter() {
  const router = express.Router();
  router.use(requireJobRadarUser);

  router.post('/scan', async (req, res) => {
    const userId = locals(res).jobRadarUserId;
    const {
      handlers: { startScanHandler },
    } = getJobRadarModule();
    const idempotencyKey = readIdempotencyKey(req);
    try {
      const shaped = mapJobRadarScanRequestWireToDtoShape(req.body);
      const payload = startScanDtoSchema.parse(shaped);
      const result = await startScanHandler.execute({ userId, idempotencyKey, payload });
      res.status(202).json(JobRadarHttpMapper.toScanAcceptedResponse(result));
    } catch (err) {
      const mapped = mapJobRadarHandlerError(err);
      res.status(mapped.status).json({ error_code: mapped.error_code, message: mapped.message });
    }
  });

  router.post('/scan/from-saved-job', async (req, res) => {
    const userId = locals(res).jobRadarUserId;
    const {
      handlers: { startScanHandler },
    } = getJobRadarModule();

    const bodySchema = z.object({
      saved_job_id: z.string().min(1).max(64),
      force_rescan: z.boolean().optional(),
    });
    const parsedBody = bodySchema.safeParse(req.body);
    if (!parsedBody.success) {
      res.status(400).json({ error_code: 'VALIDATION_ERROR', message: parsedBody.error.message });
      return;
    }

    const appRows = await db
      .select()
      .from(applications)
      .where(and(eq(applications.id, parsedBody.data.saved_job_id), eq(applications.userId, userId)))
      .limit(1);
    const app = appRows[0];
    if (!app) {
      res.status(404).json({
        error_code: 'INVALID_SCAN_INPUT',
        message: 'saved_job_id not found for this user',
      });
      return;
    }

    const employerName = app.company?.trim() || app.jobTitle?.trim() || 'Saved application';
    const jobTitle = app.jobTitle?.trim() || undefined;
    const idempotencyKey = readIdempotencyKey(req);

    try {
      const payload = startScanDtoSchema.parse({
        scanTrigger: 'saved_job',
        savedJobId: app.id,
        employerName,
        jobTitle,
        forceRescan: parsedBody.data.force_rescan ?? false,
      });
      const result = await startScanHandler.execute({ userId, idempotencyKey, payload });
      res.status(202).json(JobRadarHttpMapper.toScanAcceptedResponse(result));
    } catch (err) {
      const mapped = mapJobRadarHandlerError(err);
      res.status(mapped.status).json({ error_code: mapped.error_code, message: mapped.message });
    }
  });

  router.get('/scan/:scan_id', async (req, res) => {
    const userId = locals(res).jobRadarUserId;
    const scanId = req.params.scan_id;
    if (!scanId) {
      res.status(400).json({ error_code: 'VALIDATION_ERROR', message: 'Missing scan_id' });
      return;
    }
    const {
      handlers: { getScanStatusHandler },
    } = getJobRadarModule();
    try {
      const scan = await getScanStatusHandler.execute({ userId, scanId });
      res.status(200).json(JobRadarHttpMapper.toScanProgressResponseWire(scan));
    } catch (err) {
      if (err instanceof Error && err.message === 'FORBIDDEN') {
        res.status(404).json({ error_code: 'SCAN_NOT_FOUND', message: 'SCAN_NOT_FOUND' });
        return;
      }
      const mapped = mapJobRadarHandlerError(err);
      const status = mapped.error_code === 'SCAN_NOT_FOUND' ? 404 : mapped.status;
      res.status(status).json({ error_code: mapped.error_code, message: mapped.message });
    }
  });

  router.get('/report/:report_id', async (req, res) => {
    const userId = locals(res).jobRadarUserId;
    const reportId = req.params.report_id;
    if (!reportId) {
      res.status(400).json({ error_code: 'VALIDATION_ERROR', message: 'Missing report_id' });
      return;
    }
    const {
      handlers: { getReportHandler },
    } = getJobRadarModule();
    try {
      const payload = await getReportHandler.execute({ userId, reportId });
      res.status(200).json(payload);
    } catch (err) {
      if (err instanceof Error && err.message === 'FORBIDDEN') {
        res.status(404).json({ error_code: 'REPORT_NOT_FOUND', message: 'REPORT_NOT_FOUND' });
        return;
      }
      const mapped = mapJobRadarHandlerError(err);
      const status = mapped.error_code === 'REPORT_NOT_FOUND' ? 404 : mapped.status;
      res.status(status).json({ error_code: mapped.error_code, message: mapped.message });
    }
  });

  router.post('/report/:report_id/rescan', async (req, res) => {
    const userId = locals(res).jobRadarUserId;
    const reportId = req.params.report_id;
    if (!reportId) {
      res.status(400).json({ error_code: 'VALIDATION_ERROR', message: 'Missing report_id' });
      return;
    }
    const {
      handlers: { startScanHandler },
      repositories: { reportRepository, scanRepository },
    } = getJobRadarModule();
    try {
      const report = await reportRepository.findByIdForUser(reportId, userId);
      if (!report) throw new Error('REPORT_NOT_FOUND');
      const scan = await scanRepository.findById(String(report.scanId));
      if (!scan) throw new Error('SCAN_NOT_FOUND');
      const base = scan.inputPayload as Record<string, unknown>;
      const payload = startScanDtoSchema.parse({ ...base, forceRescan: true });
      const idempotencyKey = readIdempotencyKey(req);
      const result = await startScanHandler.execute({
        userId,
        idempotencyKey,
        payload,
      });
      res.status(202).json(JobRadarHttpMapper.toScanAcceptedResponse(result));
    } catch (err) {
      const mapped = mapJobRadarHandlerError(err);
      const status =
        mapped.error_code === 'REPORT_NOT_FOUND' || mapped.error_code === 'SCAN_NOT_FOUND' ? 404 : mapped.status;
      res.status(status).json({ error_code: mapped.error_code, message: mapped.message });
    }
  });

  router.get('/employers/:employer_id/history', async (req, res) => {
    const userId = locals(res).jobRadarUserId;
    const employerId = req.params.employer_id;
    if (!employerId) {
      res.status(400).json({ error_code: 'VALIDATION_ERROR', message: 'Missing employer_id' });
      return;
    }
    const limitRaw = req.query.limit;
    const limit =
      typeof limitRaw === 'string' && /^\d+$/.test(limitRaw)
        ? Math.min(50, Math.max(1, Number.parseInt(limitRaw, 10)))
        : 24;

    const {
      repositories: { reportRepository },
    } = getJobRadarModule();
    const history = await reportRepository.listEmployerHistoryForUser(userId, employerId, limit);
    res.status(200).json({
      employer_id: employerId,
      history: history.map((h) => ({
        report_id: h.reportId,
        created_at: h.createdAt ? h.createdAt.toISOString() : null,
        employer_score: h.employerScore,
        offer_score: h.offerScore,
        risk_score: h.riskScore,
      })),
    });
  });

  return router;
}
