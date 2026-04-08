import { z } from 'zod';
import { publicProcedure, router } from '../trpc.js';

const metricsSchema = z.object({
  answerDurationMs: z.number(),
  speakingPaceWpm: z.number(),
  pauseCount: z.number(),
  fillerWordCount: z.number(),
  eyeContactScore: z.number(),
  frameStabilityScore: z.number(),
  postureScore: z.number(),
  gestureIntensityScore: z.number(),
});

const questionBank: Record<string, string[]> = {
  behavioral: [
    'Tell me about yourself and your recent experience.',
    'Describe a challenging project you worked on.',
    'Tell me about a time you handled conflicting priorities.',
  ],
  technical: [
    'Walk me through a technical decision you made recently.',
    'Describe a production issue you investigated and fixed.',
    'How do you approach performance tuning in a frontend application?',
  ],
  general: [
    'What are you looking for in your next role?',
    'Why does this opportunity interest you?',
    'What strengths would your teammates highlight?',
  ],
};

export const interviewRouter = router({
  startSession: publicProcedure
    .input(z.object({
      userId: z.string().min(1),
      mode: z.string(),
      difficulty: z.string(),
      questionCount: z.number().int().min(1).max(10),
      recruiterPersona: z.string().optional(),
      selectedJobId: z.string().nullable().optional(),
    }))
    .mutation(async ({ input }) => {
      const bank = questionBank[input.mode] ?? questionBank.behavioral;
      const questions = Array.from({ length: input.questionCount }, (_, i) => ({
        id: `q${i + 1}`,
        text: bank[i % bank.length],
      }));
      return { sessionId: crypto.randomUUID(), questions };
    }),

  finishAnswer: publicProcedure
    .input(z.object({
      userId: z.string().min(1),
      sessionId: z.string().min(1),
      questionId: z.string().min(1),
      transcript: z.string(),
      metrics: metricsSchema,
    }))
    .mutation(async ({ input }) => {
      const fillerPenalty = input.metrics.fillerWordCount * 2;
      const paceBonus = (input.metrics.speakingPaceWpm >= 110 && input.metrics.speakingPaceWpm <= 160) ? 4 : 0;
      const score = Math.max(0, Math.min(100, 75 + paceBonus + Math.round(input.metrics.eyeContactScore / 20) - fillerPenalty - input.metrics.pauseCount));
      const comments = input.transcript === 'No transcript available.'
        ? 'Answer recorded but transcript was not captured.'
        : 'Good structure. Sharpen specificity of your examples with more quantified outcomes.';
      return { metrics: input.metrics, feedback: { score, comments } };
    }),
});
