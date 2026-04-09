import { z } from 'zod';
import { publicProcedure, router } from '../trpc.js';
import { generateCareerResponse } from '../../services/openai.js';

export const assistantRouter = router({
  sendMessage: publicProcedure
    .input(z.object({
      text: z.string().min(1).max(4000),
      mode: z.string().default('general'),
      jobId: z.string().nullable().optional(),
      history: z
        .array(
          z.object({
            role: z.enum(['user', 'assistant']),
            content: z.string().max(12000),
          }),
        )
        .max(30)
        .optional(),
    }))
    .mutation(async ({ input }) => {
      const text = await generateCareerResponse(input.text, input.mode, input.history);
      return {
        id: crypto.randomUUID(),
        role: 'assistant' as const,
        type: 'text' as const,
        text,
        createdAt: new Date().toISOString(),
      };
    }),
});
