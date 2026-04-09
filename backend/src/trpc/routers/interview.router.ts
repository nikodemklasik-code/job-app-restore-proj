import { z } from 'zod';
import { publicProcedure, router } from '../trpc.js';
import OpenAI from 'openai';

function getOpenAI(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

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

      let comments: string;
      if (input.transcript === 'No transcript available.') {
        comments = 'Answer recorded but transcript was not captured.';
      } else {
        let feedbackComment = 'Good structure. Consider adding more specific examples with quantified outcomes.';
        const openai = getOpenAI();
        if (openai && input.transcript && input.transcript.trim().length > 20) {
          try {
            const resp = await openai.chat.completions.create({
              model: 'gpt-4o-mini',
              messages: [{
                role: 'system',
                content: 'You are an interview coach. Give concise (2 sentences max) actionable feedback on this interview answer. Be encouraging but specific.'
              }, {
                role: 'user',
                content: `Question context: ${input.questionId}\nAnswer transcript: ${input.transcript.slice(0, 500)}`
              }],
              max_tokens: 100,
            });
            feedbackComment = resp.choices[0]?.message?.content ?? feedbackComment;
          } catch { /* use default */ }
        }
        comments = feedbackComment;
      }

      return { metrics: input.metrics, feedback: { score, comments } };
    }),
});
