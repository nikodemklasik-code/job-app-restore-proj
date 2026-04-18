import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { router, protectedProcedure } from '../trpc.js';
import {
  createSession,
  startSession,
  processTurn,
  completeSession,
  abandonSession,
  getSession,
  InterviewStatus,
} from '../../services/liveInterviewEngine.js';
import { db } from '../../db/index.js';
import { creditSpendEvents, liveInterviewSessions, liveInterviewTurns } from '../../db/schema.js';
import { approveSpend, commitSpend, rejectSpend, BillingError } from '../../services/creditsBilling.js';
import { FEATURE_COSTS, isKnownFeature, type FeatureKey } from '../../services/creditsConfig.js';
import { billingToTrpc } from './_shared.js';

const roleContextSchema = z.object({
  targetRole: z.string().min(1).max(200),
  company: z.string().max(200).optional(),
  seniority: z.string().max(100).optional(),
  description: z.string().max(1000).optional(),
});

const liveInterviewModeZod = z.enum([
  'behavioral',
  'technical',
  'general',
  'hr',
  'case-study',
  'language-check',
]);

function liveInterviewFeatureForMode(
  mode: z.infer<typeof liveInterviewModeZod>,
): FeatureKey {
  if (mode === 'case-study') return 'interview_deep';
  if (mode === 'behavioral' || mode === 'technical') return 'interview_standard';
  return 'interview_lite';
}

async function rollbackLiveInterviewSession(sessionId: string): Promise<void> {
  await db.delete(liveInterviewTurns).where(eq(liveInterviewTurns.sessionId, sessionId));
  await db.delete(liveInterviewSessions).where(eq(liveInterviewSessions.id, sessionId));
}

async function clearPendingSpendRow(sessionId: string): Promise<void> {
  await db
    .update(liveInterviewSessions)
    .set({ pendingCreditSpendEventId: null })
    .where(eq(liveInterviewSessions.id, sessionId));
}

async function commitOrRejectLiveInterviewSpend(
  clerkId: string,
  sessionId: string,
  outcome: 'commit' | 'reject',
  rejectReason?: string,
): Promise<void> {
  const [row] = await db
    .select({ pending: liveInterviewSessions.pendingCreditSpendEventId })
    .from(liveInterviewSessions)
    .where(eq(liveInterviewSessions.id, sessionId))
    .limit(1);
  const pending = row?.pending;
  if (!pending) return;

  if (outcome === 'reject') {
    try {
      await rejectSpend({
        clerkId,
        spendEventId: pending,
        reason: rejectReason ?? 'live_interview_abandoned',
      });
    } catch {
      /* best-effort */
    }
    await clearPendingSpendRow(sessionId);
    return;
  }

  const [ev] = await db
    .select({ feature: creditSpendEvents.feature })
    .from(creditSpendEvents)
    .where(eq(creditSpendEvents.id, pending))
    .limit(1);
  const fk: FeatureKey =
    ev?.feature && isKnownFeature(ev.feature) ? (ev.feature as FeatureKey) : 'interview_lite';
  const cfg = FEATURE_COSTS[fk];
  const actualCost = cfg.kind === 'estimated' ? cfg.minCost : cfg.cost;

  try {
    await commitSpend({
      clerkId,
      spendEventId: pending,
      actualCost,
      notes: 'Live interview session completed',
    });
    await clearPendingSpendRow(sessionId);
  } catch (e) {
    try {
      await rejectSpend({
        clerkId,
        spendEventId: pending,
        reason: e instanceof Error ? e.message : 'commit_failed',
      });
    } catch {
      /* best-effort */
    }
    await clearPendingSpendRow(sessionId);
    if (e instanceof BillingError) billingToTrpc(e);
    throw e;
  }
}

