import { z } from 'zod';

export const assistantActionSuggestionSchema = z.object({
  id: z.string().trim().min(1).max(120),
  label: z.string().trim().min(1).max(200),
  prompt: z.string().trim().min(1).max(1000),
  route: z.string().trim().min(1).max(200).optional(),
  mode: z.enum(['general', 'cv', 'interview', 'salary']).optional(),
  cta: z.string().trim().min(1).max(120).optional(),
  status: z.enum(['Available', 'Recommended', 'Needs Context']).optional(),
});

export const assistantRouteSuggestionSchema = z.object({
  label: z.string().trim().min(1).max(200),
  route: z.string().trim().min(1).max(200),
  reason: z.string().trim().min(1).max(500),
});

export const assistantContextRefSchema = z.object({
  type: z.enum(['profile', 'applications', 'job_radar', 'skills', 'documents', 'assistant']),
  label: z.string().trim().min(1).max(200),
  value: z.string().trim().min(1).max(1000),
});

export const assistantSafetyNoteSchema = z.object({
  level: z.enum(['info', 'warning', 'block']),
  text: z.string().trim().min(1).max(500),
});

export const assistantAiProductMetaSchema = z.object({
  interactionModeLabel: z.string().trim().min(1).max(120),
  estimatedCredits: z.object({
    min: z.number().int().min(0),
    max: z.number().int().min(0),
  }),
  maxApprovedCredits: z.number().int().min(0),
  usesPremiumTier: z.boolean(),
  usesRealtimeVoice: z.boolean(),
  legalSourceRestricted: z.boolean(),
});

export const assistantAiMetaSchema = z.object({
  detectedIntent: z.enum([
    'ask_for_advice',
    'review_answer',
    'rewrite_answer',
    'prepare_for_interview',
    'salary_negotiation',
    'improve_cv',
    'improve_profile',
    'explain_fit',
    'job_search_help',
    'followup_message',
    'skill_verification_request',
    'route_to_module',
  ]),
  suggestedActions: z.array(assistantActionSuggestionSchema).max(10).default([]),
  routeSuggestions: z.array(assistantRouteSuggestionSchema).max(10).default([]),
  contextRefs: z.array(assistantContextRefSchema).max(20).default([]),
  safetyNotes: z.array(assistantSafetyNoteSchema).max(10).default([]),
  nextBestStep: z.string().trim().min(1).max(200).optional(),
  complianceFlags: z.array(z.string().trim().min(1).max(120)).max(20).default([]).optional(),
  aiProductMeta: assistantAiProductMetaSchema.nullable().optional(),
});

export const assistantStructuredResponseSchema = z.object({
  conversation: z.string().trim().min(1).max(12000),
  relevantContext: z.array(assistantContextRefSchema).max(20).default([]),
  suggestedActions: z.array(assistantActionSuggestionSchema).max(10).default([]),
  nextBestStep: z.string().trim().min(1).max(200),
  routeSuggestions: z.array(assistantRouteSuggestionSchema).max(10).default([]),
  safetyNotes: z.array(assistantSafetyNoteSchema).max(10).default([]),
});

export type AssistantAiMeta = z.infer<typeof assistantAiMetaSchema>;
export type AssistantStructuredResponse = z.infer<typeof assistantStructuredResponseSchema>;
