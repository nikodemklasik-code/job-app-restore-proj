import { z } from 'zod';

/**
 * OpenAPI `ScanRequest` uses snake_case on the wire. tRPC clients typically send camelCase.
 * We accept either shape and normalize to camelCase before validation.
 */
export function mapJobRadarScanRequestWireToDtoShape(raw: unknown): unknown {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return raw;
  const r = raw as Record<string, unknown>;
  const out: Record<string, unknown> = { ...r };
  const alias = (snake: string, camel: string) => {
    if (out[camel] == null && r[snake] != null) out[camel] = r[snake];
  };
  alias('scan_trigger', 'scanTrigger');
  alias('employer_name', 'employerName');
  alias('job_title', 'jobTitle');
  alias('source_url', 'sourceUrl');
  alias('saved_job_id', 'savedJobId');
  alias('job_post_id', 'jobPostId');
  alias('force_rescan', 'forceRescan');
  return out;
}

const startScanDtoInner = z
  .object({
    scanTrigger: z.enum(['saved_job', 'manual_search', 'url_input']),
    employerName: z.string().min(1).optional(),
    jobTitle: z.string().optional(),
    location: z.string().optional(),
    sourceUrl: z.string().url().optional(),
    savedJobId: z.string().min(1).optional(),
    jobPostId: z.string().min(1).optional().nullable(),
    forceRescan: z.boolean().optional().default(false),
  })
  .refine((data) => Boolean(data.employerName || data.sourceUrl || data.jobPostId || data.savedJobId), {
    message: 'At least one of employerName, sourceUrl, jobPostId, or savedJobId is required (OpenAPI ScanRequest oneOf)',
    path: ['employerName'],
  });

export const startScanDtoSchema = z.preprocess(mapJobRadarScanRequestWireToDtoShape, startScanDtoInner);

export type StartScanDto = z.infer<typeof startScanDtoInner>;
