import { randomUUID } from 'crypto';
import { z } from 'zod';
import { eq, desc, and } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure, publicProcedure } from '../trpc.js';
import { db } from '../../db/index.js';
import {
  interviewSessions,
  interviewAnswers,
  creditSpendEvents,
  users,
} from '../../db/schema.js';
import {
  buildInterviewQuestions,
  scoreInterviewAnswer,
  computeSessionScore,
} from '../../services/interview.js';
import {
  interviewModes,
  interviewDifficulties,
  type InterviewMode,
} from '../../../../shared/interview.js';
import { approveSpend, commitSpend, rejectSpend, BillingError } from '../../services/creditsBilling.js';
import { FEATURE_COSTS, isKnownFeature, type FeatureKey } from '../../services/creditsConfig.js';
import { checkAiProfileGate } from '../../services/profileCompletionGate.service.js';
import { billingToTrpc } from './_shared.js';

function legacyInterviewFeatureForMode(mode: InterviewMode): FeatureKey {
  if (mode === 'case-study') return 'interview_deep';
  if (mode === 'behavioral' || mode === 'technical') return 'interview_standard';
  return 'interview_lite';
}

async function findApprovedLegacyInterviewSpend(
  clerkId: string,
  sessionId: string,
): Promise<{ id: string; feature: string } | null> {
  const [row] = await db
    .select({ id: creditSpendEvents.id, feature: creditSpendEvents.feature })
    .from(creditSpendEvents)
    .innerJoin(users, eq(users.id, creditSpendEvents.userId))
    .where(
      and(
        eq(users.clerkId, clerkId),
        eq(creditSpendEvents.referenceId, sessionId),
        eq(creditSpendEvents.status, 'approved'),
        eq(creditSpendEvents.kind, 'estimated'),
      ),
    )
    .limit(1);
  return row ?? null;
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
      const profileGate = await checkAiProfileGate(ctx.user);
      if (!profileGate.allowed) return profileGate.incompleteProfile;

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

      let approvedSpendEventId: string | undefined;
      try {
        const approval = await approveSpend({
          clerkId: ctx.user.clerkId,
          feature: legacyInterviewFeatureForMode(input.mode),
          referenceId: sessionId,
          notes: `Legacy interview start · ${input.mode}`,
        });
        approvedSpendEventId = approval.spendEventId;
      } catch (e) {
        await db.delete(interviewSessions).where(eq(interviewSessions.id, sessionId));
        if (e instanceof BillingError) billingToTrpc(e);
        throw e;
      }

      try {
        const questions = buildInterviewQuestions(input.mode, input.questionCount);
        return { status: 'ok' as const, sessionId, questions, profileSnapshot: profileGate.profileSnapshot };
      } catch (e) {
        if (approvedSpendEventId) {
          try {
            await rejectSpend({
              clerkId: ctx.user.clerkId,
              spendEventId: approvedSpendEventId,
              reason: 'legacy_interview_start_post_approve_failed',
            });
          } catch {
            /* best-effort */
          }
        }
        await db.delete(interviewSessions).where(eq(interviewSessions.id, sessionId));
        throw e;
      }
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
        .select({
          userId: interviewSessions.userId,
          status: interviewSessions.status,
          score: interviewSessions.score,
        })
        .from(interviewSessions)
        .where(eq(interviewSessions.id, input.sessionId))
        .limit(1);

      if (!session || session.userId !== userId) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      if (session.status === 'completed') {
        return {
          sessionId: input.sessionId,
          status: 'completed' as const,
          score: session.score ?? 0,
        };
      }

      const answers = await db
        .select({ feedback: interviewAnswers.feedback })
        .from(interviewAnswers)
        .where(eq(interviewAnswers.sessionId, input.sessionId));

      const scores = answers.map((a) => (a.feedback as { score: number }).score);
      const score = computeSessionScore(scores);

      const pendingSpend = await findApprovedLegacyInterviewSpend(ctx.user.clerkId, input.sessionId);
      if (pendingSpend) {
        const fk: FeatureKey =
          pendingSpend.feature && isKnownFeature(pendingSpend.feature)
            ? (pendingSpend.feature as FeatureKey)
            : 'interview_lite';
        const cfg = FEATURE_COSTS[fk];
        const actualCost = cfg.kind === 'estimated' ? cfg.minCost : cfg.cost;
        try {
          await commitSpend({
            clerkId: ctx.user.clerkId,
            spendEventId: pendingSpend.id,
            actualCost,
            notes: 'Legacy interview session completed',
          });
        } catch (e) {
          if (e instanceof BillingError) billingToTrpc(e);
          throw e;
        }
      }

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

  // ── Download interview progress credential PDF ────────────────────────────
  downloadCredential: protectedProcedure
    .input(
      z.object({
        sessionId: z.string().uuid(),
        growthAreas: z.array(z.string().max(200)).max(3),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;

      const [session] = await db
        .select()
        .from(interviewSessions)
        .where(and(eq(interviewSessions.id, input.sessionId), eq(interviewSessions.userId, userId)))
        .limit(1);

      if (!session) throw new TRPCError({ code: 'NOT_FOUND', message: 'Session not found' });

      const { profiles } = await import('../../db/schema.js');
      const { users } = await import('../../db/schema.js');
      const [profile] = await db
        .select({ fullName: profiles.fullName })
        .from(profiles)
        .innerJoin(users, eq(users.id, profiles.userId))
        .where(eq(users.id, userId))
        .limit(1);

      const modeLabelMap: Record<string, string> = {
        behavioral: 'Behavioral',
        technical: 'Technical',
        general: 'General HR',
        hr: 'HR Screen',
        'case-study': 'Case Study',
        'language-check': 'Language Check',
      };

      const { generateInterviewCredentialPdf } = await import('../../services/pdfGenerator.js');
      const buf = await generateInterviewCredentialPdf({
        candidateName: profile?.fullName ?? 'Candidate',
        mode: modeLabelMap[session.mode] ?? session.mode,
        date: new Date(session.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
        score: session.score ?? 0,
        questionCount: session.questionCount ?? 0,
        growthAreas: input.growthAreas,
        sessionId: session.id,
      });

      return { base64: buf.toString('base64'), filename: `interview-credential-${session.id.slice(0, 8)}.pdf` };
    }),
});
