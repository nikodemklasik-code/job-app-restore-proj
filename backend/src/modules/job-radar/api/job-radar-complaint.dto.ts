import { z } from 'zod';

export const createComplaintDtoSchema = z.object({
  reportId: z.string().min(1),
  findingId: z.string().optional().nullable(),
  complaintType: z.enum([
    'factual_inaccuracy',
    'outdated_information',
    'harmful_content',
    'legal_notice',
  ]),
  message: z.string().min(10).max(5000),
});

export type CreateComplaintDto = z.infer<typeof createComplaintDtoSchema>;

export const reviewFindingDtoSchema = z.object({
  complaintId: z.string().optional().nullable(),
  findingId: z.string().min(1),
  action: z.enum(['approve_visible', 'keep_pending', 'suppress']),
  note: z.string().max(2000).optional().nullable(),
});

export const updateKillSwitchDtoSchema = z.object({
  disableAllReports: z.boolean().optional(),
  disableReputationFindings: z.boolean().optional(),
  disableSevereRegistryAlerts: z.boolean().optional(),
});
