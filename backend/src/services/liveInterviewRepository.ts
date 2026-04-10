import { eq, asc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { liveInterviewSessions, liveInterviewTurns } from '../db/schema.js';
import type {
  LiveInterviewSession,
  InterviewMemory,
  InterviewSummary,
  InterviewTurn,
} from './liveInterviewEngine.js';

// ── Mappers ───────────────────────────────────────────────────────────────────

function rowToSession(
  row: typeof liveInterviewSessions.$inferSelect,
  turns: (typeof liveInterviewTurns.$inferSelect)[],
): LiveInterviewSession {
  return {
    id: row.id,
    userId: row.userId,
    status: row.status as LiveInterviewSession['status'],
    stage: row.stage as LiveInterviewSession['stage'],
    roleContext: {
      targetRole: row.targetRole,
      company: row.company ?? undefined,
      seniority: row.seniority ?? undefined,
      description: row.roleDescription ?? undefined,
    },
    config: {
      mode: row.mode,
      maxTurns: row.maxTurns,
      maxFollowUpsPerTopic: row.maxFollowUpsPerTopic,
    },
    turnCount: row.turnCount,
    memory: row.memory as InterviewMemory,
    transcript: turns.map((t) => ({
      id: t.id,
      speaker: t.speaker as InterviewTurn['speaker'],
      message: t.message,
      intent: t.intent as InterviewTurn['intent'],
      nextAction: t.nextAction as InterviewTurn['nextAction'],
      stage: t.stage as InterviewTurn['stage'],
      timestamp: t.timestamp,
    })),
    summary: row.summary ? (row.summary as InterviewSummary) : undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    startedAt: row.startedAt ?? undefined,
    endedAt: row.endedAt ?? undefined,
  };
}

// ── Repository functions ──────────────────────────────────────────────────────

export async function dbCreateSession(session: LiveInterviewSession): Promise<void> {
  await db.insert(liveInterviewSessions).values({
    id: session.id,
    userId: session.userId,
    status: session.status,
    stage: session.stage,
    mode: session.config.mode,
    targetRole: session.roleContext.targetRole,
    company: session.roleContext.company ?? null,
    seniority: session.roleContext.seniority ?? null,
    roleDescription: session.roleContext.description ?? null,
    maxTurns: session.config.maxTurns,
    maxFollowUpsPerTopic: session.config.maxFollowUpsPerTopic,
    turnCount: session.turnCount,
    memory: session.memory as unknown as Record<string, unknown>,
    summary: null,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    startedAt: session.startedAt ?? null,
    endedAt: session.endedAt ?? null,
  });
}

export async function dbGetSession(sessionId: string): Promise<LiveInterviewSession | undefined> {
  const [row] = await db
    .select()
    .from(liveInterviewSessions)
    .where(eq(liveInterviewSessions.id, sessionId))
    .limit(1);

  if (!row) return undefined;

  const turns = await db
    .select()
    .from(liveInterviewTurns)
    .where(eq(liveInterviewTurns.sessionId, sessionId))
    .orderBy(asc(liveInterviewTurns.timestamp));

  return rowToSession(row, turns);
}

export async function dbUpdateSession(session: LiveInterviewSession): Promise<void> {
  await db
    .update(liveInterviewSessions)
    .set({
      status: session.status,
      stage: session.stage,
      turnCount: session.turnCount,
      memory: session.memory as unknown as Record<string, unknown>,
      summary: session.summary ? (session.summary as unknown as Record<string, unknown>) : null,
      updatedAt: session.updatedAt,
      startedAt: session.startedAt ?? null,
      endedAt: session.endedAt ?? null,
    })
    .where(eq(liveInterviewSessions.id, session.id));
}

export async function dbAppendTurn(turn: InterviewTurn, sessionId: string): Promise<void> {
  await db.insert(liveInterviewTurns).values({
    id: turn.id,
    sessionId,
    speaker: turn.speaker,
    message: turn.message,
    intent: turn.intent ?? null,
    nextAction: turn.nextAction ?? null,
    stage: turn.stage,
    timestamp: turn.timestamp,
  });
}
