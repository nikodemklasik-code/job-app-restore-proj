import { z } from 'zod';

export const assistantSafetyNoteSchema = z.object({
  level: z.string().trim().min(1).max(32),
  text: z.string().trim().min(1).max(500),
});

export const assistantAiProductMetaSchema = z.object({
  productArea: z.string().trim().min(1).max(120).optional(),
  activeModule: z.string().trim().min(1).max(120).optional(),
  recommendedDepth: z.string().trim().min(1).max(120).optional(),
}).passthrough();

export const assistantAiMetaSchema = z.object({
  detectedIntent: z.string().trim().min(1).max(120),
  suggestedActions: z.array(z.string().trim().min(1).max(200)).max(10).default([]),
  routeSuggestions: z.array(z.string().trim().min(1).max(120)).max(10).default([]),
  contextRefs: z.array(z.string().trim().min(1).max(200)).max(20).default([]),
  safetyNotes: z.array(assistantSafetyNoteSchema).max(10).default([]),
  nextBestStep: z.string().trim().min(1).max(200),
  complianceFlags: z.array(z.string().trim().min(1).max(120)).max(20).default([]),
  aiProductMeta: assistantAiProductMetaSchema.default({}),
});

export const assistantStructuredResponseSchema = z.object({
  conversation: z.string().trim().min(1).max(12000),
  relevantContext: z.array(z.string().trim().min(1).max(200)).max(20).default([]),
  suggestedActions: z.array(z.string().trim().min(1).max(200)).max(10).default([]),
  nextBestStep: z.string().trim().min(1).max(200),
  routeSuggestions: z.array(z.string().trim().min(1).max(120)).max(10).default([]),
  safetyNotes: z.array(assistantSafetyNoteSchema).max(10).default([]),
});

export type AssistantAiMeta = z.infer<typeof assistantAiMetaSchema>;
export type AssistantStructuredResponse = z.infer<typeof assistantStructuredResponseSchema>;
