import { randomUUID } from 'crypto';
import { z } from 'zod';
import { eq, desc, and } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure, publicProcedure } from '../trpc.js';
import { db } from '../../db/index.js';
import { interviewSessions, interviewAnswers } from '../../db/schema.js';
import {
  buildInterviewQuestions,
  scoreInterviewAnswer,
  computeSessionScore,
} from '../../services/interview.js';
import { interviewModes, interviewDifficulties } from '../../../../shared/interview.js';

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

export const interviewRouter = router({
  // ── Start a new session ──────────────────────────────────────────────────────
  startSession: protectedProcedure
    .input(
      z.object({
        mode: z.enum(interviewModes),
        difficulty: z.enum(interviewDifficulties),
        questionCount: z.number().int().min(1).max(10).default(3),
        recruiterPersona: z.string().nullable().optional(),
        selectedJobId: z.string().nullable().optional(),
        // publicProcedure fallback field — ignored when protectedProcedure resolves userId
        userId: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;

      const sessionId = randomUUID();
      await db.insert(interviewSessions).values({
        id: sessionId,
        userId,
        mode: input.mode,
        difficulty: input.difficulty,
        status: 'in_progress',
        questionCount: input.questionCount,
        recruiterPersona: input.recruiterPersona ?? null,
        selectedJobId: input.selectedJobId ?? null,
      });

      const questions = buildInterviewQuestions(input.mode, input.questionCount);
      return { sessionId, questions };
    }),

  // ── Save one answer ──────────────────────────────────────────────────────────
  saveAnswer: protectedProcedure
    .input(
      z.object({
        sessionId: z.string().uuid(),
        questionId: z.string(),
        questionText: z.string(),
        transcript: z.string(),
        metrics: metricsSchema,
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;

      const [session] = await db
        .select({ userId: interviewSessions.userId })
        .from(interviewSessions)
        .where(eq(interviewSessions.id, input.sessionId))
        .limit(1);

      if (!session || session.userId !== userId) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      const feedback = scoreInterviewAnswer(input.metrics, input.transcript);
      const answerId = randomUUID();

      await db.insert(interviewAnswers).values({
        id: answerId,
        sessionId: input.sessionId,
        questionId: input.questionId,
        questionText: input.questionText,
        transcript: input.transcript,
        metrics: input.metrics,
        feedback,
      });

      const [answer] = await db
        .select()
        .from(interviewAnswers)
        .where(eq(interviewAnswers.id, answerId))
        .limit(1);

      return {
        answer: {
          id: answer.id,
          sessionId: answer.sessionId,
          questionId: answer.questionId,
          questionText: answer.questionText,
          transcript: answer.transcript,
          metrics: answer.metrics as typeof input.metrics,
          feedback: answer.feedback as { score: number; comments: string },
          createdAt: answer.createdAt.toISOString(),
        },
      };
    }),

  // ── Complete session — compute average score ─────────────────────────────────
  completeSession: protectedProcedure
    .input(
      z.object({
        sessionId: z.string().uuid(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;

      const [session] = await db
        .select({ userId: interviewSessions.userId })
        .from(interviewSessions)
        .where(eq(interviewSessions.id, input.sessionId))
        .limit(1);

      if (!session || session.userId !== userId) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      const answers = await db
        .select({ feedback: interviewAnswers.feedback })
        .from(interviewAnswers)
        .where(eq(interviewAnswers.sessionId, input.sessionId));

      const scores = answers.map((a) => (a.feedback as { score: number }).score);
      const score = computeSessionScore(scores);

      await db
        .update(interviewSessions)
        .set({ status: 'completed', score, updatedAt: new Date() })
        .where(eq(interviewSessions.id, input.sessionId));

      return { sessionId: input.sessionId, status: 'completed' as const, score };
    }),

  // ── Session history for current user ────────────────────────────────────────
  getHistory: protectedProcedure
    .input(z.object({}).optional())
    .query(async ({ ctx }) => {
      const userId = ctx.user.id;

      const sessions = await db
        .select()
        .from(interviewSessions)
        .where(eq(interviewSessions.userId, userId))
        .orderBy(desc(interviewSessions.createdAt))
        .limit(20);

      const result = await Promise.all(
        sessions.map(async (session) => {
          const answers = await db
            .select()
            .from(interviewAnswers)
            .where(eq(interviewAnswers.sessionId, session.id))
            .orderBy(interviewAnswers.createdAt);

          return {
            ...session,
            questionCount: session.questionCount ?? 3,
            recruiterPersona: session.recruiterPersona ?? null,
            selectedJobId: session.selectedJobId ?? null,
            createdAt: session.createdAt.toISOString(),
            updatedAt: session.updatedAt.toISOString(),
            answers: answers.map((a) => ({
              id: a.id,
              sessionId: a.sessionId,
              questionId: a.questionId,
              questionText: a.questionText ?? '',
              transcript: a.transcript,
              metrics: a.metrics as Record<string, number>,
              feedback: a.feedback as { score: number; comments: string },
              createdAt: a.createdAt.toISOString(),
            })),
          };
        }),
      );

      return result;
    }),

  // ── Single session with answers ──────────────────────────────────────────────
  getSession: protectedProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const userId = ctx.user.id;

      const [session] = await db
        .select()
        .from(interviewSessions)
        .where(
          and(
            eq(interviewSessions.id, input.sessionId),
            eq(interviewSessions.userId, userId),
          ),
        )
        .limit(1);

      if (!session) return null;

      const answers = await db
        .select()
        .from(interviewAnswers)
        .where(eq(interviewAnswers.sessionId, session.id));

      return {
        ...session,
        questionCount: session.questionCount ?? 3,
        recruiterPersona: session.recruiterPersona ?? null,
        selectedJobId: session.selectedJobId ?? null,
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString(),
        answers: answers.map((a) => ({
          id: a.id,
          sessionId: a.sessionId,
          questionId: a.questionId,
          questionText: a.questionText ?? '',
          transcript: a.transcript,
          metrics: a.metrics as Record<string, number>,
          feedback: a.feedback as { score: number; comments: string },
          createdAt: a.createdAt.toISOString(),
        })),
      };
    }),

  // ── Save session notes ───────────────────────────────────────────────────────
  saveNotes: protectedProcedure
    .input(z.object({ sessionId: z.string().uuid(), notes: z.string().max(4000) }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;
      const [session] = await db
        .select({ userId: interviewSessions.userId })
        .from(interviewSessions)
        .where(eq(interviewSessions.id, input.sessionId))
        .limit(1);
      if (!session || session.userId !== userId) throw new TRPCError({ code: 'FORBIDDEN' });
      await db
        .update(interviewSessions)
        .set({ notes: input.notes, updatedAt: new Date() })
        .where(eq(interviewSessions.id, input.sessionId));
      return { success: true };
    }),

  // ── Legacy endpoint kept for interviewReadyStore backward compat ─────────────
  finishAnswer: publicProcedure
    .input(
      z.object({
        userId: z.string().min(1),
        sessionId: z.string().min(1),
        questionId: z.string().min(1),
        transcript: z.string(),
        metrics: metricsSchema,
        isLastQuestion: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const feedback = scoreInterviewAnswer(input.metrics, input.transcript);

      await db
        .insert(interviewAnswers)
        .values({
          id: randomUUID(),
          sessionId: input.sessionId,
          questionId: input.questionId,
          questionText: '',
          transcript: input.transcript ?? '',
          metrics: input.metrics,
          feedback,
        })
        .catch(() => {});

      if (input.isLastQuestion) {
        await db
          .update(interviewSessions)
          .set({ status: 'completed', score: feedback.score })
          .where(eq(interviewSessions.id, input.sessionId))
          .catch(() => {});
      }

      return { metrics: input.metrics, feedback };
    }),
});