export const liveInterviewRouter = router({
  // ── Create session ───────────────────────────────────────────────────────────
  createSession: protectedProcedure
    .input(
      z.object({
        mode: liveInterviewModeZod,
        roleContext: roleContextSchema,
        config: z
          .object({
            maxTurns: z.number().int().min(4).max(30).optional(),
          })
          .optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;
      const session = await createSession(userId, input.mode, input.roleContext, {
        maxTurns: input.config?.maxTurns,
      });
      let approvedSpendEventId: string | undefined;
      try {
        const approval = await approveSpend({
          clerkId: ctx.user.clerkId,
          feature: liveInterviewFeatureForMode(input.mode),
          referenceId: session.id,
          notes: `Live interview create · ${input.mode}`,
        });
        approvedSpendEventId = approval.spendEventId;
        await db
          .update(liveInterviewSessions)
          .set({ pendingCreditSpendEventId: approval.spendEventId })
          .where(eq(liveInterviewSessions.id, session.id));
      } catch (e) {
        if (approvedSpendEventId) {
          try {
            await rejectSpend({
              clerkId: ctx.user.clerkId,
              spendEventId: approvedSpendEventId,
              reason: 'pending_row_write_failed',
            });
          } catch {
            /* best-effort — avoid stranded approved row (QC finding 2026-04-21) */
          }
        }
        await rollbackLiveInterviewSession(session.id);
        if (e instanceof BillingError) billingToTrpc(e);
        throw e;
      }
      return {
        sessionId: session.id,
        status: session.status,
        stage: session.stage,
      };
    }),

  // ── Start session (generates opening message) ────────────────────────────────
  startSession: protectedProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;
      const existing = await getSession(input.sessionId);
      if (!existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'Session not found' });
      if (existing.userId !== userId) throw new TRPCError({ code: 'FORBIDDEN' });

      try {
        const { assistantMessage, session } = await startSession(input.sessionId);
        return {
          sessionId: session.id,
          status: session.status,
          stage: session.stage,
          assistantMessage,
        };
      } catch (err) {
        const code = err instanceof Error ? err.message : '';
        if (code === 'SESSION_ALREADY_STARTED') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Session already started' });
        }
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to start session' });
      }
    }),

  // ── Respond (process one candidate turn) ─────────────────────────────────────
  respond: protectedProcedure
    .input(
      z.object({
        sessionId: z.string().uuid(),
        userMessage: z.string().min(1).max(4000),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;
      const session = await getSession(input.sessionId);
      if (!session) throw new TRPCError({ code: 'NOT_FOUND', message: 'Session not found' });
      if (session.userId !== userId) throw new TRPCError({ code: 'FORBIDDEN' });
      if (session.status !== InterviewStatus.ACTIVE) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Session is not active' });
      }

      try {
        const result = await processTurn(input.sessionId, input.userMessage);
        return {
          sessionId: input.sessionId,
          assistantMessage: result.assistantMessage,
          nextAction: result.nextAction,
          stage: result.stage,
          memoryUpdate: result.memoryUpdate,
          isComplete: result.isComplete,
          summary: result.isComplete ? (await getSession(input.sessionId))?.summary ?? null : null,
        };
      } catch (err) {
        const code = err instanceof Error ? err.message : '';
        if (code === 'EMPTY_MESSAGE') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Message cannot be empty' });
        }
        if (code === 'SESSION_NOT_ACTIVE') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Session is not active' });
        }
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to process turn' });
      }
    }),

  // ── Complete session (explicit end + summary) ────────────────────────────────
  complete: protectedProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;
      const session = await getSession(input.sessionId);
      if (!session) throw new TRPCError({ code: 'NOT_FOUND', message: 'Session not found' });
      if (session.userId !== userId) throw new TRPCError({ code: 'FORBIDDEN' });

      let summary: Awaited<ReturnType<typeof completeSession>>['summary'];
      let completedSession: Awaited<ReturnType<typeof completeSession>>['session'];
      try {
        const out = await completeSession(input.sessionId);
        summary = out.summary;
        completedSession = out.session;
      } catch (err) {
        await commitOrRejectLiveInterviewSpend(
          ctx.user.clerkId,
          input.sessionId,
          'reject',
          err instanceof Error ? err.message : 'complete_failed',
        );
        const code = err instanceof Error ? err.message : '';
        if (code === 'SESSION_NOT_STARTED') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Session has not been started' });
        }
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to complete session' });
      }

      try {
        await commitOrRejectLiveInterviewSpend(ctx.user.clerkId, input.sessionId, 'commit');
      } catch (e) {
        if (e instanceof BillingError) billingToTrpc(e);
        if (e instanceof TRPCError) throw e;
        throw e;
      }

      return {
        sessionId: completedSession.id,
        status: completedSession.status,
        summary,
      };
    }),

  // ── Abandon session ──────────────────────────────────────────────────────────
  abandon: protectedProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;
      const session = await getSession(input.sessionId);
      if (!session) return { success: true };
      if (session.userId !== userId) throw new TRPCError({ code: 'FORBIDDEN' });

      await commitOrRejectLiveInterviewSpend(
        ctx.user.clerkId,
        input.sessionId,
        'reject',
        'user_abandoned',
      );

      if (session.status === InterviewStatus.ACTIVE) {
        await abandonSession(input.sessionId);
      } else if (session.status === InterviewStatus.CREATED) {
        await db
          .update(liveInterviewSessions)
          .set({
            status: InterviewStatus.ABANDONED,
            endedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(liveInterviewSessions.id, input.sessionId));
      }
      return { success: true };
    }),

  // ── Get session ──────────────────────────────────────────────────────────────
  getSession: protectedProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const userId = ctx.user.id;
      const session = await getSession(input.sessionId);
      if (!session) throw new TRPCError({ code: 'NOT_FOUND' });
      if (session.userId !== userId) throw new TRPCError({ code: 'FORBIDDEN' });
      return {
        sessionId: session.id,
        status: session.status,
        stage: session.stage,
        turnCount: session.turnCount,
        config: session.config,
        roleContext: session.roleContext,
        transcript: session.transcript.map((t) => ({
          id: t.id,
          speaker: t.speaker,
          message: t.message,
          stage: t.stage,
          intent: t.intent,
          nextAction: t.nextAction,
          timestamp: t.timestamp.toISOString(),
        })),
        summary: session.summary ?? null,
        createdAt: session.createdAt.toISOString(),
      };
    }),
});
