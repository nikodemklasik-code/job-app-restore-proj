import { z } from 'zod';

export const coachEvaluationSchema = z.object({
  score: z.number().int().min(0).max(100),
  label: z.enum(['Excellent', 'Good', 'Developing', 'Needs work']),
  whatWorked: z.array(z.string().trim().min(1).max(300)).max(3),
  toImprove: z.array(z.string().trim().min(1).max(300)).max(3),
  expertInsight: z.string().trim().min(1).max(1000),
  interviewTip: z.string().trim().min(1).max(500),
});

export type CoachEvaluation = z.infer<typeof coachEvaluationSchema>;
