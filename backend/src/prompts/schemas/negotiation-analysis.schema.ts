import { z } from 'zod';

export const negotiationAnalysisSchema = z.object({
  tacticalScore: z.number().int().min(0).max(10),
  strategyLabel: z.string().trim().min(1).max(120),
  strategicEvidence: z.array(z.string().trim().min(1).max(300)).min(1).max(5),
  strengths: z.array(z.string().trim().min(1).max(300)).max(4),
  risks: z.array(z.string().trim().min(1).max(300)).max(4),
  refinedResponse: z.string().trim().min(1).max(3000),
  nextMove: z.string().trim().min(1).max(800),
  disclaimer: z.string().trim().min(1).max(300),
});

export type NegotiationAnalysis = z.infer<typeof negotiationAnalysisSchema>;
