import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { publicProcedure, router } from '../trpc.js';
import { db } from '../../db/index.js';
import { interviewSessions, interviewAnswers, users } from '../../db/schema.js';
import OpenAI from 'openai';

function getOpenAI(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

async function getLocalUserId(clerkId: string): Promise<string | null> {
  const rows = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, clerkId)).limit(1);
  return rows[0]?.id ?? null;
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

      const sessionId = crypto.randomUUID();

      const localUserId = await getLocalUserId(input.userId);
      if (localUserId) {
        await db.insert(interviewSessions).values({
          id: sessionId,
          userId: localUserId,
          mode: input.mode,
          difficulty: input.difficulty,
          status: 'in_progress',
        }).catch(() => { /* non-fatal */ });
      }

      return { sessionId, questions };
    }),

  finishAnswer: publicProcedure
    .input(z.object({
      userId: z.string().min(1),
      sessionId: z.string().min(1),
      questionId: z.string().min(1),
      transcript: z.string(),
      metrics: metricsSchema,
      isLastQuestion: z.boolean().optional(),
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

      // Persist the answer — non-fatal
      await db.insert(interviewAnswers).values({
        id: crypto.randomUUID(),
        sessionId: input.sessionId,
        questionId: input.questionId,
        transcript: input.transcript ?? '',
        metrics: input.metrics,
        feedback: { score, comments },
      }).catch(() => {});

      // If last question, mark session completed
      if (input.isLastQuestion) {
        await db.update(interviewSessions)
          .set({ status: 'completed', score })
          .where(eq(interviewSessions.id, input.sessionId))
          .catch(() => {});
      }

      return { metrics: input.metrics, feedback: { score, comments } };
    }),
});
