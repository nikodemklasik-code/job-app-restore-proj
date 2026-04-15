import { z } from 'zod';

export const startScanDtoSchema = z
  .object({
    scanTrigger: z.enum(['saved_job', 'manual_search', 'url_input']),
    employerName: z.string().min(1).optional(),
    jobTitle: z.string().optional(),
    location: z.string().optional(),
    sourceUrl: z.string().url().optional(),
    jobPostId: z.string().optional().nullable(),
    forceRescan: z.boolean().optional().default(false),
  })
  .refine((data) => Boolean(data.employerName || data.sourceUrl || data.jobPostId), {
    message: 'At least one of employerName, sourceUrl, or jobPostId is required',
    path: ['employerName'],
  });

export type StartScanDto = z.infer<typeof startScanDtoSchema>;
