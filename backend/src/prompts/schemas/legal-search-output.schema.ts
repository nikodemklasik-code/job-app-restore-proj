import { z } from 'zod';

export const legalSearchScopeSummarySchema = z.object({
  coreSourceCount: z.number().int().min(0),
  optionalEnabledCount: z.number().int().min(0),
  scopeLabel: z.string().trim().min(1).max(1000),
  vectorRetrievalMode: z.enum(['none', 'configured']),
});

export const legalSearchHitSchema = z.object({
  title: z.string().trim().min(1).max(300),
  url: z.string().trim().min(1).max(2000),
  tier: z.enum(['core', 'optional']),
  snippet: z.string().trim().min(1).max(2000),
  score: z.number().min(0),
});

export const legalGroundedSummarySchema = z.object({
  summary: z.string().trim().min(1).max(5000),
  grounded: z.boolean().optional(),
  citations: z.array(z.string().trim().min(1).max(500)).max(20).optional(),
}).passthrough();

export const legalSearchResponseSchema = z.object({
  scope: legalSearchScopeSummarySchema,
  hits: z.array(legalSearchHitSchema).max(20),
  groundedSummary: legalGroundedSummarySchema.nullable(),
});

export const legalSearchPdfExportSchema = z.object({
  mimeType: z.literal('application/pdf'),
  filename: z.string().trim().min(1).max(255),
  base64: z.string().trim().min(1),
  spendEventId: z.string().trim().min(1),
  balances: z.object({
    plan: z.string().trim().min(1).max(120),
    credits: z.number().int().min(0),
    allowanceRemaining: z.number().int().min(0),
    allowanceLimit: z.number().int().min(0),
    spendableTotal: z.number().int().min(0),
  }).optional(),
});
