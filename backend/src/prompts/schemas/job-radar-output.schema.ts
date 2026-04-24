import { z } from 'zod';

export const jobRadarScanAcceptedSchema = z.object({
  scan_id: z.string().trim().min(1).max(120),
  status: z.string().trim().min(1).max(120),
  quota_remaining: z.number().int().min(0),
  idempotency_reused: z.boolean(),
  report_id: z.string().trim().min(1).max(120).optional(),
  estimated_report_type: z.enum(['full', 'partial', 'unknown']).optional(),
});

export const jobRadarProgressStageStateSchema = z.enum(['pending', 'processing', 'done', 'partial', 'blocked', 'failed']);

export const jobRadarScanProgressSchema = z.object({
  input_normalization: jobRadarProgressStageStateSchema,
  employer_resolution: jobRadarProgressStageStateSchema,
  source_collection: jobRadarProgressStageStateSchema,
  offer_parsing: jobRadarProgressStageStateSchema,
  benchmarking: jobRadarProgressStageStateSchema,
  fit_scoring: jobRadarProgressStageStateSchema,
  report_generation: jobRadarProgressStageStateSchema,
});

export const jobRadarScanStatusSchema = z.object({
  scan_id: z.string().trim().min(1).max(120),
  status: z.string().trim().min(1).max(120),
  scan_trigger: z.string().trim().min(1).max(120),
  fingerprint: z.string().trim().min(1).max(255),
  progress: jobRadarScanProgressSchema,
  started_at: z.string().trim().min(1).max(120),
  last_updated_at: z.string().trim().min(1).max(120),
  partial_report_id: z.string().trim().min(1).max(120).nullable(),
  failed_reason: z.string().trim().min(1).max(1000).nullable(),
});

export const jobRadarEmployerHistoryItemSchema = z.object({
  report_id: z.string().trim().min(1).max(120),
  created_at: z.string().trim().min(1).max(120).nullable(),
  employer_score: z.number().nullable(),
  offer_score: z.number().nullable(),
  risk_score: z.number().nullable(),
});

export const jobRadarEmployerHistorySchema = z.object({
  employerId: z.string().trim().min(1).max(120),
  history: z.array(jobRadarEmployerHistoryItemSchema).max(50),
});
