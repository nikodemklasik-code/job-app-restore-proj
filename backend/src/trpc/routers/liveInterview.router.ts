import { z } from 'zod';
import { TRPCError } from '@trpc/server';
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

const roleContextSchema = z.object({
  targetRole: z.string().min(1).max(200),
  company: z.string().max(200).optional(),
  seniority: z.string().max(100).optional(),
  description: z.string().max(1000).optional(),
});

export const liveInterviewRouter = router({
  // ── Create session ───────────────────────────────────────────────────────────
  createSession: protectedProcedure
    .input(
      z.object({
        mode: z.enum(['behavioral', 'technical', 'general', 'hr', 'case-study', 'language-check']),
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
      const session = createSession(userId, input.mode, input.roleContext, {
        maxTurns: input.config?.maxTurns,
      });
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
      const existing = getSession(input.sessionId);
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
      const session = getSession(input.sessionId);
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
          summary: result.isComplete ? getSession(input.sessionId)?.summary ?? null : null,
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
      const session = getSession(input.sessionId);
      if (!session) throw new TRPCError({ code: 'NOT_FOUND', message: 'Session not found' });
      if (session.userId !== userId) throw new TRPCError({ code: 'FORBIDDEN' });

      try {
        const { summary, session: completedSession } = await completeSession(input.sessionId);
        return {
          sessionId: completedSession.id,
          status: completedSession.status,
          summary,
        };
      } catch (err) {
        const code = err instanceof Error ? err.message : '';
        if (code === 'SESSION_NOT_STARTED') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Session has not been started' });
        }
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to complete session' });
      }
    }),

  // ── Abandon session ──────────────────────────────────────────────────────────
  abandon: protectedProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .mutation(({ input, ctx }) => {
      const userId = ctx.user.id;
      const session = getSession(input.sessionId);
      if (!session) return { success: true };
      if (session.userId !== userId) throw new TRPCError({ code: 'FORBIDDEN' });
      abandonSession(input.sessionId);
      return { success: true };
    }),

  // ── Get session ──────────────────────────────────────────────────────────────
  getSession: protectedProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .query(({ input, ctx }) => {
      const userId = ctx.user.id;
      const session = getSession(input.sessionId);
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
